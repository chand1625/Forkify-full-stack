const fs = require("fs").promises;
const path = require("path");

const Category = require("../models/category.model");
const Recipe = require("../models/recipe.model");
const Favourite = require("../models/favourite.model");

const sessionflashUtil = require("../util/sessionflash");
const validateUtil = require("../util/validation");
const paginationUtil = require("../util/pagination");

async function getNewRecipeForm(req, res, next) {
  try {
    const categories = await Category.getAllCategories();
    let sessionData = sessionflashUtil.getSessionData(req);
    if (!sessionData) {
      sessionData = {
        formType: "new",
        title: "",
        image: "",
        category: "",
        dishtype: "",
        ingredients: "",
        description: "",
        youtubevideo: "",
        validationErrors: {
          focused: "title",
        },
      };
    }
    res.render("../views/shared/new-recipe-form.ejs", {
      categories,
      sessionData,
    });
  } catch (error) {
    next(error);
    return;
  }
}

async function addNewRecipe(req, res, next) {
  const userData = req.body;
  userData.image = req.file;

  if (
    userData.image &&
    userData.image.originalname !== userData.prevImgOriginalName &&
    userData.image.size !== userData.prevImgSize
  ) {
    try {
      if (userData.prevImgSrc != "none")
        await Recipe.deleteImage(userData.prevImgSrc);
    } catch (error) {
      next(error);
      return;
    }
  }

  if (
    userData.image &&
    userData.image.originalname == userData.prevImgOriginalName &&
    userData.image.size == userData.prevImgSize
  ) {
    try {
      await Recipe.deleteImage(userData.prevImgSrc);
    } catch (error) {
      next(error);
      return;
    }
  }

  if (!userData.image && userData.prevImgOriginalName != "none") {
    userData.image = {
      filename: userData.prevImgSrc,
      originalname: userData.prevImgOriginalName,
      size: userData.prevImgSize,
    };
  }

  try {
    userData.categories = await Category.getAllCategories();
  } catch (error) {
    next(error);
    return;
  }

  const validationErrors = validateUtil.validateRecipe(userData);

  if (!validationErrors.isValid) {
    if (userData.image) {
      userData.prevImgOriginalName = userData.image.originalname;
      userData.prevImgSrc = userData.image.filename;
      userData.prevImgSize = userData.image.size;
    }

    sessionflashUtil.flashDataToSession(
      req,
      {
        validationErrors,
        ...userData,
      },
      function () {
        res.redirect("/new-recipe-form");
      }
    );
    return;
  }

  userData.image = userData.image.filename;
  userData.user = req.session.uid;

  if (userData.youtubevideo === "") userData.youtubevideo = "none";
  if (req.session.isAdmin) {
    userData.status = "approved";
    userData.lastEdit = "admin";
    userData.publisher = "admin";
  } else {
    userData.status = "pending";
    userData.lastEdit = "user";
    userData.publisher = "user";
  }

  const recipe = new Recipe(userData);

  try {
    await recipe.saveRecipe(userData);
    const message = {
      primary: "Submission successful",
      secondary: "Your recipe is now being reviewed!",
    };
    if (req.session.isAdmin)
      message.secondary = "Newly added recipe has been published!";
    res.render("../views/shared/success.ejs", { message });
    return;
  } catch (error) {
    try {
      await Recipe.deleteImage(userData.image.filename);
    } catch (error) {
      next(error);
      return;
    }
    const message = {
      primary: "Submission failed",
      secondary: "Please try submitting your recipe again!",
    };
    console.log(error);
    res.render("../views/shared/failure.ejs", { message });
    return;
  }
}

async function getPendingRecipes(req, res, next) {
  try {
    if (req.query.page && isNaN(+req.query.page)) {
      const message = {
        primary: "Error",
        secondary: "Page number entered in URL is invalid!",
      };
      res.render("../views/shared/failure.ejs", { message });
      return;
    }
    const countOfPendingRecipes = await Recipe.getCountOfPendingRecipes();
    if (countOfPendingRecipes === 0) {
      const message = {
        primary: "No pending recipes",
        secondary: "There are no pending recipes at this time.",
      };
      res.render("../views/shared/success.ejs", { message });
      return;
    }

    const resultsPerPage = 4;
    const { offset, currPage, totalPages } =
      paginationUtil.getPaginationOffsetAndCurrPage(
        req,
        countOfPendingRecipes,
        resultsPerPage,
        res,
        "/pending-recipes/?"
      );
    let pendingRecipes;
    try {
      pendingRecipes = await Recipe.getPendingRecipes(resultsPerPage, offset);
    } catch (error) {
      throw error;
    }

    const paginationMetaData = paginationUtil.getPaginationMetadata(
      currPage,
      totalPages
    );

    res.render("../views/admin/pending-recipes.ejs", {
      pendingRecipes,
      paginationMetaData,
      totalResults: countOfPendingRecipes,
    });
    return;
  } catch (error) {
    const message = {
      primary: "Error",
      secondary:
        "There is some problem getting pending recipes, Please try again!",
    };
    console.log(error);
    res.render("../views/shared/failure.ejs", { message });
    return;
  }
}

