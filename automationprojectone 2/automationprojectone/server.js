import express from "express";
import { exec } from "child_process";
import WebSocket from "ws";
import SimplePeer from "simple-peer";

const app = express();
const port = 3000;

// Create WebSocket server for WebRTC signaling
const wss = new WebSocket.Server({ noServer: true });

// Handle WebSocket connections and WebRTC signaling
wss.on("connection", (ws) => {
  const peer = new SimplePeer({
    initiator: false, // The client will initiate the connection
    trickle: false,
  });

  // Send signaling data to the client
  peer.on("signal", (data) => {
    ws.send(JSON.stringify({ signal: data }));
  });

  // Receive the signaling data from the client
  ws.on("message", (message) => {
    const { signal } = JSON.parse(message);
    peer.signal(signal);
  });

  // Once connected, start capturing the screen with FFmpeg
  peer.on("connect", () => {
    console.log("WebRTC peer connected. Starting screen capture...");

    // Start FFmpeg to capture the screen and stream it
    exec(
      `ffmpeg -f x11grab -s 1920x1080 -i :0.0 -f webm - | websocat ws://localhost:${port}/webrtc`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing FFmpeg: ${error}`);
          return;
        }
        console.log(`FFmpeg output: ${stdout}`);
      }
    );
  });

  // Handle incoming WebRTC data (optional)
  peer.on("data", (data) => {
    console.log("Received data: ", data);
  });
});

// Upgrade HTTP request to WebSocket for WebRTC signaling
app.server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

app.server.on("upgrade", (request, socket, head) => {
  if (request.url === "/webrtc") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  }
});
