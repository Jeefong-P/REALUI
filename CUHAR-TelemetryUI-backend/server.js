import { WebSocketServer } from "ws";
import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";

const SERIAL_PORT = "COM8";
const BAUD_RATE = 115200;
const WS_PORT = 9001;

const wss = new WebSocketServer({ port: WS_PORT });
console.log(`[ws] listening on ws://localhost:${WS_PORT}`);

wss.on("connection", (ws, req) => {
  console.log(`[ws] dashboard connected — clients: ${wss.clients.size}`);
  ws.on("close", () =>
    console.log(`[ws] dashboard disconnected — clients: ${wss.clients.size}`),
  );
});

const serial = new SerialPort({ path: SERIAL_PORT, baudRate: BAUD_RATE });
const parser = serial.pipe(new ReadlineParser({ delimiter: "\n" }));

serial.on("open", () =>
  console.log(`[serial] opened ${SERIAL_PORT} @ ${BAUD_RATE}`),
);
serial.on("error", (e) => console.error(`[serial] ERROR: ${e.message}`));
serial.on("close", () => console.warn(`[serial] port closed`));

let rxCount = 0;
let skippedCount = 0;

parser.on("data", (line) => {
  line = line.trim();

  if (!line.startsWith("{")) {
    skippedCount++;
    console.log(
      `[serial] non-JSON line skipped (total skipped: ${skippedCount}): ${line}`,
    );
    return;
  }

  rxCount++;
  console.log(`[rx #${rxCount}] ${line}`);

  const clientCount = [...wss.clients].filter((c) => c.readyState === 1).length;
  console.log(`[ws] broadcasting to ${clientCount} client(s)`);

  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(line);
  }
});
