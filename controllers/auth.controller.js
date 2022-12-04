const User = require("../models/user.model");
const authUtil = require("../util/authentication");
const sessionflashUtil = require("../util/sessionflash");
const validateUtil = require("../util/validation");

function getSignup(req, res) {
  let sessionData = sessionflashUtil.getSessionData(req);
  if (!sessionData) {
    sessionData = {
      email: "",
      confirmemail: "",
      password: "",
    };
  }
  res.render("./shared/signup.ejs", { sessionData: sessionData });
}

function getLogin(req, res) {
  let sessionData = sessionflashUtil.getSessionData(req);
  if (!sessionData) {
    sessionData = {
      email: "",
      password: "",
    };
  }
  res.render("./shared/login.ejs", { sessionData: sessionData });
}

function logout(req, res) {
  authUtil.destroyUserAuthSession(req);
  res.redirect("/");
}

async function signup(req, res, next) {
  const userData = {
    email: req.body.email,
    confirmemail: req.body.confirmemail,
    password: req.body.password,
  };

  if (!validateUtil.isEmailValid(userData.email)) {
    sessionflashUtil.flashDataToSession(
      req,
      {
        errorMsg: "Email is not valid!",
        ...userData,
      },
      function () {
        res.redirect("/signup");
      }
    );
    return;
  }

  if (!validateUtil.isEmailConfirmed(userData.email, userData.confirmemail)) {
    sessionflashUtil.flashDataToSession(
      req,
      {
        errorMsg: "Email does not match with confirm email!",
        ...userData,
      },
      function () {
        res.redirect("/signup");
      }
    );
    return;
  }

  if (!validateUtil.isPasswordValid(userData.password)) {
    sessionflashUtil.flashDataToSession(
      req,
      {
        errorMsg: "Password length must be between 6 and 20!",
        ...userData,
      },
      function () {
        res.redirect("/signup");
      }
    );
    return;
  }

  const user = new User(req.body.email, req.body.password);
  try {
    const [existingUser] = await user.getExistingUserwithEmail();
    if (existingUser) {
      sessionflashUtil.flashDataToSession(
        req,
        {
          errorMsg: "User exists already!",
          ...userData,
        },
        function () {
          res.redirect("/signup");
        }
      );
      return;
    }
    await user.signup();
  } catch (error) {
    next(error);
    return;
  }
  res.redirect("/login");
}

async function login(req, res, next) {
  const userData = {
    email: req.body.email,
    password: req.body.password,
  };

  const user = new User(req.body.email, req.body.password);
  let existingUser;
  try {
    [existingUser] = await user.getExistingUserwithEmail();
  } catch (error) {
    next(error);
    return;
  }

  if (!existingUser) {
    sessionflashUtil.flashDataToSession(
      req,
      {
        errorMsg: "Invalid Email/Password!",
        ...userData,
      },
      function () {
        res.redirect("/login");
      }
    );
    return;
  }

  const isMatch = await user.hasMatchingPassword(existingUser.password);

  if (!isMatch) {
    sessionflashUtil.flashDataToSession(
      req,
      {
        errorMsg: "Invalid Email/Password!",
        ...userData,
      },
      function () {
        res.redirect("/login");
      }
    );
    return;
  }

  authUtil.createUserSession(req, existingUser, function () {
    res.redirect("/");
  });
}

module.exports = {
  getSignup,
  getLogin,
  signup,
  login,
  logout,
};
