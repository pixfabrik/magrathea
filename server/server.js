import express from "express";
import path from "path";
import multer from "multer";
import fs from "fs";
import { fileURLToPath } from "url";
import { convertLbm } from "./lbm.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "..", "dist");

const app = express();
const port = 3000;

// Set up Multer for handling file uploads
const storage = multer.diskStorage({
  destination: path.join(__dirname, "..", "uploads"),
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage });

app.use(express.static(distPath));

// Set up a route to handle file uploads
app.post("/upload", upload.single("fileInput"), async (req, res) => {
  // Multer middleware adds the file to the request object
  const uploadedFile = req.file;

  if (!uploadedFile) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  // console.log(uploadedFile);
  const convertedFilePath = await convertLbm(uploadedFile.path);
  res.sendFile(convertedFilePath, () => {
    fs.unlinkSync(uploadedFile.path);
    fs.unlinkSync(convertedFilePath);
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.get("/viewer", (req, res) => {
  res.sendFile(path.join(distPath, "viewer.html"));
});

app.listen(port, () => {
  console.log(`App listening on port ${port}!`);
});
