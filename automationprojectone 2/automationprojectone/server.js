import express from "express";
import { exec, spawn } from "child_process";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
const port = 3000;
let ffmpegProcess = null; // Store FFmpeg process

app.use(cors());

// Route to trigger the test case and start screen capture
app.post("/run-test", (req, res) => {
  // Start screen capture first
  const videoPath = startScreenCapture();

  // Run the test case using a child process
  exec("npm run wdio", (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      stopScreenCapture(videoPath); // Stop capture on error
      return res.status(500).send(`Test run failed: ${error.message}`);
    }

    if (stderr) {
      console.error(`stderr: ${stderr}`);
      stopScreenCapture(videoPath); // Stop capture on error
      return res.status(500).send(`Test run failed with error: ${stderr}`);
    }

    console.log(`stdout: ${stdout}`);
    stopScreenCapture(videoPath); // Stop capture once test is done

    // Send the video file URL to the frontend
    const videoUrl = `/videos/capture.webm`;
    res.json({ message: "Test run completed successfully!", videoUrl });
  });
});

// Function to start screen capture
function startScreenCapture() {
  console.log("Starting screen capture...");

  const videoPath = path.join(__dirname, "capture.webm");

  // Start FFmpeg to capture the screen and save it to a file
  ffmpegProcess = spawn("ffmpeg", [
    "-f",
    "x11grab",
    "-s",
    "1920x1080",
    "-i",
    ":0.0", // Adjust if needed (e.g., for a different display)
    "-f",
    "webm",
    videoPath,
  ]);

  ffmpegProcess.on("error", (err) => {
    console.error("Failed to start FFmpeg:", err);
  });

  return videoPath;
}

// Function to stop the screen capture
function stopScreenCapture(videoPath) {
  if (ffmpegProcess) {
    ffmpegProcess.kill(); // Stop FFmpeg process
    ffmpegProcess = null;
    console.log("Screen capture stopped.");

    // Check if the file exists, and clean up if needed
    fs.access(videoPath, fs.constants.F_OK, (err) => {
      if (err) {
        console.error("Capture video does not exist:", err);
      } else {
        console.log(`Capture video saved at ${videoPath}`);
      }
    });
  }
}

// Serve the video file for download or streaming
app.use("/videos", express.static(path.join(__dirname, "capture.webm")));

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
