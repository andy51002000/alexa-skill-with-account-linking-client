// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express = require('express');        // call express
var app = express();                 // define our app using express
var bodyParser = require('body-parser');
var partials = require('express-partials');
var logger = require('morgan');
var session = require('express-session')
var port = process.env.PORT || 3000;        // set our port

//===============For amazon account linking=====================================
var passport = require('passport')
var util = require('util')
var AmazonStrategy = require('passport-amazon').Strategy;

const AMAZON_CLIENT_SETTING = require('./project.json');
var AMAZON_CLIENT_ID = AMAZON_CLIENT_SETTING.AMAZON_CLIENT_ID;
var AMAZON_CLIENT_SECRET = AMAZON_CLIENT_SETTING.AMAZON_CLIENT_SECRET;

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Amazon profile is
//   serialized and deserialized.
passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (obj, done) {
    done(null, obj);
});

// Use the AmazonStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Amazon
//   profile), and invoke a callback with a user object.
passport.use(new AmazonStrategy({
    clientID: AMAZON_CLIENT_ID,
    clientSecret: AMAZON_CLIENT_SECRET,
    callbackURL: `http://127.0.0.1:${port}/auth/amazon/callback`
},
    function (accessToken, refreshToken, profile, done) {
        // asynchronous verification, for effect...
        process.nextTick(function () {

            // To keep the example simple, the user's Amazon profile is returned to
            // represent the logged-in user.  In a typical application, you would want
            // to associate the Amazon account with a user record in your database,
            // and return that user instead.
            return done(null, profile);
        });
    }
));

//===============================================================================




// configure Express
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(partials());
app.use(logger('dev'));
app.use(express.static(__dirname + '/public'));
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
}));


app.use(passport.initialize());
app.use(passport.session());


var dbHelper = require('./dynamodbHelper');
var Users = new dbHelper('Users');
app.route('/adddev')
    .get(function (req, res) {
        res.render('adddev');
    })
    .post(function (req, res) {
        Users.find(req.user.id, function (data) {
            console.log(data);
            if (typeof data.Item === "undefined") {
                Users.putItem({ id: req.user.id, devs: [{ sn: req.body.sn, name: req.body.name }] });
            } else {
                let devs = data.Item.devs;
                data.Item.devs.push({ sn: req.body.sn, name: req.body.name });
                Users.putItem(data.Item);
            }

        })
        //Users.putItem({id:req.user.id, sn:req.body.sn, name:req.body.name});
        res.render('adddev_s', { user: req.user });


    });


app.get('/', function (req, res) {
    res.render('index', { user: req.user });
    console.log(req.user);
});

app.get('/account', ensureAuthenticated, function (req, res) {
    res.render('account', { user: req.user });
});




// GET /auth/amazon
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Amazon authentication will involve
//   redirecting the user to amazon.com.  After authorization, Amazon
//   will redirect the user back to this application at /auth/amazon/callback
app.get('/auth/amazon',
    passport.authenticate('amazon', { scope: ['profile', 'postal_code'] }),
    function (req, res) {
        // The request will be redirected to Amazon for authentication, so this
        // function will not be called.
    });
// GET /auth/amazon/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/amazon/callback',
    passport.authenticate('amazon', { failureRedirect: '/login' }),
    function (req, res) {
        res.redirect('/');
    });

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});



// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Start on port ' + port);

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login')
}

function findDevice(devs, name) {

    let sn;
    devs.some(function (element, index, arr) {
        console.log(element);
        if (element.name === name) {
            console.log(`find ${name}`);
            sn = element.sn;
            return true;//break the loop
        }
    });
    return sn;

}


