require('dotenv').config();
const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const mongoose = require("mongoose");
const passport = require("passport");
const session = require('express-session');


//---------------------------------------------------------------


mongoose.connect("mongodb://localhost:27017/database", { useNewUrlParser: true });

const User = require('./models/User')
passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});


//---------------------------------------------------------------


const app = express();

app.use(express.static("public"))
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    secret: "a8FRCWFjhd",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


//---------------------------------------------------------------


app.get("/", function (req, res) {
    res.render("home")
});

app.get("/register", function (req, res) {
    res.render("register")
})

app.get("/login", function (req, res) {
    res.render("login")
})

app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
})

app.get("/sessions", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("sessions");
    } else {
        res.redirect("/login");
    }
});

app.post("/register", function (req, res) {
    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/login");
            });
        }
    });
});

app.post("/login", function (req, res) {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/sessions");
            });
        }
    });

});


//---------------------------------------------------------------

app.listen(3000, function () {
    console.log("Server started on port 3000.");
});
