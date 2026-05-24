import wrtc from "@roamhq/wrtc";
const ws = new WebSocket("ws://localhost:9003")
const pc = new wrtc.RTCPeerConnection({
  iceServers: [{ urls: "stun:stun1.l.google.com:19302" }]
});

//ws.onopen = () => {
//  ws.send(JSON.stringify({"type": 1}));
//}
//
ws.onmessage = async (e) => {
  const msg = JSON.parse(e.data)

  if (msg.offer) {
    await pc.setRemoteDescription(msg.offer)
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    console.log(JSON.stringify({answer}));
    ws.send(JSON.stringify({answer}))
  }

  if (msg.answer) {
    await pc.setRemoteDescription(msg.answer)
  }

  if (msg.ice) {
    await pc.addIceCandidate(msg.ice)
  }
  pc.onicecandidate = e => {
    if (e.candidate) {
      ws.send(JSON.stringify({ ice: e.candidate }))
    }
  }
}

pc.ondatachannel = e => {
  const channel = e.channel

  channel.onopen = () => {
    console.log("Telemetry channel open")
  }
  channel.onmessage = ev => {
    const q = JSON.parse(ev.data)
    console.log(q);
  }
}


