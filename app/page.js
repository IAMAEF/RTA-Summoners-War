import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { signOut } from "@/app/auth/actions";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
      <h1 className="font-display" style={{ fontSize: 26, marginBottom: 8 }}>
        SW RTA <span style={{ color: "var(--gold)" }}>Trainer</span>
      </h1>
      <p style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 20 }}>
        Phase 3: โหมดฝึกดราฟต่อกับฐานมอนสเตอร์จริงแล้ว — ประวัติการเล่นจะย้ายเข้ามาในเฟสถัดไป
      </p>

      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 28, flexWrap: "wrap" }}>
        <Link href="/draft" style={btnPrimary}>
          ฝึกดราฟ
        </Link>
        <Link href="/monsters" style={btnPrimary}>
          จัดการมอนสเตอร์
        </Link>
      </div>

      {user ? (
        <div
          style={{
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            padding: 20,
          }}
        >
          <p style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 14 }}>
            เข้าสู่ระบบแล้วในนาม <b style={{ color: "var(--text)" }}>{user.email}</b>
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <Link href="/dashboard" style={btnPrimary}>
              ไปหน้าที่ต้อง login
            </Link>
            <form action={signOut}>
              <button type="submit" style={btnGhost}>
                ออกจากระบบ
              </button>
            </form>
          </div>
        </div>
      ) : (
        <Link href="/login" style={btnPrimary}>
          เข้าสู่ระบบ / สมัครสมาชิก
        </Link>
      )}
    </main>
  );
}

const btnPrimary = {
  display: "inline-block",
  padding: "10px 20px",
  borderRadius: 8,
  border: "1px solid var(--gold)",
  background: "var(--gold-soft)",
  color: "var(--gold)",
  fontSize: 13,
  fontWeight: 600,
  textDecoration: "none",
  cursor: "pointer",
};

const btnGhost = {
  padding: "10px 20px",
  borderRadius: 8,
  border: "1px solid var(--line)",
  background: "transparent",
  color: "var(--text-dim)",
  fontSize: 13,
  cursor: "pointer",
};
