const moment = require("moment");
const db = require("../data/database");

class Favourite {
  constructor(favouriteData) {
    this.userId = favouriteData.userId;
    this.recipeId = favouriteData.recipeId;
  }

  static async getCountOfFavourites(userId) {
    try {
      const [rows] = await db.query(
        `SELECT * FROM favourites WHERE fuser_id = ?`,
        [userId]
      );
      return rows.length;
    } catch (error) {
      throw error;
    }
  }

  static async getFavouriteRecipes(userId, limit, offset) {
    try {
      const [rows] = await db.query(
        `SELECT r.*,c.name FROM favourites as f JOIN recipes as r ON f.recipe_id = r.id JOIN categories as c ON r.category_id = c.id WHERE fuser_id = ? ORDER BY r.updated_at LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );
      for (const recipe of rows) {
        recipe.updated_at = moment(recipe.updated_at).format(
          "MMMM Do YYYY, h:mm a"
        );
        recipe.urlTitle = recipe.title.replace(/\s+/g, "-");
      }
      return rows;
    } catch (error) {
      throw error;
    }
  }

  async isFavourite() {
    try {
      const [rows] = await db.query(
        `SELECT * FROM favourites WHERE fuser_id = ? AND recipe_id = ?`,
        [this.userId, this.recipeId]
      );
      console.log(rows);
      return rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  async addFavourite() {
    try {
      await db.query(
        `INSERT INTO favourites (fuser_id, recipe_id) VALUES (?, ?)`,
        [this.userId, this.recipeId]
      );
    } catch (error) {
      throw error;
    }
  }

  async removeFavourite() {
    try {
      await db.query(
        `DELETE FROM favourites WHERE fuser_id = ? AND recipe_id = ?`,
        [this.userId, this.recipeId]
      );
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Favourite;
