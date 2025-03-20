import express from "express";
import { exec } from "child_process";
import cors from "cors";
import fs from "fs";

const app = express();
const port = 3000;

app.use(cors());

// Run WebDriverIO Test and Record
app.post("/run-test", async (req, res) => {
  const videoPath = "test-recording.mp4";

  // Remove previous recording if exists
  if (fs.existsSync(videoPath)) {
    fs.unlinkSync(videoPath);
  }

  // Start Xvfb (virtual display)
  exec("Xvfb :99 -screen 0 1280x720x24 &", (err, stdout, stderr) => {
    if (err || stderr) {
      console.error("Error starting Xvfb:", err || stderr);
      return res.status(500).send("Error starting Xvfb.");
    }

    // Set the DISPLAY environment variable
    process.env.DISPLAY = ":99";

    // Start FFmpeg screen recording
    const ffmpegCommand = `ffmpeg -y -video_size 1280x720 -framerate 25 -f x11grab -i :99.0 ${videoPath}`;
    const ffmpegProcess = exec(ffmpegCommand);

    console.log("FFmpeg recording started...");

    // Wait 2 seconds to ensure FFmpeg is running
    setTimeout(() => {
      // Run WebDriverIO test
      exec("npm run wdio", (error, stdout, stderr) => {
        console.log("WebDriverIO test execution finished.");

        // Stop FFmpeg gracefully
        ffmpegProcess.on("close", () => {
          console.log("FFmpeg stopped.");

          if (error || stderr) {
            console.error(`Test error: ${error || stderr}`);
            return res.status(500).send("Test failed.");
          }

          res.send("Test run completed.");
        });
      });
    }, 2000);
  });
});

// Serve the recorded video
app.get("/test-video", (req, res) => {
  const videoPath = "test-recording.mp4";
  if (fs.existsSync(videoPath)) {
    res.sendFile(videoPath, { root: "." });
  } else {
    res.status(404).send("No video found.");
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
