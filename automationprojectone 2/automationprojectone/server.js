import express from "express";
import { exec } from "child_process";
import cors from "cors";

const app = express();
const port = 3000;

app.use(cors()); // Allow CORS for testing

// Route to trigger WebDriverIO test
app.post("/run-test", (req, res) => {
  console.log("Running WebDriverIO test...");

  // Run the WebDriverIO test case using a child process
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
    res.send(`Test run completed successfully: ${stdout}`);
  });
});

// Route to trigger FFmpeg screen capture and stream
app.post("/start-capture", (req, res) => {
  console.log("Starting FFmpeg screen capture...");

  exec(
    `ffmpeg -f x11grab -s 1920x1080 -i :0.0 -f webm - | websocat ws://localhost:${port}/webrtc`,
    (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing FFmpeg: ${error}`);
        return res.status(500).send(`Capture failed: ${error.message}`);
      }

      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return res.status(500).send(`Capture failed with error: ${stderr}`);
      }

      console.log(`FFmpeg output: ${stdout}`);
      res.send("Screen capture started successfully");
    }
  );
});

// Status check route
app.get("/api/status", (req, res) => {
  res.json({ message: "Server is running" });
});

// Start the HTTP server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
