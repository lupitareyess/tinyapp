const bcrypt = require("bcryptjs");

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const users = {
  userRandomID: {
    userID: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("hello", 10)
  },
  user2RandomID: {
    userID: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("bye", 10)
  },
};

module.exports = { urlDatabase, users };