function pageNotFoundMiddleware(req, res) {
  res.render("./shared/404.ejs");
}

module.exports = pageNotFoundMiddleware;
