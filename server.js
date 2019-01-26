let express = require("express");
let app = express();
let mongoose = require("mongoose");
let bcryptjs = require("bcryptjs");
let bodyParser = require("body-parser");
let User = require("./models/User");
let Chatrooms = require("./models/ChatRoom");
let morgan = require("morgan");
let multer = require("multer");
let jwt = require("jsonwebtoken");
let checkAuth= require("./middle-ware/checkAuth")
let cors = require("cors");
// app.use(cors({credentials : true, origin : ['http://localhost:3000']}))

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(morgan("dev"));
/// mongoose connection to db
let url = "mongodb://moe:pw1234@ds029811.mlab.com:29811/chatrooms";
mongoose.connect(
  url,
  { useNewUrlParser: true }
);
var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function() {
  // we're connected!
});
//////////////// multer for upload images//////////////
app.use("/roomImage", express.static("roomImage"));
app.use("/userImage", express.static("userImage"));

roomStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "./roomImage");
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + file.originalname);
  }
});
userStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./userImage");
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "_" + Date.now() + file.originalname);
  }
});

let uploadRoomImg = multer({ storage: roomStorage });
let uploadUserImg = multer({ storage: userStorage });

////// Signup endpoint/////
app.post("/signup", uploadUserImg.single("userImage"), (req, res, next) => {
  User.findOne({ email: req.body.email }).exec((err, user) => {
    if (err) {
      res.send(JSON.stringify({ error: true, message: " error finding user" }));
    } else {
      if (user !== null && user !== undefined) {
        res.send(JSON.stringify({ message: "User already exist" }));
      } else {
        bcryptjs.hash(req.body.passWord, 10, (err, hash) => {
          if (err) {
            res.send(JSON.stringify({ error: err }));
          } else {
            let user = new User();
            user.email = req.body.email;
            user.userName = req.body.userName;
            user.passWord = hash;
            user.userImage = req.file.path;
            user.save(err => {
              if (err) {
                res.send(
                  JSON.stringify({ error: true, message: " error saving user" })
                );
              } else {
                res.send(
                  JSON.stringify({
                    success: true,
                    message: "successfully signed up"
                  })
                );
              }
            });
          }
        });
      }
    }
  });
});
////////////signin endpoint/////////
app.post("/signin", (req, res, next) => {
  User.findOne({ email: req.body.email }).exec((err, user) => {
    if (err) {
      res.send(JSON.stringify({ error: true, message: "error finding user" }));
    } else {
      if (user !== null && user !== undefined) {
        bcryptjs.compare(req.body.passWord, user.passWord, (err, result) => {
          if (err) {
            res.send(JSON.stringify({ error: err, message: "Auth faild" }));
          } else {
            if (result) {
              let token = jwt.sign(
                {
                  id: user._id
                },
                "secret",
                {
                  expiresIn: "1h"
                }
              );
              res.send(JSON.stringify({ message: "Auth succeded", token }));
            } else {
              res.send(JSON.stringify({ error: err, message: "Auth faild" }));
            }
          }
        });
      } else {
        res.send(JSON.stringify({ error: err, message: "Auth faild" }));
      }
    }
  });
});
////////////create chatroom endpoint///////////

app.post(
  "/addchatroom/:id",checkAuth,
  uploadRoomImg.single("roomImage"),
  (req, res, next) => {
    let chatroom = new Chatrooms();
    chatroom.topic = req.body.topic;
    chatroom.description = req.body.description;
    chatroom.createdBy = req.params.id;
    chatroom.roomImage = req.file.path;
    chatroom.save(err => {
      if (err) {
        res.send(
          JSON.stringify({ error: true, message: "error saving chatroom" })
        );
      } else {
        res.send(
          JSON.stringify({
            success: true,
            message: "chatroom created successfully"
          })
        );
      }
    });
  }
);
/////////////////// get chat rooms////////////////
app.get("/chatrooms",checkAuth, (req, res, next) => {
  Chatrooms.find()
    .populate("createdBy")
    .exec((err, rooms) => {
      if (err) {
        res.send(
          JSON.stringify({ error: true, message: "error getting chat rooms" })
        );
      } else {
        res.send(
          JSON.stringify({
            success: true,
            message: "successfully found chat rooms",
            rooms
          })
        );
      }
    });
});

/////////// send message endpoind /////
app.post("/sendmsg/:id", (req, res, next) => {
  User.findOne({ _id: req.body.id }).exec((err, user) => {
    if (err) {
      res.send(JSON.stringify({ error: true, message: "error finding user" }));
    } else {
      Chatrooms.findOne({ _id: req.params.id })
        .populate([{ path: "messages.user", model: "User" }, "active"])
        .exec((err, room) => {
          if (err) {
            res.send(
              JSON.stringify({
                error: true,
                message: "error finding the required chat room"
              })
            );
          } else {
            room.active.push(req.body.id);
            room.messages.push({
              user: req.body.id,
              userMsg: req.body.sentMsg
            });
            room.save((err, room) => {
              if (err) {
                res.send(
                  JSON.stringify({
                    error: true,
                    message: "error saving chat room"
                  })
                );
              } else {
                res.send(
                  JSON.stringify({
                    success: true,
                    message: "successfuly saved msgs to chat room",
                    room
                  })
                );
              }
            });
          }
        });
    }
  });
});
/////////////////////// get room bu id //////////////////////
app.get("/getroom/:id", (req, res, next) => {
  Chatrooms.findOne({ _id: req.params.id })
    .populate([{ path: "messages.user", model: "User" }, "active"])
    .exec((err, room) => {
      if (err) {
        res.send(
          JSON.stringify({
            error: true,
            message: "error finding the required chat room"
          })
        );
      } else {
        res.send(
          JSON.stringify({
            success: true,
            message: "successfuly saved msgs to chat room",
            room
          })
        );
      }
    });
});
app.get("/", (req, res, next) => {
  res.send(JSON.stringify("hello"));
});

//////// Handling error

app.use((req, res, next) => {
  let error = new Error("URL NOt Found");
  error.status = 404;
  next(error);
});
app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.send(JSON.stringify({ message: error.message }));
});

app.listen(5000, () => {
  console.log("Listening on port 5000");
});
