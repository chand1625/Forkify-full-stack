const mysql = require("mysql2/promise");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const dotenv = require("dotenv");

function createSessionStore() {
  const options = {
    host: "localhost",
    port: 3306,
    user: "root",
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  };

  const connection = mysql.createPool(options);
  const sessionStore = new MySQLStore({}, connection);
  return sessionStore;
}

function createSessionConfig() {
  return {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: createSessionStore(),
    cookie: {
      maxAge: 2 * 24 * 60 * 60 * 1000,
    },
  };
}

module.exports = createSessionConfig;
