import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 9003 }); 

console.log("🚀 CUHAR Simulation (Tuned) Started on Port 9003");

let time = 0;
let altitude = 0;
let speed = 0;

wss.on('connection', (ws) => {
  console.log("Dashboard Connected!");

  const interval = setInterval(() => {
    time += 0.1; 

    
    if (time < 10) { 
        // PAD (0-10s)
        altitude = 0;
        speed = 0;
    } 
    else if (time < 25) {

        speed += 0.3; 
        altitude += speed * 0.5; 
    }
    else if (time < 45) {
      
        speed -= 0.2; 
        altitude += speed * 0.5;
    }
    else if (time < 60) {
      
        speed -= 0.3; 
        altitude += speed * 0.5;
    }
    else if (time < 80) {
        
        speed = -15;
        altitude += speed * 0.1;
    }
    else if (time < 95) {
       
        speed = -5; 
        altitude += speed * 0.1;
    }
    else {
        
        altitude = 0;
        speed = 0;
    }

    
    if (altitude < 0) altitude = 0;

    const fakeTelemetry = {
      missionTime: time,
      altitude: altitude,
      speed: Math.abs(speed * 10), 
      pitch: time < 10 ? 0 : Math.sin(time) * 0.2, 
      yaw: 0,
      roll: time * 0.5
    };

    ws.send(JSON.stringify(fakeTelemetry));
  }, 50);

  ws.on('close', () => clearInterval(interval));
});