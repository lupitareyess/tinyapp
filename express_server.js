const express = require("express");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//Change this later, will be for homepage
app.get("/", (req, res) => {
  res.send("Hello!");
});

// Pass URL data to urls_index template
app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase
  }
  res.render("urls_index", templateVars);
});

// Render form on web page to present to user 
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});



// Handle the form submission

// Page that displays a single URL and its shortened form
app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id]
  }
  res.render("urls_show", templateVars);
});



// listen should always be at the end 
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});