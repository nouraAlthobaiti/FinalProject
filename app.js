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
//This package for Search
var matchWords = require('word-regex');
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

mongoose.connect("mongodb://localhost:27017/codydb", {
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
//_______________________________________________________________________________user schema
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

//_____________________________________________________________________________authenticate steps/ hash password /user collection


//authenticate input against database
//detrmine the functionality of authenticate
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
//_______________________________________________________________________________album schema

const AlbumsSchema = {
  ownerName: {
    type: String,
    //unique: true,
    required: true,
  },
  title: {
    type: String,
    required: false
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
  cost: {
    type: Number,
    required: false,
    //default: 0,
  },
  description: {
    type: String,
    required: false
  },
  codeType: {
    type: Array,
    required: false
  }
};
/* user (ms) --> 0    -------   cost --> 0 sr

user (ms) --> 250  -------   cost --> 0 sr  to  50 sr

user (ms) --> 500  -------   cost --> every thing
 */

//_____________________________________________________________________________album collection

const Albums = mongoose.model("Albums", AlbumsSchema);
//_____________________________________________________________________________insert albums
const album1 = new Albums({
  ownerName: "admin_nassebah",
  title: "First Code",
  code: "<h1>Hi</h1>",
  cost: 0,
  description: "First code",
  codeType: "html"

});

const album2 = new Albums({
  ownerName: "admin_wafa'a",
  title: "Second Code",
  code: "<h2>Hi</h2>",
  cost: 100,
  description: "Second code",
  codeType: "css"
});

const album3 = new Albums({
  ownerName: "admin_nora",
  title: "Third Code",
  code: "<h3>Hi</h3>",
  cost: 50,
  description: "Third code",
  codeType: "js"
});

const defaultAlbums = [album1, album2, album3];
/*
//_______________________________________________________________________________Ownership Schema
const OwnershipSchema = {
  //  owner: String,
  albums: [AlbumsSchema]
};
//_____________________________________________________________________________owner collection
const Owners = mongoose.model("Owners", OwnershipSchema);
*/
//_______________________________________________________________________________
//_______________________________________________________________________________
//_______________________________________________________________________________functions
//function for matching
function matching(req, res) {
  if (req.body.search) {
    matchWords('<%=keywordType=%>');
  }
}
//function to control buttons appearance
function visibleBtnHeader(req, res) {
  var N = "none";
  var I = "inline";
  // if user is loging in --> the display attribute for buttons will change
  if (req.session.userId != null) {
    //first value for btnVisability in header.ejs (button: login )
    //second for btnVisabilityOut in header.ejs (button: logout )
    //third for btnVisabilityProfile in header.ejs (button: my profile )
    return [N, I];
  } else {
    return [I, N];
  }
}
//______________________________________________________________________________functions

//function to control add album button appearance
function visibleBtnAlbum(req, res) {
  var N = "none";
  var I = "inline";
  // if user is loging in --> the display attribute for buttons will change
  if (req.session.userId != null) {
    //first value for btnVisabilityAdd in header.ejs (button: album )
    //first value for btnVisabilityMy in header.ejs (button: myalbum )

    return [I, I];
  } else {
    return [N, N];
  }
}
//_______________________________________________________________________________routes main

// send home file to this url
app.get('/', function(req, res, next) {
  var visability = visibleBtnHeader(req, res);
  return res.render("index", {
    btnVisability: visability[0],
    btnVisabilityOut: visability[1],
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
    btnVisabilityOut: visability[1],
  });

  //res.sendFile(__dirname + '/login.html');
});

//_______________________________________________________________________________sign in
app.post('/login', function(req, res, next) {

  var visability = visibleBtnHeader(req, res);

  if (req.body.logemail && req.body.logpassword) {
    User.authenticate(req.body.logemail, req.body.logpassword, function(error, user) {
      //  req.body.errmail.style.visibility="hidden";
      if (error || !user) {
        var err = new Error('Wrong email or password.');

        return res.render("login", {
          errmail: 'البريد الالكتروني أو كلمة المرور خاطئة',
          btnVisability: visability[0],
          btnVisabilityOut: visability[1],
        });
      } else {
        req.session.userId = user._id;
        req.session.userName = user.username;
        return res.redirect('/');
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

//_______________________________________________________________________________routes signup->membership

// send membership file to this url
app.get('/signup', function(req, res, next) {
  var visability = visibleBtnHeader(req, res);
  return res.render("signup", {
    repeatedAccMsg: '',
    btnVisability: visability[0],
    btnVisabilityOut: visability[1],
  });

  //res.sendFile(__dirname + '/signup.html');
});

//_______________________________________________________________________________sign up
app.post('/signup', function(req, res, next) {

  var visability = visibleBtnHeader(req, res);

  // confirm that user typed same password twice
  if (req.body.password !== req.body.passwordConf) {
    return res.render("signup", {
      repeatedAccMsg: "كلمة المرور غير متطابقة مع التأكيد!",
      btnVisability: visability[0],
      btnVisabilityOut: visability[1],
    });
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
        repeatedAccMsg: "هذا الايميل مستخدم !",
        btnVisability: visability[0],
        btnVisabilityOut: visability[1],
      });
    } else {


      User.authenticate(req.body.email, req.body.password, function(error, user) {
        req.session.userId = user._id;
        req.session.userName = user.username;
        return res.redirect('/');
      });
    }
  });
  //} //end if

});

//_______________________________________________________________________________loguot

// GET for logout
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
//_______________________________________________________________________________profile routes


// send profile file to this url
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
            btnVisabilityOut: visability[1],
          }); //(/profile --> change url only) otherwise (render my ejs file)
        }
      }
    });
});



