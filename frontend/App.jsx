import { useState, useEffect } from "react";

const FONT_DISPLAY = "'Orbitron', monospace";
const FONT_MONO    = "'Share Tech Mono', monospace";
const FONT_BODY    = "'Rajdhani', 'Trebuchet MS', sans-serif";

const VERDICT_COLOR = { PHISHING: "#FF2D55", SUSPICIOUS: "#FF9F0A", SAFE: "#30D158" };
const VERDICT_DIM   = { PHISHING: "rgba(255,45,85,0.1)", SUSPICIOUS: "rgba(255,159,10,0.1)", SAFE: "rgba(48,209,88,0.08)" };
const VERDICT_GLOW  = { PHISHING: "rgba(255,45,85,0.35)", SUSPICIOUS: "rgba(255,159,10,0.3)", SAFE: "rgba(48,209,88,0.3)" };

const SIG_COLOR = {
  urgency:   ["#FF9F0A", "rgba(255,159,10,0.1)",  "rgba(255,159,10,0.4)"],
  fear:      ["#FF2D55", "rgba(255,45,85,0.1)",   "rgba(255,45,85,0.4)"],
  pressure:  ["#BF5FFF", "rgba(191,95,255,0.09)", "rgba(191,95,255,0.4)"],
  reward:    ["#30D158", "rgba(48,209,88,0.08)",  "rgba(48,209,88,0.35)"],
  authority: ["#0A84FF", "rgba(10,132,255,0.09)", "rgba(10,132,255,0.4)"],
};

const HIGHLIGHT_COLOR = {
  urgency:   ["#FF9F0A", "rgba(255,159,10,0.15)"],
  fear:      ["#FF2D55", "rgba(255,45,85,0.15)"],
  pressure:  ["#BF5FFF", "rgba(191,95,255,0.13)"],
  reward:    ["#30D158", "rgba(48,209,88,0.12)"],
  authority: ["#0A84FF", "rgba(10,132,255,0.12)"],
};

const API         = "http://127.0.0.1:8000/api/predict";
const API_HISTORY = "http://127.0.0.1:8000/api/history";

/* ── Highlight engine ─────────────────────────────── */
function highlightText(text, matched = {}) {
  const lower = text.toLowerCase();
  const used  = new Array(text.length).fill(null);
  const pairs = [];
  Object.entries(matched).forEach(([type, words]) =>
    (words || []).forEach(w => pairs.push({ word: w, type }))
  );
  pairs.sort((a, b) => b.word.length - a.word.length);
  pairs.forEach(({ word, type }) => {
    let idx = 0;
    while ((idx = lower.indexOf(word, idx)) !== -1) {
      for (let i = idx; i < idx + word.length; i++) used[i] = used[i] || type;
      idx += word.length;
    }
  });
  const parts = []; let i = 0;
  while (i < text.length) {
    const t = used[i]; let j = i;
    while (j < text.length && used[j] === t) j++;
    parts.push({ text: text.slice(i, j), type: t }); i = j;
  }
  return parts.map((p, idx) => {
    if (!p.type) return <span key={idx}>{p.text}</span>;
    const [fg, bg] = HIGHLIGHT_COLOR[p.type] || ["#aaa", "rgba(170,170,170,0.1)"];
    return (
      <mark key={idx} style={{ background: bg, color: fg, border: `1px solid ${fg}55`, borderRadius: 3, padding: "1px 3px", fontWeight: 700, fontStyle: "normal" }}>
        {p.text}
      </mark>
    );
  });
}

