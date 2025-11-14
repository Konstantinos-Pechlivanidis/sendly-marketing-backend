import prisma from '../services/prisma.js';
import { logger } from '../utils/logger.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import crypto from 'crypto';

/**
 * Generate unsubscribe token for a contact
 */
export function generateUnsubscribeToken(contactId, phoneE164) {
  const data = `${contactId}:${phoneE164}:${Date.now()}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
}

/**
 * Verify and decode unsubscribe token
 */
export function verifyUnsubscribeToken(token) {
  // Token format: contactId:phoneE164:timestamp (hashed)
  // For now, we'll store tokens in a way that allows us to verify them
  // In production, you might want to use JWT or store tokens in database
  return token; // Simplified - in production, implement proper token verification
}

/**
 * Show unsubscribe page
 * GET /unsubscribe/:token
 */
export async function showUnsubscribePage(req, res, next) {
  try {
    const { token } = req.params;

    if (!token) {
      throw new ValidationError('Unsubscribe token is required');
    }

    // Find contact by token (in production, store tokens in database)
    // For now, we'll use a simple approach: token contains contact info
    // In production, implement proper token storage and verification

    // Return HTML page for unsubscribe
    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Unsubscribe - Sendly</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background: linear-gradient(135deg, #020202 0%, #191819 100%);
              color: #E5E5E5;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .container {
              max-width: 500px;
              width: 100%;
              background: rgba(255, 255, 255, 0.10);
              backdrop-filter: blur(24px);
              border: 1px solid rgba(148, 169, 180, 0.30);
              border-radius: 24px;
              padding: 40px;
              box-shadow: 0 8px 32px 0 rgba(2, 2, 2, 0.37);
            }
            h1 { font-size: 24px; margin-bottom: 16px; color: #99B5D7; }
            p { margin-bottom: 24px; line-height: 1.6; color: #94A9B4; }
            button {
              width: 100%;
              padding: 12px 24px;
              background: #99B5D7;
              color: #020202;
              border: none;
              border-radius: 12px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s;
            }
            button:hover { background: #6686A9; transform: translateY(-2px); }
            .success { color: #99B5D7; margin-top: 16px; }
            .error { color: #EF4444; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Unsubscribe from SMS</h1>
            <p>We're sorry to see you go. Click the button below to unsubscribe from all SMS messages.</p>
            <form id="unsubscribeForm" method="POST">
              <button type="submit">Unsubscribe</button>
            </form>
            <div id="message"></div>
          </div>
          <script>
            document.getElementById('unsubscribeForm').addEventListener('submit', async (e) => {
              e.preventDefault();
              const button = e.target.querySelector('button');
              const messageDiv = document.getElementById('message');
              button.disabled = true;
              button.textContent = 'Processing...';
              
              try {
                const response = await fetch(window.location.href, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' }
                });
                const data = await response.json();
                
                if (response.ok) {
                  messageDiv.className = 'success';
                  messageDiv.textContent = 'You have been successfully unsubscribed.';
                  button.style.display = 'none';
                } else {
                  messageDiv.className = 'error';
                  messageDiv.textContent = data.message || 'An error occurred. Please try again.';
                  button.disabled = false;
                  button.textContent = 'Unsubscribe';
                }
              } catch (error) {
                messageDiv.className = 'error';
                messageDiv.textContent = 'An error occurred. Please try again.';
                button.disabled = false;
                button.textContent = 'Unsubscribe';
              }
            });
          </script>
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    logger.error('Error showing unsubscribe page', { error: error.message, token: req.params.token });
    next(error);
  }
}

/**
 * Process unsubscribe request
 * POST /unsubscribe/:token
 */
export async function processUnsubscribe(req, res, next) {
  try {
    const { token } = req.params;

    if (!token) {
      throw new ValidationError('Unsubscribe token is required');
    }

    // Extract phone from query or body
    // In production, implement proper token verification with database lookup
    const phoneE164 = req.query.phone || req.body.phone;

    if (!phoneE164) {
      throw new ValidationError('Phone number is required for unsubscribe');
    }

    // Find contact by phone (across all shops for unsubscribe)
    // In production, you might want to include shopId in token for better security
    const contact = await prisma.contact.findFirst({
      where: {
        phoneE164: phoneE164,
      },
      include: {
        shop: {
          select: {
            shopDomain: true,
          },
        },
      },
    });

    if (!contact) {
      throw new NotFoundError('Contact not found');
    }

    // Update contact consent to opted_out
    await prisma.contact.update({
      where: { id: contact.id },
      data: {
        smsConsent: 'opted_out',
      },
    });

    logger.info('Contact unsubscribed', {
      contactId: contact.id,
      phoneE164: contact.phoneE164,
      shopId: contact.shopId,
    });

    return sendSuccess(res, {
      message: 'You have been successfully unsubscribed from all SMS messages.',
      unsubscribed: true,
    });
  } catch (error) {
    logger.error('Error processing unsubscribe', {
      error: error.message,
      token: req.params.token,
    });
    next(error);
  }
}

