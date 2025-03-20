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

// Serve the video file from the /videos route
app.use("/videos", express.static(path.join(__dirname, "capture.webm")));

app.post("/run-test", (req, res) => {
  // Run the test case using a child process
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

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
