import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import MonsterManager from "@/components/MonsterManager";

export default async function MonstersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 20px 60px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div>
          <Link href="/" style={{ fontSize: 11, color: "var(--text-faint)", textDecoration: "none" }}>
            ← กลับหน้าแรก
          </Link>
          <h1 className="font-display" style={{ fontSize: 22, margin: "4px 0 2px" }}>
            จัดการมอนสเตอร์
          </h1>
          <div style={{ fontSize: 12.5, color: "var(--text-dim)" }}>ฐานข้อมูลกลาง ทุกคนอ่านได้ ต้อง login ถึงจะแก้ไขได้</div>
        </div>
      </div>

      <MonsterManager user={user} />
    </main>
  );
}
