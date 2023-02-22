const express = require("express");
const app = express();
const PORT = 8080;
const cookieParser = require('cookie-parser');

app.set("view engine", "ejs");

// parses the body
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// Generate unique short URL id whoch returns 6 random alphanumeric characters
const generateRandomString = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const length = 6;
  let randomString = "";
  let randomNumber;

  for (let i = 0; i < length; i++) {
    randomNumber = Math.floor(Math.random() * characters.length);
    randomString += characters[randomNumber];
  }
  return randomString;
};


//Change this later, will be for homepage
app.get("/", (req, res) => {
  res.send("Hello!");
});

// Pass URL data to urls_index template
app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
  }
  res.render("urls_index", templateVars);
});

// Render form on web page to present to user 
app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies["username"]
  }
  res.render("urls_new", templateVars);
});

// Handle the form submission
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
})

// Redirect to the appropriate long URL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id]
  res.redirect(longURL);
});

// Page that displays a single URL and its shortened form
app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    username: req.cookies["username"]
  }
  res.render("urls_show", templateVars);
});

// Delete a URL
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect("/urls")
});

// Edit/update a URL
app.post("/urls/:id", (req, res) => {
  const id = req.params.id
  let newURL = req.body.updatedURL;
  if (!newURL.includes('http')) {
    newURL = `http://${newURL}`
  };
  urlDatabase[id] = newURL;
  res.redirect("/urls");
});

// Login Route
app.post("/login", (req, res) => {
  const cookie = req.body.username
  console.log(cookie)
  res.cookie("username", cookie);
  res.redirect("/urls");
});

// Logout endpoint
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls"); // need to change this later since not ideal
});

// Registration endpoint
app.get("/register", (req, res) => {
  const templateVars = {
    username: req.cookies["username"]
  };
  res.render("urls_register", templateVars);
});


// listen should always be at the end 
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});