async function getPendingRecipeDetails(req, res, next) {
  const recipe = await recipeIdValidation(
    req,
    res,
    next,
    Recipe.getAllDetailsOfRecipeWithId
  );
  recipe.pageType = "Pending Recipe";
  recipe.fromPage = req.query.fromPage;
  res.render("../views/shared/recipe-details.ejs", { recipe });
}

async function getPublishedRecipes(req, res, next) {
  try {
    if (req.query.page && isNaN(+req.query.page)) {
      const message = {
        primary: "Error",
        secondary: "Page number entered in URL is invalid!",
      };
      res.render("../views/shared/failure.ejs", { message });
      return;
    }

    const countOfPublishedRecipes = await Recipe.getCountOfPublishedRecipes();
    if (countOfPublishedRecipes === 0) {
      const message = {
        primary: "No published recipes",
        secondary: "There are no published recipes at this time.",
      };
      res.render("../views/shared/success.ejs", { message });
      return;
    }

    const resultsPerPage = 4;
    const { offset, currPage, totalPages } =
      paginationUtil.getPaginationOffsetAndCurrPage(
        req,
        countOfPublishedRecipes,
        resultsPerPage,
        res,
        "/published-recipes/?"
      );
    let publishedRecipes;
    try {
      publishedRecipes = await Recipe.getPublishedRecipes(
        resultsPerPage,
        offset
      );
    } catch (error) {
      throw error;
    }

    const paginationMetaData = paginationUtil.getPaginationMetadata(
      currPage,
      totalPages
    );

    res.render("../views/admin/published-recipes.ejs", {
      publishedRecipes,
      paginationMetaData,
      totalResults: countOfPublishedRecipes,
    });
    return;
  } catch (error) {
    const message = {
      primary: "Error",
      secondary:
        "There is some problem getting published recipes, Please try again!",
    };
    console.log(error);
    res.render("../views/shared/failure.ejs", { message });
    return;
  }
}

async function getPublishedRecipeDetails(req, res, next) {
  const recipe = await recipeIdValidation(
    req,
    res,
    next,
    Recipe.getAllDetailsOfRecipeWithId
  );

  if (!recipe) return;
  recipe.pageType = "Published Recipe";
  recipe.fromPage = req.query.fromPage;
  res.render("../views/shared/recipe-details.ejs", { recipe });
}

async function getRecipeDetails(req, res, next) {
  const recipe = await recipeIdValidation(
    req,
    res,
    next,
    Recipe.getAllDetailsOfRecipeWithId
  );

  if (!recipe) return;

  recipe.pageType = req.query.pageType;
  recipe.fromPage = req.query.fromPage;
  recipe.searchTerm = req.query.searchterm;

  if (
    recipe.pageType != "searchedRecipe" &&
    recipe.pageType != "favourites" &&
    recipe.pageType != "Top" &&
    recipe.pageType != "myRecipes"
  ) {
    const message = {
      primary: "Error",
      secondary: "No recipe found with having page type as " + recipe.pageType,
    };
    res.render("../views/shared/failure.ejs", { message });
  }

  if (!req.session.isAdmin && recipe.status != "pending") {
    recipe.views = await Recipe.getRecipeViews(recipe.id);
    await Recipe.addRecipeView(recipe.id);
  }

  if (!req.session.isAdmin && req.session.uid) {
    try {
      const userId = req.session.uid;
      const recipeId = recipe.id;
      const favourite = new Favourite({ userId, recipeId });
      recipe.isFavourite = await favourite.isFavourite();
    } catch (error) {
      next(error);
      return;
    }
  }
  res.render("../views/shared/recipe-details.ejs", { recipe });
}

