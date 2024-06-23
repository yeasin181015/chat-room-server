const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../Models/User.js");

const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });
const nodemailer = require("nodemailer");
const cloudinary = require("cloudinary").v2;
const ObjectId = require("mongoose").Types.ObjectId;
const imageupload = require("../config/imageupload.js");
const Conversation = require("../Models/Conversation.js");

const JWT_SECRET = "yeasin";

let mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_ClOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const register = async (req, res) => {
  try {
    console.log("register request received");

    const { name, email, password, role, team } = req.body;
    if (!name || !email || !password || !team) {
      return res.status(400).json({
        error: "Please fill all the fields",
      });
    }

    const user = await User.findOne({
      email: email,
    });

    if (user) {
      return res.status(400).json({
        error: "User already exists",
      });
    }
    var imageUrl = "";

    if (req.file != null) {
      imageUrl = await imageupload(req.file);
    } else {
      imageUrl = `https://ui-avatars.com/api/?name=${name}&background=random&bold=true`;
    }

    // on render doesnt allow to store images locally hence

    // imageUrl = `https://ui-avatar.com/api/?name=${name}&background=random&bold=true`;

    // const salt = await bcrypt.genSalt(10);
    const secPass = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      role: role ? role : "user",
      password: secPass,
      profilePic: imageUrl,
      team: team,
    });

    const registeredUser = await newUser.save();

    // const us = await User.findOne({ email: email });
    // var id = us._id.toString().substring(0, 21) + "/ch";

    // id = Buffer.from(id, "utf8").toString("hex");

    // us._id = new ObjectId();
    // us.name = "AI Chatbot";
    // us.email = email + "bot";
    // us.phoneNum = "0000000000";
    // us.profilePic =
    //   "https://play-lh.googleusercontent.com/Oe0NgYQ63TGGEr7ViA2fGA-yAB7w2zhMofDBR3opTGVvsCFibD8pecWUjHBF_VnVKNdJ";

    // await User.insertMany(us);

    // const bot = await User.findOne({ email: email + "bot" });

    // const newConversation = new Conversation({
    //   members: [newUser._id, bot._id],
    // });

    // await newConversation.save();

    const data = {
      user: {
        id: newUser.id,
      },
    };

    const authtoken = jwt.sign(data, JWT_SECRET);
    res.json({
      authtoken,
      registeredUser,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const login = async (req, res) => {
  console.log("login request received", req.body);

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Please fill all the fields",
      });
    }

    const user = await User.findOne({
      email: email,
    });

    if (!user) {
      console.log("invaliod credentials");
      return res.status(400).json({
        error: "Invalid Credentials",
      });
    }

    // if (otp) {
    //   if (user.otp != otp) {
    //     return res.status(400).json({
    //       error: "Invalid otp",
    //     });
    //   }
    //   user.otp = "";
    //   await user.save();
    // } else {
    const passwordCompare = await bcrypt.compare(password, user.password);
    if (!passwordCompare) {
      return res.status(400).json({
        error: "Invalid Credentials",
      });
    }
    // }

    const data = {
      user: {
        id: user.id,
      },
    };

    const authtoken = jwt.sign(data, JWT_SECRET);

    res.json({
      authtoken,
      user: {
        _id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        profilePic: user.profilePic,
        team: user.team,
      },
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const authUser = async (req, res) => {
  const token = req.header("auth-token");
  if (!token) {
    res.status(401).send("Please authenticate using a valid token");
  }

  try {
    const data = jwt.verify(token, JWT_SECRET);

    if (!data) {
      return res.status(401).send("Please authenticate using a valid token");
    }

    const user = await User.findById(data.user.id).select("-password");
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const allUser = async (req, res) => {
  const requser = req.user;

  try {
    const users = await User.find().select("-password");
    //filter users such bot for other users are not included
    // users.forEach((user) => {
    //   if (user.email.includes("bot") && user.email != requser.email) {
    //     users.splice(users.indexOf(user), 1);
    //   }
    // });
    res.json(users);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};

const updateprofile = async (req, res) => {
  try {
    const dbuser = await User.findById(req.user.id);

    if (req.body.newpassword) {
      const passwordCompare = await bcrypt.compare(
        req.body.oldpassword,
        dbuser.password
      );
      if (!passwordCompare) {
        return res.status(400).json({
          error: "Invalid Credentials",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const secPass = await bcrypt.hash(req.body.newpassword, salt);
      req.body.password = secPass;

      delete req.body.oldpassword;
      delete req.body.newpassword;
    }
    await User.findByIdAndUpdate(req.user.id, req.body);
    res.status(200).json({ message: "Profile Updated" });
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};

const sendotp = async (req, res) => {
  try {
    console.log("sendotp request received");
    const { email } = req.body;
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).json({
        error: "User not found",
      });
    }
    const otp = Math.floor(100000 + Math.random() * 900000);
    user.otp = otp;
    await user.save();

    //delete otp after 5 minutes
    setTimeout(() => {
      user.otp = "";
      user.save();
    }, 300000);

    let mailDetails = {
      from: process.env.EMAIL,
      to: email,
      subject: "Login with your Otp",

      html: `<!DOCTYPE html>
      <html lang="en">
      <head>
          <title>Otp for Login</title>
          <style>
              .container {
                  width: 50%;
                  margin: 0 auto;
                  background: #f4f4f4;
                  padding: 20px;
              }
              h1 {
                  text-align: center;
              }
    
          </style> 
      </head>
      <body>
              <strong><h1>Conversa - online chatting app</h1></strong>
          <div class="container">
              <h2>Your Otp is</h2>
              <strong><p>${otp}</p><strong>
              <p>Use this Otp to login</p>
          </div>
      </body>
      </html>`,
    };

    await mailTransporter.sendMail(mailDetails, function (err, data) {
      if (err) {
        console.log("Error Occurs", err);
        res.status(400).json({ message: "Error Occurs" });
      } else {
        console.log("Email sent successfully");
        res.status(200).json({ message: "OTP sent" });
      }
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const updateUserRole = async (req, res) => {
  const updatedList = req.body;
  // console.log(updatedList);
  try {
    //   const bulkOps = updatedList.map((user) => ({
    //     updateOne: {
    //       filter: { id: user.id },
    //       update: { role: user.role },
    //     },
    //   }));
    //   console.log(bulkOps)
    //   const response = await User.bulkWrite(bulkOps);
    //   console.log(response);
    updatedList.forEach(async (user) => {
      await User.updateOne(
        {
          _id: user.id,
        },
        {
          role: user.role,
        }
      );
    });
    res.send("Updated Successfully").status(200);
  } catch (err) {
    console.error(err);
  }
};

const usersByTeam = async (req, res) => {
  const team = req.params.team;
  // const role = req.query.role;

  try {
    const users = await User.find({ team }).select("-password");
    //filter users such bot for other users are not included
    // users.forEach((user) => {
    //   if (user.email.includes("bot") && user.email != requser.email) {
    //     users.splice(users.indexOf(user), 1);
    //   }
    // });
    console.log(users);
    res.json(users);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  register,
  login,
  allUser,
  authUser,
  updateprofile,
  sendotp,
  updateUserRole,
  usersByTeam,
};

// const columns = [
//   { id: "name", label: "Name", minWidth: 170 },
//   { id: "email", label: "Email", minWidth: 100 },
//   //   { id: "name", label: "Username", minWidth: 170 },
//   { id: "role", label: "Role", minWidth: 170 },
// ];
