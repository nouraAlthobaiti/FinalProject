//jshint esversion:6
//Required Packeges
const express = require("express");
//This package required for variables in the html pages to use in the server and to send to database
const bodyParser = require("body-parser");
// Mongoose to use MongoDB with Node.js
const mongoose = require("mongoose");
const _ = require("lodash"); //working with arrays, numbers, objects, strings, etc.
const bcrypt = require('bcrypt'); //securety
const app = express();
//This package required for user session
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
//const alert = require("alert-node");   :((
// To tell the server to check js files in the views folder
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
// To tell the server to check files in the public folder
app.use(express.static("public"));

//--------------------------------------------
//app.engine('html', require('ejs').renderFile);
//app.set('view engine', 'html');
//--------------------------------------------
// parse incoming requests
app.use(bodyParser.json()); // tells the system that you want json to be used.

mongoose.connect("mongodb://localhost:27017/testForAuth", {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useFindAndModify: false,
  useCreateIndex: true
});

var db = mongoose.connection;

//Check connection
db.once('open', function() {
  console.log('Connected to mongoDB');
});
//Check for DB error
db.on('error', function(err) {
  console.log(err);
});
//_______________________________________________________________________________session

//use sessions for tracking logins
app.use(session({
  secret: 'work hard',
  resave: true,
  saveUninitialized: false,
  store: new MongoStore({
    mongooseConnection: db
  })
}));
//_______________________________________________________________________________schema
// user email username password
var UserSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
  },
  membership: {
    type: Number,
    required: true,
  }
});

//__________________________________________________________________________________collection

//authenticate input against database
UserSchema.statics.authenticate = function(email, password, callback) {
  User.findOne({
      email: email
    })
    .exec(function(err, user) {
      if (err) {
        return callback(err);
      } else if (!user) {
        err = new Error('User not found.');
        err.status = 401;
        return callback(err);
      }
      bcrypt.compare(password, user.password, function(err, result) {
        if (result === true) {
          return callback(null, user);
        } else {
          return callback();
        }
      });
    });
};

//hashing a password before saving it to the database
UserSchema.pre('save', function(next) {
  var user = this;
  bcrypt.hash(user.password, 10, function(err, hash) {
    if (err) {
      return next(err);
    }
    user.password = hash;
    next();
  });
});

//create collection
var User = mongoose.model('User', UserSchema);
//_______________________________________________________________________________functions

//function to control buttons appearance
function visibleBtnHeader(req, res) {
  var N = "none";
  var I = "inline";
  // if user is loging in the display attribute for buttons will change
  if (req.session.userId != null) {
    //first value for btnVisability in header.ejs (button: login , signup)
    //second for btnVisabilityOut in header.ejs (button: logout , profile)
    return [N, I];
  } else {
    return [I, N];
  }
}


//_______________________________________________________________________________routes main

// send home file to this url
app.get('/', function(req, res, next) {
  var visability = visibleBtnHeader(req, res);
  return res.render("index", {
    btnVisability: visability[0],
    btnVisabilityOut: visability[1]
  });

});
//_______________________________________________________________________________routes sign in
// send login file to this url
app.get('/login', function(req, res, next) {
  //return res.render("login");
  // any ejs var should be given value (initiated)
  var visability = visibleBtnHeader(req, res);
  return res.render("login", {
    errmail: '',
    btnVisability: visability[0],
    btnVisabilityOut: visability[1]
  });

  //res.sendFile(__dirname + '/login.html');
});
//_______________________________________________________________________________routes login->pricing

// send pricing file to this url
app.get('/pricing', function(req, res, next) {
  var visability = visibleBtnHeader(req, res);
  return res.render("pricing", {
    btnVisability: visability[0],
    btnVisabilityOut: visability[1]
  });
});

//_______________________________________________________________________________routes signup->pricing

// send pricing file to this url
app.get('/signup', function(req, res, next) {
  var visability = visibleBtnHeader(req, res);
  return res.render("signup", {
    repeatedAccMsg: '',
    btnVisability: visability[0],
    btnVisabilityOut: visability[1]
  });

  //res.sendFile(__dirname + '/signup.html');
});

