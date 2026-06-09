import { useEffect } from "react";

// ── Base overlay wrapper ───────────────────────────────────────────────────
export function PopupOverlay({ onClose, children, className = "" }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="popup-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className={`popup-box ${className}`}>
        {children}
      </div>
    </div>
  );
}

// ── Reusable header ───────────────────────────────────────────────────────
function PopupHeader({ title, onClose }) {
  return (
    <div className="popup-header">
      <span className="popup-title">{title}</span>
      {onClose && (
        <button className="popup-close" onClick={onClose} aria-label="Close">✕</button>
      )}
    </div>
  );
}

// ── Alert — one button, info only ────────────────────────────────────────
export function AlertPopup({ title = "ALERT", message, onClose }) {
  return (
    <PopupOverlay onClose={onClose}>
      <PopupHeader title={title} onClose={onClose} />
      <div className="popup-body">
        <p className="popup-message">{message}</p>
      </div>
      <div className="popup-footer">
        <button className="popup-btn popup-btn--primary" onClick={onClose}>OK</button>
      </div>
    </PopupOverlay>
  );
}

// ── Confirm — confirm / cancel ───────────────────────────────────────────
export function ConfirmPopup({ title = "CONFIRM", message, onConfirm, onClose }) {
  return (
    <PopupOverlay onClose={onClose}>
      <PopupHeader title={title} onClose={onClose} />
      <div className="popup-body">
        <p className="popup-message">{message}</p>
      </div>
      <div className="popup-footer">
        <button className="popup-btn popup-btn--ghost" onClick={onClose}>CANCEL</button>
        <button className="popup-btn popup-btn--primary" onClick={() => { onConfirm?.(); onClose?.(); }}>CONFIRM</button>
      </div>
    </PopupOverlay>
  );
}

// ── Status — shows a list of label/value rows ────────────────────────────
export function StatusPopup({ title = "STATUS", items = [], onClose }) {
  return (
    <PopupOverlay onClose={onClose}>
      <PopupHeader title={title} onClose={onClose} />
      <div className="popup-body">
        {items.map(({ label, value, ok }, i) => (
          <div key={i} className="popup-status-row">
            <span className="popup-status-lbl">{label}</span>
            <span className={`popup-status-val${ok === false ? " err" : ok === true ? " ok" : ""}`}>
              {value}
            </span>
          </div>
        ))}
      </div>
      <div className="popup-footer">
        <button className="popup-btn popup-btn--primary" onClick={onClose}>CLOSE</button>
      </div>
    </PopupOverlay>
  );
}

// ── Warning — critical warning with red accent ───────────────────────────
export function WarningPopup({ title = "WARNING", message, onClose }) {
  return (
    <PopupOverlay onClose={onClose} className="popup-box--warn">
      <PopupHeader title={title} onClose={onClose} />
      <div className="popup-body">
        <div className="popup-warn-icon">⚠</div>
        <p className="popup-message">{message}</p>
      </div>
      <div className="popup-footer">
        <button className="popup-btn popup-btn--danger" onClick={onClose}>ACKNOWLEDGE</button>
      </div>
    </PopupOverlay>
  );
}
