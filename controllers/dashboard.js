import prisma from '../services/prisma.js';
import { getBalance } from '../services/wallet.js';

export async function overview(req, res, next) {
  try {
    const shopDomain = req.shop;
    console.log('📊 Overview - Shop domain:', shopDomain);
    
    const shop = await prisma.shop.findUnique({ where: { shopDomain } });
    
    if (!shop) {
      console.log('❌ Shop not found:', shopDomain);
      return res.json({
        success: true,
        data: {
          sms: { sent: 0, delivered: 0, failed: 0, deliveryRate: 0 },
          contacts: { total: 0, optedIn: 0, optedOut: 0 },
          wallet: { balance: 0, currency: 'EUR' },
          recentMessages: [],
          recentTransactions: [],
        },
      });
    }
    
    console.log('✅ Shop found:', shop.id);
    
    // Get real data from database
    const wallet = await getBalance(shopDomain);
    
    // Get SMS stats
    const smsStats = await prisma.messageLog.groupBy({
      by: ['status'],
      where: { shopId: shop.id, direction: 'outbound' },
      _count: { status: true }
    });
    
    const sent = smsStats.find(s => s.status === 'sent')?._count?.status || 0;
    const delivered = smsStats.find(s => s.status === 'delivered')?._count?.status || 0;
    const failed = smsStats.find(s => s.status === 'failed')?._count?.status || 0;
    const deliveryRate = sent > 0 ? (delivered / sent) : 0;
    
    // Get contact stats
    const contactStats = await prisma.contact.groupBy({
      by: ['smsConsent'],
      where: { shopId: shop.id },
      _count: { smsConsent: true }
    });
    
    const total = contactStats.reduce((sum, stat) => sum + stat._count.smsConsent, 0);
    const optedIn = contactStats.find(s => s.smsConsent === 'opted_in')?._count?.smsConsent || 0;
    const optedOut = contactStats.find(s => s.smsConsent === 'opted_out')?._count?.smsConsent || 0;
    
    // Get recent messages
    const recentMessages = await prisma.messageLog.findMany({
      where: { shopId: shop.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        phoneE164: true,
        status: true,
        createdAt: true,
        payload: true
      }
    });
    
    // Get recent transactions
    const recentTransactions = await prisma.walletTransaction.findMany({
      where: { shopId: shop.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        type: true,
        credits: true,
        createdAt: true,
        meta: true
      }
    });
    
    console.log('📊 Real data - SMS:', { sent, delivered, failed, deliveryRate });
    console.log('📊 Real data - Contacts:', { total, optedIn, optedOut });
    console.log('📊 Real data - Wallet:', wallet);
    
    return res.json({
      success: true,
      data: {
        sms: { sent, delivered, failed, deliveryRate },
        contacts: { total, optedIn, optedOut },
        wallet,
        recentMessages,
        recentTransactions,
      },
    });
  } catch (e) {
    console.error('❌ Overview error:', e);
    next(e);
  }
}
export async function quickStats(req, res, next) {
  try {
    const shopDomain = req.shop;
    console.log('📊 QuickStats - Shop domain:', shopDomain);
    
    const shop = await prisma.shop.findUnique({ where: { shopDomain } });
    
    if (!shop) {
      console.log('❌ Shop not found:', shopDomain);
      return res.json({ success: true, data: { smsSent: 0, walletBalance: 0 } });
    }
    
    console.log('✅ Shop found:', shop.id);
    
    // Get real data from database
    const wallet = await getBalance(shopDomain);
    const smsSent = await prisma.messageLog.count({
      where: { shopId: shop.id, direction: 'outbound' }
    });
    
    console.log('📊 Real data - SMS sent:', smsSent, 'Wallet balance:', wallet.balance);
    
    return res.json({ 
      success: true, 
      data: { 
        smsSent, 
        walletBalance: wallet.balance 
      } 
    });
  } catch (e) {
    console.error('❌ QuickStats error:', e);
    next(e);
  }
}
