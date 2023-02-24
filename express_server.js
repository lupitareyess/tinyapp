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

// User database
const users = {
  userRandomID: {
    userID: "userRandomID",
    email: "user@example.com",
    password: "hello",
  },
  user2RandomID: {
    userID: "user2RandomID",
    email: "user2@example.com",
    password: "bye",
  },
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

// Function to lookup user
const getUserByEmail = (email) => {
  for (const user in users) {
    if (email === users[user].email) {
      return users[user];
    }
  }
  return null;
}


//Change this later, will be for homepage
app.get("/", (req, res) => {
  res.send("Hello!");
});

// Pass URL data to urls_index template
app.get("/urls", (req, res) => {

  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]]
  }
  res.render("urls_index", templateVars);
});

// Render form on web page to present to user 
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]]
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
    user: users[req.cookies["user_id"]]
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

// Login route - render login template
app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]]
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

  if (email === '' || password === '') {
    return res.status(400).send('400. Email and password is required.');
  }

  const user = getUserByEmail(email)
  console.log(user)
  if (!user) {
    return res.status(404).send("404. User not found.")
  }

  if (user.password !== password) {
    return res.status(403).send("Incorrect password")
  }

  res.cookie("user_id", user.userID);;
  return res.redirect("/urls");

});

// Logout endpoint - clear cookies
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

// Registration route - render registration template
app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]]
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
  if (email === "" || password === "") {
    return res.status(404).send('400. Request has resulted in an error');
  }
  else if (getUserByEmail(email)) {
    return res.status(404).send('400. Email associated with existing account')
  }
  else {
    users[userID] = {
      userID,
      email,
      password
    };

    res.cookie("user_id", userID);
    return res.redirect("/urls");
  }
});





// listen should always be at the end 
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});