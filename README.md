# SW RTA Trainer — Phase 1 (โครงสร้างพื้นฐาน + Auth)

โปรเจกต์ Next.js + Supabase ที่พร้อมสำหรับต่อยอดฟีเจอร์จาก artifact เดิม (โหมดฝึกดราฟ / จัดการมอนสเตอร์ / ประวัติการเล่น) เฟสนี้ทำแค่โครงพื้นฐาน + ระบบสมัคร/ล็อกอิน ให้เดินได้จริงก่อน

## สิ่งที่ทำไว้ในเฟสนี้
- โปรเจกต์ Next.js (App Router) พร้อม theme สีเดิม (arcane/dark) จาก artifact
- ต่อ Supabase (Auth + Postgres + Storage) ผ่าน `@supabase/ssr`
- หน้า สมัครสมาชิก/เข้าสู่ระบบ/ออกจากระบบ ใช้งานได้จริง
- Middleware ป้องกันหน้าที่ต้อง login (ตอนนี้มีตัวอย่าง `/dashboard`)
- SQL migration พร้อม Row Level Security ครบทุกตาราง (`monsters`, `monster_tags`, `monster_counters` = shared, `match_history`, `owned_monsters` = personal ต่อ user)
- Storage bucket `monster-images` (public read, ต้อง login ถึงจะอัปโหลด/ลบได้)

## ขั้นตอนติดตั้ง

