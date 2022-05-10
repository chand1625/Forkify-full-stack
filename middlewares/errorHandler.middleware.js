function errorHandlerMiddleware(error, req, res, next) {
  console.log(error);
  res.status(500).render("./shared/500.ejs");
}

module.exports = errorHandlerMiddleware;
