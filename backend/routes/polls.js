const express = require("express");
const router = express.Router();
const Poll = require("../models/Poll");

// ─── CREATE a new poll ─────────────────────────────────────────────────────
// POST /api/polls
router.post("/", async (req, res) => {
  try {
    const { title, description, organizerName, organizerEmail, organizerPhone, pollType, options, deadline } = req.body;

    if (!title || !organizerName || !options || options.length < 2) {
      return res.status(400).json({ error: "Title, organizer name, and at least 2 options are required." });
    }

    const poll = new Poll({
      title,
      description,
      organizerName,
      organizerEmail,
      organizerPhone,
      pollType: pollType || "activity",
      options: options.map((opt) => ({
        label: opt.label,
        tag: opt.tag || "Other",
        votes: 0,
      })),
      deadline: deadline ? new Date(deadline) : null,
    });

    await poll.save();
    res.status(201).json({ message: "Poll created successfully", poll });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while creating poll." });
  }
});

// ─── GET all polls (organizer dashboard) ──────────────────────────────────
// GET /api/polls
router.get("/", async (req, res) => {
  try {
    const polls = await Poll.find().sort({ createdAt: -1 });
    res.json(polls);
  } catch (err) {
    res.status(500).json({ error: "Server error while fetching polls." });
  }
});

// ─── GET polls by organizer email ─────────────────────────────────────────
// GET /api/polls/organizer/:email
router.get("/organizer/:email", async (req, res) => {
  try {
    const polls = await Poll.find({ organizerEmail: req.params.email }).sort({ createdAt: -1 });
    res.json(polls);
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

// ─── GET single poll by ID ─────────────────────────────────────────────────
// GET /api/polls/:id
router.get("/:id", async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ error: "Poll not found." });
    res.json(poll);
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

// ─── VOTE on a poll ────────────────────────────────────────────────────────
// POST /api/polls/:id/vote
router.post("/:id/vote", async (req, res) => {
  try {
    const { optionIndex, voterName } = req.body;
    const poll = await Poll.findById(req.params.id);

    if (!poll) return res.status(404).json({ error: "Poll not found." });
    if (poll.status === "closed") return res.status(400).json({ error: "This poll is closed." });
    if (optionIndex === undefined || optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ error: "Invalid option selected." });
    }

    // Increment vote count for chosen option
    poll.options[optionIndex].votes += 1;
    poll.totalVotes += 1;

    // Add to vote log
    poll.voteLog.push({
      voterName: voterName || "Anonymous",
      optionIndex,
      votedAt: new Date(),
    });

    await poll.save();

    res.json({
      message: "Vote recorded successfully!",
      poll,
      votedOption: poll.options[optionIndex].label,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while submitting vote." });
  }
});

// ─── CLOSE a poll ──────────────────────────────────────────────────────────
// PATCH /api/polls/:id/close
router.patch("/:id/close", async (req, res) => {
  try {
    const poll = await Poll.findByIdAndUpdate(
      req.params.id,
      { status: "closed" },
      { new: true }
    );
    if (!poll) return res.status(404).json({ error: "Poll not found." });
    res.json({ message: "Poll closed.", poll });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

// ─── DELETE a poll ─────────────────────────────────────────────────────────
// DELETE /api/polls/:id
router.delete("/:id", async (req, res) => {
  try {
    const poll = await Poll.findByIdAndDelete(req.params.id);
    if (!poll) return res.status(404).json({ error: "Poll not found." });
    res.json({ message: "Poll deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

module.exports = router;