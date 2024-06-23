const express = require("express");
const router = express.Router();
const fetchuser = require("../middleware/fetchUser.js");
const multer = require("multer");
const {
  register,
  login,
  allUser,
  authUser,
  updateprofile,
  sendotp,
  updateUserRole,
  usersByTeam,
} = require("../Controllers/auth_controller.js");

const upload = multer();

router.post("/register", upload.single("profilePic"), register);
router.post("/login", login);
router.post("/role-change", fetchuser, updateUserRole);
router.get("/login", authUser);
router.get("/get-all-users", fetchuser, allUser);
router.put("/update", fetchuser, updateprofile);
router.post("/getotp", sendotp);
router.get("/team/:team", usersByTeam);

module.exports = router;