async function getUserSubmittedRecipes(req, res, next) {
  try {
    if (req.query.page && isNaN(+req.query.page)) {
      const message = {
        primary: "Error",
        secondary: "Page number entered in URL is invalid!",
      };
      res.render("../views/shared/failure.ejs", { message });
      return;
    }

    const countOfUserSubmittedRecipes =
      await Recipe.getCountOfUserSubmittedRecipes(req.session.uid);
    if (countOfUserSubmittedRecipes === 0) {
      const message = {
        primary: "Empty submission list",
        secondary: "There are no recipes submitted by you at this time.",
      };
      res.render("../views/shared/success.ejs", { message });
      return;
    }

    const resultsPerPage = 4;
    const { offset, currPage, totalPages } =
      paginationUtil.getPaginationOffsetAndCurrPage(
        req,
        countOfUserSubmittedRecipes,
        resultsPerPage,
        res,
        "/my-recipes/?"
      );
    let userSubmittedRecipes;
    try {
      userSubmittedRecipes = await Recipe.getUserSubmittedRecipes(
        req.session.uid,
        resultsPerPage,
        offset
      );
    } catch (error) {
      throw error;
    }

    const paginationMetaData = paginationUtil.getPaginationMetadata(
      currPage,
      totalPages
    );

    res.render("../views/shared/my-recipes.ejs", {
      userSubmittedRecipes,
      paginationMetaData,
      totalResults: countOfUserSubmittedRecipes,
    });
    return;
  } catch (error) {
    const message = {
      primary: "Error",
      secondary:
        "There is some problem getting user submitted recipes, Please try again!",
    };
    console.log(error);
    res.render("../views/shared/failure.ejs", { message });
  }
}

async function addRecipeToFavourites(req, res, next) {
  const recipe = await recipeIdValidation(
    req,
    res,
    next,
    Recipe.getAllDetailsOfRecipeWithId
  );

  if (!recipe) return;

  if (recipe.user_id == req.session.uid) {
    const message = {
      primary: "Error",
      secondary: "Can not add your own recipe to favourites!",
    };
    res.render("../views/shared/success.ejs", { message });
    return;
  }

  const pageType = req.query.pageType;
  const fromPage = req.query.fromPage;
  const searchTerm = req.query.searchterm;

  if (
    pageType != "searchedRecipe" &&
    pageType != "favourites" &&
    pageType != "Top"
  ) {
    const message = {
      primary: "Error",
      secondary: "No recipe found with having page type as " + pageType,
    };
    res.render("../views/shared/failure.ejs", { message });
    return;
  }

  const userId = req.session.uid;
  const recipeId = recipe.id;

  const favourite = new Favourite({ userId, recipeId });

  try {
    const isFavourite = await favourite.isFavourite();
    if (isFavourite) {
      const message = {
        primary: "Already added to favourites",
        secondary: "You have already added this recipe to your favourites!",
      };
      res.render("../views/shared/success.ejs", { message });
      return;
    }

    await favourite.addFavourite();
    res.redirect(
      `/recipe-details/${recipe.id}/${recipe.title}?fromPage=${fromPage}&pageType=${pageType}&searchterm=${searchTerm}`
    );
  } catch (error) {
    const message = {
      primary: "Error",
      secondary:
        "There is some problem adding this recipe to your favourites, Please try again!",
    };
    console.log(error);
    res.render("../views/shared/failure.ejs", { message });
    return;
  }
}

async function removeFavourite(req, res, next) {
  const recipe = await recipeIdValidation(
    req,
    res,
    next,
    Recipe.getAllDetailsOfRecipeWithId
  );

  if (!recipe) return;

  const pageType = req.query.pageType;
  const fromPage = req.query.fromPage;
  const searchTerm = req.query.searchterm;

  if (
    pageType != "searchedRecipe" &&
    pageType != "favourites" &&
    pageType != "Top"
  ) {
    const message = {
      primary: "Error",
      secondary: "No recipe found with having page type as " + pageType,
    };
    res.render("../views/shared/failure.ejs", { message });
  }

  const userId = req.session.uid;
  const recipeId = recipe.id;

  const favourite = new Favourite({ userId, recipeId });

  try {
    const isFavourite = await favourite.isFavourite();
    if (!isFavourite) {
      const message = {
        primary: "Not added to favourites",
        secondary: "You have not added this recipe to your favourites!",
      };
      res.render("../views/shared/success.ejs", { message });
      return;
    }
    await favourite.removeFavourite();
    res.redirect(
      `/recipe-details/${recipe.id}/${recipe.title}?fromPage=${fromPage}&pageType=${pageType}&searchterm=${searchTerm}`
    );
  } catch (error) {
    const message = {
      primary: "Error",
      secondary:
        "There is some problem removing this recipe from your favourites, Please try again!",
    };
    console.log(error);
    res.render("../views/shared/failure.ejs", { message });
    return;
  }
}

