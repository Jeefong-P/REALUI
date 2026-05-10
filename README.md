# Vehicle Overview Dashboard

Chula Engineering — Vehicle Overview React frontend.

## Stack
- **React 18** + **Vite**
- **Three.js** (r134) for 3D model viewer
- Plain CSS (no Tailwind, no styled-components — easy to edit)

## Getting Started

```bash
cd vehicle-dashboard
npm install
npm run dev
```

Open http://localhost:5173

## Connecting to Node.js / LoRa Data

All telemetry values flow through the `telemetry` prop in `App.jsx`.
There is a clearly marked `TODO` block in `App.jsx` showing exactly where to plug in your WebSocket/socket.io connection.

**Steps:**
1. Install socket.io-client:  `npm install socket.io-client`
2. Replace `STATIC_TELEMETRY` in `App.jsx` with a `useTelemetry()` hook that reads from your Node.js server
3. Your Node.js server emits: `socket.emit('telemetry', { ppo2, cabinTemp, ... })`

## Loading Your 3D Model

1. Place your `.glb` file in the `public/model/` folder
2. Edit `src/components/ModelZone.jsx`, line 6:
   ```js
   const MODEL_SRC = '/model/your-model-name.glb'
   ```

The model auto-centers, auto-scales, and slowly rotates. Drag to orbit, scroll to zoom.

## Project Structure

```
src/
  App.jsx              ← Main layout + telemetry wiring point
  index.css            ← All styles (CSS variables at top for easy theming)
  main.jsx             ← React entry point
  assets/
    logo.jpg           ← Chula Engineering logo
  components/
    TopBar.jsx         ← Header with logo + clock
    LeftList.jsx       ← Checklist panel
    LeftData.jsx       ← Gauges + loops + connections
    ArcGauge.jsx       ← Reusable arc gauge (SVG)
    LoopGauge.jsx      ← Reusable circular gauge (SVG)
    ModelZone.jsx      ← Three.js 3D model viewer
    RightData.jsx      ← Net power readouts
    RightList.jsx      ← Consumables panel
    IconBar.jsx        ← Function buttons + icon row
    StatusBar.jsx      ← Bottom status strip
    Clock.jsx          ← Live clock component
```

## Theming

Edit CSS variables at the top of `src/index.css`:
```css
:root {
  --crimson: #a01818;   /* primary accent */
  --gold:    #c89820;   /* secondary accent */
  --bg:      #0c0b10;   /* background */
  ...
}
```
