import { createClient } from "@/utils/supabase/server";
import { signOut } from "@/app/auth/actions";

// This route is listed in PROTECTED_PATHS (utils/supabase/middleware.js),
// so the middleware already redirects here-to-/login for anonymous visitors.
// The check below is a second, defense-in-depth guard.
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main style={{ maxWidth: 480, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
        <p style={{ color: "var(--text-dim)" }}>ต้องเข้าสู่ระบบก่อนถึงจะเห็นหน้านี้</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
      <h1 className="font-display" style={{ fontSize: 20, color: "var(--gold)", marginBottom: 10 }}>
        ✓ ระบบ Auth ทำงานถูกต้อง
      </h1>
      <p style={{ color: "var(--text-dim)", fontSize: 13, marginBottom: 4 }}>
        ล็อกอินในนาม <b style={{ color: "var(--text)" }}>{user.email}</b>
      </p>
      <p style={{ color: "var(--text-faint)", fontSize: 12, marginBottom: 24 }}>
        user_id: <span className="font-mono">{user.id}</span>
      </p>
      <p style={{ color: "var(--text-faint)", fontSize: 12, marginBottom: 24 }}>
        หน้านี้เป็นตัวอย่างเฉยๆ — เฟสถัดไปจะแทนที่ด้วยหน้าจัดการมอนสเตอร์ / ฝึกดราฟ / ประวัติการเล่นจริง
      </p>
      <form action={signOut}>
        <button
          type="submit"
          style={{
            padding: "9px 18px",
            borderRadius: 8,
            border: "1px solid var(--line)",
            background: "transparent",
            color: "var(--text-dim)",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          ออกจากระบบ
        </button>
      </form>
    </main>
  );
}
