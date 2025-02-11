const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const cors = require("cors");
// Load User model
const EmailUser = require('../models/EmailUser');
const User = require('../models/User');
const GoogleUser = require('../models/GoogleUser');
const TwitterUser = require('../models/TwitterUser');
dotenv.config({ path: './config/config.env' });
const Notification = require("../models/Notification");
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const domain = "edunode.org"
const mg = mailgun.client({ username: 'api', key: "key-c8d12b7428fbe666e074108aaa0820bc" || 'key-yourkeyhere', url: 'https://api.eu.mailgun.net' });



// register email user

router.post("/", async (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header("Access-Control-Allow-Origin", '*');
  res.header("Access-Control-Allow-Credentials", true);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
  // validation 1
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ msg: "Email is required" })
  }

  if (!password) {
    return res.status(400).json({ msg: "Password is required" })
  }

  // validation 2 - check for existing 

  try {

    let user = await User.findOne({ email }, { sparse: true })
      .then(user => {
        const confirmationCode = req.body.confirmationCode
        const email = req.body.email

        if (user) return res.status(400).json({ user, msg: "User already exists" });


        const newUser = new User({
          email,
          password,
          confirmationCode,
        });



        // create salt and hash

        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            console.log(newUser.password)
            if (err) throw err;
            newUser.password = hash;
            console.log(hash)

            // store to mongodb .then(console.log("saved to mongodb"))
            EmailUser.create(newUser).then(console.log("saved to mongodb"))

              .then(user => {

                jwt.sign(
                  { id: user.id }, process.env.JWT_SECRET,
                  { expiresIn: 3600 },
                  (err, token) => {
                    if (err) throw err;
                    res.json({
                      token,
                      user,
                      user: {
                        id: user.id,
                        email: user.email,
                        confirmationCode: user.confirmationCode
                      }
                    });
                  }
                );
                console.log(user)
              }).catch((err) => { console.log(err) });

          })
        })

      })

  } catch (error) {
    console.log(error)
  }
  next()
});


// get users
router.get('/user', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const email = req.query.email; // Access the email value from query parameters
  User.findOne({ email })
    .then(users => res.json(users))
    .catch(err => res.status(400).json('Error: ' + err));
});

// Define a route to get the user ID based on the email
router.get('/user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return the user ID
    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/userByid/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return the user
    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});
// get users
router.get("/googleusers", (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  GoogleUser.findOne({ id: "_id" })
    .then(users => res.json(users))
    .catch(err => res.status(400).json("Error: " + err));
});
// get users
router.get("/all", async (req, res) => {
  try {
      const users = await User.find();
      res.json(users);
  } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
  }
});

// update user verification status

router.put("/update", (req, res) => {
  const { email } = req.body;
  User.updateOne(
    { "email": email },
    { "isVerified": true }
  )
    .then(users => res.json(users))
    .catch(err => res.status(400).json("Error: " + err));

})

// put username

router.put("/username", (req, res) => {
  const { email } = req.body;
  const { username } = req.body

  User.updateOne({ "email": email }, { "userName": username })
    .then(() => {
      res.send({
        userName: username
      });
    }
    )
    .catch(err => res.status(400).json("Error: " + err));

})

// put user account

router.put("/useraccount", (req, res) => {
  const { email } = req.body;
  const { userName } = req.body;
  const { pkey } = req.body

  User.updateOne(
    { "email": email },
    { $set: { "userName": userName, "pkey": pkey } }

  )
    .then(() => {
      res.send({
        email: email,
        name: userName,
        pkey: pkey
      });

    }
    )
    .catch(err => res.status(400).json("Error: " + err));

  console.log("hi")

})

// put user course

router.put("/courses", (req, res) => {
  const { email } = req.body;
  const courseOneDone = true

  if (!email) {
    return res.status(400).json({ msg: "Email is required" });
  }

  User.updateOne({ email: email }, { courseOneDone: courseOneDone })
    .then(() => {
      res.send({
        email: email,
        courseOneDone: courseOneDone,
      });
    })
    .catch((err) => res.status(400).json("Error: " + err));

})



// get Username

router.get("/username", (req, res) => {
  const { email } = req.body;
  User.findOne({ "email": email })
    .then((user) => {
      res.send({
        userName: user.userName
      });
    }
    )
    .catch(err => res.status(400).json("Error: " + err));

})

// put google pkey

router.put("/googlepk", async (req, res) => {
  const { email, pkey } = req.body;

  GoogleUser.updateOne({ "email": email }, { $set: { "pkey": pkey } })
    .then(() => {
      res.send({
        email: email,
        pkey: pkey,
      });

    }
    )
    .catch(err => res.status(400).json("Error: " + err));





})


// Register and login google user

