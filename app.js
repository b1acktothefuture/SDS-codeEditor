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
const Session = require('./models/Session')

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
    if (req.isAuthenticated()) {
        res.redirect("/home")
    }
    else { res.render("index") }
});

app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
})

app.get("/home", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("home");
    } else {
        res.redirect("/login");
    }
})

app.get("/sessions/newSession", function (req, res) {
    if (req.isAuthenticated()) {
        var newSession = new Session({
            sourceCode: "",
            owner: req.user.username
        });
        newSession.save(function (err, data) {
            if (err) {
                console.log(err)
                res.render("error")
            }
            else {
                console.log(data._id)
                req.user.sessions.push(data._id)
                User.findByIdAndUpdate({ _id: req.user._id },
                    { $push: { sessions: data._id } },
                    function (error, success) {
                        if (error) {
                            console.log(error);
                            res.render("error")
                        }
                    })
                res.redirect('/sessions/' + data._id)
            }
        })
    } else {
        res.redirect("/login");
    }
})

app.get("/sessions/:id", function (req, res) {
    if (req.params.id) {
        Session.findOne({ _id: req.params.id }, function (err, data) {
            if (err) {
                console.log('err')
                res.render("error")
            }
            if (data) {
                // Implementation remaining
                console.log(data)
                res.render("session")
            }
            else {
                res.render('error')
            }
        })
    }
    else {
        res.render('error')
    }
})

app.post("/register", function (req, res) {
    User.register({ username: req.body.username, name: req.body.name }, req.body.password, function (err, user) {
        if (err) {
            console.log(err)
            res.redirect("/")
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/home");
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
                res.redirect("/home");
            });
        }
    });

});


//---------------------------------------------------------------


app.listen(3000, function () {
    console.log("Server started on port 3000.");
});
