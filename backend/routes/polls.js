const express = require("express");
const router = express.Router();
const Poll = require("../models/Poll");

// ─── CREATE a new poll ─────────────────────────────────────────────────────
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

// ─── GET all polls ─────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const polls = await Poll.find().sort({ createdAt: -1 });
    res.json(polls);
  } catch (err) {
    res.status(500).json({ error: "Server error while fetching polls." });
  }
});

// ─── GET polls by organizer email ─────────────────────────────────────────
router.get("/organizer/:email", async (req, res) => {
  try {
    const polls = await Poll.find({ organizerEmail: req.params.email }).sort({ createdAt: -1 });
    res.json(polls);
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

// ─── GET single poll by ID ─────────────────────────────────────────────────
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
router.post("/:id/vote", async (req, res) => {
  try {
    const { optionIndex, voterName } = req.body;
    const poll = await Poll.findById(req.params.id);

    if (!poll) return res.status(404).json({ error: "Poll not found." });
    if (poll.status === "closed") return res.status(400).json({ error: "This poll is closed." });
    if (optionIndex === undefined || optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ error: "Invalid option selected." });
    }

    poll.options[optionIndex].votes += 1;
    poll.totalVotes += 1;
    poll.voteLog.push({
      voterName: voterName || "Anonymous",
      optionIndex,
      votedAt: new Date(),
    });

    await poll.save();
    res.json({ message: "Vote recorded successfully!", poll, votedOption: poll.options[optionIndex].label });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while submitting vote." });
  }
});

// ─── CLOSE a poll ──────────────────────────────────────────────────────────
router.patch("/:id/close", async (req, res) => {
  try {
    const poll = await Poll.findByIdAndUpdate(req.params.id, { status: "closed" }, { new: true });
    if (!poll) return res.status(404).json({ error: "Poll not found." });
    res.json({ message: "Poll closed.", poll });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

// ─── EDIT a poll (title, description, options — votes untouched) ───────────
// PATCH /api/polls/:id/edit
router.patch("/:id/edit", async (req, res) => {
  try {
    const { title, description, options } = req.body;
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ error: "Poll not found." });

    if (title) poll.title = title.trim();
    if (description !== undefined) poll.description = description.trim();

    if (options && options.length >= 2) {
      // Merge edited options — preserve existing votes by index, add new ones with 0
      const updatedOptions = options.map((opt, i) => {
        const existing = poll.options[i];
        return {
          label: opt.label,
          tag: opt.tag || "Other",
          votes: existing ? existing.votes : 0, // keep old votes
        };
      });
      poll.options = updatedOptions;
    }

    await poll.save();
    res.json({ message: "Poll updated successfully.", poll });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while editing poll." });
  }
});

// ─── DUPLICATE a poll ──────────────────────────────────────────────────────
// POST /api/polls/:id/duplicate
router.post("/:id/duplicate", async (req, res) => {
  try {
    const original = await Poll.findById(req.params.id);
    if (!original) return res.status(404).json({ error: "Poll not found." });

    const copy = new Poll({
      title: `${original.title} (Copy)`,
      description: original.description,
      organizerName: original.organizerName,
      organizerEmail: original.organizerEmail,
      organizerPhone: original.organizerPhone,
      pollType: original.pollType,
      options: original.options.map((opt) => ({
        label: opt.label,
        tag: opt.tag,
        votes: 0,
      })),
      deadline: original.deadline,
      status: "active",
      totalVotes: 0,
      voteLog: [],
      comments: [],
    });

    await copy.save();
    res.status(201).json({ message: "Poll duplicated successfully.", poll: copy });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while duplicating poll." });
  }
});

// ─── ADD a comment to a poll ───────────────────────────────────────────────
// POST /api/polls/:id/comment
router.post("/:id/comment", async (req, res) => {
  try {
    const { commenterName, text } = req.body;
    if (!commenterName || !text) {
      return res.status(400).json({ error: "Name and comment text are required." });
    }

    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ error: "Poll not found." });

    poll.comments.push({ commenterName, text, commentedAt: new Date() });
    await poll.save();

    res.json({ message: "Comment added.", comments: poll.comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while adding comment." });
  }
});

// ─── DELETE a poll ─────────────────────────────────────────────────────────
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