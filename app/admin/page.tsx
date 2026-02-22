"use client";

import { useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBNYGM_VJ6ZsVzp3Btx2_Zbzn_mRtNT1UA",
  authDomain: "inside-lab-24796.firebaseapp.com",
  projectId: "inside-lab-24796",
  storageBucket: "inside-lab-24796.firebasestorage.app",
  messagingSenderId: "866869112989",
  appId: "1:866869112989:web:ca51dd8fb2f30b1e832474",
  measurementId: "G-DX77RE6R3K"
};

function getDb() {
  if (getApps().length === 0) initializeApp(firebaseConfig);
  return getFirestore(getApps()[0]);
}

const ADMIN_PASSWORD = "insidelab2024";
const MAX_SCORE = 20;
const TYPE_LABELS: Record<number, string> = {
  1: "1유형", 2: "2유형", 3: "3유형", 4: "4유형", 5: "5유형",
  6: "6유형", 7: "7유형", 8: "8유형", 9: "9유형",
};

type Result = {
  id: string;
  name: string;
  gender: string;
  age: number;
  scores: Record<number, number>;
  dominantTypes: number[];
  createdAt: any;
};

// ─── 레이더 차트 (SVG) ────────────────────────────────────────────────────────
function RadarChart({ scores, dominantTypes }: { scores: Record<number, number>; dominantTypes: number[] }) {
  const cx = 220, cy = 220, R = 160;
  const types = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const n = types.length;
  const levels = 4;

  function angle(i: number) {
    return (Math.PI * 2 * i) / n - Math.PI / 2;
  }
  function pt(i: number, r: number) {
    return { x: cx + r * Math.cos(angle(i)), y: cy + r * Math.sin(angle(i)) };
  }

  const gridRings = Array.from({ length: levels }, (_, i) => ((i + 1) / levels) * R);

  const dataPoints = types.map((t, i) => {
    const ratio = (scores?.[t] ?? 0) / MAX_SCORE;
    return pt(i, ratio * R);
  });
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ") + "Z";

  return (
    <svg viewBox="0 0 440 440" style={{ width: "100%", display: "block" }}>
      {/* 그리드 링 */}
      {gridRings.map((r, li) => {
        const pts = types.map((_, i) => pt(i, r));
        const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ") + "Z";
        return <path key={li} d={d} fill="none" stroke="#E2E2DE" strokeWidth={li === levels - 1 ? 1.5 : 1} />;
      })}
      {/* 축 */}
      {types.map((_, i) => {
        const o = pt(i, R);
        return <line key={i} x1={cx} y1={cy} x2={o.x} y2={o.y} stroke="#E2E2DE" strokeWidth="1" />;
      })}
      {/* 데이터 면 */}
      <path d={dataPath} fill="#111110" fillOpacity="0.07" stroke="#111110" strokeWidth="2" strokeLinejoin="round" />
      {/* 데이터 포인트 */}
      {dataPoints.map((p, i) => {
        const isDom = dominantTypes?.includes(types[i]);
        return <circle key={i} cx={p.x} cy={p.y} r={isDom ? 5 : 3.5} fill={isDom ? "#111110" : "#A0A09A"} />;
      })}
      {/* 눈금값 */}
      {gridRings.map((r, li) => {
        const val = Math.round(((li + 1) / levels) * MAX_SCORE);
        return <text key={li} x={cx + 4} y={cy - r + 3} fontSize={9} fill="#A0A09A" fontFamily="Pretendard, sans-serif">{val}</text>;
      })}
      {/* 레이블 */}
      {types.map((t, i) => {
        const p = pt(i, R + 28);
        const isDom = dominantTypes?.includes(t);
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
            fontSize={isDom ? 13 : 11} fontWeight={isDom ? 700 : 400}
            fill={isDom ? "#111110" : "#6B6B63"} fontFamily="Pretendard, sans-serif">
            {TYPE_LABELS[t]}
          </text>
        );
      })}
    </svg>
  );
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);
  const [allResults, setAllResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Result | null>(null);

  async function loadResults() {
    setLoading(true);
    setLoadError(null);
    try {
      const db = getDb();
      const snap = await getDocs(collection(db, "results"));
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Result))
        .sort((a, b) => (b.createdAt?.toDate?.()?.getTime() ?? 0) - (a.createdAt?.toDate?.()?.getTime() ?? 0));
      setAllResults(data);
    } catch (e: any) {
      setLoadError(e?.message ?? "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  }

  function handleUnlock() {
    if (pw === ADMIN_PASSWORD) { setUnlocked(true); setPwError(false); loadResults(); }
    else setPwError(true);
  }

  const filtered = allResults.filter((r) =>
    search.trim() === "" ? true : r.name?.includes(search.trim())
  );

  const topType = (() => {
    const cnt: Record<number, number> = {};
    allResults.forEach((r) => r.dominantTypes?.forEach((t) => { cnt[t] = (cnt[t] || 0) + 1; }));
    const top = Object.entries(cnt).sort((a, b) => Number(b[1]) - Number(a[1]))[0];
    return top ? `${top[0]}유형` : "—";
  })();

  const sorted9 = selected
    ? Array.from({ length: 9 }, (_, i) => i + 1).sort(
        (a, b) => (selected.scores?.[b] ?? 0) - (selected.scores?.[a] ?? 0)
      )
    : [];

  return (
    <>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #F5F5F3;
          --surface: #FFFFFF;
          --border: #E2E2DE;
          --border-strong: #C8C8C4;
          --tp: #111110;
          --ts: #5A5A54;
          --tm: #A0A09A;
          --soft: #EEEEED;
        }
        html, body { height: 100%; }
        body { font-family: 'Pretendard', -apple-system, sans-serif; background: var(--bg); color: var(--tp); -webkit-font-smoothing: antialiased; }

        /* ── 비밀번호 ── */
        .pw-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .pw-box { width: 100%; max-width: 380px; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 52px 44px; }
        .pw-brand { font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: var(--tm); margin-bottom: 36px; }
        .pw-title { font-size: 24px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 6px; }
        .pw-sub { font-size: 13px; color: var(--ts); margin-bottom: 32px; }
        .inp { width: 100%; padding: 14px 16px; font-family: 'Pretendard', sans-serif; font-size: 14px; color: var(--tp); background: var(--bg); border: 1.5px solid var(--border); border-radius: 4px; outline: none; margin-bottom: 10px; }
        .inp:focus { border-color: var(--tp); background: #fff; }
        .pw-error { font-size: 12px; color: #B91C1C; margin-bottom: 10px; }
        .btn { width: 100%; padding: 15px; background: var(--tp); color: #fff; border: none; border-radius: 4px; font-family: 'Pretendard', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 4px; }
        .pw-back { margin-top: 20px; font-size: 12px; color: var(--tm); text-decoration: none; text-align: center; display: block; }

        /* ── 목록 ── */
        .list-page { max-width: 900px; margin: 0 auto; padding: 0 40px 80px; }
        .list-topbar { display: flex; align-items: center; justify-content: space-between; padding: 28px 0 24px; border-bottom: 1px solid var(--border); margin-bottom: 36px; }
        .list-brand { font-size: 14px; font-weight: 700; letter-spacing: -0.01em; }
        .ghost { background: none; border: none; font-family: 'Pretendard', sans-serif; font-size: 12px; color: var(--tm); cursor: pointer; }

        .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 28px; }
        .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 22px 24px; }
        .stat-lbl { font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--tm); margin-bottom: 10px; }
        .stat-val { font-size: 30px; font-weight: 800; letter-spacing: -0.03em; line-height: 1; }
        .stat-unit { font-size: 13px; font-weight: 400; color: var(--tm); margin-left: 2px; }

        .search-inp { width: 100%; padding: 13px 16px; font-family: 'Pretendard', sans-serif; font-size: 14px; background: var(--surface); border: 1px solid var(--border); border-radius: 4px; outline: none; color: var(--tp); margin-bottom: 4px; }
        .search-inp:focus { border-color: var(--tp); }

        .tbl { width: 100%; border-collapse: collapse; margin-top: 12px; }
        .tbl thead th { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--tm); padding: 10px 14px; text-align: left; border-bottom: 1.5px solid var(--border-strong); }
        .tbl tbody tr { border-bottom: 1px solid var(--border); cursor: pointer; }
        .tbl tbody tr:hover { background: var(--soft); }
        .tbl tbody td { padding: 15px 14px; font-size: 14px; vertical-align: middle; }
        .td-name { font-weight: 600; }
        .td-sec { color: var(--ts); }
        .td-muted { color: var(--tm); font-size: 13px; }
        .badge { display: inline-flex; align-items: center; background: var(--tp); color: #fff; font-size: 11px; font-weight: 700; border-radius: 3px; padding: 3px 8px; margin-right: 4px; }
        .err-box { background: #FEF2F2; border: 1px solid #FECACA; border-radius: 6px; padding: 14px 16px; margin: 16px 0; font-size: 13px; color: #991B1B; }

        /* ── 리포트 ── */
        .report-page { max-width: 1040px; margin: 0 auto; padding: 0 48px 80px; animation: fadeUp .3s ease both; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }

        .report-nav { display: flex; align-items: center; justify-content: space-between; padding: 28px 0 36px; }
        .back-btn { display: flex; align-items: center; gap: 6px; background: none; border: none; font-family: 'Pretendard', sans-serif; font-size: 13px; color: var(--tm); cursor: pointer; padding: 0; }

        .report-header { display: grid; grid-template-columns: 1fr auto; align-items: end; gap: 24px; padding-bottom: 28px; border-bottom: 2px solid var(--tp); margin-bottom: 40px; }
        .report-name { font-size: 42px; font-weight: 800; letter-spacing: -0.04em; line-height: 1; margin-bottom: 12px; }
        .report-meta { display: flex; gap: 24px; }
        .meta-item { font-size: 13px; color: var(--ts); }
        .meta-item strong { color: var(--tp); font-weight: 600; }
        .report-brand { font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--tm); text-align: right; line-height: 2; }

        .dominant-row { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 44px; }
        .dom-chip { display: flex; flex-direction: column; gap: 5px; background: var(--tp); border-radius: 8px; padding: 22px 32px; min-width: 150px; }
        .dom-chip-label { font-size: 9px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(255,255,255,.45); }
        .dom-chip-val { font-size: 32px; font-weight: 800; color: #fff; letter-spacing: -0.03em; line-height: 1; }
        .dom-chip-soft { background: var(--soft); }
        .dom-chip-soft .dom-chip-label { color: var(--tm); }
        .dom-chip-soft .dom-chip-val { color: var(--tp); font-size: 24px; }

        .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; align-items: start; }
        .chart-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 28px 24px; }
        .chart-card-title { font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--tm); margin-bottom: 22px; }

        .bar-item { margin-bottom: 13px; }
        .bar-item:last-child { margin-bottom: 0; }
        .bar-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 5px; }
        .bar-lbl { font-size: 12px; color: var(--ts); }
        .bar-lbl.dom { font-weight: 700; color: var(--tp); }
        .bar-sc { font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--tm); }
        .bar-sc.dom { color: var(--tp); }
        .bar-track { width: 100%; height: 6px; background: var(--soft); border-radius: 3px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 3px; background: #C8C8C4; }
        .bar-fill.dom { background: var(--tp); }

        .rank-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
        .rank-card-title { font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--tm); padding: 22px 24px 0; }
        .rank-tbl { width: 100%; border-collapse: collapse; margin-top: 16px; }
        .rank-tbl thead th { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--tm); padding: 8px 24px 10px; text-align: left; border-bottom: 1px solid var(--border); }
        .rank-tbl tbody tr { border-bottom: 1px solid var(--border); }
        .rank-tbl tbody tr:last-child { border-bottom: none; }
        .rank-tbl tbody tr.dom-row { background: #FAFAF9; }
        .rank-tbl td { padding: 13px 24px; font-size: 14px; }
        .r-num { color: var(--tm); font-size: 12px; width: 36px; }
        .r-type { color: var(--ts); }
        .r-type.dom { font-weight: 700; color: var(--tp); }
        .r-score { font-weight: 700; font-variant-numeric: tabular-nums; text-align: right; }
        .r-max { color: var(--tm); font-size: 13px; font-variant-numeric: tabular-nums; }
        .r-bar { width: 140px; }
        .mini-track { width: 100%; height: 4px; background: var(--soft); border-radius: 2px; }
        .mini-fill { height: 100%; border-radius: 2px; background: #C8C8C4; }
        .mini-fill.dom { background: var(--tp); }
        .dom-tag { display: inline-flex; margin-left: 8px; font-size: 9px; font-weight: 700; background: var(--tp); color: #fff; border-radius: 2px; padding: 2px 5px; letter-spacing: 0.06em; vertical-align: middle; }

        @media print {
          .report-nav { display: none; }
          .report-page { padding: 0 20px; }
        }
      `}</style>

      {/* ── 비밀번호 ── */}
      {!unlocked ? (
        <div className="pw-wrap">
          <div className="pw-box">
            <p className="pw-brand">Inside Lab</p>
            <h1 className="pw-title">상담사 전용</h1>
            <p className="pw-sub">접근 권한이 필요합니다</p>
            <input className="inp" type="password" placeholder="비밀번호"
              value={pw}
              onChange={(e) => { setPw(e.target.value); setPwError(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            />
            {pwError && <p className="pw-error">비밀번호가 올바르지 않습니다</p>}
            <button className="btn" onClick={handleUnlock}>로그인</button>
            <a href="/" className="pw-back">돌아가기</a>
          </div>
        </div>

      /* ── 리포트 상세 ── */
      ) : selected ? (
        <div className="report-page">
          <div className="report-nav">
            <button className="back-btn" onClick={() => setSelected(null)}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              목록으로
            </button>
            <div style={{ display: "flex", gap: 16 }}>
              <button className="ghost" onClick={() => window.print()}>인쇄</button>
              <button className="ghost" onClick={() => { setUnlocked(false); setPw(""); setAllResults([]); setSelected(null); }}>로그아웃</button>
            </div>
          </div>

          {/* 헤더 */}
          <div className="report-header">
            <div>
              <div className="report-name">{selected.name}</div>
              <div className="report-meta">
                <span className="meta-item"><strong>성별</strong>&nbsp;{selected.gender}</span>
                <span className="meta-item"><strong>나이</strong>&nbsp;{selected.age}세</span>
                <span className="meta-item"><strong>검사일</strong>&nbsp;
                  {selected.createdAt?.toDate?.()
                    ? selected.createdAt.toDate().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })
                    : "—"}
                </span>
              </div>
            </div>
            <div className="report-brand">Inside Lab<br/>유형검사 결과 분석지</div>
          </div>

          {/* 차트 2개 */}
          <div className="charts-grid">
            <div className="chart-card">
              <p className="chart-card-title">유형별 점수 분포</p>
              {Array.from({ length: 9 }, (_, i) => i + 1).map((t) => {
                const score = selected.scores?.[t] ?? 0;
                const isDom = selected.dominantTypes?.includes(t);
                return (
                  <div className="bar-item" key={t}>
                    <div className="bar-top">
                      <span className={`bar-lbl${isDom ? " dom" : ""}`}>{TYPE_LABELS[t]}</span>
                      <span className={`bar-sc${isDom ? " dom" : ""}`}>{score}</span>
                    </div>
                    <div className="bar-track">
                      <div className={`bar-fill${isDom ? " dom" : ""}`} style={{ width: `${(score / MAX_SCORE) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="chart-card">
              <p className="chart-card-title">발달 분포</p>
              <RadarChart scores={selected.scores} dominantTypes={selected.dominantTypes} />
            </div>
          </div>

          {/* 순위 테이블 */}
          <div className="rank-card">
            <p className="rank-card-title">전체 결과 요약</p>
            <table className="rank-tbl">
              <thead>
                <tr>
                  <th>순위</th>
                  <th>유형</th>
                  <th style={{ textAlign: "right" }}>점수</th>
                  <th>만점</th>
                  <th className="r-bar">비율</th>
                </tr>
              </thead>
              <tbody>
                {sorted9.map((t, rank) => {
                  const score = selected.scores?.[t] ?? 0;
                  const isDom = selected.dominantTypes?.includes(t);
                  return (
                    <tr key={t} className={isDom ? "dom-row" : ""}>
                      <td className="r-num">{rank + 1}</td>
                      <td className={`r-type${isDom ? " dom" : ""}`}>
                        {TYPE_LABELS[t]}
                        {isDom && <span className="dom-tag">주 유형</span>}
                      </td>
                      <td className="r-score" style={{ color: isDom ? "var(--tp)" : "var(--tm)" }}>{score}</td>
                      <td className="r-max">{MAX_SCORE}</td>
                      <td className="r-bar">
                        <div className="mini-track">
                          <div className={`mini-fill${isDom ? " dom" : ""}`} style={{ width: `${(score / MAX_SCORE) * 100}%` }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      /* ── 목록 ── */
      ) : (
        <div className="list-page">
          <div className="list-topbar">
            <span className="list-brand">Inside Lab · 결과 조회</span>
            <div style={{ display: "flex", gap: 20 }}>
              <button className="ghost" onClick={loadResults}>새로고침</button>
              <button className="ghost" onClick={() => { setUnlocked(false); setPw(""); setAllResults([]); }}>로그아웃</button>
            </div>
          </div>

          {allResults.length > 0 && (
            <div className="stat-grid">
              <div className="stat-card">
                <p className="stat-lbl">전체 응답</p>
                <p className="stat-val">{allResults.length}<span className="stat-unit">명</span></p>
              </div>
            </div>
          )}

          <input className="search-inp" type="text" placeholder="이름으로 검색"
            value={search} onChange={(e) => setSearch(e.target.value)} />

          {loadError && <div className="err-box">오류: {loadError}</div>}

          <table className="tbl">
            <thead>
              <tr>
                <th>이름</th>
                <th>성별</th>
                <th>나이</th>
                <th>주 유형</th>
                <th>검사일</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: "60px", color: "var(--tm)", fontSize: 13 }}>불러오는 중...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: "60px", color: "var(--tm)", fontSize: 13 }}>
                  {search ? "검색 결과가 없습니다." : "아직 제출된 결과가 없습니다."}
                </td></tr>
              ) : filtered.map((r) => (
                <tr key={r.id} onClick={() => setSelected(r)}>
                  <td className="td-name">{r.name}</td>
                  <td className="td-sec">{r.gender}</td>
                  <td className="td-sec">{r.age}세</td>
                  <td>{r.dominantTypes?.map((t) => <span key={t} className="badge">{t}유형</span>)}</td>
                  <td className="td-muted">
                    {r.createdAt?.toDate?.()
                      ? r.createdAt.toDate().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}