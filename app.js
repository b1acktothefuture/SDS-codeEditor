require('dotenv').config();
const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const mongoose = require("mongoose");
const passport = require("passport");
const session = require('express-session');
const http = require('http')
const path = require('path')
const socketIO = require('socket.io')
var ot = require('ot');
// const { userJoin, getCurrUser, userLeaves, getSessionUsers } = require("./utils/users")

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
const server = http.createServer(app);
const io = socketIO(server)

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
        res.render("home", { nameVar: req.user.name });
    } else {
        res.redirect("/");
    }
})

app.get("/sessions/join", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("join", { sessionID: "", displayName: req.user.name })
    }
    else {
        res.render("join", { sessionID: "", displayName: "" })
    }
})

app.get("/sessions", function (req, res) {
    if (req.query["id"]) {
        if (req.query["name"]) {
            Session.findOne({ _id: req.query["id"] }, function (err, data) {
                if (err) {
                    console.log('err')
                    res.render("error")
                }
                else {
                    if (data) {
                        res.render("session", { nameVar: data.sessionName })
                    }
                    else {
                        res.render('error')
                    }
                }
            })
        }
        else
            res.render("join", { sessionID: req.query["id"], displayName: "" })
    }
    else {
        res.render('error')
    }
})

app.post("/sessions/newSession", function (req, res) {
    if (req.isAuthenticated()) {
        var newSession = new Session({
            sourceCode: "",
            owner: req.user.username,
            sessionName: req.body.sessionName
        });
        newSession.save(function (err, data) {
            if (err) {
                console.log(err)
                res.render("error")
            }
            else {
                User.findByIdAndUpdate({ _id: req.user._id },
                    { $push: { sessions: data._id } },
                    function (error, success) {
                        if (error) {
                            console.log(error);
                            res.render("error")
                        }
                    })
                res.redirect('/sessions?id=' + data._id + '&name=' + req.user.name)
            }
        })
    } else {
        res.redirect("/");
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

var sessionList = {};

io.on('connection', function (socket) {

    socket.on('joinSession', (data) => {

        if (!sessionList[data.session]) {
            // Backup remaining
            var str = "";
            Session.find({}, {
                _id: data.session
            }, (err, data) => {
                str += data.sourceCode
            });
            console.log(str)

            if (!str) {
                str =
                    '// Welcome User';
            }
            var socketIOServer = new ot.EditorSocketIOServer(str, [], data.session, (socket, cb) => {
                var self = this;
                Session.findByIdAndUpdate({ _id: data.session }, { $set: { docObj: self.document } }, function (err, file) {
                    if (err)
                        return cb(false);
                    cb(true);
                });
            });
            sessionList[data.session] = socketIOServer;

        }

        sessionList[data.session].addClient(socket);

        sessionList[data.session].setName(socket, data.username);

        socket.room = data.session;
        socket.join(data.session);
        io.to(socket.room).emit('chatMessage', { message: data.username + " has joined the chat", username: ">" })
    });

    socket.on('chatMessage', function (data) {
        io.to(socket.room).emit('chatMessage', data);
    });

    socket.on("saveCode", function (data) {
        console.log(data)
        Session.findByIdAndUpdate({ _id: data.session }, { $set: { sourceCode: data.code } }, function (err, file) {
            if (err)
                console.log(err)
        });
    })

    socket.on('disconnect', function () {
        io.to(socket.room).emit('chatMessage', { message: "A has left the chat", username: ">" })
        socket.leave(socket.room);
    });
})

//---------------------------------------------------------------

server.listen(3000, function () {
    console.log("Server started on port 3000.");
});
