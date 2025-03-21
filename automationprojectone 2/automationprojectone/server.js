import express from "express";
import { exec } from "child_process";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import wrtc from "wrtc";
import ffmpeg from "fluent-ffmpeg";
import { Readable } from "stream";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Fix __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;
const server = http.createServer(app);

// Configure CORS properly before routes and Socket.IO
const corsOptions = {
  origin: "http://34.93.172.107", // Allow only your frontend
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Handle preflight requests explicitly

const io = new Server(server, {
  cors: corsOptions,
});

let childProcess = null;
let rtcPeerConnection = null;
let senderStream = null;
let videoSource = null;
let videoTrack = null;

// WebRTC Configuration
const rtcConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

// Function to start FFmpeg screen capture
function startScreenCapture() {
  console.log("Starting FFmpeg screen capture...");

  // Define the video file path (you can modify this path as needed)
  const videoFilePath = path.join(
    __dirname,
    "recordings",
    `test_${Date.now()}.webm`
  );

  // Ensure the recordings directory exists
  if (!fs.existsSync(path.join(__dirname, "recordings"))) {
    fs.mkdirSync(path.join(__dirname, "recordings"), { recursive: true });
  }

  const ffmpegProcess = ffmpeg()
    .input(":99.0") // Virtual display for headless screen capture
    .inputFormat("x11grab")
    .videoCodec("libvpx") // VP8 codec (WebRTC-compatible)
    .fps(30)
    .size("1280x720")
    .outputOptions([
      "-preset ultrafast",
      "-tune zerolatency",
      "-pix_fmt yuv420p",
      "-b:v 500k",
      "-bufsize 1000k",
    ])
    .format("webm")
    .output(videoFilePath) // Save to file
    .on("start", () =>
      console.log(`FFmpeg recording started: ${videoFilePath}`)
    )
    .on("stderr", (stderr) => console.log("FFmpeg Log:", stderr))
    .on("error", (err) => console.error("FFmpeg error:", err))
    .on("end", () => console.log("FFmpeg recording finished"));

  ffmpegProcess.run(); // Start FFmpeg process

  return ffmpegProcess;
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

    // Use RTCVideoSource to create a track
    videoSource = new wrtc.nonstandard.RTCVideoSource();
    videoTrack = videoSource.createTrack();

    // Convert the FFmpeg output to a readable stream
    const readableStream = new Readable().wrap(senderStream.pipe());

    readableStream.on("data", (chunk) => {
      console.log("Received video frame chunk");
      videoSource.onFrame({ data: chunk, width: 1280, height: 720 });
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
    if (videoTrack) {
      videoTrack.stop();
      videoTrack = null;
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

    // Get the last saved video
    fs.readdir(path.join(__dirname, "recordings"), (err, files) => {
      if (err || files.length === 0) {
        console.error("No recordings found.");
        return;
      }

      // Get the latest recorded file
      const latestVideo = files
        .filter((file) => file.endsWith(".webm"))
        .sort(
          (a, b) =>
            fs.statSync(path.join(__dirname, "recordings", b)).mtimeMs -
            fs.statSync(path.join(__dirname, "recordings", a)).mtimeMs
        )[0];

      if (latestVideo) {
        const videoUrl = `/recordings/${latestVideo}`;
        io.emit("test-video", { videoUrl });
      }
    });
  });

  res.json({ message: "Test started." });
});

// Example route for checking server status
app.get("/api/status", (req, res) => {
  res.json({ message: "WDIO Express API with WebRTC streaming is working" });
});

app.use("/recordings", express.static(path.join(__dirname, "recordings")));

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://34.93.172.107:${port}`);
});
