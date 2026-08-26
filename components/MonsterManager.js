"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { ELEMENTS, TAG_OPTIONS, deleteMonster, listMonsters, saveMonster } from "@/lib/monsters";
import { ELEMENT_TH, MonsterAvatar, ModalShell, TAG_COLOR, TAG_TH, ghostBtn, inputStyle, miniBtn, primaryBtn } from "./ui";
import MonsterFormModal from "./MonsterFormModal";

export default function MonsterManager({ user }) {
  const [monsters, setMonsters] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [elementFilter, setElementFilter] = useState("All");
  const [tagFilter, setTagFilter] = useState("All");
  const [metaOnly, setMetaOnly] = useState(false);
  const [editing, setEditing] = useState(null); // null | {} (new) | monster (edit)
  const [deleteTarget, setDeleteTarget] = useState(null);

  const canWrite = !!user;

  const refresh = async () => {
    try {
      const supabase = createClient();
      const data = await listMonsters(supabase);
      setMonsters(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    return monsters
      .filter((m) => (elementFilter === "All" ? true : m.element === elementFilter))
      .filter((m) => (tagFilter === "All" ? true : (m.tags || []).includes(tagFilter)))
      .filter((m) => (metaOnly ? m.meta : true))
      .filter((m) => (search.trim() ? m.name.toLowerCase().includes(search.trim().toLowerCase()) : true));
  }, [monsters, elementFilter, tagFilter, metaOnly, search]);

  const handleSaved = async (supabase, formData) => {
    await saveMonster(supabase, formData);
    setEditing(null);
    await refresh();
  };

  const confirmDelete = async () => {
    try {
      const supabase = createClient();
      await deleteMonster(supabase, deleteTarget);
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      setError(err.message);
      setDeleteTarget(null);
    }
  };

  if (!loaded) {
    return <div style={{ color: "var(--text-faint)", fontSize: 13, textAlign: "center", padding: 40 }}>กำลังโหลดฐานข้อมูลมอนสเตอร์…</div>;
  }

  return (
    <div>
      {!canWrite && (
        <div
          style={{
            fontSize: 12.5,
            color: "var(--text-dim)",
            background: "var(--panel-alt)",
            border: "1px solid var(--line)",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 14,
          }}
        >
          ดูฐานข้อมูลได้โดยไม่ต้อง login แต่ต้อง{" "}
          <a href="/login" style={{ color: "var(--gold)" }}>
            เข้าสู่ระบบ
          </a>{" "}
          ก่อนถึงจะเพิ่ม/แก้ไข/ลบได้
        </div>
      )}

      {error && <div style={{ fontSize: 12.5, color: "var(--danger)", marginBottom: 12 }}>{error}</div>}

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาชื่อมอนสเตอร์…" style={{ ...inputStyle, width: 200 }} />
        <select style={inputStyle} value={elementFilter} onChange={(e) => setElementFilter(e.target.value)}>
          <option value="All">ทุกธาตุ</option>
          {ELEMENTS.map((el) => (
            <option key={el} value={el}>
              {ELEMENT_TH[el]}
            </option>
          ))}
        </select>
        <select style={inputStyle} value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
          <option value="All">ทุกแท็ก</option>
          {TAG_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {TAG_TH[t]}
            </option>
          ))}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--text-dim)" }}>
          <input type="checkbox" checked={metaOnly} onChange={(e) => setMetaOnly(e.target.checked)} />
          Meta เท่านั้น
        </label>
        <div style={{ fontSize: 11.5, color: "var(--text-faint)" }}>
          ทั้งหมด {filtered.length} / {monsters.length} ตัว
        </div>
        {canWrite && (
          <button style={{ ...primaryBtn, marginLeft: "auto" }} onClick={() => setEditing({})}>
            + เพิ่มมอนสเตอร์
          </button>
        )}
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12 }}>
        {filtered.map((m) => (
          <div
            key={m.id}
            style={{
              background: "var(--panel)",
              border: "1px solid var(--line)",
              borderRadius: 12,
              padding: 12,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
          >
            <MonsterAvatar mon={m} size={56} />
            <div style={{ fontSize: 12, textAlign: "center", fontWeight: 600 }}>{m.name}</div>
            <div style={{ fontSize: 10, color: "var(--text-faint)" }}>
              {ELEMENT_TH[m.element]} • {m.stars}★{m.meta ? " • Meta" : ""}
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
              {(m.tags || []).map((t) => (
                <span key={t} style={{ fontSize: 8.5, padding: "1px 5px", borderRadius: 999, background: `${TAG_COLOR[t]}22`, border: `1px solid ${TAG_COLOR[t]}66`, color: TAG_COLOR[t] }}>
                  {TAG_TH[t]}
                </span>
              ))}
            </div>
            {(m.weakAgainst?.length > 0 || m.strongAgainst?.length > 0) && (
              <div style={{ fontSize: 9.5, lineHeight: 1.5, textAlign: "center" }}>
                {m.weakAgainst?.length > 0 && (
                  <div style={{ color: "var(--danger)" }}>แพ้: {m.weakAgainst.map((id) => monsters.find((x) => x.id === id)?.name).filter(Boolean).join(", ")}</div>
                )}
                {m.strongAgainst?.length > 0 && (
                  <div style={{ color: "var(--wind)" }}>ชนะ: {m.strongAgainst.map((id) => monsters.find((x) => x.id === id)?.name).filter(Boolean).join(", ")}</div>
                )}
              </div>
            )}
            {canWrite && (
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                <button style={miniBtn} onClick={() => setEditing(m)}>
                  แก้ไข
                </button>
                <button style={{ ...miniBtn, color: "var(--danger)", borderColor: "rgba(226,87,43,0.4)" }} onClick={() => setDeleteTarget(m.id)}>
                  ลบ
                </button>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <div style={{ color: "var(--text-faint)", fontSize: 12, padding: "20px 0" }}>ไม่พบมอนสเตอร์ตามตัวกรองนี้</div>}
      </div>

      {editing !== null && <MonsterFormModal initial={editing.id ? editing : null} allMonsters={monsters} onCancel={() => setEditing(null)} onSaved={handleSaved} />}

      {deleteTarget && (
        <ModalShell onClose={() => setDeleteTarget(null)} width={360}>
          <div className="font-display" style={{ fontSize: 15, marginBottom: 10 }}>
            ลบมอนสเตอร์นี้?
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginBottom: 16 }}>
            ลบแล้วกู้คืนไม่ได้ และจะลบความสัมพันธ์แพ้ทาง/ชนะทางที่ผูกกับตัวนี้ด้วย
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button style={ghostBtn} onClick={() => setDeleteTarget(null)}>
              ยกเลิก
            </button>
            <button style={{ ...primaryBtn, borderColor: "var(--danger)", background: "rgba(226,87,43,0.14)", color: "var(--danger)" }} onClick={confirmDelete}>
              ลบ
            </button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