router.post("/google", async (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  // const courseOneDone = false
  // validation 1
  const { email, lastName, fistName, googleId, googleProfilePic, userName, pkey } = req.body;
  const newUser = {
    email,
    lastName,
    fistName,
    googleId,
    googleProfilePic,
    userName,
    pkey

  };
  // if (!email) {
  //   return res.status(400).json({ msg: "Email is required" })
  // }

  try {
    let user = await GoogleUser.findOne({ email: email })
    if (user) {

      res.send({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isVerified: user.isVerified,
          userName: user.userName,
          googleProfilePic: user.googleProfilePic,
          courseOneDone: user.courseOneDone,
          pkey: user.pkey
        },
      });
    } else {
      user = await GoogleUser.create(newUser)

      res.send({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isVerified: user.isVerified,
          userName: user.userName,
          googleProfilePic: user.googleProfilePic,
          courseOneDone: user.courseOneDone,
          pkey: ""
        },
      });

    }

  } catch (err) {
    console.error(err)
  }
  next()
});

// Register and login twitter user

router.post("/twitter", async (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  // const courseOneDone = false


  // validation 1
  const { email, lastName, fistName, twitterId, twitterProfilePic, userName, pkey } = req.body;
  const newUser = {
    email,
    lastName,
    fistName,
    twitterId,
    twitterProfilePic,
    userName,
    pkey

  };
  // if (!email) {
  //   return res.status(400).json({ msg: "Email is required" })
  // }

  try {
    let user = await TwitterUser.findOne({ email: email })
    if (user) {

      console.log(user)

      // res.send({
      //   user: {
      //     id: user.id,
      //     name: user.name,
      //     email: user.email,
      //     isVerified: user.isVerified,
      //     userName: user.userName,
      //     googleProfilePic: user.googleProfilePic,
      //     courseOneDone: user.courseOneDone,
      //     pkey: user.pkey
      //   },
      // });
    } else {
      user = await GoogleUser.create(newUser)

      // res.send({
      //   user: {
      //     id: user.id,
      //     name: user.name,
      //     email: user.email,
      //     isVerified: user.isVerified,
      //     userName: user.userName,
      //     googleProfilePic: user.googleProfilePic,
      //     courseOneDone: user.courseOneDone,
      //     pkey: ""
      //   },
      // });

    }

  } catch (err) {
    console.error(err)
  }
  next()
});

// get google user

router.get("/google", async (req, res) => {

  const { email } = req.body;

  try {

    let user = await GoogleUser.findOne({ email: email })
    if (user) {

      res.send({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isVerified: user.isVerified,
          userName: user.userName,
          googleProfilePic: user.googleProfilePic,
          courseOneDone: user.courseOneDone,
          pkey: user.pkey
        },
      });
    }

  } catch (error) {
    console.log(error)

  }


})

// put google user course

router.put("/google", async (req, res) => {
  const { email, courseOneDone } = req.body;

  GoogleUser.updateOne({ "email": email }, { "courseOneDone": courseOneDone })
    .then((user) => {
      res.send({
        email: user.email,
        courseOneDone: user.courseOneDone,
      });
    })
    // .then((user) => res.json({
    //   email: user.email,
    //   courseOneDone: user.courseOneDone
    // }))
    .catch((err) => res.status(400).json("Error: " + err));




})
router.post('/preferences', (req, res) => {
  const { email, preferences } = req.body;

  // Find the user by email and update their preferences
  User.findOneAndUpdate({ email }, { preferences }, { new: true })
    .then(user => {
      if (!user) {
        res.status(404).json({ message: 'User not found' });
      } else {
        res.json({ message: 'Preferences updated successfully' });
      }
    })
    .catch(error => {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    });
});
router.post('/role', (req, res) => {
  const { email, role } = req.body;

  // Find the user by email and update their preferences
  User.findOneAndUpdate({ email }, { role }, { new: true })
    .then(user => {
      if (!user) {
        res.status(404).json({ message: 'User not found' });
      } else {
        res.json({ message: 'role updated successfully' });
      }
    })
    .catch(error => {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    });
});

router.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
      await User.findByIdAndRemove(id);
      res.json({ message: 'User deleted successfully' });
  } catch (error) {
      console.error('Error deleting User:', error);
      res.status(500).json({ error: 'Failed to delete User' });
  }
});

router.post('/skills', (req, res) => {
  const { email, skills } = req.body;

  // Find the user by email and update their skills
  User.findOneAndUpdate({ email }, { skills }, { new: true })
    .then(user => {
      if (!user) {
        res.status(404).json({ message: 'User not found' });
      } else {
        res.json({ message: 'skills updated successfully' });
      }
    })
    .catch(error => {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    });
});


