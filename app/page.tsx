"use client";

import { useState } from "react";
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, collection, addDoc, Timestamp, Firestore } from "firebase/firestore";

// ─── Firebase Config ───────────────────────────────────────────────────────────
// TODO: Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBNYGM_VJ6ZsVzp3Btx2_Zbzn_mRtNT1UA",
  authDomain: "inside-lab-24796.firebaseapp.com",
  projectId: "inside-lab-24796",
  storageBucket: "inside-lab-24796.firebasestorage.app",
  messagingSenderId: "866869112989",
  appId: "1:866869112989:web:ca51dd8fb2f30b1e832474",
  measurementId: "G-DX77RE6R3K"
};

let app: FirebaseApp;
let db: Firestore;

function getFirebaseDb() {
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
  }
  return db;
}

// ─── Questions (임시 질문, 추후 교체 예정) ─────────────────────────────────────
// 각 유형당 4문항, 총 36문항
// type: 1~9 (유형 번호)
const QUESTIONS: { id: number; type: number; text: string }[] = [
  // 유형 1
  { id: 1, type: 1, text: "나는 옳고 그름에 대한 명확한 기준이 있다." },
  { id: 2, type: 1, text: "실수를 하면 오랫동안 자책하는 편이다." },
  { id: 3, type: 1, text: "일을 할 때 더 나은 방법이 있다고 자주 생각한다." },
  { id: 4, type: 1, text: "규칙과 원칙을 지키는 것이 중요하다고 생각한다." },
  // 유형 2
  { id: 5, type: 2, text: "다른 사람의 필요를 먼저 챙기는 편이다." },
  { id: 6, type: 2, text: "도움을 받는 것보다 주는 것이 더 편하다." },
  { id: 7, type: 2, text: "사람들이 나를 따뜻하고 친절하다고 표현한다." },
  { id: 8, type: 2, text: "관계에서 인정받고 싶은 마음이 크다." },
  // 유형 3
  { id: 9, type: 3, text: "목표를 세우고 달성하는 것에서 큰 보람을 느낀다." },
  { id: 10, type: 3, text: "성공적인 이미지를 유지하는 것이 중요하다." },
  { id: 11, type: 3, text: "효율적으로 일하는 것을 중요하게 여긴다." },
  { id: 12, type: 3, text: "다른 사람들의 평가가 신경 쓰인다." },
  // 유형 4
  { id: 13, type: 4, text: "나는 감정이 풍부하고 깊이 느끼는 편이다." },
  { id: 14, type: 4, text: "나만의 독특한 정체성을 찾고 싶다." },
  { id: 15, type: 4, text: "평범한 것보다 특별하고 의미 있는 것에 끌린다." },
  { id: 16, type: 4, text: "결핍감이나 그리움을 자주 느끼는 편이다." },
  // 유형 5
  { id: 17, type: 5, text: "혼자만의 시간이 많이 필요하다." },
  { id: 18, type: 5, text: "무언가를 깊이 탐구하고 분석하는 것을 좋아한다." },
  { id: 19, type: 5, text: "감정보다 논리와 데이터를 신뢰하는 편이다." },
  { id: 20, type: 5, text: "에너지와 자원을 아끼고 보존하려는 경향이 있다." },
  // 유형 6
  { id: 21, type: 6, text: "불확실한 상황에서 최악의 경우를 대비하는 편이다." },
  { id: 22, type: 6, text: "신뢰할 수 있는 사람이나 시스템이 필요하다." },
  { id: 23, type: 6, text: "결정을 내리기 전에 많은 것을 확인하고 검토한다." },
  { id: 24, type: 6, text: "책임감이 강하고 의무를 다하려고 노력한다." },
  // 유형 7
  { id: 25, type: 7, text: "새로운 경험과 가능성에 쉽게 흥미를 느낀다." },
  { id: 26, type: 7, text: "고통스러운 감정보다 즐거운 것에 집중하려 한다." },
  { id: 27, type: 7, text: "계획이 많고 아이디어가 넘치는 편이다." },
  { id: 28, type: 7, text: "한 곳에 오래 머무르는 것이 답답하게 느껴질 때가 있다." },
  // 유형 8
  { id: 29, type: 8, text: "불의나 부당함에 맞서는 것을 두려워하지 않는다." },
  { id: 30, type: 8, text: "내 의견을 명확하게 표현하는 편이다." },
  { id: 31, type: 8, text: "통제력을 잃는 것이 불편하다." },
  { id: 32, type: 8, text: "강한 사람에 대한 존중심이 있다." },
  // 유형 9
  { id: 33, type: 9, text: "갈등 상황을 피하거나 중재하려는 편이다." },
  { id: 34, type: 9, text: "다른 사람의 의견에 쉽게 동조하는 편이다." },
  { id: 35, type: 9, text: "평화롭고 안정적인 환경을 선호한다." },
  { id: 36, type: 9, text: "내 욕구보다 다른 사람의 욕구를 우선시할 때가 많다." },
];

