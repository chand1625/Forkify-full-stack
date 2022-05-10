const db = require("../data/database");

class Category {
  static async getAllCategories() {
    try {
      const [categories] = await db.query("SELECT * FROM categories");
      return categories;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Category;
