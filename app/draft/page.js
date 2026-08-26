import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import DraftTrainer from "@/components/DraftTrainer";

export default async function DraftPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px 60px" }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/" style={{ fontSize: 11, color: "var(--text-faint)", textDecoration: "none" }}>
          ← กลับหน้าแรก
        </Link>
        <h1 className="font-display" style={{ fontSize: 22, margin: "4px 0 2px" }}>
          โหมดฝึกดราฟ <span style={{ color: "var(--gold)" }}>RTA</span>
        </h1>
        <div style={{ fontSize: 12.5, color: "var(--text-dim)" }}>ฝึกจังหวะ ban/pick แบบ Real-Time Arena</div>
      </div>

      <DraftTrainer user={user} />
    </main>
  );
}
