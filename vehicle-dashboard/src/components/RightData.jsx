import { useEffect, useLayoutEffect, useRef, useState } from "react";

const USB_CAMERA_HINTS = ["usb", "external", "capture", "webcam", "camera"];

function findPreferredCamera(devices) {
  return devices.find(
    (device) =>
      device.kind === "videoinput" &&
      USB_CAMERA_HINTS.some((hint) => device.label.toLowerCase().includes(hint)),
  );
}

export default function RightData() {
  const [zoomed, setZoomed] = useState(false);
  const [cameraStatus, setCameraStatus] = useState("CONNECTING");
  const [cameraLabel, setCameraLabel] = useState("CAM 01");
  const ref = useRef(null);
  const videoRef = useRef(null);
  const prevRect = useRef(null);

  const toggleZoom = () => {
    if (ref.current) {
      prevRect.current = ref.current.getBoundingClientRect();
    }
    setZoomed((z) => !z);
  };

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !prevRect.current) return;

    const next = el.getBoundingClientRect();
    const prev = prevRect.current;
    prevRect.current = null;

    const dx = prev.left - next.left;
    const dy = prev.top - next.top;
    const sx = prev.width / next.width;
    const sy = prev.height / next.height;

    el.animate(
      [
        {
          transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`,
          transformOrigin: "0 0",
        },
        { transform: "none", transformOrigin: "0 0" },
      ],
      { duration: 800, easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
    );
  }, [zoomed]);

  useEffect(() => {
    let cancelled = false;
    let stream;

    async function attachCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraStatus("UNSUPPORTED");
        return;
      }

      try {
        setCameraStatus("CONNECTING");

        let constraints = {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
          audio: false,
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);

        const devices = navigator.mediaDevices.enumerateDevices
          ? await navigator.mediaDevices.enumerateDevices()
          : [];
        const preferredCamera = findPreferredCamera(devices);
        const [activeVideoTrack] = stream.getVideoTracks();

        if (
          preferredCamera?.deviceId &&
          activeVideoTrack?.getSettings().deviceId !== preferredCamera.deviceId
        ) {
          stream.getTracks().forEach((track) => track.stop());
          constraints = {
            video: {
              deviceId: { exact: preferredCamera.deviceId },
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 },
            },
            audio: false,
          };
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        }

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const [videoTrack] = stream.getVideoTracks();
        if (videoTrack?.label) {
          setCameraLabel(videoTrack.label);
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setCameraStatus("LIVE");
      } catch (error) {
        if (cancelled) return;
        setCameraStatus(error?.name === "NotAllowedError" ? "PERMISSION DENIED" : "NO SIGNAL");
      }
    }

    attachCamera();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  return (
    <div id="right-data" ref={ref} className={zoomed ? "zoomed" : ""}>
      <div className="video-head">
        <span className="video-lbl">Live Feed</span>
        <span className="video-tag">{cameraStatus === "LIVE" ? cameraLabel : cameraStatus}</span>
        <button
          className="video-zoom-btn"
          onClick={toggleZoom}
          aria-label={zoomed ? "Shrink video" : "Expand video"}
        >
          {zoomed ? "−" : "+"}
        </button>
      </div>
      <div className="video-frame">
        <video ref={videoRef} autoPlay muted playsInline className="video-el" />
        {cameraStatus !== "LIVE" && <div className="video-placeholder">{cameraStatus}</div>}
      </div>
    </div>
  );
}
