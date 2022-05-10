const path = require("path");

const express = require("express");
const expressSession = require("express-session");

const createSessionConfig = require("./config/session");

const pageNotFoundMiddleware = require("./middlewares/pageNotFound.middleware");
const errorHandlerMiddleware = require("./middlewares/errorHandler.middleware");
const { checkAuthentication } = require("./middlewares/checkAuth.middleware");

const homeRoutes = require("./routes/home.routes");
const authRoutes = require("./routes/auth.routes");
const recipe = require("./routes/recipe.routes");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
app.use(express.static("recipe-images"));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const sessionConfig = createSessionConfig();

app.use(expressSession(sessionConfig));

app.use(checkAuthentication);

app.use(homeRoutes);
app.use(authRoutes);
app.use(recipe);

app.use(pageNotFoundMiddleware);
app.use(errorHandlerMiddleware);

app.listen(3000, () => {
  console.log("Server is running on port 3000 ✅");
});
