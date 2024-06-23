const express = require("express");
const router = express.Router();

const {
  accessConversation,
  getConversation,
  getConversationList,
} = require("../Controllers/conversation_controller.js");
const fetchuser = require("../middleware/fetchUser.js");

router.post("/create-conversation", fetchuser, accessConversation);
router.get("/:id", fetchuser, getConversation);
router.get("/", fetchuser, getConversationList);

module.exports = router;
