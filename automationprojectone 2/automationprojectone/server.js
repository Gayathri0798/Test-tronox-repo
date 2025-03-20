import express from "express";
import { exec } from "child_process";
import { createProxyMiddleware } from "http-proxy-middleware";
import cors from "cors";

const app = express();
const port = 3000;

app.use(cors());

// Route to trigger the test case
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

// WebSocket Proxy for noVNC (VNC Streaming)
app.use(
  "/websockify",
  createProxyMiddleware({
    target: "ws://localhost:5900", // Change this if VNC is on another machine
    ws: true,
    changeOrigin: true,
    logLevel: "debug",
  })
);

// Example route for checking server status
app.get("/api/status", (req, res) => {
  res.json({ message: "WDIO Express API is working" });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