router.post('/friend-request/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { user } = req.body;

    const sender = await User.findById(userId).populate();
    const receiver = await User.findById(user._id);

    const newNotification = new Notification({
      message:
        `You have a new friend request from ${sender.email}`,
      time: new Date(),
      email: user.email,
    });
    await newNotification.save();

    // Check if the users are already friends
    if (sender.friends.includes(receiver._id) || receiver.friends.includes(sender._id)) {
      return res.status(400).json({ message: 'Users are already friends.' });
    }

    // Check if the friend request already exists
    if (receiver.friendRequests.find((request) => request.user.equals(sender._id))) {
      return res.status(400).json({ message: 'Friend request already sent.' });
    }

    // Add the friend request
    receiver.friendRequests.push({ user: sender , userInfo: sender.name});

    const data = {
      from: 'hi@edunode.org',
      to: user.email,
      subject: 'Friend Request! ',
      text: `Hello! Your have a new friend Request from ${sender.email} in Edunode!`
    };


    mg.messages.create(domain, data, function (error, body) {
      if (error) {
        console.log('Error sending email:', error);
        res.status(500).json({ error: 'Error sending email' });
      } else {
        console.log('Email sent successfully:', body);
        res.json({ msg: 'Email sent' });
      }
    });

    await receiver.save();

    res.status(200).json({ message: 'Friend request sent.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

//fetch requests
router.get('/friend-requests/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate('friendRequests.user');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const friendRequests = user.friendRequests.filter(request => request.status === 'pending');

    res.status(200).json(friendRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Accept a friend request
router.post('/accept-friend-request/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = req.body.user;

    const sender = await User.findById(userId);
    const receiver = await User.findById(user._id);

    const newNotification = new Notification({
      message:
        `Your friend request to ${receiver.email} has been accepted!`,
      time: new Date(),
      email: sender.email,
    });
    await newNotification.save();

    // Check if the friend request exists
    const friendRequest = receiver.friendRequests.find((request) =>
      request.user.equals(sender._id)
    );
    if (!friendRequest) {
      return res.status(400).json({ message: 'Friend request not found.' });
    }

    // Accept the friend request
    friendRequest.status = 'accepted';
    receiver.friends.push(sender._id);

    // Update the sender's friend list
    sender.friends.push(receiver._id);

    // Remove the friend request
    receiver.friendRequests = receiver.friendRequests.filter(
      (request) => !request.user.equals(sender._id)
    );

    await receiver.save();
    await sender.save();

    res.status(200).json({ message: 'Friend request accepted.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Reject a friend request
router.post('/reject-friend-request/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = req.body.user;

    const sender = await User.findById(userId);
    const receiver = await User.findById(user._id);

    // Check if the friend request exists
    const friendRequest = receiver.friendRequests.find((request) =>
      request.user.equals(sender._id)
    );
    if (!friendRequest) {
      return res.status(400).json({ message: 'Friend request not found.' });
    }

    // Remove the friend request
    receiver.friendRequests = receiver.friendRequests.filter(
      (request) => !request.user.equals(sender._id)
    );

    await receiver.save();

    res.status(200).json({ message: 'Friend request rejected.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/friends/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email }).populate('friends', '-friends');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ friends: user.friends });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/rating', async (req, res) => {
  try {
    const users = await User.find().sort({ rating: -1 });
    res.json(users);
  } catch (error) {
    console.error('Error:', error);
    res.sendStatus(500);
  }
});




router.post('/create', function (req, res) {
  res.header("Access-Control-Allow-Origin", '*');
  res.header("Access-Control-Allow-Credentials", true);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
  res.header('Content-Type', 'application/json');
  
  const email = req.body.email;
  const password = req.body.password;
  const role = req.body.role;
  const name = req.body.name;

  User.findOne({ email })
    .then((user) => {
      if (user) {
        // If the user exists, throw an error
        res.status(403).json({ msg: "Email already exists, please log in" });
      } else {
        // If the user doesn't exist, create a new user
        const confirmationCode = JSON.stringify(Math.floor(Math.random() * 90000) + 10000)
        const newUser = { email, password, confirmationCode, name,role };
        const data = {
          from: 'hi@edunode.org',
          to: req.body.email ,
          subject: 'Edunode Confirmation Code',
          text: `Hello! Your confirmation code is: ${confirmationCode}`
        };
        
        mg.messages.create(domain, data, function (error, body) {
        if (error) {
          console.log('Error sending email:', error);
          res.status(500).json({ error: 'Error sending email' });
        } else {
          console.log('Email sent successfully:', body);
          res.json({ msg: 'Email sent' });
        }
      });
      
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            User.create(newUser).then((user) => {
              // If the user is created successfully, generate a JWT and send it back to the client
              jwt.sign(
                { id: user.id },
                process.env.JWT_SECRET,
                { expiresIn: 3600 },
                (err, token) => {
                  if (err) throw err;
                  res.json({
                    token,
                    user: {
                      id: user._id,
                      email: user.email,
                      confirmationCode: user.confirmationCode
                    }
                  });
                }
              );
            }).catch((err) => {
              console.log(err);
              res.status(500).json({ msg: "Internal server error" });
            });
          });
        });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ msg: "Internal server error" });
    });
});

module.exports = router;