async function getAllFavourites(req, res, next) {
  try {
    if (req.query.page && isNaN(+req.query.page)) {
      const message = {
        primary: "Error",
        secondary: "Page number entered in URL is invalid!",
      };
      res.render("../views/shared/failure.ejs", { message });
      return;
    }
    const countOfFavouriteRecipes = await Favourite.getCountOfFavourites(
      req.session.uid
    );
    if (countOfFavouriteRecipes === 0) {
      const message = {
        primary: "No favourite recipes",
        secondary:
          "There are no favourite recipes in your list. Try adding some!",
      };
      res.render("../views/shared/success.ejs", { message });
      return;
    }

    const resultsPerPage = 4;
    const { offset, currPage, totalPages } =
      paginationUtil.getPaginationOffsetAndCurrPage(
        req,
        countOfFavouriteRecipes,
        resultsPerPage,
        res,
        "/favourites/?"
      );
    let favouriteRecipes;
    try {
      favouriteRecipes = await Favourite.getFavouriteRecipes(
        req.session.uid,
        resultsPerPage,
        offset
      );
    } catch (error) {
      throw error;
    }

    const paginationMetaData = paginationUtil.getPaginationMetadata(
      currPage,
      totalPages
    );

    res.render("../views/shared/favourite-recipes.ejs", {
      favouriteRecipes,
      paginationMetaData,
      totalResults: countOfFavouriteRecipes,
    });
    return;
  } catch (error) {
    const message = {
      primary: "Error",
      secondary:
        "There is some problem getting your favourite recipes, Please try again!",
    };
    console.log(error);
    res.render("../views/shared/failure.ejs", { message });
    return;
  }
}

async function rejectRecipe(req, res, next) {
  try {
    const recipe = await recipeIdValidation(
      req,
      res,
      next,
      Recipe.getRecipeWithId
    );
    await Recipe.rejectRecipe(recipe.id);
    res.redirect(`/pending-recipes`);
  } catch (error) {
    next(error);
    return;
  }
}

async function approveRecipe(req, res, next) {
  try {
    const recipe = await recipeIdValidation(
      req,
      res,
      next,
      Recipe.getRecipeWithId
    );
    await Recipe.approveRecipe(recipe.id);
    res.redirect(`/pending-recipes`);
  } catch (error) {
    next(error);
    return;
  }
}

async function deleteRecipe(req, res, next) {
  try {
    const recipe = await recipeIdValidation(
      req,
      res,
      next,
      Recipe.getRecipeWithId
    );
    await Recipe.deleteRecipe(recipe.id);
    res.redirect(`/published-recipes`);
  } catch (error) {
    next(error);
    return;
  }
}

async function editRecipe(req, res, next) {
  const recipe = await recipeIdValidation(
    req,
    res,
    next,
    Recipe.getAllDetailsOfRecipeWithId
  );

  recipe.recipeId = recipe.id;

  recipe.category = recipe.category_id;

  recipe.prevImgSrc = recipe.image;
  recipe.prevImgOriginalName = recipe.image.slice(37);

  const filePath = path.join(path.resolve("./"), "recipe-images", recipe.image);
  const fileStats = await fs.stat(filePath);
  recipe.prevImgSize = fileStats.size;
  recipe.formType = "edit";

  recipe.validationErrors = {
    focused: "title",
  };

  sessionflashUtil.flashDataToSession(
    req,
    {
      ...recipe,
    },
    function () {
      res.redirect("/new-recipe-form");
    }
  );
}

