const db = require("../data/database");
const moment = require("moment");

const fs = require("fs");
const { promisify } = require("util");

const unlinkAsync = promisify(fs.unlink);

class Recipe {
  constructor(recipe) {
    this.id = recipe.id;
    this.user = recipe.user;
    this.title = recipe.title;
    this.image = recipe.image;
    this.category = recipe.category;
    this.dishtype = recipe.dishtype;
    this.ingredients = recipe.ingredients;
    this.description = recipe.description;
    this.youtubevideo = recipe.youtubevideo;
    this.status = recipe.status;
    this.lastEdit = recipe.lastEdit;
    this.publisher = recipe.publisher;
  }

  static async deleteImage(imgPath) {
    try {
      await unlinkAsync(`recipe-images/${imgPath}`);
    } catch (error) {
      throw error;
    }
  }

  static async getTopRecipes() {
    try {
      const [topRecipes] = await db.query(
        `SELECT r.id, r.title, r.image, c.name, r.updated_at
        FROM recipes as r
        join categories as c
        ON r.category_id = c.id
        WHERE r.status = "approved" 
        ORDER BY r.views DESC LIMIT 8`
      );
      for (const recipe of topRecipes) {
        recipe.updated_at = moment(recipe.updated_at).format(
          "MMMM Do YYYY, h:mm a"
        );
        recipe.urlTitle = recipe.title.replace(/\s+/g, "-");
      }
      return topRecipes;
    } catch (error) {
      throw error;
    }
  }

