import prisma from '../services/prisma.js';
import { getBalance } from '../services/wallet.js';

export async function overview(req, res, next) {
  try {
    const wallet = await getBalance(req.shop);
    return res.json({
      success: true,
      data: {
        sms: { sent: 0, delivered: 0, failed: 0, deliveryRate: 0 },
        contacts: { total: 0, optedIn: 0, optedOut: 0 },
        wallet,
        recentMessages: [],
        recentTransactions: [],
      },
    });
  } catch (e) {
    next(e);
  }
}
export async function quickStats(req, res, next) {
  try {
    return res.json({ success: true, data: { smsSent: 0, walletBalance: 0 } });
  } catch (e) {
    next(e);
  }
}
