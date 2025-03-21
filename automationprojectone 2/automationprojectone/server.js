import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import puppeteer from "puppeteer";
import wrtc from "wrtc";
import ffmpeg from "fluent-ffmpeg";
import { PassThrough } from "stream";

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

// WebRTC Config
const rtcConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

let rtcPeerConnection = null;
let videoStream = null;

// Handle WebSocket connections
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("offer", async (offer) => {
    console.log("Received WebRTC offer.");
    rtcPeerConnection = new wrtc.RTCPeerConnection(rtcConfig);

    rtcPeerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("candidate", event.candidate);
      }
    };

    await rtcPeerConnection.setRemoteDescription(new wrtc.RTCSessionDescription(offer));

    const answer = await rtcPeerConnection.createAnswer();
    await rtcPeerConnection.setLocalDescription(answer);

    socket.emit("answer", answer);
  });

  socket.on("candidate", async (candidate) => {
    if (rtcPeerConnection) {
      await rtcPeerConnection.addIceCandidate(new wrtc.RTCIceCandidate(candidate));
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected.");
    if (rtcPeerConnection) {
      rtcPeerConnection.close();
      rtcPeerConnection = null;
    }
    if (videoStream) {
      videoStream.end();
      videoStream = null;
    }
  });
});

// Start Puppeteer & Stream Video
app.post("/run-test", async (req, res) => {
  console.log("Starting Puppeteer test with video streaming...");

  (async () => {
    try {
      const browser = await puppeteer.launch({
        headless: false, // Disable headless to enable video streaming
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 720 });

      // Start video streaming with FFmpeg
      videoStream = new PassThrough();

      ffmpeg()
        .input(":0.0") // Capture screen
        .inputFormat("x11grab")
        .videoCodec("libx264")
        .fps(25)
        .size("1280x720")
        .outputOptions([
          "-preset ultrafast",
          "-tune zerolatency",
          "-pix_fmt yuv420p",
          "-b:v 450k",
          "-bufsize 450k",
        ])
        .format("mpegts") // Low-latency streaming format
        .pipe(videoStream);

      // Send the stream to WebRTC
      if (rtcPeerConnection) {
        const videoTrack = rtcPeerConnection.addTrack(new wrtc.MediaStreamTrack(videoStream));
        io.emit("test-video", { videoUrl: "/stream" });
      }

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

// Video Stream Endpoint
app.get("/stream", (req, res) => {
  res.setHeader("Content-Type", "video/mp4");
  if (videoStream) {
    videoStream.pipe(res);
  } else {
    res.status(404).send("No active video stream");
  }
});

// Server status endpoint
app.get("/api/status", (req, res) => {
  res.json({ message: "Puppeteer API with WebRTC Streaming is running" });
});

// Start server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