  static async getUserSubmittedRecipes(userId, limit, offset) {
    try {
      const [userSubmittedRecipes] = await db.query(
        `SELECT r.id, r.title, r.image, c.name, r.updated_at
        FROM recipes as r
        join categories as c
        ON r.category_id = c.id
        WHERE r.user_id = ?
        ORDER BY r.updated_at DESC LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );
      for (const recipe of userSubmittedRecipes) {
        recipe.updated_at = moment(recipe.updated_at).format(
          "MMMM Do YYYY, h:mm a"
        );
        recipe.urlTitle = recipe.title.replace(/\s+/g, "-");
      }
      return userSubmittedRecipes;
    } catch (error) {
      throw error;
    }
  }

  static async getCountOfUserSubmittedRecipes(userId) {
    try {
      const [rows] = await db.query(
        `SELECT COUNT(*) AS count FROM recipes WHERE user_id = ?`,
        [userId]
      );
      return rows[0].count;
    } catch (error) {
      throw error;
    }
  }

  static async getCountOfPublishedRecipes() {
    try {
      const [rows] = await db.query(
        `SELECT COUNT(*) AS count FROM recipes WHERE status = 'approved'`
      );
      return rows[0].count;
    } catch (error) {
      throw error;
    }
  }

  static async getCountOfPendingRecipes() {
    try {
      const [rows] = await db.query(
        `SELECT COUNT(*) AS count FROM recipes WHERE status = 'pending'`
      );
      return rows[0].count;
    } catch (error) {
      throw error;
    }
  }

  static async getCountOfSearchResults(searchTerm) {
    try {
      const [rows] = await db.query(
        `SELECT COUNT(*) AS count FROM recipes WHERE (title LIKE '%${searchTerm}%' OR ingredients LIKE '%${searchTerm}%') AND status="approved"`
      );
      return rows[0].count;
    } catch (error) {
      throw error;
    }
  }

  static async getPublishedRecipes(limit, offset) {
    try {
      const [publishedRecipes] = await db.query(
        `select r.id, r.title, r.image, c.name, r.updated_at
        from recipes as r
        join categories as c
        ON r.category_id = c.id
        WHERE r.status = "approved"
        ORDER BY r.updated_at LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      for (const recipe of publishedRecipes) {
        recipe.updated_at = moment(recipe.updated_at).format(
          "MMMM Do YYYY, h:mm a"
        );
        recipe.urlTitle = recipe.title.replace(/\s+/g, "-");
      }
      return publishedRecipes;
    } catch (error) {
      throw error;
    }
  }

  static async getPendingRecipes(limit, offset) {
    try {
      const [pendingRecipes] = await db.query(
        `select r.id, r.title, r.image, c.name, r.updated_at
        from recipes as r
        join categories as c
        ON r.category_id = c.id
        WHERE r.status = "pending"
        ORDER BY r.updated_at LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      for (const recipe of pendingRecipes) {
        recipe.updated_at = moment(recipe.updated_at).format(
          "MMMM Do YYYY, h:mm a"
        );
        recipe.urlTitle = recipe.title.replace(/\s+/g, "-");
      }
      return pendingRecipes;
    } catch (error) {
      throw error;
    }
  }

  static async getSearchedRecipes(searchTerm, limit, offset) {
    try {
      const [searchedRecipes] = await db.query(
        `select r.id, r.title, r.image, c.name, r.updated_at
        from recipes as r
        join categories as c
        ON r.category_id = c.id
        WHERE (r.title LIKE '%${searchTerm}%' OR r.ingredients LIKE '%${searchTerm}%') AND r.status = "approved"
        ORDER BY r.updated_at LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      for (const recipe of searchedRecipes) {
        recipe.updated_at = moment(recipe.updated_at).format(
          "MMMM Do YYYY, h:mm a"
        );
        recipe.urlTitle = recipe.title.replace(/\s+/g, "-");
      }
      return searchedRecipes;
    } catch (error) {
      throw error;
    }
  }

  static async addRecipeView(id) {
    try {
      await db.query("UPDATE recipes SET views = views + 1 WHERE id = ?", [id]);
    } catch (error) {
      throw error;
    }
  }

  static async getRecipeViews(id) {
    try {
      const [recipeViews] = await db.query(
        `SELECT views FROM recipes WHERE id = ?`,
        [id]
      );
      return recipeViews[0].views;
    } catch (error) {
      throw error;
    }
  }

  static async getRecipeWithId(id) {
    try {
      const [recipe] = await db.query("SELECT id FROM recipes WHERE id = ?", [
        id,
      ]);
      return recipe;
    } catch (error) {
      throw error;
    }
  }

  static async getAllDetailsOfRecipeWithId(id) {
    try {
      const [recipe] = await db.query(
        "SELECT recipes.*, name, email  from recipes join categories on category_id = categories.id join users on recipes.user_id = users.id WHERE recipes.id = ?",
        [id]
      );
      if (recipe.length !== 0) {
        recipe[0].title = recipe[0].title.replace(/\s+/g, "-");
        recipe[0].updated_at = moment(new Date(recipe[0].updated_at)).format(
          "MMMM Do YYYY, h:mm a"
        );
        recipe[0].created_at = moment(new Date(recipe[0].created_at)).format(
          "MMMM Do YYYY, h:mm a"
        );
        recipe[0].userName = recipe[0].email.split("@")[0];
        recipe[0].userName =
          recipe[0].userName.charAt(0).toUpperCase() +
          recipe[0].userName.slice(1);
        delete recipe[0].email;
      }
      return recipe;
    } catch (error) {
      throw error;
    }
  }

  static async rejectRecipe(id) {
    try {
      await db.query("UPDATE recipes SET status = 'rejected' WHERE id = ?", [
        id,
      ]);
    } catch (error) {
      throw error;
    }
  }

  static async approveRecipe(id) {
    try {
      await db.query("UPDATE recipes SET status = 'approved' WHERE id = ?", [
        id,
      ]);
    } catch (error) {
      throw error;
    }
  }

  static async deleteRecipe(id) {
    try {
      const [recipe] = await db.query(
        "SELECT image FROM recipes WHERE id = ?",
        [id]
      );
      await db.query("DELETE FROM recipes WHERE id = ?", [id]);
      await Recipe.deleteImage(recipe[0].image);
    } catch (error) {
      throw error;
    }
  }

  async saveRecipe() {
    const data = [
      this.user,
      this.title,
      this.image,
      this.category,
      this.dishtype,
      this.ingredients,
      this.description,
      this.youtubevideo,
      this.status,
      this.lastEdit,
      this.publisher,
    ];
    try {
      await db.query(
        "INSERT INTO recipes (user_id,title,image,category_id,dishtype,ingredients,description,youtubevideo,status,last_edit,publisher) VALUES(?)",
        [data]
      );
    } catch (error) {
      throw error;
    }
  }

  async updateRecipe() {
    try {
      await db.query(
        "UPDATE recipes SET title = ?, image = ?, category_id = ?, dishtype = ?, ingredients = ?, description = ?, youtubevideo = ?, status = ?, last_edit = ? WHERE id = ?",
        [
          this.title,
          this.image,
          this.category,
          this.dishtype,
          this.ingredients,
          this.description,
          this.youtubevideo,
          this.status,
          this.lastEdit,
          this.id,
        ]
      );
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Recipe;
