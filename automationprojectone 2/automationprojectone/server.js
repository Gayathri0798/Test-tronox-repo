import express from "express";
import { exec } from "child_process";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import puppeteer from "puppeteer";
const app = express();
const port = 3002;
const server = http.createServer(app);

// Configure CORS

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
  credentials: true,
};

app.use(cors(corsOptions));

const io = new Server(server, {
  cors: corsOptions,
});

// WebSocket connection

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected.");
  });
});

// Route to trigger Puppeteer test

app.post("/run-test", async (req, res) => {
  console.log("Starting Puppeteer test...");

  (async () => {
    try {
      const browser = await puppeteer.launch({
        headless: "new", // Ensures headless mode is used

        args: ["--no-sandbox", "--disable-setuid-sandbox"], // Required for GCP
      });

      const page = await browser.newPage();

      // Log console messages from the Puppeteer page

      page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
      await page.goto("https://the-internet.herokuapp.com/login");
      await page.type("#username", "tomsmith");
      await page.type("#password", "SuperSecretPassword!");
      await page.click('button[type="submit"]');
      await page.waitForSelector("#flash");
      const flashText = await page.$eval("#flash", (el) =>
        el.textContent.trim()
      );
      console.log("Flash Message:", flashText);

      // Send message to frontend via WebSocket
      io.emit("test-log", flashText);

      // Take a screenshot for debugging

      await page.screenshot({ path: "screenshot.png" });
      console.log("Screenshot saved as screenshot.png");
      await browser.close();
      console.log("Puppeteer test completed!");
    } catch (error) {
      console.error("Puppeteer error:", error);
      io.emit("test-log", `Error: ${error.message}`);
    }
  })();

  res.json({ message: "Test started with Puppeteer." });
});

// Example route for checking server status

app.get("/api/status", (req, res) => {
  res.json({ message: "Puppeteer Express API is working" });
});

// Start the server

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
