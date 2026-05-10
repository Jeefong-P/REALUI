import { useLayoutEffect, useRef, useState } from "react";

export default function RightData() {
  const [zoomed, setZoomed] = useState(false);
  const ref = useRef(null);
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

  return (
    <div id="right-data" ref={ref} className={zoomed ? "zoomed" : ""}>
      <div className="video-head">
        <span className="video-lbl">Live Feed</span>
        <span className="video-tag">CAM 01</span>
        <button
          className="video-zoom-btn"
          onClick={toggleZoom}
          aria-label={zoomed ? "Shrink video" : "Expand video"}
        >
          {zoomed ? "−" : "+"}
        </button>
      </div>
      <div className="video-frame">
        {/* <video
              src=""
              autoPlay
              muted
              loop
              playsInline
              className="video-el"
            /> */}
        <div className="video-placeholder">NO SIGNAL</div>
      </div>
    </div>
  );
}
