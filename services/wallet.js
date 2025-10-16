import prisma from './prisma.js';

export async function ensureShopAndWallet(shopDomain) {
  let shop = await prisma.shop.findUnique({ where: { shopDomain } });
  if (!shop) {
    shop = await prisma.shop.create({ data: { shopDomain } });
  }
  let wallet = await prisma.wallet.findUnique({ where: { shopId: shop.id } });
  if (!wallet) {
    wallet = await prisma.wallet.create({ data: { shopId: shop.id } });
  }
  return { shop, wallet };
}

export async function getBalance(shopDomain) {
  const shop = await prisma.shop.findUnique({ where: { shopDomain }, include: { wallet: true } });
  if (!shop || !shop.wallet) return { balance: 0, totalBought: 0, totalUsed: 0, active: false };
  const { balance, totalBought, totalUsed, active } = shop.wallet;
  return { balance, totalBought, totalUsed, active };
}

export async function purchasePackage(shopDomain, packageId) {
  const pkg = await prisma.smsPackage.findUnique({ where: { id: packageId } });
  if (!pkg || !pkg.active) throw new Error('package_not_available');

  const { shop, wallet } = await ensureShopAndWallet(shopDomain);

  await prisma.$transaction(async (tx) => {
    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: { increment: pkg.credits },
        totalBought: { increment: pkg.credits },
      },
    });
    await tx.walletTransaction.create({
      data: {
        shopId: shop.id,
        type: 'purchase',
        credits: pkg.credits,
        ref: pkg.id,
        meta: { priceCents: pkg.priceCents, currency: pkg.currency, packageName: pkg.name },
      },
    });
  });

  return await getBalance(shopDomain);
}

export async function debitForMessages(shopDomain, credits, ref) {
  const { shop, wallet } = await ensureShopAndWallet(shopDomain);
  if (wallet.balance < credits) throw new Error('insufficient_credits');
  await prisma.$transaction(async (tx) => {
    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: { decrement: credits },
        totalUsed: { increment: credits },
      },
    });
    await tx.walletTransaction.create({
      data: {
        shopId: shop.id,
        type: 'debit',
        credits,
        ref,
      },
    });
  });
  return await getBalance(shopDomain);
}
