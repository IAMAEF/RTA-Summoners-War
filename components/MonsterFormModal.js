"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { ELEMENTS, TAG_OPTIONS, uploadMonsterImage } from "@/lib/monsters";
import { FieldLabel, ModalShell, TAG_COLOR, TAG_TH, ghostBtn, inputStyle, primaryBtn } from "./ui";
import MonsterPicker from "./MonsterPicker";

const blank = () => ({
  id: null,
  name: "",
  element: "Fire",
  stars: 5,
  tags: [],
  meta: false,
  imageUrl: "",
  notes: "",
  weakAgainst: [],
  strongAgainst: [],
});

export default function MonsterFormModal({ initial, allMonsters, onCancel, onSaved }) {
  const [form, setForm] = useState(
    initial
      ? {
          id: initial.id,
          name: initial.name,
          element: initial.element,
          stars: initial.stars,
          tags: initial.tags || [],
          meta: initial.meta,
          imageUrl: initial.image_url || "",
          notes: initial.notes || "",
          weakAgainst: initial.weakAgainst || [],
          strongAgainst: initial.strongAgainst || [],
        }
      : blank()
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleTag = (t) => setForm((f) => ({ ...f, tags: f.tags.includes(t) ? f.tags.filter((x) => x !== t) : [...f.tags, t] }));
  const pickerOptions = allMonsters.filter((m) => m.id !== form.id);
  const valid = form.name.trim().length > 0;

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const supabase = createClient();
      const url = await uploadMonsterImage(supabase, file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err) {
      setError("อัปโหลดรูปไม่สำเร็จ: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const supabase = createClient();
      await onSaved(supabase, form);
    } catch (err) {
      setError(err.message || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell onClose={onCancel} width={460}>
      <div className="font-display" style={{ fontSize: 16, marginBottom: 14 }}>
        {form.id ? "แก้ไขมอนสเตอร์" : "เพิ่มมอนสเตอร์ใหม่"}
      </div>

      <FieldLabel>ชื่อ</FieldLabel>
      <input style={{ ...inputStyle, width: "100%", marginBottom: 12 }} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div>
          <FieldLabel>ธาตุ</FieldLabel>
          <select style={{ ...inputStyle, width: "100%" }} value={form.element} onChange={(e) => setForm((f) => ({ ...f, element: e.target.value }))}>
            {ELEMENTS.map((el) => (
              <option key={el} value={el}>
                {el}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel>ดาว</FieldLabel>
          <select style={{ ...inputStyle, width: "100%" }} value={form.stars} onChange={(e) => setForm((f) => ({ ...f, stars: Number(e.target.value) }))}>
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <option key={s} value={s}>
                {s}★
              </option>
            ))}
          </select>
        </div>
      </div>

      <FieldLabel>แท็ก</FieldLabel>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {TAG_OPTIONS.map((t) => (
          <button
            key={t}
            onClick={() => toggleTag(t)}
            style={{
              padding: "5px 12px",
              borderRadius: 999,
              border: `1px solid ${form.tags.includes(t) ? TAG_COLOR[t] : "var(--line)"}`,
              background: form.tags.includes(t) ? `${TAG_COLOR[t]}22` : "transparent",
              color: form.tags.includes(t) ? TAG_COLOR[t] : "var(--text-dim)",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {TAG_TH[t]}
          </button>
        ))}
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--text-dim)", marginBottom: 12, cursor: "pointer" }}>
        <input type="checkbox" checked={form.meta} onChange={(e) => setForm((f) => ({ ...f, meta: e.target.checked }))} />
        ติด tab Meta
      </label>

      <MonsterPicker
        label="แพ้ทาง (ถูก counter โดย…)"
        hint="ตัวที่ทำให้มอนสเตอร์นี้เสียเปรียบเมื่อเจอกัน"
        selectedIds={form.weakAgainst}
        options={pickerOptions}
        onChange={(ids) => setForm((f) => ({ ...f, weakAgainst: ids }))}
      />
      <MonsterPicker
        label="ชนะทาง (counter…)"
        hint="ตัวที่มอนสเตอร์นี้ได้เปรียบเมื่อเจอกัน"
        selectedIds={form.strongAgainst}
        options={pickerOptions}
        onChange={(ids) => setForm((f) => ({ ...f, strongAgainst: ids }))}
      />

      <FieldLabel>รูปภาพ</FieldLabel>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
        {form.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.imageUrl} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8, border: "1px solid var(--line)" }} />
        )}
        <input type="file" accept="image/*" onChange={handleImageChange} disabled={uploading} style={{ fontSize: 11.5, color: "var(--text-dim)" }} />
        {uploading && <span style={{ fontSize: 11, color: "var(--text-faint)" }}>กำลังอัปโหลด…</span>}
      </div>

      <FieldLabel>โน้ต</FieldLabel>
      <textarea
        style={{ ...inputStyle, width: "100%", minHeight: 60, resize: "vertical", marginBottom: 12 }}
        value={form.notes}
        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
      />

      {error && <div style={{ fontSize: 12, color: "var(--danger)", marginBottom: 10 }}>{error}</div>}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button style={ghostBtn} onClick={onCancel}>
          ยกเลิก
        </button>
        <button style={{ ...primaryBtn, opacity: valid && !saving && !uploading ? 1 : 0.5 }} onClick={handleSave} disabled={!valid || saving || uploading}>
          {saving ? "กำลังบันทึก…" : "บันทึก"}
        </button>
      </div>
    </ModalShell>
  );
}
