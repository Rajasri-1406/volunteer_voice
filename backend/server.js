const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const pollRoutes = require("./routes/polls");

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/polls", pollRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "VolunteerPoll API is running" });
});

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });