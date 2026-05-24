import { SerialPort } from "serialport";
import { WebSocketServer } from "ws";
import { FrameParser, toTelemetry } from "./packet.js";

const SERIAL_PATH = process.env.LORA_PORT || "COM3";
const BAUD_RATE = Number(process.env.LORA_BAUD) || 115200;
const WS_PORT = Number(process.env.WS_PORT) || 9001;

const wss = new WebSocketServer({ port: WS_PORT });
console.log(`[ws] listening on ws://localhost:${WS_PORT}`);

let lastSeq = null;
let lastTelemetry = null;

function broadcast(obj) {
  const msg = JSON.stringify(obj);
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(msg);
  }
}

wss.on("connection", (ws) => {
  console.log(`[ws] dashboard connected (${wss.clients.size} total)`);
  if (lastTelemetry) ws.send(JSON.stringify(lastTelemetry));
  ws.on("close", () =>
    console.log(`[ws] dashboard disconnected (${wss.clients.size} left)`),
  );
});

const parser = new FrameParser(
  (pkt) => {
    if (lastSeq !== null) {
      const expected = (lastSeq + 1) & 0xff;
      if (pkt.seq !== expected) {
        const dropped = (pkt.seq - expected + 256) & 0xff;
        console.warn(
          `[lora] dropped ~${dropped} packet(s) (seq jump ${lastSeq} -> ${pkt.seq})`,
        );
      }
    }
    lastSeq = pkt.seq;
    lastTelemetry = toTelemetry(pkt);
    broadcast(lastTelemetry);
  },
  (err) => console.warn(`[lora] frame error: ${err}`),
);

function openPort() {
  const port = new SerialPort(
    { path: SERIAL_PATH, baudRate: BAUD_RATE },
    (err) => {
      if (err) {
        console.error(
          `[lora] open ${SERIAL_PATH} @${BAUD_RATE} failed: ${err.message}`,
        );
        console.error(
          `[lora] retrying in 3s. set LORA_PORT env var to override (e.g. LORA_PORT=COM5).`,
        );
        setTimeout(openPort, 3000);
        return;
      }
      console.log(`[lora] open ${SERIAL_PATH} @${BAUD_RATE}`);
    },
  );

  port.on("data", (buf) => parser.push(buf));
  port.on("error", (e) => console.error(`[lora] error: ${e.message}`));
  port.on("close", () => {
    console.warn("[lora] port closed, retrying in 3s");
    setTimeout(openPort, 3000);
  });
}

openPort();