const SCALE_LABELS: { [key: number]: string } = {
  1: "전혀 아니다",
  2: "아니다",
  3: "보통",
  4: "그렇다",
  5: "매우 그렇다",
};

type Screen = "intro" | "questions" | "result" | "submit-form" | "submitted";

export default function Page() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [answers, setAnswers] = useState<{ [id: number]: number }>({});
  const [scores, setScores] = useState<{ [type: number]: number }>({});
  const [formData, setFormData] = useState({ name: "", gender: "", age: "" });
  const [visible, setVisible] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = QUESTIONS.length;
  const allAnswered = answeredCount === totalQuestions;

  function transition(to: Screen) {
    setVisible(false);
    setTimeout(() => {
      setScreen(to);
      setVisible(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 350);
  }

  function handleAnswer(id: number, value: number) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function calculateScores() {
    const s: { [type: number]: number } = {};
    for (let t = 1; t <= 9; t++) s[t] = 0;
    QUESTIONS.forEach((q) => {
      if (answers[q.id]) s[q.type] += answers[q.id];
    });
    return s;
  }

  function handleShowResult() {
    const s = calculateScores();
    setScores(s);
    transition("result");
  }

  function getDominantTypes(s: { [type: number]: number }) {
    const max = Math.max(...Object.values(s));
    return Object.entries(s)
      .filter(([, v]) => v === max)
      .map(([k]) => Number(k));
  }

  async function handleSubmit() {
    if (!formData.name || !formData.gender || !formData.age) return;
    setIsSubmitting(true);
    try {
      const db = getFirebaseDb();
      await addDoc(collection(db, "results"), {
        name: formData.name,
        gender: formData.gender,
        age: Number(formData.age),
        scores,
        dominantTypes: getDominantTypes(scores),
        createdAt: Timestamp.now(),
      });
      transition("submitted");
    } catch (e) {
      alert("제출 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const progressPct = Math.round((answeredCount / totalQuestions) * 100);

  return (
    <>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #F7F7F5;
          --surface: #FFFFFF;
          --border: #E4E4E0;
          --text-primary: #111110;
          --text-secondary: #6B6B63;
          --text-muted: #A8A8A0;
          --accent: #1C1C1A;
          --accent-light: #E8E8E4;
          --selected-bg: #111110;
          --selected-text: #FFFFFF;
          --bar-fill: #111110;
          --bar-dominant: #4A4A46;
        }

        html { font-size: 16px; }

        body {
          font-family: 'Pretendard', -apple-system, sans-serif;
          background: var(--bg);
          color: var(--text-primary);
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }

        .page-wrapper {
          max-width: 640px;
          margin: 0 auto;
          min-height: 100vh;
          padding: 0 20px;
        }

        .fade-enter {
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.35s ease, transform 0.35s ease;
        }
        .fade-visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* ── INTRO ── */
        .intro-wrapper {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          min-height: 100vh;
          padding: 60px 0;
        }

        .intro-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 48px;
        }

        .intro-title {
          font-size: clamp(36px, 9vw, 52px);
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.03em;
          color: var(--text-primary);
          margin-bottom: 20px;
        }

        .intro-subtitle {
          font-size: 15px;
          line-height: 1.7;
          color: var(--text-secondary);
          margin-bottom: 56px;
          max-width: 360px;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: var(--text-primary);
          color: #FFFFFF;
          border: none;
          border-radius: 4px;
          padding: 16px 32px;
          font-family: 'Pretendard', sans-serif;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .btn-primary:active { opacity: 0.8; }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          background: transparent;
          color: var(--text-primary);
          border: 1.5px solid var(--border);
          border-radius: 4px;
          padding: 14px 28px;
          font-family: 'Pretendard', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: border-color 0.15s;
        }
        .btn-secondary:active { border-color: var(--text-primary); }

        .divider {
          width: 40px;
          height: 1.5px;
          background: var(--border);
          margin: 48px 0;
        }

        .intro-meta {
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.8;
        }

        /* ── PROGRESS BAR ── */
        .progress-bar-wrap {
          position: sticky;
          top: 0;
          z-index: 10;
          background: var(--bg);
          padding: 16px 0 12px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 32px;
        }
        .progress-bar-track {
          width: 100%;
          height: 2px;
          background: var(--border);
          border-radius: 2px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          background: var(--text-primary);
          border-radius: 2px;
          transition: width 0.3s ease;
        }
        .progress-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .progress-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .progress-count {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-muted);
          font-variant-numeric: tabular-nums;
        }

        /* ── QUESTIONS ── */
        .questions-wrapper {
          padding-top: 0;
          padding-bottom: 80px;
        }

        .question-block {
          padding: 28px 0;
          border-bottom: 1px solid var(--border);
        }
        .question-block:last-of-type { border-bottom: none; }

        .question-number {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 10px;
        }

        .question-text {
          font-size: 15px;
          font-weight: 500;
          line-height: 1.6;
          color: var(--text-primary);
          margin-bottom: 20px;
        }

        .scale-row {
          display: flex;
          gap: 8px;
        }

        .scale-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 10px 4px;
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: 4px;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s, color 0.15s;
          font-family: 'Pretendard', sans-serif;
        }
        .scale-btn:active { opacity: 0.7; }

        .scale-btn.selected {
          background: var(--selected-bg);
          border-color: var(--selected-bg);
          color: var(--selected-text);
        }

        .scale-num {
          font-size: 16px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: inherit;
        }
        .scale-btn:not(.selected) .scale-num { color: var(--text-primary); }

        .scale-word {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.04em;
          color: var(--text-muted);
          text-align: center;
          line-height: 1.3;
        }
        .scale-btn.selected .scale-word { color: rgba(255,255,255,0.6); }

        .cta-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: var(--bg);
          border-top: 1px solid var(--border);
          padding: 16px 20px;
          display: flex;
          justify-content: center;
          z-index: 20;
        }
        .cta-bar-inner {
          width: 100%;
          max-width: 600px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .cta-remaining {
          font-size: 12px;
          color: var(--text-muted);
        }

        /* ── RESULT ── */
        .result-wrapper {
          padding: 60px 0 80px;
        }

        .result-header-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 16px;
        }

        .result-headline {
          font-size: clamp(28px, 7vw, 40px);
          font-weight: 700;
          letter-spacing: -0.03em;
          line-height: 1.15;
          margin-bottom: 8px;
        }

        .result-dominant-label {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 48px;
        }

        .chart-section {}
        .chart-title {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 20px;
        }

        .chart-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        .chart-label {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-secondary);
          width: 28px;
          text-align: right;
          flex-shrink: 0;
        }
        .chart-bar-track {
          flex: 1;
          height: 6px;
          background: var(--accent-light);
          border-radius: 3px;
          overflow: hidden;
        }
        .chart-bar-fill {
          height: 100%;
          border-radius: 3px;
          background: var(--bar-fill);
          transition: width 0.6s cubic-bezier(0.16,1,0.3,1);
        }
        .chart-bar-fill.dominant {
          background: var(--bar-dominant);
        }
        .chart-score {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          width: 24px;
          text-align: right;
          flex-variant-numeric: tabular-nums;
          flex-shrink: 0;
        }

        .section-divider {
          height: 1px;
          background: var(--border);
          margin: 40px 0;
        }

        /* ── FORM ── */
        .form-wrapper {
          padding: 60px 0 40px;
        }
        .form-title {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-bottom: 8px;
        }
        .form-subtitle {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 40px;
          line-height: 1.6;
        }

        .form-group {
          margin-bottom: 24px;
        }
        .form-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 8px;
        }
        .form-input {
          width: 100%;
          padding: 14px 16px;
          font-family: 'Pretendard', sans-serif;
          font-size: 15px;
          color: var(--text-primary);
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: 4px;
          outline: none;
          transition: border-color 0.15s;
          appearance: none;
        }
        .form-input:focus { border-color: var(--text-primary); }

        .gender-row {
          display: flex;
          gap: 10px;
        }
        .gender-btn {
          flex: 1;
          padding: 14px;
          font-family: 'Pretendard', sans-serif;
          font-size: 14px;
          font-weight: 500;
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: 4px;
          cursor: pointer;
          color: var(--text-secondary);
          transition: all 0.15s;
        }
        .gender-btn.selected {
          background: var(--text-primary);
          border-color: var(--text-primary);
          color: #fff;
          font-weight: 600;
        }

        /* ── SUBMITTED ── */
        .submitted-wrapper {
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: 100vh;
          padding: 60px 0;
        }
        .submitted-check {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--text-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 32px;
        }
        .submitted-title {
          font-size: 26px;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-bottom: 12px;
        }
        .submitted-sub {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.7;
        }

        /* ── ADMIN ── */
        .admin-wrapper {
          padding: 60px 0 80px;
        }
        .admin-title {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-bottom: 32px;
        }
        .admin-search-row {
          display: flex;
          gap: 10px;
          margin-bottom: 32px;
        }
        .admin-result-item {
          padding: 16px 0;
          border-bottom: 1px solid var(--border);
          cursor: pointer;
        }
        .admin-result-name {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .admin-result-meta {
          font-size: 12px;
          color: var(--text-muted);
        }
        .admin-detail {
          margin-top: 32px;
          padding: 24px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
        }
        .admin-detail-name {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .admin-detail-meta {
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 24px;
        }
        .admin-password-wrap {
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: 60vh;
          gap: 16px;
        }
        .admin-password-title {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        /* ── ADMIN LINK ── */
        .admin-link-wrap {
          text-align: center;
          padding: 40px 0 20px;
        }
        .admin-link {
          font-size: 11px;
          color: var(--text-muted);
          text-decoration: none;
          letter-spacing: 0.1em;
          cursor: pointer;
          background: none;
          border: none;
          font-family: 'Pretendard', sans-serif;
        }

        @media (max-width: 400px) {
          .scale-word { display: none; }
          .scale-btn { padding: 10px 2px; }
        }
      `}</style>

      <div
        className={`fade-enter ${visible ? "fade-visible" : ""}`}
        style={{ transition: "opacity 0.35s ease, transform 0.35s ease" }}
      >
        {/* ── INTRO ──────────────────────────────────────────── */}
        {screen === "intro" && (
          <div className="page-wrapper">
            <div className="intro-wrapper">
              <p className="intro-label">Inside Lab</p>
              <h1 className="intro-title">
                나를 이해하는<br />첫 번째 질문
              </h1>
              <p className="intro-subtitle">
                36개의 문항에 솔직하게 답해주세요.<br />
                당신의 내면 패턴을 분석해 드립니다.
              </p>
              <button className="btn-primary" onClick={() => transition("questions")}>
                시작하기
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div className="divider" />
              <p className="intro-meta">
                소요 시간 약 5분 · 총 36문항<br />
                결과는 제출 후 플래너와 공유됩니다
              </p>
            </div>
            <div className="admin-link-wrap">
              <a className="admin-link" href="/admin">플래너 전용</a>
            </div>
          </div>
        )}

        {/* ── QUESTIONS ──────────────────────────────────────── */}
        {screen === "questions" && (
          <>
            <div className="page-wrapper">
              <div className="progress-bar-wrap">
                <div className="progress-info">
                  <span className="progress-label">진행도</span>
                  <span className="progress-count">{answeredCount} / {totalQuestions}</span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
                </div>
              </div>

              <div className="questions-wrapper">
                {QUESTIONS.map((q, idx) => (
                  <div className="question-block" key={q.id}>
                    <p className="question-number">Q{idx + 1}</p>
                    <p className="question-text">{q.text}</p>
                    <div className="scale-row">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <button
                          key={v}
                          className={`scale-btn${answers[q.id] === v ? " selected" : ""}`}
                          onClick={() => handleAnswer(q.id, v)}
                        >
                          <span className="scale-num">{v}</span>
                          <span className="scale-word">{SCALE_LABELS[v]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="cta-bar">
              <div className="cta-bar-inner">
                <span className="cta-remaining">
                  {allAnswered ? "모든 문항 완료" : `${totalQuestions - answeredCount}개 남음`}
                </span>
                <button
                  className="btn-primary"
                  disabled={!allAnswered}
                  onClick={handleShowResult}
                >
                  결과 보기
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── RESULT ─────────────────────────────────────────── */}
        {screen === "result" && (() => {
          const dominant = getDominantTypes(scores);
          const maxScore = Math.max(...Object.values(scores));
          const domLabel = dominant.map(t => `유형 ${t}`).join(", ");
          return (
            <div className="page-wrapper">
              <div className="result-wrapper">
                <p className="result-header-label">Inside Lab · 분석 결과</p>
                <h2 className="result-headline">
                  {dominant.length === 1 ? `유형 ${dominant[0]}` : domLabel}
                </h2>
                <p className="result-dominant-label">
                  {dominant.length > 1 ? "공동 주 유형" : "주 유형"}
                </p>

                <div className="chart-section">
                  <p className="chart-title">유형별 점수</p>
                  {Array.from({ length: 9 }, (_, i) => i + 1).map((t) => {
                    const score = scores[t] ?? 0;
                    const isDom = dominant.includes(t);
                    return (
                      <div className="chart-row" key={t}>
                        <span className="chart-label" style={isDom ? { color: "var(--text-primary)", fontWeight: 800 } : {}}>
                          {t}
                        </span>
                        <div className="chart-bar-track">
                          <div
                            className={`chart-bar-fill${isDom ? " dominant" : ""}`}
                            style={{ width: `${(score / 20) * 100}%` }}
                          />
                        </div>
                        <span className="chart-score" style={isDom ? { color: "var(--text-primary)", fontWeight: 700 } : {}}>
                          {score}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="section-divider" />

                <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={() => transition("submit-form")}>
                  결과 제출하기
                </button>
              </div>
            </div>
          );
        })()}

        {/* ── SUBMIT FORM ────────────────────────────────────── */}
        {screen === "submit-form" && (
          <div className="page-wrapper">
            <div className="form-wrapper">
              <h2 className="form-title">기본 정보 입력</h2>
              <p className="form-subtitle">결과를 저장하기 위한 정보를 입력해주세요.</p>

              <div className="form-group">
                <label className="form-label">이름</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="이름을 입력해주세요"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">성별</label>
                <div className="gender-row">
                  {["남성", "여성", "기타"].map((g) => (
                    <button
                      key={g}
                      className={`gender-btn${formData.gender === g ? " selected" : ""}`}
                      onClick={() => setFormData((p) => ({ ...p, gender: g }))}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">나이</label>
                <input
                  className="form-input"
                  type="number"
                  placeholder="나이를 입력해주세요"
                  min={1}
                  max={120}
                  value={formData.age}
                  onChange={(e) => setFormData((p) => ({ ...p, age: e.target.value }))}
                />
              </div>

              <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 12 }}>
                <button
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center" }}
                  disabled={!formData.name || !formData.gender || !formData.age || isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? "제출 중..." : "제출하기"}
                </button>
                <button className="btn-secondary" style={{ justifyContent: "center" }} onClick={() => transition("result")}>
                  돌아가기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── SUBMITTED ──────────────────────────────────────── */}
        {screen === "submitted" && (
          <div className="page-wrapper">
            <div className="submitted-wrapper">
              <div className="submitted-check">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M5 11.5l4 4 8-8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="submitted-title">제출이 완료되었습니다</h2>
              <p className="submitted-sub">
                결과가 안전하게 저장되었습니다.<br />
                상담사가 결과를 확인할 예정입니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}