**Feel free to do anything with this file, make sure you don't mess up the original by creating a branch. 


**This git repository will only demonstrate the UI Front-end, all backend logics are not here, what you see is only the simulation

Live feed React frontend.

## Stack
- **React 18** + **Vite**
- **Three.js** (r134) for 3D model viewer
- Plain CSS, might add tailwind later.

## Getting Started
**If your installed node_modules does not work, show this README.md to AI.

```bash
cd vehicle-dashboard
npm install
npm run dev
```

Open http://localhost:xxxx (depends on your bash)

## pages

Click L to swap pages, this logic will be changed later.

## Connecting to Node.js

All telemetry values flow through the `telemetry` prop in `App.jsx`.
There is a clearly marked `TODO` block in `App.jsx` 


1. Install websocket-client:
2. I will Replace `STATIC_TELEMETRY` in `App.jsx` with a `useTelemetry()` hook later.


## Project Structure (not done yet)

```
src/
  App.jsx              ← Main layout + telemetry wiring point
  index.css            ← All styles (CSS variables at top for easy theming)
  main.jsx             ← React entry point
  assets/
    logo.jpg           ← All logo(s)
    **anything that suppose to be in public will be here

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

Note that the .CSS does not contains all of the CSS existed in the project.

Edit CSS variables at the top of `src/index.css`:
```css
:root {
  --crimson: #a01818;   /* primary accent */
  --gold:    #c89820;   /* secondary accent */
  --bg:      #0c0b10;   /* background */
  ...
}
```
