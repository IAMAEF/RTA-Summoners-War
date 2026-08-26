"use client";

import { useState } from "react";
import { ELEMENT_COLOR, ELEMENT_TH, FieldLabel, inputStyle } from "./ui";

export default function MonsterPicker({ label, hint, selectedIds, options, onChange }) {
  const [query, setQuery] = useState("");
  const selected = selectedIds.map((id) => options.find((m) => m.id === id)).filter(Boolean);
  const matches =
    query.trim().length === 0
      ? []
      : options.filter((m) => !selectedIds.includes(m.id) && m.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6);

  const add = (id) => {
    onChange(Array.from(new Set([...selectedIds, id])));
    setQuery("");
  };
  const remove = (id) => onChange(selectedIds.filter((x) => x !== id));

  return (
    <div style={{ marginBottom: 12 }}>
      <FieldLabel>{label}</FieldLabel>
      {hint && <div style={{ fontSize: 10, color: "var(--text-faint)", marginBottom: 6 }}>{hint}</div>}

      {selected.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
          {selected.map((m) => (
            <span
              key={m.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11.5,
                padding: "3px 6px 3px 9px",
                borderRadius: 999,
                background: `${ELEMENT_COLOR[m.element]}1f`,
                border: `1px solid ${ELEMENT_COLOR[m.element]}66`,
                color: "var(--text)",
              }}
            >
              {m.name}
              <button
                onClick={() => remove(m.id)}
                style={{ background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer", fontSize: 12, lineHeight: 1, padding: 0 }}
                title="เอาออก"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      <div style={{ position: "relative" }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="พิมพ์ชื่อมอนสเตอร์เพื่อเพิ่ม…" style={{ ...inputStyle, width: "100%" }} />
        {matches.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              marginTop: 4,
              background: "var(--panel-alt)",
              border: "1px solid var(--line)",
              borderRadius: 8,
              overflow: "hidden",
              zIndex: 5,
            }}
          >
            {matches.map((m) => (
              <div
                key={m.id}
                onClick={() => add(m.id)}
                style={{ padding: "7px 10px", fontSize: 12.5, cursor: "pointer", display: "flex", justifyContent: "space-between" }}
              >
                <span>{m.name}</span>
                <span style={{ color: ELEMENT_COLOR[m.element], fontSize: 10.5 }}>{ELEMENT_TH[m.element]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
