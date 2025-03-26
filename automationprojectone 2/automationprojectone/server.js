// import express from "express";
// import { exec } from "child_process";
// import http from "http";
// import { Server } from "socket.io";
// import cors from "cors";
// import wrtc from "wrtc";
// import ffmpeg from "fluent-ffmpeg";
// import puppeteer from "puppeteer";

// const app = express();
// const port = 3000;
// const server = http.createServer(app);

// // Configure CORS properly before routes and Socket.IO
// const corsOptions = {
//   origin: "*",
//   methods: ["GET", "POST"],
//   allowedHeaders: ["Content-Type"],
//   credentials: true,
// };

// app.use(cors(corsOptions));

// const io = new Server(server, {
//   cors: corsOptions,
// });

// let childProcess = null;
// let rtcPeerConnection = null;
// let senderStream = null;

// // WebRTC Configuration
// const rtcConfig = {
//   iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
// };

// // Function to start FFmpeg screen capture
// function startScreenCapture() {
//   console.log("Starting FFmpeg screen capture...");

//   return ffmpeg()
//     .input(":0.0") // Captures the default X11 display
//     .inputFormat("x11grab")
//     .videoCodec("libx264")
//     .fps(25)
//     .size("1280x720")
//     .outputOptions([
//       "-preset ultrafast",
//       "-tune zerolatency",
//       "-pix_fmt yuv420p",
//       "-b:v 450k", // Bitrate adjustment
//       "-bufsize 450k",
//     ])
//     .format("mpegts") // MPEG-TS format for low latency streaming
//     .on("start", () => console.log("FFmpeg streaming started"))
//     .on("error", (err) => console.error("FFmpeg error:", err))
//     .on("end", () => console.log("FFmpeg stream ended"));
// }

// // WebRTC Signaling
// io.on("connection", (socket) => {
//   console.log("Client connected:", socket.id);

//   socket.on("offer", async (offer) => {
//     console.log("Received WebRTC offer.");
//     rtcPeerConnection = new wrtc.RTCPeerConnection(rtcConfig);

//     rtcPeerConnection.onicecandidate = (event) => {
//       if (event.candidate) {
//         socket.emit("candidate", event.candidate);
//       }
//     };

//     await rtcPeerConnection.setRemoteDescription(
//       new wrtc.RTCSessionDescription(offer)
//     );

//     const answer = await rtcPeerConnection.createAnswer();
//     await rtcPeerConnection.setLocalDescription(answer);

//     socket.emit("answer", answer);
//   });

//   socket.on("candidate", async (candidate) => {
//     if (rtcPeerConnection) {
//       await rtcPeerConnection.addIceCandidate(
//         new wrtc.RTCIceCandidate(candidate)
//       );
//     }
//   });

//   socket.on("disconnect", () => {
//     console.log("Client disconnected.");
//     if (rtcPeerConnection) {
//       rtcPeerConnection.close();
//       rtcPeerConnection = null;
//     }
//     if (senderStream) {
//       senderStream.kill("SIGTERM");
//       senderStream = null;
//     }
//   });
// });

// // Route to trigger WebDriverIO test
// app.post("/run-test", async (req, res) => {
//   console.log("Starting Puppeteer test...");

//   (async () => {
//     try {
//       const browser = await puppeteer.launch({
//         headless: "new", // Ensures headless mode is used in newer Puppeteer versions
//         args: ["--no-sandbox", "--disable-setuid-sandbox"], // Required for GCP
//       });      

//       const page = await browser.newPage();
//       await page.goto("https://the-internet.herokuapp.com/login");

//       await page.type("#username", "tomsmith");
//       await page.type("#password", "SuperSecretPassword!");
//       await page.click('button[type="submit"]');

//       await page.waitForSelector("#flash");
//       const flashText = await page.$eval("#flash", (el) => el.textContent);

//       console.log("Flash Message:", flashText);
//       io.emit("test-log", flashText);

//       // Take a screenshot to verify execution
//       await page.screenshot({ path: "screenshot.png" });

//       await browser.close();
//     } catch (error) {
//       console.error("Puppeteer error:", error);
//       io.emit("test-log", `Error: ${error.message}`);
//     }
//   })();

//   res.json({ message: "Test started with Puppeteer." });
// });

// // Example route for checking server status
// app.get("/api/status", (req, res) => {
//   res.json({ message: "WDIO Express API with WebRTC streaming is working" });
// });

// // Start the server
// server.listen(port, () => {
//   console.log(`Server running at http://34.93.172.107:${port}`);
// });
//Capture screenshots using node.js
import express from "express";
import { exec } from "child_process";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import puppeteer from "puppeteer";

const app = express();
const port = 3000;
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
  console.log("Starting Puppeteer test with video streaming...");

  (async () => {
    try {
      const browser = await puppeteer.launch({
        headless: false, // Disable headless to see if errors appear in UI
        args: ["--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--disable-software-rasterizer",
    "--ignore-certificate-errors",
    "--ignore-certificate-errors-spki-list",
    "--proxy-server='direct://'", // Bypass proxy
    "--proxy-bypass-list=*", // Prevent proxy interference
    "--host-resolver-rules='MAP * ~NOTFOUND , EXCLUDE localhost'", // Force DNS resolution
    ],
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 720 });

      // ✅ Test if Puppeteer can access the internet
      try {
        await page.goto("https://www.google.com", { waitUntil: "networkidle2" });
        console.log("✅ Puppeteer successfully accessed Google.");
      } catch (error) {
        console.error("❌ Puppeteer cannot access the internet:", error.message);
        io.emit("test-log", `Error: Cannot access the internet - ${error.message}`);
        await browser.close();
        return;
      }

      // 🔵 Now navigate to the actual test page
      await page.goto("https://the-internet.herokuapp.com/login");

      await page.type("#username", "tomsmith");
      await page.type("#password", "SuperSecretPassword!");
      await page.click('button[type="submit"]');

      await page.waitForSelector("#flash");
      const flashText = await page.$eval("#flash", (el) => el.textContent.trim());

      console.log("Flash Message:", flashText);
      io.emit("test-log", flashText);

      // Test done, close browser after 10 seconds
      setTimeout(async () => {
        await browser.close();
        console.log("Puppeteer test completed!");
      }, 10000);
    } catch (error) {
      console.error("Puppeteer error:", error);
      io.emit("test-log", `Error: ${error.message}`);
    }
  })();

  res.json({ message: "Test started with Puppeteer & Video Streaming." });
});


// Example route for checking server status
app.get("/api/status", (req, res) => {
  res.json({ message: "Puppeteer Express API is working" });
});

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
