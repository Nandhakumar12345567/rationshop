const db = require('../config/db');

class ItemController {
  /**
   * Get list of ration items with category limit entitlement rules calculated
   */
  static async getItems(req, res) {
    try {
      const { category } = req.user;
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

        const maxEntitlement = categoryLimits[category] !== undefined ? categoryLimits[category] : 0;

        return {
          item_id: item.item_id,
          name: item.name,
          unit: item.unit,
          price_per_unit: parseFloat(item.price_per_unit),
          monthly_entitlement: maxEntitlement,
          category_limits: categoryLimits
        };
      });

      return res.json({
        success: true,
        user_category: category,
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
