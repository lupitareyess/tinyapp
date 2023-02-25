// -------------- DEPENDENCIES & PORT ----------------- //
const express = require("express");
const bcrypt = require("bcryptjs");
const methodOverride = require("method-override");
const cookieSession = require("cookie-session");
const { generateRandomString, getUserByEmail, urlsForUser } = require("./helpers");

const app = express();
const PORT = 8080;

// ---------------- MIDDLEWARE ------------------ //
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(cookieSession({
  name: "session",
  keys: ["key1"]
}));

// ----------------- DATA --------------------- //
const { urlDatabase, users } = require("./data");

// -------------- GET REQUESTS ---------------- //

// Landing page, redirects to login page if user is not logged in
app.get("/", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    return res.redirect("/login");
  }

  return res.redirect("/urls");
});

// Display users URLs if logged in
app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  const user = users[userID];
  const templateVars = {
    urls: urlsForUser(userID, urlDatabase),
    user: users[userID],
    error: "Please log in or register to access TinyApp URLs."
  };

  if (!user) {
    return res.status(403).render("errors", templateVars);
  }

  return res.render("urls_index", templateVars);
});

// Page to create new URL, user must be logged in
app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    return res.redirect("/login");
  }
  const templateVars = {
    user: users[userID]
  };

  return res.render("urls_new", templateVars);
});

// Page that displays a single URL and its shortened form
app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  const userID = req.session.user_id;
  const userURLS = urlsForUser(userID, urlDatabase);

  if (!userID) {
    const templateVars = {
      user: null,
      error: "Please log in or register to access TinyApp URLs."
    };

    return res.status(403).render("errors", templateVars);
  }

  if (!urlDatabase[id]) {
    const templateVars = {
      user: null,
      error: "Oops! Page does not exist."
    }
    return res.status(404).render("errors", templateVars);
  }

  if (!userURLS[id]) {
    const templateVars = {
      user: null,
      error: "You do not have access to this URL."
    }
    return res.status(403).render("errors", templateVars);
  }

  const templateVars = {
    id: id,
    longURL: urlDatabase[id].longURL,
    user: users[userID],
    error: ''
  };

  res.render("urls_show", templateVars);
});

// Redirection from shortURL to the appropriate longURL
app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id];

  if (longURL === undefined) {
    const templateVars = {
      user: null,
      error: "Oops! Short URL does not exist."
    }
    return res.status(400).render("errors", templateVars);
  }

  return res.redirect(urlDatabase[id].longURL);
});

// Render registration template
app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };
  if (templateVars.user) {
    return res.redirect("/urls");
  }

  return res.render("urls_register", templateVars);
});

// Renders login template
app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session.userID]
  };
  if (templateVars.user) {
    return res.redirect("/urls");
  }

  return res.render("urls_login", templateVars);
});

// ------------ POST REQUESTS --------------- //

// Handle the form submission, creates shortURL
app.post("/urls", (req, res) => {
  const userID = req.session.user_id;

  if (!userID) {
    return res.send("Please log in to shorten a TinyApp URL.");
  }

  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  };

  return res.redirect(`/urls/${shortURL}`);
});

// Registration endpoint that handles the registration data
app.post("/register", (req, res) => {
  const userID = generateRandomString();
  const { email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (email === "" || password === "") {
    const templateVars = {
      user: null,
      error: "Please enter a valid email address and password."
    }
    return res.status(400).render("errors", templateVars);
  }
  if (getUserByEmail(email, users)) {
    const templateVars = {
      user: null,
      error: "Email associated with existing account."
    }
    return res.status(400).render("errors", templateVars);
  }
  users[userID] = {
    userID,
    email,
    password: hashedPassword
  };

  req.session.user_id = userID;
  return res.redirect("/urls");
});

// Login Endpoint
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (email === '' || password === '') {
    const templateVars = {
      user: null,
      error: "Please enter a valid email address and password."
    }
    return res.status(400).render("errors", templateVars);
  }

  const user = getUserByEmail(email, users);

  if (!user) {
    const templateVars = {
      user: null,
      error: "User not found. Please register to get started."
    }
    return res.status(403).render("errors", templateVars);
  }

  if (!bcrypt.compareSync(password, user.password)) {
    const templateVars = {
      user: null,
      error: "Incorrect email or password. Please try again."
    }
    return res.status(403).render("errors", templateVars);
  }

  req.session.user_id = user.userID;
  return res.redirect("/urls");

});

// Logout endpoint, clear cookies
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});


// ------------ DELETE & PUT REQUESTS ------------- //

// Delete a URL
app.delete("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  const userID = req.session.user_id;
  const userURLS = urlsForUser(userID, urlDatabase);

  if (!userID) {
    return res.status(403).send("Must be logged in or registered to access URLs.");
  }

  if (!urlDatabase[id]) {
    return res.status(404).send("URL does not exist");
  }

  if (!userURLS[id]) {
    return res.status(403).send("You do not have access");
  }

  delete urlDatabase[id];
  res.redirect("/urls");
});

// Edit/update a URL
app.put("/urls/:id", (req, res) => {
  const id = req.params.id;
  const userID = req.session.user_id;
  let newURL = req.body.updatedURL;

  if (!userID) {
    return res.status(403).send("Must be logged in or registered to access URLs");
  }

  if (!urlDatabase[id]) {
    return res.status(404).send("URL does not exist");
  }

  const userURLS = urlsForUser(userID, urlDatabase);
  if (!userURLS[id]) {
    return res.status(403).send("You do not have acess to this url");
  }

  if (!newURL.includes('http')) {
    newURL = `http://${newURL}`;
  }
  urlDatabase[id].longURL = newURL;
  res.redirect("/urls");
});

// ---------- LISTENING PORT ------------ //
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});