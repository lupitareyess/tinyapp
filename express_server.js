const express = require("express");
const app = express();
const PORT = 8080;
const cookieParser = require('cookie-parser');
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");
const { generateRandomString, getUserByEmail, urlsForUser } = require("./helpers");

app.set("view engine", "ejs");

// parses the body
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cookieSession({
  name: "session",
  keys: ["key1"]
}));

// New URL database - longURL now nested in object
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

// User database
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


//Change this later, will be for homepage
app.get("/", (req, res) => {
  res.send("Hello!");
});

// Pass URL data to urls_index template
app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {
    urls: urlsForUser(userID, urlDatabase),
    user: users[userID]
  }
  console.log(userID);
  console.log(templateVars);

  if (!templateVars.user) {
    return res.send("Please log in or register to access URLs.")
  }
  return res.render("urls_index", templateVars);
});

// Render form on web page to present to user 
app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {
    user: users[userID]
  }
  if (!templateVars.user) {
    return res.redirect("/login")
  }
  return res.render("urls_new", templateVars);
});

// Handle the form submission
app.post("/urls", (req, res) => {
  const userID = req.session.user_id;

  if (!userID) {
    return res.send("Please login to shorten a URL")
  }
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  }
  return res.redirect(`/urls/${shortURL}`);
})

// Redirect to the appropriate long URL
app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id]

  if (longURL === undefined) {
    return res.status(400).send("Short URL does not exist")
  }
  //make sure its not being added to database
  console.log(urlDatabase[id].longURL);
  res.redirect(urlDatabase[id].longURL);
});


// Page that displays a single URL and its shortened form
app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  const userID = req.session.user_id;
  const userURLS = urlsForUser(userID, urlDatabase);

  //if user is not logged in
  if (!userID) {
    return res.status(403).send("Must be logged in or registered to acess URLs")
  }

  //if shortURL does not exist in url databse
  if (!urlDatabase[id]) {
    return res.status(404).send("URL does no exist")
  }

  //if url does not belong to user
  if (!userURLS[id]) {
    return res.status(403).send("You do not have access")
  }


  const templateVars = {
    id: id,
    longURL: urlDatabase[id].longURL,
    user: users[userID]
  }
  res.render("urls_show", templateVars);
});

// Delete a URL
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  const userID = req.session.user_id;
  const userURLS = urlsForUser(userID, urlDatabase)

  // if user is not logged in
  if (!userID) {
    return res.status(403).send("Must be logged in or registered to access URLs.")
  }

  // if shortURL does not exist in the database
  if (!urlDatabase[id]) {
    return res.status(404).send("URL does not exist")
  }

  //if url does not belong to user
  if (!userURLS[id]) {
    return res.status(403).send("You do not have access")
  }

  delete urlDatabase[id];
  res.redirect("/urls")
});

// Edit/update a URL
app.post("/urls/:id", (req, res) => {
  const id = req.params.id
  let newURL = req.body.updatedURL;
  const userID = req.session.user_id;
  const userURLS = urlsForUser(userID, urlDatabase)

  // if user not logged in
  if (!userID) {
    return res.status(403).send("Must be logged in or registered to access URLs")
  }

  // if shortURL does not exist in the datas base 
  if (!urlDatabase[id]) {
    return res.status(404).send("URL does not exist")
  }

  // if URL does not belong to the user
  if (!userURLS[id]) {
    return res.status(403).send("You do not have acess to this url")
  }

  if (!newURL.includes('http')) {
    newURL = `http://${newURL}`
  };
  urlDatabase[id] = newURL;
  res.redirect("/urls");
});

// Login route - render login template
app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session.userID]
  }
  if (templateVars.user) {
    return res.redirect("/urls")
  }
  return res.render("urls_login", templateVars)
})

// Login Endpoint
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (email === '' || password === '') {
    return res.status(400).send('400. Email and password is required.');
  }

  const user = getUserByEmail(email, users)
  console.log("user", user)
  if (!user) {
    return res.status(404).send("404. User not found.")
  }
  console.log("user password", user.password);
  console.log("hashed", hashedPassword);
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send("Incorrect password")
  }

  req.session.user_id = user.userID;
  return res.redirect("/urls");

});

// Logout endpoint - clear cookies
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// Registration route - render registration template
app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };
  if (templateVars.user) {
    return res.redirect("/urls");
  }
  return res.render("urls_register", templateVars);
});

// Registration endpoint that handles the registration data:
app.post("/register", (req, res) => {
  const userID = generateRandomString()
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (email === "" || password === "") {
    return res.status(404).send('400. Request has resulted in an error');
  }
  else if (getUserByEmail(email, users)) {
    return res.status(404).send('400. Email associated with existing account')
  }
  else {
    users[userID] = {
      userID,
      email,
      password: hashedPassword
    };

    res.session.user_id = userID;
    return res.redirect("/urls");
  }
});





// listen should always be at the end 
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});