//_______________________________________________________________________________routes login->membership

// send membership file to this url
app.get('/membership', function(req, res, next) {
  var visability = visibleBtnHeader(req, res);
  return res.render("membership", {
    btnVisability: visability[0],
    btnVisabilityOut: visability[1],
  });
});
//_______________________________________________________________________________membershipCheck

// GET for membershipCheck
app.post('/membershipCheck', function(req, res, next) {
    var visability = visibleBtnHeader(req, res);
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
        if (membersh == "0") {
          return res.redirect('/profile');
        } else {
          return res.render("payment", {
            //  totalAmount: user.membership,
            totalAmount: membersh,
            btnVisability: visability[0],
            btnVisabilityOut: visability[1],
          }); //(/profile --> change url only) otherwise (render my ejs file)
        }
      }
    }));
  } else {
    // go login
    return res.redirect('/login');
  }

});

//_______________________________________________________________________________routes albums
// send albums file to this url & display albums

// send albums data to this url
app.get('/albums', function(req, res, next) {
  //button visiibility
  var visability = visibleBtnHeader(req, res);
  var addalbumbutton = visibleBtnAlbum(req, res);

  Albums.find({}, function(err, foundAlbums) {

    if (foundAlbums.length === 0) {
      Albums.insertMany(defaultAlbums, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully savevd default items to DB.");
        }
      });
      res.redirect("/albums"); //redirect to albums function in app.js
    }
    //To render views/list.ejs and send the markers values

    res.render("albums", {
      btnVisability: visability[0],
      btnVisabilityOut: visability[1],
      btnVisabilityAdd: addalbumbutton[0],
      btnVisabilityMy: addalbumbutton[1],
      newAlbums: foundAlbums,
      btnaccess: "none",
      buyId: " ",
      paymentAlbum: " "
    });

  });

});

//_______________________________________________________________________________routes albums
// send albums file to this url & display albums

