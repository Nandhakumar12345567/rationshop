const db = require('../config/db');
const { calculateItemEntitlement } = require('../services/entitlementService');

class ItemController {
  /**
   * Get list of ration items with category limit entitlement rules calculated dynamically based on family members count
   */
  static async getItems(req, res) {
    try {
      const { category, card_no } = req.user;
      let familySize = req.query.family_size ? parseInt(req.query.family_size, 10) : req.user.family_size;

      if (!familySize && card_no) {
        const cardRes = await db.query('SELECT family_size, category FROM ration_cards WHERE card_no = $1', [card_no]);
        if (cardRes.rows.length > 0) {
          familySize = cardRes.rows[0].family_size;
        }
      }
      familySize = Math.max(1, parseInt(familySize, 10) || 1);

      const result = await db.query('SELECT * FROM items');
      
      const items = result.rows.map((item) => {
        let categoryLimits = {};
        try {
          categoryLimits = typeof item.category_limit_rules === 'string'
            ? JSON.parse(item.category_limit_rules)
            : item.category_limit_rules;
        } catch (e) {
          categoryLimits = {};
        }

        const entitlement = calculateItemEntitlement(item.item_id, category, familySize);

        return {
          item_id: item.item_id,
          name: item.name,
          unit: item.unit,
          price_per_unit: parseFloat(item.price_per_unit),
          monthly_entitlement: entitlement.quota,
          per_member_rate: entitlement.perMemberRate,
          per_member_rate_ta: entitlement.perMemberRateTa,
          formula_text: entitlement.formulaText,
          formula_text_ta: entitlement.formulaTextTa,
          family_size: familySize,
          category_limits: categoryLimits
        };
      });

      return res.json({
        success: true,
        user_category: category,
        family_size: familySize,
        items
      });
    } catch (error) {
      console.error('[Item Controller Error]', error);
      res.status(500).json({ success: false, error: 'Failed to fetch items list' });
    }
  }

  /**
   * Get live shop stock
   */
  static async getShopStock(req, res) {
    try {
      const shopId = req.params.shopId || 'FPS-TN-0401';
      const result = await db.query('SELECT * FROM shops WHERE shop_id = $1', [shopId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Shop not found' });
      }

      const shop = result.rows[0];
      const stockObj = typeof shop.stock === 'string' ? JSON.parse(shop.stock) : shop.stock;

      return res.json({
        success: true,
        shop: {
          shop_id: shop.shop_id,
          name: shop.name,
          location: shop.location,
          stock: stockObj
        }
      });
    } catch (error) {
      console.error('[Shop Stock Error]', error);
      res.status(500).json({ success: false, error: 'Failed to fetch shop stock' });
    }
  }
}

module.exports = ItemController;
