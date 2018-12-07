// init project
const express = require('express');
const app = express();
const bodyparser = require("body-parser");
const cookieparser = require("cookie-parser");
const flash = require('connect-flash');
const mongoose = require('mongoose');
const passport = require("passport");
const session = require("express-session");

mongoose.connect(process.env.DATABASE, { useNewUrlParser: true, useCreateIndex: true });
mongoose.Promise = global.Promise;

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));
app.set('view engine', 'pug');

// bodyparser middleware
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());

// express-session middleware
app.use(session({
  secret: process.env.SECRET,
  resave: true,
  saveUninitialized: true
}));

// express-messages middleware
app.use(require('connect-flash')());
app.use((req, res, next) => {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

// import passport-config file
require("./passport-config")(passport);

// passport middleware
app.use(passport.initialize());
app.use(passport.session());

const routes = require('./routes.js');
routes(app);

// listen for requests :)
let listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