async function updateRecipe(req, res, next) {
  const userData = req.body;
  userData.image = req.file;

  if (
    userData.image &&
    userData.image.originalname !== userData.prevImgOriginalName &&
    userData.image.size !== userData.prevImgSize
  ) {
    try {
      if (userData.prevImgSrc != "none")
        await Recipe.deleteImage(userData.prevImgSrc);
    } catch (error) {
      next(error);
      return;
    }
  }

  if (
    userData.image &&
    userData.image.originalname == userData.prevImgOriginalName &&
    userData.image.size == userData.prevImgSize
  ) {
    try {
      await Recipe.deleteImage(userData.prevImgSrc);
    } catch (error) {
      next(error);
      return;
    }
  }

  if (!userData.image && userData.prevImgOriginalName != "none") {
    userData.image = {
      filename: userData.prevImgSrc,
      originalname: userData.prevImgOriginalName,
      size: userData.prevImgSize,
    };
  }

  try {
    userData.categories = await Category.getAllCategories();
  } catch (error) {
    next(error);
    return;
  }

  const validationErrors = validateUtil.validateRecipe(userData);

  if (!validationErrors.isValid) {
    if (userData.image) {
      userData.prevImgOriginalName = userData.image.originalname;
      userData.prevImgSrc = userData.image.filename;
      userData.prevImgSize = userData.image.size;
    }

    sessionflashUtil.flashDataToSession(
      req,
      {
        validationErrors,
        ...userData,
      },
      function () {
        res.redirect("/new-recipe-form");
      }
    );
    return;
  }

  userData.image = userData.image.filename;

  if (userData.youtubevideo === "") userData.youtubevideo = "none";
  userData.status = "approved";
  userData.lastEdit = "admin";

  userData.id = userData.recipeId;

  const recipe = new Recipe(userData);

  try {
    await recipe.updateRecipe();
    const urlTitle = userData.title.replace(/\s+/g, "-");
    res.redirect(
      `published-recipe-details/${userData.id}/${urlTitle}?fromPage=1`
    );
  } catch (error) {
    next(error);
    return;
  }
}

async function searchRecipe(req, res, next) {
  const searchTerm = req.query.searchterm;
  try {
    if (req.query.page && isNaN(+req.query.page)) {
      const message = {
        primary: "Error",
        secondary: "Page number entered in URL is invalid!",
      };
      res.render("../views/shared/failure.ejs", { message });
      return;
    }
    const countOfSearchedRecipes = await Recipe.getCountOfSearchResults(
      searchTerm
    );
    if (countOfSearchedRecipes === 0) {
      const message = {
        primary: "No Results Found",
        secondary: "No results found for your search term!",
      };
      res.render("../views/shared/failure.ejs", { message });
      return;
    }

    const resultsPerPage = 4;
    const { offset, currPage, totalPages } =
      paginationUtil.getPaginationOffsetAndCurrPage(
        req,
        countOfSearchedRecipes,
        resultsPerPage,
        res,
        "/search-recipe/?searchterm=" + searchTerm + "&"
      );

    let searchedRecipes;
    try {
      searchedRecipes = await Recipe.getSearchedRecipes(
        searchTerm,
        resultsPerPage,
        offset
      );
    } catch (error) {
      throw error;
    }

    const paginationMetaData = paginationUtil.getPaginationMetadata(
      currPage,
      totalPages
    );

    res.render("../views/shared/searched-recipes.ejs", {
      searchedRecipes,
      paginationMetaData,
      totalResults: countOfSearchedRecipes,
      searchTerm,
    });
    return;
  } catch (error) {
    const message = {
      primary: "Error",
      secondary:
        "There is some problem getting searched recipes, Please try again!",
    };
    console.log(error);
    res.render("../views/shared/failure.ejs", { message });
    return;
  }
}

async function recipeIdValidation(req, res, next, modelFunc) {
  try {
    let recipe;

    if (!isNaN(+req.params.recipeId)) {
      [recipe] = await modelFunc(req.params.recipeId);
    }

    if (
      !recipe ||
      recipe.length === 0 ||
      isNaN(+req.params.recipeId) ||
      recipe.title !== req.params.recipeTitle ||
      (!req.session.isAdmin &&
        (recipe.status == "pending" || recipe.status == "rejected") &&
        recipe.user_id != req.session.uid)
    ) {
      const message = {
        primary: "Recipe not found",
        secondary:
          "We could not find the requested recipe, Please check the URL!",
      };
      res.render("../views/shared/failure.ejs", { message });
      return;
    }
    return recipe;
  } catch (error) {
    next(error);
    return;
  }
}

module.exports = {
  getNewRecipeForm,
  addNewRecipe,
  getPendingRecipes,
  getPendingRecipeDetails,
  getPublishedRecipes,
  getPublishedRecipeDetails,
  getRecipeDetails,
  rejectRecipe,
  approveRecipe,
  editRecipe,
  deleteRecipe,
  updateRecipe,
  searchRecipe,
  addRecipeToFavourites,
  removeFavourite,
  getAllFavourites,
  getUserSubmittedRecipes,
};
