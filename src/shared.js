// ============================================================================
//  shared.js — जो चीज़ें हर file में दोहराई जा रही थीं, अब एक ही जगह
//  ---------------------------------------------------------------------------
//  पहले `vib`, `api`, `media`, Title, Empty, Pill — ये सब App.jsx, Queue.jsx और
//  बाक़ी हर component में अलग-अलग लिखे थे। एक जगह बदलो तो बाक़ी जगह पुराना ही
//  रह जाता था। अब एक ही जगह है।
// ============================================================================

import React from "react";

export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// relative path (/generated/..) → पूरा backend URL
export const media = (u) => (u && u.startsWith("/") ? API_BASE + u : u);

// हल्का सा कम्पन — दबाने का एहसास हो
export const vib = (ms = 30) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };

// ── token ────────────────────────────────────────────────────────────────
let TOKEN = "";
try { TOKEN = localStorage.getItem("asv_token") || ""; } catch (_) {}
export const getToken = () => TOKEN;
export function setToken(t) {
  TOKEN = t || "";
  try { t ? localStorage.setItem("asv_token", t) : localStorage.removeItem("asv_token"); } catch (_) {}
}

export async function api(p, opts = {}) {
  const res = await fetch(API_BASE + p, {
    headers: { "Content-Type": "application/json", ...(TOKEN ? { Authorization: "Bearer " + TOKEN } : {}) },
    ...opts,
  });
  if (res.status === 401) {
    const msg = (await res.json().catch(() => ({}))).error;
    if (p === "/api/auth/login") throw new Error(msg || "ग़लत email/password");
    setToken(""); throw new Error("session ख़त्म — दुबारा login करें");
  }
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
  return res.json();
}

// file upload के लिए (Content-Type अपने आप बनने दें)
export async function upload(p, formData) {
  const res = await fetch(API_BASE + p, {
    method: "POST", headers: { Authorization: "Bearer " + TOKEN }, body: formData,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "upload नहीं हुआ");
  return res.json();
}

export const ADMIN = ["super-admin", "admin"];
export const CAN_APPROVE = ["super-admin", "admin", "manager"];

// ── छोटे UI टुकड़े ────────────────────────────────────────────────────────

export const Title = ({ children, right }) => (
  <div className="flex items-center gap-2 mb-3">
    <h2 className="text-sm font-semibold text-neutral-300">{children}</h2>
    <div className="h-px flex-1 bg-neutral-800" />
    {right}
  </div>
);

export const Empty = ({ icon = "—", children, action }) => (
  <div className="rounded-2xl border border-dashed border-neutral-800 px-4 py-8 text-center">
    <div className="text-2xl mb-2 opacity-40">{icon}</div>
    <p className="text-sm text-neutral-500">{children}</p>
    {action}
  </div>
);

export const Pill = ({ on, color, children, onClick }) => (
  <button onClick={onClick}
    style={{ borderColor: on ? color : "#3a3a3a", background: on ? color : "transparent", color: on ? "#fff" : "#9a9a9a" }}
    className="px-3 py-1.5 rounded-full text-sm font-medium border">{children}</button>
);

export const Stat = ({ label, v, c, hint }) => (
  <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-3">
    <div className="text-2xl font-bold" style={{ color: c }}>{v ?? 0}</div>
    <div className="text-xs text-neutral-400">{label}</div>
    {hint && <div className="text-[10px] text-neutral-600 mt-0.5">{hint}</div>}
  </div>
);

export const Err = ({ children, onClose }) =>
  !children ? null : (
    <div className="mb-3 text-sm bg-red-950/60 border border-red-800 text-red-200 rounded-lg px-3 py-2 flex justify-between gap-2">
      <span className="flex-1">{children}</span>
      {onClose && <button onClick={onClose} className="text-red-400">×</button>}
    </div>
  );

// खुलने-बन्द होने वाला खाना — Settings जैसे लम्बे पन्नों के लिए
export function Fold({ icon, title, sub, children, defaultOpen = false }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden">
      <button onClick={() => { vib(15); setOpen(!open); }}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
        <span className="text-lg">{icon}</span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-medium text-neutral-200">{title}</span>
          {sub && <span className="block text-[11px] text-neutral-500 truncate">{sub}</span>}
        </span>
        <span className="text-neutral-600 text-sm">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="px-4 pb-4 pt-1 border-t border-neutral-800">{children}</div>}
    </div>
  );
}

// भेजी जा चुकी post की एक पंक्ति
export const SentRow = ({ s, kind, onResend, onDel, busy, onShare }) => {
  const img = s.imgUrl || s.images?.square;
  const full = media(img);
  return (
    <div className="rounded-2xl bg-neutral-900/70 border border-neutral-800 overflow-hidden">
      {s.video
        ? <video src={media(s.video)} controls className="w-full max-h-60 bg-black" />
        : full && (
          <div className="relative">
            <img src={full} alt="" className="w-full max-h-60 object-cover" />
            <span className={`absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.status === "sent" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
              {s.status === "sent" ? "भेजा ✓" : "नहीं गई"}
            </span>
          </div>
        )}
      <div className="px-3 pt-2 pb-1">
        <p className="text-sm text-neutral-200 line-clamp-2">{s.text}</p>
        <div className="text-[11px] text-neutral-500 mt-0.5">
          {s.sentAt ? new Date(s.sentAt).toLocaleString("hi-IN") : ""}
          {s.channels?.length ? " · " + s.channels.join(", ") : ""}
        </div>
      </div>
      <div className="grid grid-cols-3 border-t border-neutral-800 divide-x divide-neutral-800">
        <button onClick={() => onShare && onShare(s)}
          className="py-2 text-[11px] text-neutral-300 active:bg-neutral-800">📤 भेजें</button>
        <button disabled={busy} onClick={() => { vib(); onResend(kind, s._id); }}
          className="py-2 text-[11px] font-semibold text-yellow-400 active:bg-neutral-800 disabled:opacity-40">🔄 दोबारा</button>
        <button disabled={busy} onClick={() => { vib([20, 30, 20]); onDel(kind, s._id); }}
          className="py-2 text-[11px] text-red-400 active:bg-red-900/30 disabled:opacity-40">🗑 हटाएँ</button>
      </div>
    </div>
  );
};

// phone का अपना share menu — WhatsApp / Instagram / Facebook
export async function nativeShare(item, brandName = "") {
  const imgUrl = media(item.imgUrl || item.images?.square);
  const text = (item.text || "") + (item.customerName ? `\n${item.customerName} — ${item.bikeName || ""}` : "");
  if (!navigator.share) {
    window.open("https://wa.me/?text=" + encodeURIComponent(text + (imgUrl ? "\n" + imgUrl : "")), "_blank");
    return;
  }
  try {
    if (imgUrl) {
      const blob = await (await fetch(imgUrl)).blob();
      const file = new File([blob], "post.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text, title: brandName });
        return;
      }
    }
    await navigator.share({ text: text + (imgUrl ? "\n" + imgUrl : ""), title: brandName });
  } catch (e) { if (e.name !== "AbortError") alert("Share नहीं हुआ: " + e.message); }
}