// send albums data to this url
app.post('/viewAlbum', function(req, res, next) {
  var visability = visibleBtnHeader(req, res);
  var addalbumbutton = visibleBtnAlbum(req, res);

  console.log(req.body.albumIdButton);
  var keywordType = [];
  Albums.findById(req.body.albumIdButton)
    .exec(function(err, album) {
      if (err) {
        console.log("Error We are here");
        return next(err);
      } else {
        console.log("We are here");
        if (album.codeType != null) {
          keywordType = album.codeType;

        }
        if (keywordType == null) {
          keywordType = " ";
        }
        return res.render("viewAlbum", {
          btnVisability: visability[0],
          btnVisabilityOut: visability[1],
          updateTitleVar: album.title,
          updateCodeVar: album.code,
          updateDecVar: album.description,
          keyword: keywordType,
          albumid: album._id
        });

      }

    });
});


//_______________________________________________________________________________routes my albums
// send myalbums file to this url & display my albums

// send my albums data to this url
app.get('/myalbums', function(req, res, next) {
  //button visiibility
  var visability = visibleBtnHeader(req, res);
  var addalbumbutton = visibleBtnAlbum(req, res);

  Albums.find({
    ownerName: req.session.userName
  }, function(err, foundAlbums) {

    if (foundAlbums.length === 0) {
      // go addalbums function in app.js
      //To render views/list.ejs and send the markers values
      res.render("addalbums", {
        noAlbumMsg: "لا يوجد لديك اكواد يمكنك اضافتها الان",
        btnVisability: visability[0],
        btnVisabilityOut: visability[1],
        btnVisabilityAdd: addalbumbutton[0],
        btnVisabilityMy: addalbumbutton[1],
        newAlbums: foundAlbums
      });

    } else {
      //To render views/list.ejs and send the markers values
      res.render("myalbums", {
        editAlbumMsg: "",
        btnVisability: visability[0],
        btnVisabilityOut: visability[1],
        btnVisabilityAdd: addalbumbutton[0],
        btnVisabilityMy: addalbumbutton[1],
        newAlbums: foundAlbums
      });
    }
  });

});
//_______________________________________________________________________________myalbums

app.post('/myalbums', function(req, res, next) {

  /*if(updateTitleVar == null || updateCodeVar == null || updateCostVar == null || updateDecVar== null)
  {
  "من فضلك! قم بتعبئة الخانات الفارغة"
  }*/
  // read code type
  var booleanACodeType = [];
  if (req.body.htmlCode == "true") {
    booleanACodeType.push("html");
  }
  if (req.body.javascriptCode == "true") {
    booleanACodeType.push("java script");
  }
  if (req.body.cssCode == "true") {
    booleanACodeType.push("css");
  }
  if (req.body.keyword != null) {
    booleanACodeType.push(req.body.keyword);
  }
  if (booleanACodeType == null) {
    booleanACodeType.push(" ");
  }

  //update
  Albums.findOneAndUpdate({
      ownerName: req.session.userName,
      _id: req.body.albumIdButton
    }, {
      title: req.body.updateTitle,
      code: req.body.code,
      cost: req.body.updateCost,
      description: req.body.updateDescription,
      codeType: booleanACodeType
    },
    (function(err)

      {
        if (err) {
          return next(err);
        } else {
          console.log(req.body.editButton);

          res.redirect('/myalbums');
          //redirect to albums function in app.js

          //  editAlbumMsg: "updated successfully", //var in my albums
        }
      }
    )
  );


});


//_______________________________________________________________________________routes add albums

// send addalbums file to this url
app.get('/addalbums', function(req, res, next) {
  var visability = visibleBtnHeader(req, res);
  return res.render("addalbums", {
    noAlbumMsg: "",
    btnVisability: visability[0],
    btnVisabilityOut: visability[1],
  });

});
//_______________________________________________________________________________add albums

