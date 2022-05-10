const express = require("express");

const checkAuth = require("../middlewares/checkAuth.middleware");
const imageUpload = require("../middlewares/imageUpload.middleware");

const recipe = require("../controllers/recipe.controller");

const router = express.Router();

router.get(
  "/new-recipe-form",
  checkAuth.checkUserOrAdminAuthorization,
  recipe.getNewRecipeForm
);

router.post(
  "/add-new-recipe",
  checkAuth.checkUserOrAdminAuthorization,
  imageUpload,
  recipe.addNewRecipe
);

router.get(
  "/pending-recipes",
  checkAuth.checkAdminAuthorization,
  recipe.getPendingRecipes
);

router.get(
  "/published-recipes",
  checkAuth.checkAdminAuthorization,
  recipe.getPublishedRecipes
);

router.get(
  "/pending-recipe-details/:recipeId/:recipeTitle",
  checkAuth.checkAdminAuthorization,
  recipe.getPendingRecipeDetails
);

router.get(
  "/published-recipe-details/:recipeId/:recipeTitle",
  checkAuth.checkAdminAuthorization,
  recipe.getPublishedRecipeDetails
);

router.get(
  "/reject-recipe/:recipeId/",
  checkAuth.checkAdminAuthorization,
  recipe.rejectRecipe
);

router.get(
  "/approve-recipe/:recipeId/",
  checkAuth.checkAdminAuthorization,
  recipe.approveRecipe
);

router.get(
  "/edit-recipe/:recipeId/:recipeTitle",
  checkAuth.checkUserOrAdminAuthorization,
  recipe.editRecipe
);

router.get(
  "/delete-recipe/:recipeId",
  checkAuth.checkUserOrAdminAuthorization,
  recipe.deleteRecipe
);

router.post(
  "/update-recipe",
  checkAuth.checkUserOrAdminAuthorization,
  imageUpload,
  recipe.updateRecipe
);

router.get("/search-recipe", recipe.searchRecipe);

router.get("/recipe-details/:recipeId/:recipeTitle", recipe.getRecipeDetails);

router.get(
  "/favourite-recipe/:recipeId/:recipeTitle",
  checkAuth.checkUserAuthorization,
  recipe.addRecipeToFavourites
);

router.get(
  "/remove-favourite-recipe/:recipeId/:recipeTitle",
  checkAuth.checkUserAuthorization,
  recipe.removeFavourite
);

router.get(
  "/favourites",
  checkAuth.checkUserAuthorization,
  recipe.getAllFavourites
);

router.get(
  "/my-recipes",
  checkAuth.checkUserAuthorization,
  recipe.getUserSubmittedRecipes
);

module.exports = router;
