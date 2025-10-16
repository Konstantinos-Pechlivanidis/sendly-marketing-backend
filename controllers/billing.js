import prisma from '../services/prisma.js';
import { getBalance, purchasePackage as walletPurchasePackage } from '../services/wallet.js';

export async function listPackages(req, res, next) {
  try {
    const rows = await prisma.smsPackage.findMany({
      where: { active: true },
      orderBy: { credits: 'asc' },
    });
    res.json({ success: true, data: { packages: rows } });
  } catch (e) {
    next(e);
  }
}

export async function seedPackages(req, res, next) {
  try {
    const seed = [
      {
        name: 'Starter 1k',
        credits: 1000,
        priceCents: 2900,
        currency: process.env.APP_DEFAULT_CURRENCY || 'EUR',
      },
      {
        name: 'Growth 5k',
        credits: 5000,
        priceCents: 12900,
        currency: process.env.APP_DEFAULT_CURRENCY || 'EUR',
      },
      {
        name: 'Scale 20k',
        credits: 20000,
        priceCents: 39900,
        currency: process.env.APP_DEFAULT_CURRENCY || 'EUR',
      },
    ];
    for (const p of seed) {
      await prisma.smsPackage.upsert({
        where: { name: p.name },
        create: { ...p, active: true },
        update: { ...p, active: true },
      });
    }
    res.json({ success: true, message: 'seeded' });
  } catch (e) {
    next(e);
  }
}

export async function purchasePackage(req, res, next) {
  try {
    const shopDomain = req.shop;
    const { packageId } = req.params;
    const balance = await walletPurchasePackage(shopDomain, packageId);
    res.json({ success: true, data: balance });
  } catch (e) {
    next(e);
  }
}

export async function balance(req, res, next) {
  try {
    const out = await getBalance(req.shop);
    res.json({ success: true, data: out });
  } catch (e) {
    next(e);
  }
}

export async function transactions(req, res, next) {
  try {
    const shopDomain = req.shop;
    const shop = await prisma.shop.findUnique({ where: { shopDomain } });
    if (!shop) return res.json({ success: true, data: { transactions: [] } });
    const rows = await prisma.walletTransaction.findMany({
      where: { shopId: shop.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ success: true, data: { transactions: rows } });
  } catch (e) {
    next(e);
  }
}
