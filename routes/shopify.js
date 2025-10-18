import express from 'express';
import { body } from 'express-validator';
import * as ctrl from '../controllers/discounts.js';
import { handleValidation } from '../middlewares/validate.js';
import { setDevShop } from '../middlewares/dev-shop.js';

const r = express.Router();

// Apply dev shop middleware
r.use(setDevShop);

// Get available discount codes
r.get('/discounts', ctrl.getShopifyDiscounts);

// Get specific discount code
r.get('/discounts/:id', ctrl.getShopifyDiscount);

// Validate discount code for campaign use
r.post(
  '/discounts/validate',
  body('discountId').isString().notEmpty(),
  handleValidation,
  ctrl.validateDiscount,
);

export default r;
