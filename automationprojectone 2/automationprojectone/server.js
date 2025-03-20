import express from "express";
import { exec } from "child_process";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import wrtc from "wrtc";
import ffmpeg from "fluent-ffmpeg";
import { Readable } from "stream";

const app = express();
const port = 3000;
const server = http.createServer(app);

// Configure CORS properly before routes and Socket.IO
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

let childProcess = null;
let rtcPeerConnection = null;
let senderStream = null;

// WebRTC Configuration
const rtcConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

// Function to start FFmpeg screen capture
function startScreenCapture() {
  console.log("Starting FFmpeg screen capture...");

  // Using Xvfb for headless screen capture
  return ffmpeg()
    .input(":99.0") // Use virtual display
    .inputFormat("x11grab")
    .videoCodec("libvpx") // VP8 codec for WebRTC
    .fps(30)
    .size("1280x720")
    .outputOptions([
      "-preset ultrafast",
      "-tune zerolatency",
      "-pix_fmt yuv420p",
      "-b:v 500k", // Bitrate adjustment
      "-bufsize 1000k",
    ])
    .format("webm") // WebRTC-friendly format
    .on("start", () => console.log("FFmpeg streaming started"))
    .on("error", (err) => console.error("FFmpeg error:", err))
    .on("end", () => console.log("FFmpeg stream ended"));
}

// WebRTC Signaling
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

    await rtcPeerConnection.setRemoteDescription(
      new wrtc.RTCSessionDescription(offer)
    );

    const answer = await rtcPeerConnection.createAnswer();
    await rtcPeerConnection.setLocalDescription(answer);

    socket.emit("answer", answer);

    // Start FFmpeg and get the output as a readable stream
    senderStream = startScreenCapture();

    // Convert the FFmpeg output to a readable stream
    const readableStream = new Readable().wrap(senderStream.pipe());

    // Create WebRTC track
    const videoTrack = new wrtc.MediaStreamTrack({ kind: "video" });

    readableStream.on("data", (chunk) => {
      videoTrack.write(chunk);
    });

    rtcPeerConnection.addTrack(videoTrack);
  });

  socket.on("candidate", async (candidate) => {
    if (rtcPeerConnection) {
      await rtcPeerConnection.addIceCandidate(
        new wrtc.RTCIceCandidate(candidate)
      );
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected.");
    if (rtcPeerConnection) {
      rtcPeerConnection.close();
      rtcPeerConnection = null;
    }
    if (senderStream) {
      senderStream.kill("SIGTERM");
      senderStream = null;
    }
  });
});

// Route to trigger WebDriverIO test
app.post("/run-test", (req, res) => {
  if (childProcess) {
    return res.status(400).json({ message: "Test is already running." });
  }

  console.log("Starting WDIO test...");
  childProcess = exec("npm run wdio");

  childProcess.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
    io.emit("test-log", data.toString());
  });

  childProcess.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
    io.emit("test-log", `Error: ${data}`);
  });

  childProcess.on("exit", (code) => {
    console.log(`Test process exited with code ${code}`);
    childProcess = null;
  });

  res.json({ message: "Test started." });
});

// Example route for checking server status
app.get("/api/status", (req, res) => {
  res.json({ message: "WDIO Express API with WebRTC streaming is working" });
});

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://34.93.172.107:${port}`);
});
