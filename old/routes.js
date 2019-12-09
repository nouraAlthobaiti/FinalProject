

//_______________________________________________________________________________eye on album
 // read and wright
app.post('/access', function(req, res, next) {
  var visability = visibleBtnHeader(req, res);
  var addalbumbutton = visibleBtnAlbum(req, res);

  console.log(req.body.accessButton); //album id
  console.log(req.session.userName);


  //user membership
  var membershipvar = User.findOne({
      _id: req.session.userName },
      {membership:1} , function(err,ms){ if(err) {return next(err);} else{console.log(ms);}});

      //code cost
  var albumdoc = Albums.findOne({
      ownerName: req.session.userName,
      _id: req.body.accessButton
    }, function(err,doc){ if(err) {return next(err);} else{console.log(doc);}});


    var keywordType = [];

      // check type
      if (albumdoc.codeType != null) {
        keywordType = album.codeType;

      }
      if (keywordType == null) {
        keywordType = " ";
      }

      //if free
      if(albumdoc.cost == 0){
        return res.render("copyCode", {
          btnVisability: visability[0],
          btnVisabilityOut: visability[1],
          titleVar: albumdoc.title,
          codeVar: albumdoc.code,
          decVar: albumdoc.description,
          codeTypevar: keywordType
        });

      }
      //if not free
      else {

        //if logged in
        if(req.session.userName)
        {

          //if ms = 250
          if(ms == 250)
          {
            //if in range
            if(albumdoc.cost <= 250){

              return res.render("copyCode", {
                btnVisability: visability[0],
                btnVisabilityOut: visability[1],
                titleVar: albumdoc.title,
                codeVar: albumdoc.code,
                decVar: albumdoc.description,
                codeTypevar: keywordType
              });


            }
            //if not in range
            else{
              // display:inline btnaccess:inline
              res.render("albums", {
                btnVisability: visability[0],
                btnVisabilityOut: visability[1],
                btnVisabilityAdd: addalbumbutton[0],
                btnVisabilityMy: addalbumbutton[1],
                newAlbums: foundAlbums,
                btnaccess:inline
              });

            }

          }
          //if 500 ---> free
          {

            return res.render("copyCode", {
              btnVisability: visability[0],
              btnVisabilityOut: visability[1],
              titleVar: albumdoc.title,
              codeVar: albumdoc.code,
              decVar: albumdoc.description,
              codeTypevar: keywordType
            });

          }
        }
        //if not logged in

        else{
          return res.redirect('/login');

        }


      }

});