// send albums data to this url
app.post('/addAlbums', function(req, res, next) {

  // catch checkboxes status   < err1-->[] err2-->"" >
  //  var booleanACodeType = [];
  var booleanACodeType = [];
  if (req.body.htmlCode == "true") {
    booleanACodeType.push("html");
  }
  if (req.body.javascriptCode == "true") {
    booleanACodeType.push("java script");
  }
  if (req.body.cssCode == "true") {
    booleanACodeType.push("css");
  }
  if (req.body.keyword != null) {
    booleanACodeType.push(req.body.keyword);
  }
  if (booleanACodeType == null) {
    booleanACodeType.push(" ");
  }

  //check if user logged in
  if (req.session.userId != null) {

    //create var to make doc
    var albumData = {
      ownerName: req.session.userName,
      title: req.body.title,
      code: req.body.code,
      cost: Number(req.body.cost, 10), // string in number
      //  cost: req.body.costType,
      description: req.body.description,
      codeType: booleanACodeType
    };

    //create doc
    Albums.create(albumData, function(error, foundAlbums) {
      if (error) {
        console.log(error);
        return (error);
      } else {
        console.log("album added successfully");

        // go addalbums function in app.js
        return res.redirect('/myalbums'); //albums
      }
    });
  } //end if log in
  else {
    // go login
    return res.redirect('/login');
  }
});

//_______________________________________________________________________________update albums
//routes from form in myalbums.ejs after click on editButton
// send addalbums file to this url
app.post('/updateAlbum', function(req, res, next) {
  var visability = visibleBtnHeader(req, res);



  console.log(req.body.editButton);
  console.log(req.session.userName);
  var checkedType = [];
  var keywordType = [];
  Albums.findOne({
      ownerName: req.session.userName,
      _id: req.body.editButton
    },
    (function(err, album) {
      if (err) {
        return next(err);
      } else {
        console.log(album.codeType);
        if (album.codeType.includes("html")) {
          checkedType[0] = "checked";
          album.codeType.splice("html", 1);
        } else {
          checkedType[0] = " ";
        }
        if (album.codeType.includes("java script")) {
          checkedType[1] = "checked";
          album.codeType.splice("java script", 1);
        } else {
          checkedType[1] = " ";
        }
        if (album.codeType.includes("css")) {
          checkedType[2] = "checked";
          album.codeType.splice("css", 1);
        } else {
          checkedType[2] = " ";
        }
        if (album.codeType != null) {
          keywordType = album.codeType;

        }
        if (keywordType == null) {
          keywordType = " ";
        }

        return res.render("updateAlbum", {
          btnVisability: visability[0],
          btnVisabilityOut: visability[1],
          updateTitleVar: album.title,
          updateCodeVar: album.code,
          updateCostVar: album.cost,
          updateDecVar: album.description,
          idUpdate: album._id,
          htmlChecked: checkedType[0],
          jsChecked: checkedType[1],
          cssChecked: checkedType[2],
          keyword: keywordType
        });
      }

    }));

});
//_______________________________________________________________________________routes userManual

app.get('/userManual', function(req, res, next) {
  var visability = visibleBtnHeader(req, res);
  res.render("manual", {
    btnVisability: visability[0],
    btnVisabilityOut: visability[1],
  });
});
app.get('/rules', function(req, res, next) {
  res.sendFile(__dirname + "/rules.html");
});


