require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");
const renderGuide = require("./guide");

const app = express();
app.set("trust proxy", 1);

const origins = (process.env.CLIENT_ORIGINS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

app.use(cors({ origin: origins }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send(renderGuide(`${req.protocol}://${req.get("host")}`));
});

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Health check failed:", error.message);
    res.status(503).json({ status: "error", message: "Database is not responding." });
  }
});

app.use("/api/records", require("./routes/records"));

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use((error, req, res, next) => {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Malformed JSON in request body." });
  }
  console.error(error);
  res.status(500).json({ message: "Something went wrong on the server." });
});

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});