var express = require("express");
var bodyParser = require('body-parser');
var passport = require("passport");
var session = require("express-session");
var mongoose = require("mongoose");

var configDB = require("./config/db");
var app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(session({secret: 'daretostanley', resave: false, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(configDB.url);

require('./app/route')(app, passport);
require("./config/passport")(passport);

app.listen(process.env.PORT, function(err){
    if(err) throw err;
    console.log('listening at ', process.env.PORT);
})