"use client";

export const ELEMENT_COLOR = { Fire: "#E2572B", Water: "#3B8FD1", Wind: "#4FAE7B", Light: "#E8C25B", Dark: "#9463C9" };
export const ELEMENT_TH = { Fire: "ไฟ", Water: "น้ำ", Wind: "ลม", Light: "แสง", Dark: "มืด" };
export const TAG_TH = { Strip: "ลบบัพ", Damage: "ดาเมจ", Support: "ซัพพอร์ต", CC: "CC" };
export const TAG_COLOR = { Strip: "#C9576B", Damage: "#D8863A", Support: "#4FAE9B", CC: "#6E8FE0" };

export function Hex({ size = 56, color, children, imageUrl, title }) {
  const clip = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";
  return (
    <div
      title={title}
      style={{
        width: size,
        height: size * 1.06,
        clipPath: clip,
        background: imageUrl ? `center/cover url(${imageUrl})` : `linear-gradient(155deg, ${color}55, ${color}1a)`,
        border: `1.5px solid ${color}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {!imageUrl && children}
    </div>
  );
}

export function MonsterAvatar({ mon, size = 56 }) {
  const color = ELEMENT_COLOR[mon.element];
  const initials = mon.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <Hex size={size} color={color} imageUrl={mon.image_url} title={mon.name}>
      <span style={{ fontFamily: "'Cinzel', serif", fontSize: size * 0.32, color: "var(--text)", fontWeight: 600 }}>{initials}</span>
    </Hex>
  );
}

export function EmptySlot({ size = 56 }) {
  return (
    <Hex size={size} color="var(--line)">
      <span style={{ color: "var(--text-faint)", fontSize: size * 0.4 }}>?</span>
    </Hex>
  );
}

export function FieldLabel({ children }) {
  return <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 5, fontWeight: 600 }}>{children}</div>;
}

export function ModalShell({ children, onClose, width = 420 }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(8,6,12,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width,
          maxWidth: "100%",
          maxHeight: "85vh",
          overflowY: "auto",
          background: "var(--panel)",
          border: "1px solid var(--line)",
          borderRadius: 14,
          padding: 20,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export const inputStyle = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid var(--line)",
  background: "var(--panel-alt)",
  color: "var(--text)",
  fontSize: 12.5,
  outline: "none",
};

export const miniBtn = {
  padding: "5px 10px",
  borderRadius: 6,
  border: "1px solid var(--line)",
  background: "transparent",
  color: "var(--text-dim)",
  fontSize: 11.5,
  cursor: "pointer",
};

export const ghostBtn = {
  padding: "8px 16px",
  borderRadius: 8,
  border: "1px solid var(--line)",
  background: "transparent",
  color: "var(--text-dim)",
  fontSize: 13,
  cursor: "pointer",
};

export const primaryBtn = {
  padding: "9px 20px",
  borderRadius: 8,
  border: "1px solid var(--gold)",
  background: "var(--gold-soft)",
  color: "var(--gold)",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};
