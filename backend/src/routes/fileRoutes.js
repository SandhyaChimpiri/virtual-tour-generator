const express = require("express");
const multer = require("multer");
const router = express.Router();

// Upload location
const upload = multer({ dest: "uploads/" });

// ROUTE 1: Upload file
router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  res.json({
    message: "File uploaded successfully",
    file: req.file,
  });
});

// ROUTE 2: Process text (example)
router.post("/process-text", (req, res) => {
  const { text } = req.body;

  res.json({
    success: true,
    processed: `Processed: ${text}`,
  });
});

module.exports = router;
