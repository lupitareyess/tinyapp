/**
 * Function that returns 6 random alphanumeric characters
 * @returns {string}
 */
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

/**
 * Function that takes in users email, and loops through database to find if its already stored
 *
 * @param {string} email
 * @param {object} userDatabase
 * @returns {object}
 */
const getUserByEmail = (email, userDatabase) => {
  for (const user in userDatabase) {
    if (email === userDatabase[user].email) {
      return userDatabase[user];
    }
  }
  return undefined;
};

/**
 * Function that return a shortURL if it belongs to the user requesting it
 *
 * @param {string} userID
 * @param {object} urlDatabase
 * @returns {object}
 */
const urlsForUser = (userID, urlDatabase) => {
  let userUrls = {};
  for (const id in urlDatabase) {
    if (userID === urlDatabase[id].userID) {
      userUrls[id] = urlDatabase[id].longURL;
    }
  }
  return userUrls;
};

module.exports = { generateRandomString, getUserByEmail, urlsForUser };