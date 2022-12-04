function isEmailConfirmed(email, confirmemail) {
  return email === confirmemail;
}

function isPasswordValid(password) {
  password = password.trim();
  return password.length >= 6 && password.length <= 20;
}

function isEmailValid(email) {
  return email && email.trim() !== "";
}

function validateRecipe(recipe) {
  let isValid = true;
  let focused;
  const errors = {};

  if (recipe.title === "") {
    isValid = false;
    errors.titleError = "Title is required";
    focused = "title";
  }

  if (recipe.title.length > 25) {
    isValid = false;
    errors.titleError = "Title must be within 25 characters!";
    focused = "title";
  }

  if (!recipe.image) {
    isValid = false;
    errors.imageError = "Image is required!";
    if (!focused) focused = "image";
  }

  if (recipe.category === "") {
    isValid = false;
    errors.categoryError = "Category is required!";
    if (!focused) focused = "category";
  }

  let categoryFound = false;
  for (const category of recipe.categories) {
    if (category.id == recipe.category) {
      categoryFound = true;
      break;
    }
  }
  if (!categoryFound) {
    isValid = false;
    errors.categoryError = "Category is not valid!";
    if (!focused) focused = "category";
  }

  if (recipe.dishtype === "") {
    isValid = false;
    errors.dishtypeError = "Dish type is required!";
    if (!focused) focused = "dishtype";
  }

  if (recipe.dishtype != "1" && recipe.dishtype != "0") {
    isValid = false;
    errors.dishtypeError = "Dish type is not valid!";
    if (!focused) focused = "dishtype";
  }

  if (recipe.ingredients === "") {
    isValid = false;
    errors.ingredientsError = "Ingredients is required!";
    if (!focused) focused = "ingredients";
  }

  if (recipe.ingredients.length > 1000) {
    isValid = false;
    errors.ingredientsError = "Ingredients must be within 1000 characters!";
    if (!focused) focused = "ingredients";
  }

  if (recipe.description === "") {
    isValid = false;
    errors.descriptionError = "Description is required!";
    if (!focused) focused = "description";
  }

  if (recipe.description.length > 4000) {
    isValid = false;
    errors.descriptionError = "Description must be within 4000 characters!";
    if (!focused) focused = "description";
  }

  if (
    recipe.youtubevideo &&
    !recipe.youtubevideo.includes("https://www.youtube.com/embed/")
  ) {
    isValid = false;
    errors.youtubevideoError = "Youtube video format is incorrect!";
    if (!focused) focused = "youtubevideo";
  }

  errors.isValid = isValid;
  errors.focused = focused;

  return errors;
}

module.exports = {
  isEmailConfirmed,
  isPasswordValid,
  isEmailValid,
  validateRecipe,
};