### 1. สร้างโปรเจกต์ Supabase
1. ไปที่ [supabase.com](https://supabase.com) → สมัคร/ล็อกอิน → New Project
2. รอจนโปรเจกต์สร้างเสร็จ (ประมาณ 1-2 นาที)

### 2. รัน SQL migration
1. ในโปรเจกต์ Supabase ไปที่ **SQL Editor** → New query
2. คัดลอกเนื้อหาทั้งหมดจาก `supabase/migrations/0001_init.sql` มาวาง แล้วกด Run
3. เช็คว่าไม่มี error — จะได้ตาราง 5 ตัว + storage bucket `monster-images`

### 3. ตั้งค่า Auth (แนะนำสำหรับตอน dev)
- ไปที่ **Authentication → Providers → Email**
- ถ้าอยากทดสอบเร็วๆ โดยไม่ต้องกดยืนยันอีเมล: ปิด "Confirm email" ชั่วคราว (ตอน production ค่อยเปิดกลับ)

### 4. ตั้งค่า environment variables
1. คัดลอก `.env.local.example` เป็น `.env.local`
2. ไปที่ Supabase → **Project Settings → API**
3. คัดลอก **Project URL** → ใส่ใน `NEXT_PUBLIC_SUPABASE_URL`
4. คัดลอก **anon / public key** → ใส่ใน `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   *(ถ้า dashboard แสดงเป็น "publishable key" แทน — ใช้ค่านั้นได้เลย ชื่อฟิลด์เปลี่ยนแต่ใช้แทนกันได้)*

### 5. รันโปรเจกต์
```bash
npm install
npm run dev
```
เปิด [http://localhost:3000](http://localhost:3000)

### 6. ทดสอบ
1. กด "เข้าสู่ระบบ / สมัครสมาชิก" → สมัครด้วยอีเมล/รหัสผ่าน
2. ถ้าปิด "Confirm email" ไว้ จะเข้าสู่ระบบได้ทันที
3. ลองเข้า `/dashboard` — ถ้า login แล้วจะเห็นหน้ายืนยันว่า auth ทำงาน ถ้ายังไม่ login จะถูกเด้งไป `/login` อัตโนมัติ (พิสูจน์ middleware ทำงาน)
4. ลองเปิด Supabase → **Table Editor → monsters** จะยังว่างอยู่ (ฐานมอนสเตอร์ยังไม่ถูกย้ายเข้ามาในเฟสนี้)

## Deploy ขึ้น Vercel
1. Push โปรเจกต์นี้ขึ้น GitHub
2. ไปที่ [vercel.com](https://vercel.com) → New Project → เลือก repo
3. ใส่ environment variables เดียวกับ `.env.local` ในหน้าตั้งค่า Vercel project (Settings → Environment Variables)
4. Deploy

## ต่อไป (เฟส 2)
ย้าย component จัดการมอนสเตอร์จาก artifact เดิม (`rta-draft-trainer.jsx`) มาต่อกับตาราง `monsters`/`monster_tags`/`monster_counters` จริง พร้อมเพิ่มระบบอัปโหลดรูปเข้า Supabase Storage bucket `monster-images` ที่เตรียมไว้แล้ว

---

# Phase 2 — จัดการมอนสเตอร์ต่อ Supabase จริง (เสร็จแล้ว)

## สิ่งที่เพิ่มเข้ามา
- `lib/monsters.js` — data access layer: `listMonsters`, `saveMonster`, `deleteMonster`, `uploadMonsterImage`
- `components/MonsterManager.js` — หน้าจัดการมอนสเตอร์แบบเต็ม (list/filter/add/edit/delete)
- `components/MonsterFormModal.js` — ฟอร์มเพิ่ม/แก้ไข พร้อม **อัปโหลดรูปจริง** ขึ้น Supabase Storage
- `components/MonsterPicker.js` — ตัวเลือกมอนสเตอร์แบบพิมพ์ค้นหา ใช้กับช่องแพ้ทาง/ชนะทาง
- `components/ui.js` — ชิ้นส่วน UI ที่ใช้ร่วมกัน (hexagon avatar, modal, ปุ่ม, สีธาตุ/แท็ก)
- หน้า `/monsters` — **อ่านได้โดยไม่ต้อง login** (ตรงกับ RLS policy ที่ตั้งไว้ตั้งแต่เฟส 1) แต่ปุ่มเพิ่ม/แก้ไข/ลบจะโผล่เฉพาะตอน login แล้ว

## ทำไมยังไม่มีข้อมูลมอนสเตอร์ในนี้
ตาราง `monsters` ใน Supabase ยังว่างอยู่ — ฐาน ~60 ตัวที่เคย seed ไว้ใน artifact เดิมยังไม่ได้ migrate เข้ามา ตอนนี้ต้อง**เพิ่มเองทีละตัวผ่านหน้า `/monsters`** ไปก่อน (การ bulk-import จาก JSON เดิมจะทำในเฟสถัดไป หรือแจ้งได้ถ้าอยากให้ทำเป็นสคริปต์ migrate ให้เลย)

## ทดสอบหลัง deploy
1. เข้า `/monsters` โดยยังไม่ login — ควรเห็นหน้าว่างๆ พร้อมข้อความแจ้งว่าต้อง login ถึงจะแก้ไขได้ (ไม่มีปุ่ม "+ เพิ่มมอนสเตอร์")
2. Login แล้วเข้า `/monsters` อีกครั้ง — ควรเห็นปุ่ม "+ เพิ่มมอนสเตอร์"
3. ลองเพิ่มมอนสเตอร์ 1 ตัว พร้อมอัปโหลดรูป — เช็คใน Supabase **Table Editor → monsters** ว่าขึ้นแถวใหม่ และ **Storage → monster-images** ว่ามีไฟล์รูปขึ้น
4. ลองตั้งค่า "แพ้ทาง" ให้มอนสเตอร์ตัวที่ 2 ชี้ไปตัวที่ 1 แล้วเช็คว่าตัวที่ 1 ขึ้น "ชนะทาง" ตัวที่ 2 ให้อัตโนมัติ (reciprocal sync)
5. Logout แล้วรีเฟรชหน้า `/monsters` — ควรยังเห็นรายการมอนสเตอร์ (read เป็น public) แต่ปุ่มแก้ไข/ลบหายไป

## ต่อไป (เฟส 3)
ย้ายโหมดฝึกดราฟ (draft board, selection panel, Counter Watch) มาดึงมอนสเตอร์จาก Supabase แทน state ในเครื่อง

---

# Phase 3 — โหมดฝึกดราฟต่อฐานมอนสเตอร์จริง (เสร็จแล้ว)

## สิ่งที่เพิ่มเข้ามา
- `components/DraftTrainer.js` — พอร์ตทั้งระบบดราฟจาก artifact เดิม: setup screen (เล่นคนเดียว/ฝึกกับบอท), ลำดับ pick 1-2-2-2-2-1, draft board, selection panel (2 แถว เลื่อนแนวนอน, แท็บ Meta/ธาตุ, filter เรียงตามธาตุ/ใช้ล่าสุด), Counter Watch (ใช้ข้อมูลแพ้ทาง/ชนะทางจริงก่อน เสริมด้วย heuristic จากแท็ก)
- `lib/matches.js` — `saveMatch()` เขียนผลดราฟลงตาราง `match_history` จริง
- หน้า `/draft` — อ่านมอนสเตอร์จาก Supabase (public read) เล่นได้แม้ไม่ login แต่ต้อง login ถึงจะกด "บันทึกผลดราฟ" ได้ (เพราะ `match_history` ผูกกับ `user_id` ตาม RLS)

## การเปลี่ยนแปลงที่ตั้งใจจากของเดิม
- **"ใช้ล่าสุด" เปลี่ยนจาก `window.storage` เป็น `localStorage` ธรรมดา** — เพราะตอนนี้เป็นเว็บไซต์จริงแล้ว ไม่ได้รันในข้อจำกัดของ Claude artifact อีกต่อไป จึงใช้ browser storage ปกติได้เลย ข้อมูลนี้เป็นแค่ preference ส่วนตัวในเครื่อง ไม่จำเป็นต้องผูกกับบัญชี/ฐานข้อมูล

## ทดสอบหลัง deploy
1. เข้า `/draft` โดยยังไม่ login — เล่นดราฟได้ปกติ แต่ตอนจบดราฟจะเห็นข้อความให้ไป login แทนปุ่มบันทึก
2. Login แล้วลองดราฟจนจบ เลือกผล แล้วกด "บันทึกผลดราฟ" — เช็คใน Supabase **Table Editor → match_history** ว่ามีแถวใหม่ขึ้น พร้อม `user_id` ตรงกับบัญชีที่ login
3. ลองตั้ง "แพ้ทาง" ให้มอนสเตอร์บางตัวไว้ที่หน้า `/monsters` ก่อน แล้วไปดราฟเลือกตัวนั้น เช็คว่า Counter Watch ขึ้นป้าย "ข้อมูลจริง" ให้ตัวที่ตั้งไว้

## ต่อไป (เฟส 4)
ย้ายหน้าประวัติการเล่น (summary, filter, list, แก้ไขผล/แท็ก/โน้ต) มาอ่าน/เขียนตาราง `match_history` จริงแทน `window.storage`


