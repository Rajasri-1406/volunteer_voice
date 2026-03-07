const mongoose = require("mongoose");

const VoteSchema = new mongoose.Schema({
  voterName: { type: String, default: "Anonymous" },
  optionIndex: { type: Number, required: true },
  votedAt: { type: Date, default: Date.now },
});

const OptionSchema = new mongoose.Schema({
  label: { type: String, required: true },
  tag: {
    type: String,
    enum: ["Environment", "Food", "Community", "Health", "Other"],
    default: "Other",
  },
  votes: { type: Number, default: 0 },
});

const PollSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    organizerName: { type: String, required: true, trim: true },
    organizerEmail: { type: String, trim: true },
    pollType: {
      type: String,
      enum: ["activity", "date", "location", "general"],
      default: "activity",
    },
    options: { type: [OptionSchema], required: true },
    deadline: { type: Date },
    status: { type: String, enum: ["active", "closed"], default: "active" },
    totalVotes: { type: Number, default: 0 },
    voteLog: { type: [VoteSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Poll", PollSchema);