//_______________________________________________________________________________sign in
app.post('/login', function(req, res, next) {
  if (req.body.logemail && req.body.logpassword) {
    User.authenticate(req.body.logemail, req.body.logpassword, function(error, user) {
      //  req.body.errmail.style.visibility="hidden";
      if (error || !user) {
        var err = new Error('Wrong email or password.');

        return res.render("login", {
          errmail: 'البريد الالكتروني أو كلمة المرور خاطئة'
        });
      } else {
        req.session.userId = user._id;
        return res.redirect('/profile');
      }
    });
  } else {
    var err1 = new Error('All fields required.');
    err1.status = 400;
    return next(err1);
  }
});
//err.status = 401;
//res.send('Wrong email or password.');  //new page
//alert("Wrong email or password"); //nice box :( 'alert-node'
//  document.getElementById('errmsg').style.visibility = "visible";
//req.body.errmail.textContent="البريد الالكتروني أو كلمة المرور خاطئة  ";
//window.alert('message');
//alertMessage('message');
//res.send(alert(err));

//_______________________________________________________________________________sign up
app.post('/signup', function(req, res, next) {

  // confirm that user typed same password twice
  if (req.body.password !== req.body.passwordConf) {
    var err = new Error('Passwords do not match. :( ');
    err.status = 400;
    res.send("passwords dont match :.( ");
    return next(err);
  }

  //if they all entered <sign up>
  /*if (req.body.email &&
    req.body.username &&
    req.body.password &&
    req.body.passwordConf) {
*/
  //create var to make doc
  var userData = {
    email: req.body.email,
    username: req.body.username,
    password: req.body.password,
    membership: 0
  };

  //create doc  ///repeatedAccMsg
  User.create(userData, function(error, user) {
    if (error) {
      return res.render("signup", {
        repeatedAccMsg: "هذا الايميل مستخدم !"
      });
    } else {


      User.authenticate(req.body.email, req.body.password, function(error, user) {
        req.session.userId = user._id;
        return res.redirect('/profile');
      });
    }
  });
  //} //end if

});
//_______________________________________________________________________________profile


// GET route after registering
app.get('/profile', function(req, res, next) {
  var visability = visibleBtnHeader(req, res);

  User.findById(req.session.userId)
    .exec(function(error, user) {
      if (error) {
        return next(error);
      } else {
        if (user === null) {
          var err = new Error('Not authorized! Go back!');
          err.status = 400;
          return next(err);
        } else {
          return res.render("profile", {
            username: user.username,
            email: user.email,
            membership: user.membership,
            btnVisability: visability[0],
            btnVisabilityOut: visability[1]
          }); //(/profile --> change url only) otherwise (render my ejs file)
        }
      }
    });
});

//_______________________________________________________________________________loguot

// GET for logout logout
app.get('/logout', function(req, res, next) {
  if (req.session) {
    // delete session object
    req.session.destroy(function(err) {
      if (err) {
        return next(err);
      } else {
        return res.redirect('/');
      }
    });
  }
});


//_______________________________________________________________________________pricing

// GET for logout logout
app.post('/pricingCheck', function(req, res, next) {
  // Always the value attribute of elements will send in submit form (from client to server)
  // memberBtn is the name of buttons in pricinig.ejs
  // req.body.memberBtn is the sending value of button clicked for submitting
  var membersh = req.body.memberBtn;
  //check login
  if (req.session.userId != null) {
    User.findOneAndUpdate({
      _id: req.session.userId
    }, {
      membership: membersh
    }, (function(err) {
      if (err) {
        return next(err);

      } else {
        return res.redirect('/profile');
      }
    }));
  } else {
    // go login
    return res.redirect('/login');
  }

});

//_______________________________________________________________________________server port


//server port
app.listen(3000, function() {
  console.log("Server started on port 3000");
});