/* ── CSS ──────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:#030508;color:#c0d0e0;font-family:${FONT_BODY};overflow-x:hidden;min-height:100vh}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#030508}::-webkit-scrollbar-thumb{background:#1a3050;border-radius:3px}

.hex-bg{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}
.hex-bg svg{width:100%;height:100%;opacity:0.025}
.vignette{position:fixed;inset:0;pointer-events:none;z-index:1;background:radial-gradient(ellipse at center,transparent 40%,rgba(3,5,8,0.9) 100%)}
.glow-top{position:fixed;top:-300px;left:50%;transform:translateX(-50%);width:800px;height:600px;border-radius:50%;pointer-events:none;z-index:0;background:radial-gradient(ellipse,rgba(0,100,200,0.07) 0%,transparent 70%);animation:gp 8s ease-in-out infinite}
@keyframes gp{0%,100%{opacity:.5}50%{opacity:1}}
@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
@keyframes scanLine{from{top:-60px}to{top:110%}}
.fi{animation:fadeUp .4s ease both}
.fi1{animation:fadeUp .4s .07s ease both}
.fi2{animation:fadeUp .4s .14s ease both}
.fi3{animation:fadeUp .4s .21s ease both}
.fi4{animation:fadeUp .4s .28s ease both}
.cursor-blink{display:inline-block;width:2px;height:.9em;background:#0078d4;margin-left:2px;animation:blink .9s infinite;vertical-align:text-bottom}

.topbar{position:sticky;top:0;z-index:100;background:rgba(3,5,8,.95);backdrop-filter:blur(24px);border-bottom:1px solid rgba(0,100,200,.12);height:62px;padding:0 2rem;display:flex;align-items:center;justify-content:space-between}
.topbar::after{content:'';position:absolute;bottom:-1px;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(0,120,255,.4),rgba(0,200,120,.2),transparent)}
.logo-wrap{display:flex;align-items:center;gap:12px;cursor:pointer;border:none;background:none;padding:0}
.logo-icon{width:38px;height:38px;border-radius:9px;border:1px solid rgba(0,120,255,.3);background:rgba(0,100,220,.08);display:flex;align-items:center;justify-content:center;font-size:18px}
.logo-name{font-family:${FONT_DISPLAY};font-size:14px;font-weight:900;letter-spacing:.14em;color:#e8f4ff}
.logo-sub{font-family:${FONT_MONO};font-size:8px;color:#0060a0;letter-spacing:.2em;margin-top:1px}
.nav-pill{font-family:${FONT_MONO};font-size:9px;letter-spacing:.14em;padding:6px 16px;border-radius:5px;border:1px solid rgba(0,100,200,.2);background:transparent;color:#3a6080;cursor:pointer;transition:all .2s;text-transform:uppercase}
.nav-pill:hover{border-color:rgba(0,150,255,.4);color:#90c0e0;background:rgba(0,100,200,.07)}
.nav-pill.active{border-color:rgba(0,140,255,.55);color:#40a8ff;background:rgba(0,120,255,.1);box-shadow:0 0 16px rgba(0,120,255,.15)}

.container{max-width:740px;margin:0 auto;padding:2.5rem 1.5rem 6rem;position:relative;z-index:2}
.eyebrow{font-family:${FONT_MONO};font-size:9px;letter-spacing:.22em;color:#005090;text-transform:uppercase;margin-bottom:8px;display:flex;align-items:center;gap:10px}
.eyebrow::before{content:'';width:20px;height:1px;background:currentColor}
.section-title{font-family:${FONT_DISPLAY};font-size:28px;font-weight:900;letter-spacing:.06em;color:#eaf4ff;line-height:1.1}
.section-sub{font-family:${FONT_MONO};font-size:10px;color:#1a4060;margin-top:8px;letter-spacing:.04em}

.card{background:rgba(5,12,24,.9);border:1px solid rgba(0,100,180,.15);border-radius:14px;padding:1.5rem;position:relative;overflow:hidden;backdrop-filter:blur(12px);margin-bottom:14px}
.card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(0,140,255,.3),transparent)}
.card-scan{position:absolute;left:0;right:0;height:48px;pointer-events:none;background:linear-gradient(transparent,rgba(0,120,255,.02),transparent);animation:scanLine 6s linear infinite}
.card-corner{position:absolute;width:10px;height:10px}
.card-corner.tl{top:9px;left:9px;border-top:1px solid rgba(0,140,255,.35);border-left:1px solid rgba(0,140,255,.35)}
.card-corner.tr{top:9px;right:9px;border-top:1px solid rgba(0,140,255,.35);border-right:1px solid rgba(0,140,255,.35)}
.card-corner.bl{bottom:9px;left:9px;border-bottom:1px solid rgba(0,140,255,.15);border-left:1px solid rgba(0,140,255,.15)}
.card-corner.br{bottom:9px;right:9px;border-bottom:1px solid rgba(0,140,255,.15);border-right:1px solid rgba(0,140,255,.15)}
.card-label{font-family:${FONT_MONO};font-size:10px;letter-spacing:.22em;color:#2a6080;text-transform:uppercase;margin-bottom:1.1rem;display:flex;align-items:center;gap:8px}
.card-label::after{content:'';flex:1;height:1px;background:rgba(0,70,140,.25)}

.field-label{font-family:${FONT_MONO};font-size:11px;letter-spacing:.2em;color:#4a9fd4;text-transform:uppercase;margin-bottom:6px;display:block}
.field-input{width:100%;font-family:${FONT_MONO};font-size:13px;color:#c0d0e0;background:rgba(0,12,30,.7);border:1px solid rgba(0,90,160,.22);border-radius:7px;padding:10px 14px;outline:none;transition:all .2s;resize:vertical;line-height:1.5}
.field-input::placeholder{color:#2a5a70}
.field-input:focus{border-color:rgba(0,150,255,.55);background:rgba(0,20,50,.75);box-shadow:0 0 0 3px rgba(0,130,255,.07)}

.btn-primary{font-family:${FONT_DISPLAY};font-size:10px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;padding:11px 28px;border:none;border-radius:7px;cursor:pointer;background:linear-gradient(135deg,#0055b8,#0088ff);color:#fff;transition:all .22s;display:inline-flex;align-items:center;gap:8px}
.btn-primary:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 28px rgba(0,136,255,.35)}
.btn-primary:active:not(:disabled){transform:translateY(0)}
.btn-primary:disabled{opacity:.55;cursor:not-allowed}
.btn-ghost{font-family:${FONT_MONO};font-size:10px;letter-spacing:.12em;text-transform:uppercase;padding:10px 18px;border:1px solid rgba(0,90,160,.28);border-radius:7px;cursor:pointer;background:transparent;color:#2a5070;transition:all .2s;display:inline-flex;align-items:center;gap:6px}
.btn-ghost:hover{border-color:rgba(0,140,255,.45);color:#70a8d0;background:rgba(0,120,200,.05)}
.btn-danger{font-family:${FONT_MONO};font-size:9px;letter-spacing:.1em;text-transform:uppercase;padding:7px 14px;border:1px solid rgba(255,45,85,.25);border-radius:6px;cursor:pointer;background:transparent;color:#6a2030;transition:all .2s;display:inline-flex;align-items:center;gap:6px}
.btn-danger:hover{border-color:rgba(255,45,85,.5);color:#FF2D55;background:rgba(255,45,85,.06)}

.tab-bar{display:flex;gap:2px;background:rgba(0,6,16,.6);padding:4px;border-radius:8px;border:1px solid rgba(0,80,160,.12);margin-bottom:1.2rem}
.tab-btn{font-family:${FONT_MONO};font-size:8px;letter-spacing:.14em;text-transform:uppercase;padding:7px 0;border:none;border-radius:5px;cursor:pointer;flex:1;background:transparent;color:#1a4060;transition:all .2s}
.tab-btn.active{background:rgba(0,120,255,.13);color:#40a0f0;box-shadow:0 0 12px rgba(0,120,255,.1)}
.tab-btn:hover:not(.active){color:#507090;background:rgba(0,90,160,.06)}

.sig-badge{display:inline-flex;align-items:center;gap:5px;font-family:${FONT_MONO};font-size:8px;letter-spacing:.12em;text-transform:uppercase;padding:4px 10px;border-radius:4px;margin:3px;font-weight:600;border:1px solid}
.sig-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}

.bar-track{height:3px;background:rgba(255,255,255,.04);border-radius:2px;overflow:hidden;margin-top:4px}
.bar-fill{height:100%;border-radius:2px;position:relative;transition:width 1s cubic-bezier(.23,1,.32,1)}

.stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
.stat-cell{background:rgba(0,8,20,.85);border:1px solid rgba(0,80,160,.13);border-radius:9px;padding:14px;position:relative;overflow:hidden}
.stat-lbl{font-family:${FONT_MONO};font-size:10px;letter-spacing:.18em;color:#3a6080;text-transform:uppercase;margin-bottom:5px}
.stat-val{font-family:${FONT_DISPLAY};font-size:22px;font-weight:700}
/* INCREASED: stat-sub */
.stat-sub{font-family:${FONT_MONO};font-size:13px;color:#4a7a9b;margin-top:3px}

.hist-row{display:flex;align-items:center;gap:12px;padding:12px;margin-bottom:4px;border:1px solid rgba(0,60,130,.1);border-radius:9px;cursor:pointer;background:rgba(0,6,16,.5);transition:all .2s;position:relative}
.hist-row:hover{border-color:rgba(0,130,255,.22);background:rgba(0,20,50,.55)}
.hist-del{position:absolute;right:10px;top:50%;transform:translateY(-50%);width:26px;height:26px;border-radius:6px;border:1px solid rgba(255,45,85,.18);background:transparent;color:#4a1828;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:12px;transition:all .2s;opacity:0}
.hist-row:hover .hist-del{opacity:1}
.hist-del:hover{border-color:rgba(255,45,85,.45);color:#FF2D55;background:rgba(255,45,85,.06)}

.layer-row{margin-bottom:18px}
.layer-meta{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px}
.layer-name{font-family:${FONT_MONO};font-size:12px;letter-spacing:.08em;color:#4a7a9b}
.layer-score{font-family:${FONT_DISPLAY};font-size:11px;font-weight:700}

.verdict-block{display:flex;align-items:center;gap:22px}
.verdict-label{font-family:${FONT_DISPLAY};font-size:11px;font-weight:700;letter-spacing:.16em;border-radius:5px;padding:5px 14px;border:1px solid;display:inline-block}

.spinner{width:16px;height:16px;border:2px solid rgba(255,255,255,.15);border-top-color:#0088ff;border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0}
.hist-spinner{width:14px;height:14px;border:1.5px solid rgba(0,120,255,.15);border-top-color:#0088ff;border-radius:50%;animation:spin .8s linear infinite;margin:0 auto}

.err-box{font-family:${FONT_MONO};font-size:15px;color:#ff6b81;background:rgba(255,45,85,.1);border:1px solid rgba(255,45,85,.35);border-radius:7px;padding:10px 14px;margin-bottom:14px;letter-spacing:.04em}
.info-box{font-family:${FONT_MONO};font-size:14px;color:#4a9fd4;background:rgba(0,80,160,.1);border:1px solid rgba(0,100,200,.25);border-radius:7px;padding:8px 14px;margin-bottom:14px;letter-spacing:.04em}

.highlight-body{font-family:${FONT_BODY};font-size:13px;line-height:1.75;color:#8090a0;padding:4px 0}
.legend-row{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px;padding-top:14px;border-top:1px solid rgba(0,60,120,.12)}

.feature-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:16px}
.feature-cell{background:rgba(0,6,18,.6);border:1px solid rgba(0,80,160,.1);border-radius:9px;padding:13px 14px;position:relative;overflow:hidden}
.feature-cell::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(0,120,255,.18),transparent)}
.feature-name{font-family:${FONT_MONO};font-size:7px;letter-spacing:.18em;color:#0060a0;margin-bottom:5px;text-transform:uppercase}
.feature-badge{color:#003050;background:rgba(0,50,90,.4);padding:1px 6px;border-radius:3px;margin-left:5px}
/* INCREASED: feature-desc */
.feature-desc{font-size:13px;color:#4a7a9b;font-family:${FONT_MONO};line-height:1.5}

/* INCREASED: empty-state */
.empty-state{text-align:center;padding:3.5rem 0;font-family:${FONT_MONO};font-size:15px;color:#2a6080;letter-spacing:.1em}

@media(max-width:560px){
  .stat-grid{grid-template-columns:1fr 1fr}
  .feature-row{grid-template-columns:1fr}
  .verdict-block{flex-direction:column;gap:14px}
  .section-title{font-size:22px}
}
`;

/* ── Shared components ────────────────────────────── */
function HexBg() {
  return (
    <div className="hex-bg">
      <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="hp" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
            <polygon points="30,2 58,17 58,47 30,52 2,47 2,17" fill="none" stroke="#0096ff" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hp)"/>
      </svg>
    </div>
  );
}

function Card({ label, children, style, className = "" }) {
  return (
    <div className={`card ${className}`} style={style}>
      <div className="card-corner tl"/><div className="card-corner tr"/>
      <div className="card-corner bl"/><div className="card-corner br"/>
      <div className="card-scan"/>
      {label && <div className="card-label">{label}</div>}
      {children}
    </div>
  );
}

function VerdictRing({ verdict, score, size = 120 }) {
  const [anim, setAnim] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnim(score), 100); return () => clearTimeout(t); }, [score]);
  const col  = VERDICT_COLOR[verdict] || "#6a8aaa";
  const r    = size / 2 - 10;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ width: size, height: size, position: "relative", flexShrink: 0 }}>
      <svg width={size} height={size} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.04)" strokeWidth="3"/>
        <circle cx={size/2} cy={size/2} r={size/2-2} fill="none" stroke={col} strokeWidth=".5" opacity=".2"
          strokeDasharray="3 9"
          style={{ animation: "spin 28s linear infinite", transformOrigin: `${size/2}px ${size/2}px` }}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth="3"
          strokeDasharray={`${anim * circ} ${circ}`} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 7px ${col})`, transition: "stroke-dasharray 1.1s cubic-bezier(.23,1,.32,1)" }}/>
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 900, color: col, lineHeight: 1, filter: `drop-shadow(0 0 10px ${col})` }}>
          {Math.round(score * 100)}
        </span>
        <span style={{ fontFamily: FONT_MONO, fontSize: 7, letterSpacing: ".16em", color: "rgba(255,255,255,.2)", marginTop: 3 }}>SCORE</span>
      </div>
    </div>
  );
}

function VerdictBadge({ verdict }) {
  const c    = VERDICT_COLOR[verdict] || "#6a8aaa";
  const icon = verdict === "PHISHING" ? "⊘" : verdict === "SUSPICIOUS" ? "⚠" : "✓";
  return (
    <span className="verdict-label" style={{ color: c, background: VERDICT_DIM[verdict] || "transparent", borderColor: `${c}44`, filter: `drop-shadow(0 0 10px ${VERDICT_GLOW[verdict] || "transparent"})` }}>
      {icon} {verdict}
    </span>
  );
}

function SigBadge({ signal }) {
  const [c, bg, bc] = SIG_COLOR[signal] || ["#6a8aaa", "rgba(106,138,170,.08)", "rgba(106,138,170,.3)"];
  return (
    <span className="sig-badge" style={{ color: c, background: bg, borderColor: bc }}>
      <span className="sig-dot" style={{ background: c, boxShadow: `0 0 4px ${c}` }}/>{signal}
    </span>
  );
}

function ScoreBar({ label, value, color, delay = 0 }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(value * 100), 130 + delay); return () => clearTimeout(t); }, [value]);
  return (
    <div className="layer-row">
      <div className="layer-meta">
        <span className="layer-name">{label}</span>
        <span className="layer-score" style={{ color, filter: `drop-shadow(0 0 4px ${color}70)` }}>{value.toFixed(3)}</span>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${w}%`, background: `linear-gradient(90deg,${color}60,${color})` }}/>
      </div>
    </div>
  );
}

function StatCell({ label, value, sub, color, delay = 0 }) {
  return (
    <div className="stat-cell fi" style={{ animationDelay: `${delay}s` }}>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: color, opacity: .5, borderRadius: "0 0 9px 9px" }}/>
      <div className="stat-lbl">{label}</div>
      <div className="stat-val" style={{ color, filter: `drop-shadow(0 0 7px ${color}80)` }}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function FieldInput({ label, value, onChange, placeholder, rows }) {
  const Tag = rows ? "textarea" : "input";
  return (
    <div style={{ marginBottom: 14 }}>
      <label className="field-label">{label}</label>
      <Tag className="field-input" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={rows} style={rows ? { minHeight: 110 } : {}}/>
    </div>
  );
}

/* ── INPUT PAGE ───────────────────────────────────── */
function InputPage({ onResult }) {
  const [subject, setSubject] = useState("");
  const [body,    setBody]    = useState("");
  const [url,     setUrl]     = useState("");
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState(null);
  const [typed,   setTyped]   = useState("");
  const tagline = "THREAT DETECTION SYSTEM · v2.4.1 · ACTIVE";

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => { setTyped(tagline.slice(0, ++i)); if (i >= tagline.length) clearInterval(t); }, 36);
    return () => clearInterval(t);
  }, []);

  const loadDemo = () => {
    setSubject("URGENT: Your account has been suspended");
    setBody("You must act now or your account will be permanently deleted. We have detected unauthorized access from your IP address. Click immediately to verify your credentials or your account will be terminated within 24 hours. This is your FINAL NOTICE. Failure to comply will result in permanent suspension and potential fraud investigation by government authorities.");
    setUrl("http://192.168.1.1/login?verify=account&update=true&free=bonus");
    setErr(null);
  };

  const analyze = async () => {
    if (!subject.trim() && !body.trim()) return;
    setLoading(true); setErr(null);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, url }),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      onResult({ subject, body, url, result: await res.json() });
    } catch (e) {
      setErr(e.message || "Connection failed — is the backend running on port 8000?");
    }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ marginBottom: "2rem" }} className="fi">
        <div className="eyebrow">Phishunter Intelligence Platform</div>
        <div className="section-title">EMAIL<br/>ANALYZER</div>
        <div className="section-sub">{typed}{typed.length < tagline.length && <span className="cursor-blink"/>}</div>
      </div>

      <Card label="INPUT VECTOR" className="fi1">
        <FieldInput label="Subject Line" value={subject} onChange={setSubject} placeholder="Enter email subject..."/>
        <FieldInput label="Email Body"   value={body}    onChange={setBody}    placeholder="Paste full email body here..." rows={6}/>
        <FieldInput label="URL Target (optional)" value={url} onChange={setUrl} placeholder="https://example.com/..."/>
        {err && <div className="err-box">⚠ {err}</div>}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button className="btn-primary" onClick={analyze} disabled={loading || (!subject.trim() && !body.trim())}>
            {loading ? <><span className="spinner"/><span>SCANNING…</span></> : "▶  INITIATE SCAN"}
          </button>
          <button className="btn-ghost" onClick={loadDemo}>LOAD DEMO</button>
        </div>
      </Card>

      <div className="feature-row fi2">
        {[
          ["URL ANALYSIS",  "L1", "Heuristic + structural URL scan — IP detection, suspicious tokens, parameter depth"],
          ["NLP ENGINE",    "L2", "RoBERTa sequence classifier — semantic phishing intent detection"],
          ["MANIP DETECT",  "L3", "BERT + signal extraction — urgency, fear, pressure, reward pattern matching"],
        ].map(([name, badge, desc]) => (
          <div key={name} className="feature-cell">
            <div className="feature-name">{name}<span className="feature-badge">{badge}</span></div>
            <div className="feature-desc">{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── RESULT PAGE ──────────────────────────────────── */
function ResultPage({ input, onBack }) {
  const { subject, body, url, result } = input;
  const [tab,         setTab]         = useState("breakdown");
  const [editSubject, setEditSubject] = useState(subject);
  const [editBody,    setEditBody]    = useState(body);
  const [editUrl,     setEditUrl]     = useState(url);
  const [reResult,    setReResult]    = useState(null);
  const [rechecking,  setRechecking]  = useState(false);
  const [recheckErr,  setRecheckErr]  = useState(null);

  const active      = reResult || result || {};
  const verdict     = active.verdict       || "SAFE";
  const final_score = active.final_score   || 0;
  const layer1      = active.layer1        || 0;
  const layer2      = active.layer2        || 0;
  const layer3      = active.layer3        || {};
  const manip       = layer3.manipulation_score ?? 0;
  const signals     = layer3.detected_signals   ?? [];
  const matched     = layer3.matched            ?? {};
  const col         = VERDICT_COLOR[verdict]    || "#6a8aaa";

  const doRecheck = async () => {
    setRechecking(true); setRecheckErr(null);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: editSubject, body: editBody, url: editUrl }),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      setReResult(await res.json());
      setTab("breakdown");
    } catch (e) { setRecheckErr(e.message); }
    setRechecking(false);
  };

  return (
    <div>
      <div className="fi" style={{ marginBottom: "1.5rem" }}>
        <div className="eyebrow">Analysis Complete</div>
        <div className="section-title" style={{ fontSize: 24 }}>THREAT REPORT</div>
      </div>

      <Card label="VERDICT" className="fi1">
        <div className="verdict-block">
          <VerdictRing verdict={verdict} score={final_score}/>
          <div>
            <VerdictBadge verdict={verdict}/>
            <div style={{ marginTop: 12, lineHeight: 1 }}>
              {signals.length > 0
                ? signals.map(s => <SigBadge key={s} signal={s}/>)
                : <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#0a3050", letterSpacing: ".1em" }}>NO MANIPULATION SIGNALS DETECTED</span>
              }
            </div>
            <div style={{ marginTop: 14, fontFamily: FONT_MONO, fontSize: 12, color: "#4a7a9b", letterSpacing: ".08em", lineHeight: 1.7 }}>
              <span style={{ color: "#0060a0" }}>SUBJECT: </span>{subject || "(none)"}<br/>
              {url && <><span style={{ color: "#0060a0" }}>URL: </span>{url.slice(0, 58)}{url.length > 58 ? "…" : ""}</>}
            </div>
          </div>
        </div>
      </Card>

      <div className="tab-bar fi2">
        {[["breakdown","▣ Breakdown"],["highlight","◈ Highlight"],["recheck","↺ Re-check"]].map(([t, lbl]) => (
          <button key={t} className={`tab-btn ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{lbl}</button>
        ))}
      </div>

      {tab === "breakdown" && (
        <Card label="MODEL LAYERS" className="fi3">
          <ScoreBar label="Layer 1 — URL Heuristics"     value={layer1} color="#0A84FF" delay={0}/>
          <ScoreBar label="Layer 2 — NLP Classifier"     value={layer2} color="#30D158" delay={80}/>
          <ScoreBar label="Layer 3 — Manipulation Score" value={manip}  color="#FF2D55" delay={160}/>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(0,60,120,.12)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div>
              <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#4a9fd4", letterSpacing: ".1em" }}>COMPOSITE FINAL SCORE</span>
              <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#6ab0d0", marginTop: 3 }}>Weighted: 25% URL · 40% NLP · 35% Manipulation</div>
            </div>
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700, color: col, filter: `drop-shadow(0 0 8px ${col}80)` }}>
              {(final_score * 100).toFixed(1)}%
            </span>
          </div>
        </Card>
      )}

      {tab === "highlight" && (
        <Card label="EMAIL BODY — SIGNAL HIGHLIGHTS" className="fi3">
          <div className="highlight-body">
            {body ? highlightText(body, matched)
              : <span style={{ color: "#082030", fontFamily: FONT_MONO, fontSize: 10 }}>No body text provided.</span>}
          </div>
          {Object.entries(matched).some(([, w]) => w?.length > 0) && (
            <div className="legend-row">
              {Object.entries(matched).filter(([, w]) => w?.length > 0).map(([type]) => (
                <SigBadge key={type} signal={type}/>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === "recheck" && (
        <Card label="EDIT & RE-ANALYZE" className="fi3">
          <FieldInput label="Subject" value={editSubject} onChange={setEditSubject} placeholder="Subject line…"/>
          <FieldInput label="Body"    value={editBody}    onChange={setEditBody}    placeholder="Email body…" rows={5}/>
          <FieldInput label="URL"     value={editUrl}     onChange={setEditUrl}     placeholder="URL…"/>
          {recheckErr && <div className="err-box">⚠ {recheckErr}</div>}
          <button className="btn-primary" onClick={doRecheck} disabled={rechecking}>
            {rechecking ? <><span className="spinner"/><span>SCANNING…</span></> : "↺  RE-RUN ANALYSIS"}
          </button>
        </Card>
      )}

      <button className="btn-ghost fi4" onClick={onBack} style={{ marginTop: 20 }}>← Back to Analyzer</button>
    </div>
  );
}

/* ── HISTORY PAGE ─────────────────────────────────── */
function HistoryPage({ history, setHistory }) {
  const counts   = { PHISHING: 0, SUSPICIOUS: 0, SAFE: 0 };
  const sigCount = {};
  history.forEach(h => {
    counts[h.result.verdict] = (counts[h.result.verdict] || 0) + 1;
    (h.result.layer3?.detected_signals || []).forEach(s => { sigCount[s] = (sigCount[s] || 0) + 1; });
  });
  const top = Object.entries(sigCount).sort((a, b) => b[1] - a[1])[0];
  const avg = history.length
    ? (history.reduce((a, h) => a + h.result.final_score, 0) / history.length * 100).toFixed(0)
    : null;

  const deleteEntry = async (e, h, i) => {
    e.stopPropagation();
    if (h.id) {
      try {
        await fetch(`${API_HISTORY}/${h.id}`, { method: "DELETE" });
      } catch (_) {}
    }
    setHistory(prev => prev.filter((_, idx) => idx !== i));
  };

  const clearAll = async () => {
    try { await fetch(API_HISTORY, { method: "DELETE" }); } catch (_) {}
    setHistory([]);
  };

  return (
    <div>
      <div className="fi" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="eyebrow">Intelligence Log</div>
          <div className="section-title" style={{ fontSize: 24 }}>SCAN HISTORY</div>
        </div>
        {history.length > 0 && (
          <button className="btn-danger" onClick={clearAll}>✕ Clear All</button>
        )}
      </div>

      {history.length > 0 && (
        <div className="stat-grid fi1">
          <StatCell label="PHISHING"   value={counts.PHISHING}   sub="detected" color={VERDICT_COLOR.PHISHING}   delay={0}/>
          <StatCell label="SUSPICIOUS" value={counts.SUSPICIOUS} sub="flagged"  color={VERDICT_COLOR.SUSPICIOUS} delay={.07}/>
          <StatCell label="SAFE"       value={counts.SAFE}       sub="cleared"  color={VERDICT_COLOR.SAFE}        delay={.14}/>
        </div>
      )}

      <Card label="SCAN LOG" className="fi2">
        {!history.length ? (
          <div className="empty-state">NO RECORDS — INITIATE FIRST SCAN TO BEGIN LOGGING</div>
        ) : history.map((h, i) => (
          <div key={h.id || i} className="hist-row">
            <span style={{ fontFamily: FONT_MONO, fontSize: 15, color: "#2a6080", minWidth: 28 }}>#{String(i + 1).padStart(2, "0")}</span>
            <div style={{ flex: 1, overflow: "hidden", paddingRight: 32 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 16, color: "#6ab0d0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {h.subject || "(no subject)"}
              </div>
              <div style={{ marginTop: 3 }}>
                {(h.result.layer3?.detected_signals || []).map(s => <SigBadge key={s} signal={s}/>)}
              </div>
            </div>
            <VerdictBadge verdict={h.result.verdict}/>
            <button className="hist-del" onClick={e => deleteEntry(e, h, i)} title="Remove">✕</button>
          </div>
        ))}
      </Card>

      {history.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }} className="fi3">
          <StatCell label="TOP SIGNAL" value={top ? top[0].toUpperCase() : "—"} sub={top ? `${top[1]} occurrences` : ""} color={VERDICT_COLOR.SUSPICIOUS}/>
          <StatCell label="AVG THREAT" value={avg ? `${avg}%` : "—"} sub="across all scans" color={VERDICT_COLOR.PHISHING}/>
        </div>
      )}
    </div>
  );
}

/* ── APP ROOT ─────────────────────────────────────── */
export default function App() {
  const [page,         setPage]         = useState("input");
  const [current,      setCurrent]      = useState(null);
  const [history,      setHistory]      = useState([]);
  const [histLoading,  setHistLoading]  = useState(true);
  const [histErr,      setHistErr]      = useState(null);

  useEffect(() => {
    fetch(API_HISTORY)
      .then(res => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json();
      })
      .then(data => {
        const items = Array.isArray(data) ? data : (data.history ?? []);
        setHistory(items);
      })
      .catch(e => setHistErr(e.message))
      .finally(() => setHistLoading(false));
  }, []);

  const handleResult = data => {
    setCurrent(data);
    setHistory(p => [data, ...p].slice(0, 50));
    setPage("result");
  };

  return (
    <>
      <style>{CSS}</style>
      <HexBg/>
      <div className="vignette"/>
      <div className="glow-top"/>

      <div className="topbar">
        <button className="logo-wrap" onClick={() => setPage("input")}>
          <div className="logo-icon">🔍</div>
          <div>
            <div className="logo-name">PHISHUNTER</div>
            <div className="logo-sub">EMAIL THREAT INTELLIGENCE</div>
          </div>
        </button>
        <div style={{ display: "flex", gap: 6 }}>
          {[
            ["input",   "ANALYZE"],
            ["history", histLoading ? "HISTORY…" : history.length ? `HISTORY [${history.length}]` : "HISTORY"],
          ].map(([p, lbl]) => (
            <button key={p}
              className={`nav-pill ${(page === p || (page === "result" && p === "input")) ? "active" : ""}`}
              onClick={() => setPage(p)}>{lbl}
            </button>
          ))}
        </div>
      </div>

      <div className="container">
        {page === "input" && <InputPage onResult={handleResult}/>}

        {page === "result" && current && (
          <ResultPage input={current} onBack={() => setPage("input")}/>
        )}

        {page === "history" && (
          histLoading ? (
            <div style={{ textAlign: "center", paddingTop: "4rem" }}>
              <div className="hist-spinner"/>
              <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#003050", marginTop: 14, letterSpacing: ".14em" }}>LOADING HISTORY…</div>
            </div>
          ) : histErr ? (
            <div>
              <div className="eyebrow" style={{ marginTop: "2rem" }}>Intelligence Log</div>
              <div className="section-title" style={{ fontSize: 24, marginBottom: "1rem" }}>SCAN HISTORY</div>
              <div className="err-box">⚠ Could not load history from backend: {histErr}</div>
              <div className="info-box">Showing session-only history below (not persisted).</div>
              <HistoryPage history={history} setHistory={setHistory}/>
            </div>
          ) : (
            <HistoryPage history={history} setHistory={setHistory}/>
          )
        )}
      </div>
    </>
  );
}