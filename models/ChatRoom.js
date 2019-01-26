let mongoose = require("mongoose");

chatRoomSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  roomImage: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  active: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  messages: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false
      },
      userMsg: {
        type: String,
        required: false
      }
    }
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
});
module.exports = mongoose.model("ChatRoom", chatRoomSchema);
