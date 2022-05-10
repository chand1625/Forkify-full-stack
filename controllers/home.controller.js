const Recipe = require("../models/recipe.model");

function checkAuthorization(req, res, next) {
  if (res.locals.isAdmin) {
    res.redirect("/dashboard");
  } else {
    next();
  }
}

async function getHome(req, res, next) {
  try {
    const topRecipes = await Recipe.getTopRecipes();
    res.render("../views/shared/home.ejs", { topRecipes });
  } catch (error) {
    next(error);
    return;
  }
}

function getDashboard(req, res) {
  res.render("../views/admin/dashboard.ejs");
}

module.exports = {
  checkAuthorization,
  getHome,
  getDashboard,
};