//_______________________________________________________________________________eye on album
// read and wright
app.post('/access', function(req, res, next) {
  var visability = visibleBtnHeader(req, res);
  var addalbumbutton = visibleBtnAlbum(req, res);

  var membershipvar;
  var keywordType = [];

  //user membership
  User.findOne({
    _id: req.session.userId
  }, {
    membership: 1
  }, function(err, ms) {
    if (err) {
      return next(err);
    } else {
      membershipvar = ms.membership;
      console.log(ms);
    }
  });

  console.log(membershipvar);
  //code cost
  Albums.findById(req.body.viewBtn)
    .exec(function(err, album) {
      if (err) {
        console.log("Error We are here");
        return next(err);
      } else {
        var payment= album.cost;
        console.log("We are here");
        if (album.codeType != null) {
          keywordType = album.codeType;

        }
        if (keywordType == null) {
          keywordType = " ";
        }

        //if free
        if (album.cost == 0) {
          return res.render("viewAlbum", {
            btnVisability: visability[0],
            btnVisabilityOut: visability[1],
            updateTitleVar: album.title,
            updateCodeVar: album.code,
            updateDecVar: album.description,
            keyword: keywordType,
            albumid: album._id
          });

        }


        //if not free   //if logged in
        else if (req.session.userId)

        {
          console.log("//if logged in");

          if ((membershipvar == 0) && (album.cost != 0)) {
            //all albums
            Albums.find({}, function(err, foundAlbums) {
              if (err) {
                return next(err);
              } else {
                console.log (req.body.viewBtn);
                console.log (payment);
                // display:inline btnaccess:inline
                res.render("albums", {
                  btnVisability: visability[0],
                  btnVisabilityOut: visability[1],
                  btnVisabilityAdd: addalbumbutton[0],
                  btnVisabilityMy: addalbumbutton[1],
                  newAlbums: foundAlbums,
                  btnaccess: "inline",
                  buyId: req.body.viewBtn,
                  paymentAlbum:payment
                });

                console.log(foundAlbums);
              }
            });



          }


          //if ms = 250
          if (membershipvar == 250) {
            console.log("250");
            //if in range
            if (album.cost <= 50) {
              console.log("cost 50");
              return res.render("viewAlbum", {
                btnVisability: visability[0],
                btnVisabilityOut: visability[1],
                updateTitleVar: album.title,
                updateCodeVar: album.code,
                updateDecVar: album.description,
                keyword: keywordType,
                albumid: album._id
              });
            }


            //if not in range
            else {
              //all albums
              Albums.find({}, function(err, foundAlbums) {
                if (err) {
                  return next(err);
                } else {
                  console.log (req.body.viewBtn);
                  console.log (payment);
                  // display:inline btnaccess:inline
                  res.render("albums", {
                    btnVisability: visability[0],
                    btnVisabilityOut: visability[1],
                    btnVisabilityAdd: addalbumbutton[0],
                    btnVisabilityMy: addalbumbutton[1],
                    newAlbums: foundAlbums,
                    btnaccess: "inline",
                    buyId: req.body.viewBtn,
                    paymentAlbum: payment
                  });

                  console.log(foundAlbums);
                }
              });



            }

          } //end if 250

          //if 500

          if (membershipvar == 500) {
            return res.render("viewAlbum", {
              btnVisability: visability[0],
              btnVisabilityOut: visability[1],
              updateTitleVar: album.title,
              updateCodeVar: album.code,
              updateDecVar: album.description,
              keyword: keywordType,
              albumid: album._id
            });
          } //end if 500


        }

        //if not logged in
        else {
          return res.redirect('/login');

        }



      }

    }); //end query


});

app.get('/payment', function(req, res, next) {
  var visability = visibleBtnHeader(req, res);
  return res.render("payment", {
    //  totalAmount: user.membership,
    totalAmount: req.body.memberBtn,
    btnVisability: visability[0],
    btnVisabilityOut: visability[1],
  }); //(/profile --> change url only) otherwise (render my ejs file)
});

app.post('/payment', function(req, res, next) {
var visability = visibleBtnHeader(req, res);

  if (req.session.userId != null) {
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
            return res.render("payment", {
              //  totalAmount: user.membership,
              totalAmount: req.body.memberBtn,
              btnVisability: visability[0],
              btnVisabilityOut: visability[1],
            }); //(/profile --> change url only) otherwise (render my ejs file)
          }
        }
      });
  } else {
    return res.redirect('/login');
  }
});

//_______________________________________________________________________________server port

//server port
app.listen(3000, function() {
  console.log("Server started on port 3000");
});
