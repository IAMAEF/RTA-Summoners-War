"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { listMonsters } from "@/lib/monsters";
import { saveMatch } from "@/lib/matches";
import { ELEMENT_COLOR, ELEMENT_TH, EmptySlot, MonsterAvatar, TAG_COLOR, TAG_TH, ghostBtn, inputStyle, primaryBtn } from "./ui";

const TABS = ["Meta", "Fire", "Water", "Wind", "Light", "Dark"];
const STEPS = [
  { team: "A", count: 1 },
  { team: "B", count: 2 },
  { team: "A", count: 2 },
  { team: "B", count: 2 },
  { team: "A", count: 2 },
  { team: "B", count: 1 },
];
const RECENT_KEY = "sw-recent-usage"; // plain localStorage — this is a real website now, not a sandboxed artifact

function loadRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveRecent(map) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(map));
  } catch {
    /* best effort */
  }
}

export default function DraftTrainer({ user }) {
  const [monsters, setMonsters] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [phase, setPhase] = useState("setup"); // setup | draft | result
  const [gameMode, setGameMode] = useState("bot");
  const [stepIdx, setStepIdx] = useState(0);
  const [pickedInStep, setPickedInStep] = useState(0);
  const [picks, setPicks] = useState({ A: [], B: [] });
  const [pickedIds, setPickedIds] = useState(new Set());
  const [activeTab, setActiveTab] = useState("Meta");
  const [sortBy, setSortBy] = useState("element");
  const [recent, setRecent] = useState({});
  const [resultChoice, setResultChoice] = useState("unset");
  const [opponentName, setOpponentName] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [saveError, setSaveError] = useState("");
  const botTimer = useRef(null);

  useEffect(() => {
    setRecent(loadRecent());
    const supabase = createClient();
    listMonsters(supabase)
      .then(setMonsters)
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoaded(true));
    return () => botTimer.current && clearTimeout(botTimer.current);
  }, []);

  const currentStep = STEPS[stepIdx];
  const currentTeam = phase === "draft" ? currentStep.team : null;
  const remainingThisStep = phase === "draft" ? currentStep.count - pickedInStep : 0;

  const resetDraft = () => {
    setPhase("setup");
    setStepIdx(0);
    setPickedInStep(0);
    setPicks({ A: [], B: [] });
    setPickedIds(new Set());
    setSavedFlash(false);
    setSaveError("");
    setResultChoice("unset");
    setOpponentName("");
  };

  const startDraft = (mode) => {
    setGameMode(mode);
    setPhase("draft");
    setStepIdx(0);
    setPickedInStep(0);
    setPicks({ A: [], B: [] });
    setPickedIds(new Set());
    setSavedFlash(false);
    setSaveError("");
    setResultChoice("unset");
    setOpponentName("");
  };

  const commitPick = useCallback((mon) => {
    setPicks((prev) => ({ ...prev, [currentStep.team]: [...prev[currentStep.team], mon] }));
    setPickedIds((prev) => new Set(prev).add(mon.id));
    setRecent((prev) => {
      const next = { ...prev, [mon.id]: Date.now() };
      saveRecent(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const advance = useCallback(() => {
    setPickedInStep((prevCount) => {
      const newCount = prevCount + 1;
      if (newCount >= currentStep.count) {
        setStepIdx((prevStep) => {
          const nextStep = prevStep + 1;
          if (nextStep >= STEPS.length) setPhase("result");
          return nextStep;
        });
        return 0;
      }
      return newCount;
    });
  }, [currentStep]);

  const pickMonster = useCallback(
    (mon) => {
      if (phase !== "draft" || pickedIds.has(mon.id)) return;
      commitPick(mon);
      advance();
    },
    [phase, pickedIds, commitPick, advance]
  );

  useEffect(() => {
    if (phase !== "draft" || gameMode !== "bot" || currentTeam !== "B") return;
    botTimer.current = setTimeout(() => {
      const pool = monsters.filter((m) => !pickedIds.has(m.id));
      const metaPool = pool.filter((m) => m.meta);
      const choice = (metaPool.length ? metaPool : pool)[Math.floor(Math.random() * (metaPool.length ? metaPool.length : pool.length))];
      if (choice) pickMonster(choice);
    }, 750);
    return () => clearTimeout(botTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, gameMode, currentTeam, stepIdx, pickedInStep, pickedIds, monsters]);

  const visibleMonsters = useMemo(() => {
    let list = monsters.filter((m) => (activeTab === "Meta" ? m.meta : m.element === activeTab));
    if (sortBy === "recent") {
      list = [...list].sort((a, b) => (recent[b.id] || 0) - (recent[a.id] || 0) || a.name.localeCompare(b.name));
    } else {
      list = [...list].sort((a, b) => a.element.localeCompare(b.element) || a.name.localeCompare(b.name));
    }
    return list;
  }, [monsters, activeTab, sortBy, recent]);

  const handleSaveResult = async () => {
    if (!user) return;
    setSaveError("");
    try {
      const supabase = createClient();
      await saveMatch(supabase, {
        userId: user.id,
        mode: gameMode,
        teamA: picks.A.map((m) => ({ monsterId: m.id, name: m.name, element: m.element })),
        teamB: picks.B.map((m) => ({ monsterId: m.id, name: m.name, element: m.element })),
        playedAs: "A",
        result: resultChoice,
        opponentName: opponentName.trim(),
      });
      setSavedFlash(true);
    } catch (err) {
      setSaveError(err.message);
    }
  };

  const botTurnActive = gameMode === "bot" && currentTeam === "B";

  if (!loaded) {
    return <div style={{ color: "var(--text-faint)", fontSize: 13, textAlign: "center", padding: 40 }}>กำลังโหลดฐานข้อมูลมอนสเตอร์…</div>;
  }
  if (loadError) {
    return <div style={{ color: "var(--danger)", fontSize: 13, textAlign: "center", padding: 40 }}>โหลดข้อมูลไม่สำเร็จ: {loadError}</div>;
  }
  if (monsters.length === 0) {
    return (
      <div style={{ color: "var(--text-faint)", fontSize: 13, textAlign: "center", padding: 40, border: "1px dashed var(--line)", borderRadius: 12 }}>
        ยังไม่มีมอนสเตอร์ในฐานข้อมูล — ไปเพิ่มที่หน้า{" "}
        <a href="/monsters" style={{ color: "var(--gold)" }}>
          จัดการมอนสเตอร์
        </a>{" "}
        ก่อนครับ
      </div>
    );
  }

  return (
    <div>
      {phase !== "setup" && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
          <button onClick={resetDraft} style={ghostBtn}>
            ↺ เริ่มดราฟใหม่
          </button>
        </div>
      )}

      {phase === "setup" && <SetupScreen onStart={startDraft} />}

      {phase !== "setup" && (
        <>
          <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 14, padding: "18px 20px", marginBottom: 18 }}>
            <StepProgress stepIdx={phase === "result" ? STEPS.length : stepIdx} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "14px 0 18px" }}>
              {phase === "draft" ? (
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    padding: "6px 16px",
                    borderRadius: 999,
                    background: "var(--gold-soft)",
                    color: "var(--gold)",
                    border: "1px solid rgba(216,179,106,0.35)",
                  }}
                >
                  {botTurnActive ? "⏳ บอทกำลังเลือก…" : `ตาทีม ${currentStep.team} • เลือกอีก ${remainingThisStep} ตัว`}
                </div>
              ) : (
                <div className="font-display" style={{ fontSize: 17, color: "var(--gold)" }}>
                  ดราฟเสร็จสมบูรณ์
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 16, alignItems: "start" }}>
              <TeamPanel label="ทีม A" picks={picks.A} active={phase === "draft" && currentStep.team === "A"} align="start" />
              <div style={{ color: "var(--text-faint)", fontFamily: "'Cinzel', serif", fontSize: 20, paddingTop: 20 }}>VS</div>
              <TeamPanel label={`ทีม B${gameMode === "bot" ? " (บอท)" : ""}`} picks={picks.B} active={phase === "draft" && currentStep.team === "B"} align="end" />
            </div>
          </div>

          {phase === "draft" && (
            <SelectionPanel
              monsters={visibleMonsters}
              pickedIds={pickedIds}
              sortBy={sortBy}
              setSortBy={setSortBy}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onPick={pickMonster}
              disabled={botTurnActive}
            />
          )}

          {(phase === "draft" || phase === "result") && (picks.A.length > 0 || picks.B.length > 0) && (
            <ThreatPanel picks={picks} pickedIds={pickedIds} monsters={monsters} />
          )}

          {phase === "result" && (
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              {!user ? (
                <div style={{ fontSize: 12.5, color: "var(--text-dim)" }}>
                  <a href="/login" style={{ color: "var(--gold)" }}>
                    เข้าสู่ระบบ
                  </a>{" "}
                  ก่อนถึงจะบันทึกผลดราฟลงประวัติได้
                </div>
              ) : (
                !savedFlash && (
                  <>
                    <div style={{ display: "flex", gap: 8 }}>
                      {[
                        { key: "win", label: "ชนะ", color: "var(--wind)" },
                        { key: "loss", label: "แพ้", color: "var(--danger)" },
                        { key: "draw", label: "เสมอ", color: "var(--text-dim)" },
                        { key: "unset", label: "ยังไม่ไปเล่น", color: "var(--text-faint)" },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => setResultChoice(opt.key)}
                          style={{
                            padding: "7px 14px",
                            borderRadius: 8,
                            border: `1px solid ${resultChoice === opt.key ? opt.color : "var(--line)"}`,
                            background: resultChoice === opt.key ? `${opt.color}22` : "transparent",
                            color: resultChoice === opt.key ? opt.color : "var(--text-dim)",
                            fontSize: 12.5,
                            cursor: "pointer",
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <input
                      value={opponentName}
                      onChange={(e) => setOpponentName(e.target.value)}
                      placeholder="ชื่อคู่แข่ง (ไม่บังคับ)"
                      style={{ ...inputStyle, width: 240, textAlign: "center" }}
                    />
                  </>
                )
              )}

              {saveError && <div style={{ fontSize: 12, color: "var(--danger)" }}>{saveError}</div>}

              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                {user && (
                  <button onClick={handleSaveResult} style={primaryBtn} disabled={savedFlash}>
                    {savedFlash ? "✓ บันทึกแล้ว" : "บันทึกผลดราฟ"}
                  </button>
                )}
                <button onClick={() => startDraft(gameMode)} style={ghostBtn}>
                  ดราฟใหม่ (โหมดเดิม)
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ---------------- Setup ---------------- */
function SetupScreen({ onStart }) {
  return (
    <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 14, padding: "40px 24px", textAlign: "center" }}>
      <div className="font-display" style={{ fontSize: 20, marginBottom: 6 }}>
        เลือกรูปแบบการฝึก
      </div>
      <div style={{ color: "var(--text-dim)", fontSize: 13, marginBottom: 26 }}>
        ลำดับดราฟ: A pick 1 → B pick 2 → A pick 2 → B pick 2 → A pick 2 → B pick 1
      </div>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
        <ModeCard title="เล่นคนเดียว" desc="สลับเลือกเองทั้งทีม A และทีม B" onClick={() => onStart("solo")} />
        <ModeCard title="ฝึกกับบอท" desc="คุณคือทีม A • บอทจะสุ่มเลือกให้ทีม B โดยเน้นตัวที่เป็น Meta" onClick={() => onStart("bot")} />
      </div>
    </div>
  );
}

function ModeCard({ title, desc, onClick }) {
  return (
    <button onClick={onClick} className="mode-card" style={{ width: 260, textAlign: "left", background: "transparent", border: "1px solid var(--line)", borderRadius: 12, padding: 20, cursor: "pointer", color: "var(--text)" }}>
      <div className="font-display" style={{ fontSize: 16, marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 12.5, color: "var(--text-dim)", lineHeight: 1.5 }}>{desc}</div>
    </button>
  );
}

/* ---------------- Progress ---------------- */
function StepProgress({ stepIdx }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {STEPS.map((s, i) => (
        <div key={i} style={{ flex: 1 }}>
          <div
            style={{
              height: 5,
              borderRadius: 3,
              background: i < stepIdx ? (s.team === "A" ? "#6FB4E8" : "#E8896F") : i === stepIdx ? "var(--gold)" : "var(--line)",
            }}
          />
          <div style={{ fontSize: 10, color: "var(--text-faint)", textAlign: "center", marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
            {s.team}×{s.count}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Team panel ---------------- */
function TeamPanel({ label, picks, active, align }) {
  return (
    <div className={active ? "sw-active-panel" : ""} style={{ background: active ? "var(--panel-alt)" : "transparent", border: `1px solid ${active ? "var(--gold)" : "transparent"}`, borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 12, color: active ? "var(--gold)" : "var(--text-dim)", marginBottom: 10, textAlign: align === "end" ? "right" : "left", fontWeight: 600 }}>{label}</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: align === "end" ? "flex-end" : "flex-start" }}>
        {Array.from({ length: 5 }).map((_, i) => (picks[i] ? <MonsterAvatar key={picks[i].id} mon={picks[i]} size={50} /> : <EmptySlot key={i} size={50} />))}
      </div>
    </div>
  );
}

/* ---------------- Selection panel ---------------- */
function SelectionPanel({ monsters, pickedIds, sortBy, setSortBy, activeTab, setActiveTab, onPick, disabled }) {
  return (
    <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 14, padding: 16, display: "grid", gridTemplateColumns: "150px minmax(0, 1fr)", gap: 16, opacity: disabled ? 0.6 : 1 }}>
      <div>
        <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 8 }}>เรียงลำดับ</div>
        <FilterBtn active={sortBy === "element"} onClick={() => setSortBy("element")} label="ตามธาตุ" />
        <FilterBtn active={sortBy === "recent"} onClick={() => setSortBy("recent")} label="ใช้ล่าสุด" />
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                border: `1px solid ${activeTab === tab ? (tab === "Meta" ? "#C9A6E8" : ELEMENT_COLOR[tab]) : "var(--line)"}`,
                background: activeTab === tab ? (tab === "Meta" ? "#C9A6E822" : `${ELEMENT_COLOR[tab]}22`) : "transparent",
                color: activeTab === tab ? "var(--text)" : "var(--text-dim)",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div
          className="sw-scroll"
          style={{
            display: "grid",
            gridTemplateRows: "repeat(2, auto)",
            gridAutoFlow: "column",
            gridAutoColumns: "56px",
            columnGap: 10,
            rowGap: 12,
            overflowX: "auto",
            paddingBottom: 8,
            minWidth: 0,
            maxWidth: "100%",
          }}
        >
          {monsters.map((m) => {
            const used = pickedIds.has(m.id);
            return (
              <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ opacity: used ? 0.35 : 1, cursor: !used && !disabled ? "pointer" : "default" }} onClick={!used && !disabled ? () => onPick(m) : undefined}>
                  <MonsterAvatar mon={m} size={44} />
                </div>
                <div style={{ fontSize: 9.5, color: used ? "var(--text-faint)" : "var(--text-dim)", width: 54, textAlign: "center", lineHeight: 1.15 }}>{m.name}</div>
              </div>
            );
          })}
          {monsters.length === 0 && <div style={{ color: "var(--text-faint)", fontSize: 12, padding: "20px 0" }}>ไม่มีมอนสเตอร์ในหมวดนี้</div>}
        </div>
      </div>
    </div>
  );
}

function FilterBtn({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        padding: "8px 10px",
        borderRadius: 8,
        border: `1px solid ${active ? "var(--gold)" : "transparent"}`,
        background: active ? "var(--gold-soft)" : "transparent",
        color: active ? "var(--gold)" : "var(--text-dim)",
        fontSize: 12.5,
        marginBottom: 6,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

/* ---------------- Threat / counter panel ---------------- */
function analyzeWeakness(teamPicks) {
  const tagCount = { Strip: 0, Damage: 0, Support: 0, CC: 0 };
  teamPicks.forEach((m) => (m.tags || []).forEach((t) => tagCount[t]++));
  const weak = new Set();
  if (tagCount.Support >= 2) weak.add("Strip");
  if (tagCount.Support === 0 && teamPicks.length > 0) weak.add("Damage");
  if (tagCount.CC === 0 && teamPicks.length > 0) weak.add("CC");
  if (tagCount.Damage >= 3) weak.add("CC");
  return Array.from(weak);
}

function CounterList({ label, teamPicks, pool, align }) {
  const explicitIds = new Set();
  teamPicks.forEach((m) => (m.weakAgainst || []).forEach((id) => explicitIds.add(id)));
  const explicit = pool.filter((m) => explicitIds.has(m.id));

  const weakTags = analyzeWeakness(teamPicks);
  const heuristic = pool.filter((m) => !explicitIds.has(m.id) && (m.tags || []).some((t) => weakTags.includes(t))).sort((a, b) => (b.meta === true) - (a.meta === true));

  const suggestions = [...explicit.map((m) => ({ ...m, _explicit: true })), ...heuristic.map((m) => ({ ...m, _explicit: false }))].slice(0, 6);

  return (
    <div>
      <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 8, fontWeight: 600, textAlign: align === "end" ? "right" : "left" }}>{label}</div>
      {teamPicks.length === 0 ? (
        <div style={{ fontSize: 11.5, color: "var(--text-faint)", textAlign: align === "end" ? "right" : "left" }}>ยังไม่มีตัวให้วิเคราะห์</div>
      ) : suggestions.length === 0 ? (
        <div style={{ fontSize: 11.5, color: "var(--text-faint)", textAlign: align === "end" ? "right" : "left" }}>ทีมนี้ยังไม่มีจุดอ่อนชัดเจน</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: align === "end" ? "flex-end" : "flex-start" }}>
          {suggestions.map((m) => (
            <div key={m.id} style={{ display: "flex", gap: 6, alignItems: "center", flexDirection: align === "end" ? "row-reverse" : "row" }}>
              <span style={{ fontSize: 12.5, color: "var(--text)" }}>{m.name}</span>
              <span style={{ fontSize: 9.5, color: "var(--text-faint)" }}>({ELEMENT_TH[m.element]})</span>
              {m._explicit ? (
                <span style={{ fontSize: 9, padding: "1.5px 6px", borderRadius: 999, background: "var(--gold-soft)", border: "1px solid rgba(216,179,106,0.4)", color: "var(--gold)" }}>ข้อมูลจริง</span>
              ) : (
                (m.tags || []).map((t) => (
                  <span key={t} style={{ fontSize: 9, padding: "1.5px 6px", borderRadius: 999, background: `${TAG_COLOR[t]}22`, border: `1px solid ${TAG_COLOR[t]}66`, color: TAG_COLOR[t] }}>
                    {TAG_TH[t]}
                  </span>
                ))
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ThreatPanel({ picks, pickedIds, monsters }) {
  const pool = useMemo(() => monsters.filter((m) => !pickedIds.has(m.id)), [monsters, pickedIds]);
  return (
    <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 14, padding: 16, marginTop: 14 }}>
      <div className="font-display" style={{ fontSize: 14, color: "var(--gold)", marginBottom: 4 }}>
        มอนสเตอร์ที่แพ้ทาง (Counter Watch)
      </div>
      <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 14 }}>
        ใช้ข้อมูล &quot;แพ้ทาง/ชนะทาง&quot; ที่ตั้งไว้ในฐานข้อมูลมอนสเตอร์ก่อน (ป้าย <b style={{ color: "var(--gold)" }}>ข้อมูลจริง</b>) แล้วเสริมด้วยการเดาจากแท็กถ้ายังมีที่ว่างเหลือ
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 16 }}>
        <CounterList label="ตัวที่แพ้ทางทีม A" teamPicks={picks.A} pool={pool} align="start" />
        <div style={{ width: 1, background: "var(--line)" }} />
        <CounterList label="ตัวที่แพ้ทางทีม B" teamPicks={picks.B} pool={pool} align="end" />
      </div>
    </div>
  );
}
