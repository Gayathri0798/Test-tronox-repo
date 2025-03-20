import express from "express";
import { exec } from "child_process";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import wrtc from "wrtc";
import ffmpeg from "fluent-ffmpeg";

const app = express();
const port = 3000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://34.93.172.107",
    methods: ["GET", "POST"],
  },
});

app.use(cors());

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

  return ffmpeg()
    .input(":0.0") // Captures the default X11 display
    .inputFormat("x11grab")
    .videoCodec("libx264")
    .fps(25)
    .size("1280x720")
    .outputOptions([
      "-preset ultrafast",
      "-tune zerolatency",
      "-pix_fmt yuv420p",
      "-b:v 450k", // Bitrate adjustment
      "-bufsize 450k",
    ])
    .format("mpegts") // MPEG-TS format for low latency streaming
    .output("udp://127.0.0.1:5004") // Stream to UDP port
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

    const videoTrack = new wrtc.MediaStreamTrack({
      kind: "video",
    });

    senderStream = startScreenCapture();
    senderStream.pipe(videoTrack); // Pipe FFmpeg output to WebRTC track

    rtcPeerConnection.addTrack(videoTrack);

    await rtcPeerConnection.setRemoteDescription(
      new wrtc.RTCSessionDescription(offer)
    );

    const answer = await rtcPeerConnection.createAnswer();
    await rtcPeerConnection.setLocalDescription(answer);

    socket.emit("answer", answer);
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
    return res.status(400).send("Test is already running.");
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

  res.send("Test started.");
});

// Example route for checking server status
app.get("/api/status", (req, res) => {
  res.json({ message: "WDIO Express API with WebRTC streaming is working" });
});

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://34.93.172.107:${port}`);
});
