const express = require("express");
const fs = require("node:fs");
const path = require("node:path");
const multer = require("multer");

const protectAdmin = require("../middleware/authMiddleware");

const router = express.Router();

const uploadDirectory = path.resolve(__dirname, "../../uploads/restaurants");
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const safeExtension = extension || ".jpg";
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExtension}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (_req, file, cb) => {
  if (!file.mimetype || !file.mimetype.startsWith("image/")) {
    cb(new Error("Only image files are allowed"));
    return;
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

router.post("/restaurant-image", protectAdmin, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "No image file uploaded"
    });
  }

  const imageUrl = `/uploads/restaurants/${req.file.filename}`;

  return res.status(201).json({
    message: "Image uploaded successfully",
    imageUrl
  });
});

router.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "Image is too large. Max size is 5MB."
      });
    }

    return res.status(400).json({
      message: error.message || "Image upload failed"
    });
  }

  return res.status(400).json({
    message: error.message || "Image upload failed"
  });
});

module.exports = router;
