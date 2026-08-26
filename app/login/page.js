"use client";

import { useState } from "react";
import { signIn, signUp } from "@/app/auth/actions";

export default function LoginPage() {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (formData) => {
    setPending(true);
    setError("");
    const action = mode === "signin" ? signIn : signUp;
    const result = await action(formData);
    // If we get here (no redirect happened), there was an error.
    if (result?.error) setError(result.error);
    setPending(false);
  };

  return (
    <main style={{ maxWidth: 380, margin: "0 auto", padding: "70px 20px" }}>
      <h1 className="font-display" style={{ fontSize: 22, textAlign: "center", marginBottom: 6 }}>
        {mode === "signin" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
      </h1>
      <p style={{ textAlign: "center", color: "var(--text-faint)", fontSize: 12.5, marginBottom: 24 }}>
        SW RTA Trainer
      </p>

      <form action={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input name="email" type="email" required placeholder="อีเมล" style={inputStyle} />
        <input name="password" type="password" required minLength={6} placeholder="รหัสผ่าน (อย่างน้อย 6 ตัว)" style={inputStyle} />

        {error && <div style={{ fontSize: 12, color: "var(--danger)" }}>{error}</div>}

        <button type="submit" disabled={pending} style={btnPrimary}>
          {pending ? "กำลังดำเนินการ…" : mode === "signin" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
        </button>
      </form>

      <div style={{ textAlign: "center", marginTop: 18, fontSize: 12.5, color: "var(--text-dim)" }}>
        {mode === "signin" ? (
          <>
            ยังไม่มีบัญชี?{" "}
            <button onClick={() => setMode("signup")} style={linkBtn}>
              สมัครสมาชิก
            </button>
          </>
        ) : (
          <>
            มีบัญชีอยู่แล้ว?{" "}
            <button onClick={() => setMode("signin")} style={linkBtn}>
              เข้าสู่ระบบ
            </button>
          </>
        )}
      </div>
    </main>
  );
}

const inputStyle = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--line)",
  background: "var(--panel-alt)",
  color: "var(--text)",
  fontSize: 13,
  outline: "none",
};

const btnPrimary = {
  padding: "10px 16px",
  borderRadius: 8,
  border: "1px solid var(--gold)",
  background: "var(--gold-soft)",
  color: "var(--gold)",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const linkBtn = {
  background: "none",
  border: "none",
  color: "var(--gold)",
  cursor: "pointer",
  fontSize: 12.5,
  padding: 0,
  textDecoration: "underline",
};
