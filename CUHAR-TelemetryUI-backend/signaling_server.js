import { WebSocketServer } from "ws";

const PORT = 9003;
const wss = new WebSocketServer({ port: PORT });
const clients = new Set()
let code = 2;

wss.on("connection", ws => {
  clients.add(ws);
  ws.on("message", data => {
    // broadcast signaling messages
    const msg = JSON.parse(data.toString());
    //console.log(msg);
    for(const client of clients) {
      if(client !== ws && client.readyState === WebSocket.OPEN) {
        console.log("resent");
        client.send(data.toString());
      }
    }
  })
  
  if(clients.size == 2) {
    for(const client of clients) {
      if(client.readyState === WebSocket.OPEN) 
      client.send(JSON.stringify({ "ready" : code }));
    }
  }

  ws.on("close", () => {
    console.log("Client disconnect: ");
    clients.delete(ws);
    code = clients.size;
  }
  )
})

console.log(`Signaling server running on ws://localhost:${PORT}`)


