import express from "express";
import { exec } from "child_process";
import path from "path"; // Import path module
import fs from "fs"; // For file system
import { fileURLToPath } from "url"; // To get __dirname equivalent

// Equivalent to __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Serve the video file from the /videos route (the capture will be stored here)
app.use("/videos", express.static(path.join(__dirname, "capture.webm")));

// Route to trigger the test case
app.post("/run-test", (req, res) => {
  // Run the test case using a child process (assuming you are capturing the screen using FFmpeg)
  exec("npm run wdio", (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).send(`Test run failed: ${error.message}`);
    }

    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return res.status(500).send(`Test run failed with error: ${stderr}`);
    }

    console.log(`stdout: ${stdout}`);

    // Start capturing the screen after the test run has started
    startScreenCapture();

    res.send(`Test run completed successfully: ${stdout}`);
  });
});

// Start screen capture using FFmpeg and store the video
function startScreenCapture() {
  const capturePath = path.join(__dirname, "capture.webm");

  // Check if a previous capture file exists, and delete it if necessary
  if (fs.existsSync(capturePath)) {
    fs.unlinkSync(capturePath);
  }

  // Start FFmpeg to capture the screen and store it in the capture.webm file
  const ffmpegCommand = `ffmpeg -f x11grab -s 1920x1080 -i :0.0 -f webm ${capturePath}`;
  exec(ffmpegCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`FFmpeg error: ${error}`);
      return;
    }

    if (stderr) {
      console.error(`FFmpeg stderr: ${stderr}`);
      return;
    }

    console.log(`FFmpeg stdout: ${stdout}`);
  });

  console.log("Screen capture started...");
}

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
