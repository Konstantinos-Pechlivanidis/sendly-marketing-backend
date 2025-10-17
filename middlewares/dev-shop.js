// Development middleware to set shop domain for testing
export function setDevShop(req, res, next) {
  // Set hardcoded shop domain for development testing
  req.shop = 'sms-blossom-dev.myshopify.com';
  next();
}
