function checkAuthentication(req, res, next) {
  const uid = req.session.uid;
  const isAdmin = req.session.isAdmin;

  if (!uid) {
    return next();
  } else if (!isAdmin) {
    res.locals.uid = uid;
    res.locals.isAuth = true;
    res.locals.name = req.session.name;
    next();
  } else {
    res.locals.uid = uid;
    res.locals.isAuth = true;
    res.locals.isAdmin = true;
    res.locals.name = req.session.name;
    next();
  }
}

function checkAdminAuthorization(req, res, next) {
  if (!res.locals.isAdmin) {
    res.redirect("/");
    return;
  }
  next();
}

function checkUserAuthorization(req, res, next) {
  if (!res.locals.isAdmin && res.locals.isAuth) {
    next();
    return;
  }
  res.redirect("/login");
  return;
}

function checkUserOrAdminAuthorization(req, res, next) {
  if (res.locals.isAdmin || res.locals.isAuth) {
    next();
    return;
  }
  res.redirect("/login");
  return;
}

module.exports = {
  checkAuthentication,
  checkAdminAuthorization,
  checkUserAuthorization,
  checkUserOrAdminAuthorization,
};
