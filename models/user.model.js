const bcrypt = require("bcrypt");

const db = require("../data/database");

class User {
  constructor(email, password) {
    this.email = email;
    this.password = password;
  }

  async signup() {
    const hashedPassword = await bcrypt.hash(this.password, 12);
    const data = [this.email, hashedPassword, 0];
    try {
      await db.query("INSERT INTO users (email,password,is_admin) VALUES(?)", [
        data,
      ]);
    } catch (error) {
      throw error;
    }
  }

  async getUserwithEmail() {
    try {
      const [user] = await db.query("SELECT * FROM users WHERE email=?", [
        this.email,
      ]);
      user[0].email = user[0].email.split("@")[0];
      user[0].email =
        user[0].email.charAt(0).toUpperCase() + user[0].email.slice(1);
      return user;
    } catch (error) {
      throw error;
    }
  }

  async getExistingUserwithEmail() {
    try {
      const [user] = await db.query("SELECT * FROM users WHERE email=?", [
        this.email,
      ]);

      if (user.length == 0) return user;

      user[0].name = user[0].email.split("@")[0];
      user[0].name =
        user[0].name.charAt(0).toUpperCase() + user[0].name.slice(1);
      return user;
    } catch (error) {
      throw error;
    }
  }

  async hasMatchingPassword(hashedPassword) {
    try {
      const isMatch = await bcrypt.compare(this.password, hashedPassword);
      return isMatch;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;
