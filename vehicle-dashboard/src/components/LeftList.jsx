import { useEffect, useState } from "react";

const ITEMS = [
  { id: 0, name: "CHECK1" },
  { id: 1, name: "CHECK2" },
  { id: 2, name: "CHECK3" },
  { id: 3, name: "CHECK4" },
  { id: 4, name: "CHECK5" },
  { id: 5, name: "CHECK6" },
  { id: 6, name: "CHECK7" },
];

const WAITING = 0;
const LOADING = 1;
const READY = 2;

const DOT_CLASS = { [WAITING]: "warn", [LOADING]: "loading", [READY]: "done" };
const SUB_CLASS = {
  [WAITING]: "awaiting",
  [LOADING]: "loading",
  [READY]: "open",
};
const LABEL = { [WAITING]: "Waiting", [LOADING]: "Loading", [READY]: "Ready" };

export default function LeftList({ items = ITEMS }) {
  const [statuses, setStatuses] = useState(() => items.map(() => WAITING));

  const setStatusAt = (i, value) =>
    setStatuses((prev) => {
      const next = [...prev];
      next[i] = value;
      return next;
    });

  const startCascadeSequence = () => {
    setStatuses(items.map(() => WAITING));
    items.forEach((_, i) => {
      setTimeout(() => setStatusAt(i, LOADING), i * 400);
      setTimeout(() => setStatusAt(i, READY), i * 400 + 1500);
    });
  };

  useEffect(() => {
    // const channel = new BroadcastChannel("mission_control");
    // channel.onmessage = (e) => {
    //   if (e.data.type === "TRIGGER_EVENT" && e.data.target === "START_MISSION") {
    //     startCascadeSequence();
    //   }
    // };
    // return () => channel.close();
  }, []);

  return (
    <div id="left-list">
      {items.map((item, i) => {
        const status = statuses[i];
        return (
          <div
            key={item.id}
            className={`ci ${status === WAITING ? "warn" : ""}`}
            // onClick={() => {/* operator click handler */}}
          >
            <div className={`ci-dot ${DOT_CLASS[status]}`} />
            <div>
              <div className="ci-name">{item.name}</div>
              <div className={`ci-sub ${SUB_CLASS[status]}`}>
                {LABEL[status]}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
