import { useMemo } from 'react';
import { countSMSCharacters, formatMessageWithTokens } from '../../utils/smsParser';
import { API_URL } from '../../utils/constants';

/**
 * iPhone 17 Preview Component with Discount Code and Unsubscribe Link
 * Used for landing page and marketing materials
 * Unsubscribe link is part of the message content
 */
export default function IPhonePreviewWithDiscount({ 
  message = 'Hi {{first_name}}! Get 20% off your next order with code {{discount_code}}. Shop now at yourstore.com\n\nReply STOP to unsubscribe',
  discountCode = 'SUMMER20',
  firstName = 'Sarah',
  unsubscribeToken = 'demo-token-123',
}) {
  // Replace tokens in message
  const processedMessage = useMemo(() => {
    let processed = message
      .replace(/\{\{first_name\}\}/gi, firstName)
      .replace(/\{\{discount_code\}\}/gi, discountCode);
    
    // Replace unsubscribe link if it exists in the message
    const unsubscribeUrl = `${API_URL}/unsubscribe/${unsubscribeToken}`;
    processed = processed.replace(/unsubscribe/gi, (match) => {
      // Keep the text but make it a link in the display
      return match;
    });
    
    return processed;
  }, [message, firstName, discountCode, unsubscribeToken]);

  const smsInfo = useMemo(() => countSMSCharacters(processedMessage), [processedMessage]);
  const messageParts = useMemo(() => {
    // Split message by lines to handle unsubscribe link separately
    const lines = processedMessage.split('\n');
    const parts = [];
    const unsubscribeUrl = `${API_URL}/unsubscribe/${unsubscribeToken}`;
    
    lines.forEach((line, lineIndex) => {
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('unsubscribe') || lowerLine.includes('stop') || lowerLine.includes('opt-out')) {
        // This is the unsubscribe line - format it specially as a clickable link
        parts.push({
          type: 'unsubscribe',
          content: line,
          url: unsubscribeUrl,
        });
      } else if (line.trim()) {
        // Regular message line - check for tokens
        const lineParts = formatMessageWithTokens(line);
        parts.push(...lineParts.map(part => ({ ...part, lineIndex })));
      } else {
        // Empty line - preserve spacing
        parts.push({
          type: 'text',
          content: '\n',
        });
      }
    });
    
    return parts;
  }, [processedMessage, unsubscribeToken]);

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* iPhone Frame */}
      <div className="relative bg-primary-dark rounded-3xl p-2 shadow-glass-lg">
        {/* Outer frame with subtle highlights */}
        <div className="relative bg-gradient-to-b from-primary-dark via-surface-dark to-primary-dark rounded-[28px] p-1">
          {/* Inner screen */}
          <div
            className="relative rounded-[24px] overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #020202 0%, #191819 45%, #262425 100%)',
              aspectRatio: '9 / 16', // Compact iPhone 17 aspect ratio (reduced height)
            }}
          >
            {/* Status Bar */}
            <div className="absolute top-0 left-0 right-0 h-8 flex items-center justify-between px-4 text-white/90 text-xs z-10">
              <div className="flex items-center gap-1">
                <span className="font-medium">9:41</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2 22h20V2z" />
                </svg>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M1 9l2-2v14l-2-2V9zm4-2l2-2v14l-2-2V7zm4-2l2-2v14l-2-2V5zm4-2l2-2v14l-2-2V3zm4-2l2-2v14l-2-2V1z" />
                </svg>
                <div className="w-6 h-3 border border-white/90 rounded-sm">
                  <div className="w-4 h-2 bg-white/90 rounded-sm m-0.5" />
                </div>
              </div>
            </div>

            {/* Message Content Area */}
            <div className="absolute inset-0 pt-12 pb-20 px-4 flex flex-col justify-start">
              {/* Message Bubble */}
              <div className="w-full flex flex-col items-start gap-3">
                <div
                  className="relative max-w-[80%] rounded-[20px] rounded-tl-[4px] px-3.5 py-2.5"
                  style={{
                    background: 'linear-gradient(135deg, #99B5D7 0%, #B3CDDA 100%)',
                  }}
                >
                  <div className="text-primary-dark text-[0.95rem] leading-relaxed whitespace-pre-wrap break-words">
                    {messageParts.map((part, index) => {
                      if (part.type === 'token') {
                        return (
                          <span
                            key={index}
                            className="font-semibold underline decoration-primary-dark/50 decoration-1 underline-offset-1"
                          >
                            {part.content}
                          </span>
                        );
                      }
                      if (part.type === 'unsubscribe') {
                        return (
                          <span key={index} className="block mt-2 pt-2 border-t border-primary-dark/20">
                            <a
                              href={part.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-dark/80 underline underline-offset-2 hover:text-primary-dark"
                              onClick={(e) => {
                                e.preventDefault();
                                window.open(part.url, '_blank');
                              }}
                            >
                              {part.content}
                            </a>
                          </span>
                        );
                      }
                      return <span key={index}>{part.content}</span>;
                    })}
                  </div>
                </div>

                {/* Discount Code Highlight */}
                {discountCode && processedMessage.includes(discountCode) && (
                  <div className="w-full max-w-[80%]">
                    <div className="bg-zoom-fuchsia/20 border border-zoom-fuchsia/40 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zoom-fuchsia font-medium">CODE:</span>
                        <span className="text-sm font-bold text-zoom-fuchsia tracking-wider">{discountCode}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Character Counter */}
                <div className="self-end pr-2">
                  <div
                    className={`text-xs flex items-center gap-1 ${
                      smsInfo.parts > 1
                        ? 'text-zoom-fuchsia font-medium'
                        : 'text-white/60'
                    }`}
                  >
                    <span>
                      {smsInfo.count} {smsInfo.count === 1 ? 'char' : 'chars'}
                    </span>
                    <span>•</span>
                    <span
                      className={
                        smsInfo.parts > 1 ? 'text-zoom-fuchsia font-semibold' : ''
                      }
                    >
                      {smsInfo.parts} {smsInfo.parts === 1 ? 'part' : 'parts'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Home Indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
