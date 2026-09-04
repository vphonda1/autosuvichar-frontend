// ============================================================================
//  SettingsHub.jsx — "सेटिंग"
//  ---------------------------------------------------------------------------
//  पहले सात अलग tabs थे: ⚙️ Settings, 🖼️ Logo, 🧠 Brand Memory, 🏍️ गाड़ियाँ,
//  🎛️ Automation, 🧹 रखरखाव, 📱 WhatsApp — सब admin के लिए, सब कभी-कभार का काम।
//
//  ये रोज़ के काम नहीं हैं। इसलिए अब एक ही पर्दे पर, बन्द डिब्बों में। जिसकी
//  ज़रूरत हो वही खोलिए। रोज़ की जगह रोज़ के कामों के लिए ख़ाली रहे।
// ============================================================================

import React, { useEffect, useState } from "react";
import { api, vib, Fold, Err } from "./shared.jsx";

import LogoSettings from "./LogoSettings.jsx";
import BrandMemory from "./BrandMemory.jsx";
import Vehicles from "./Vehicles.jsx";
import Automation from "./Automation.jsx";
import Maintenance from "./Maintenance.jsx";
import WhatsAppApproval from "./WhatsAppApproval.jsx";

// ── किस brand का FB/IG/WhatsApp कहाँ जुड़ा है ────────────────────────────
function Accounts({ brands, accent }) {
  const [cfgBrand, setCfgBrand] = useState("vp_honda");
  const [settings, setSettings] = useState({});
  const [f, setF] = useState({});
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [igMsg, setIgMsg] = useState("");

  const cur = settings[cfgBrand] || {};

  useEffect(() => { api("/api/settings").then(setSettings).catch((e) => setErr(e.message)); }, []);
  useEffect(() => {
    setF({
      fbPageId: cur.fbPageId || "", fbToken: "", igUserId: cur.igUserId || "",
      waPhoneId: cur.waPhoneId || "",
      waToken: "",
      waRecipients: Array.isArray(cur.waRecipients) ? cur.waRecipients.join(",") : (cur.waRecipients || ""),
    });
    setIgMsg("");
  }, [cfgBrand, settings]);

  async function save() {
    setBusy(true); setErr(""); setNote("");
    try {
      await api(`/api/settings/${cfgBrand}`, {
        method: "PUT",
        body: JSON.stringify({ ...f, waRecipients: f.waRecipients.split(",").map((s) => s.trim()).filter(Boolean) }),
      });
      setSettings(await api("/api/settings"));
      setNote("✓ सुरक्षित — tokens server में रहते हैं, यहाँ दोबारा नहीं दिखेंगे");
      setTimeout(() => setNote(""), 4000);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  async function findIg() {
    if (!f.fbPageId) { setIgMsg("पहले FB Page ID भरें"); return; }
    setIgMsg("ढूँढ रहे हैं…");
    try {
      const q = f.fbToken ? `token=${encodeURIComponent(f.fbToken)}` : "useSaved=1";
      const d = await api(`/api/ig-account-id?pageId=${f.fbPageId}&${q}`);
      if (d.found) { setF((p) => ({ ...p, igUserId: d.igId })); setIgMsg("✓ मिल गया: " + d.igId); }
      else setIgMsg(d.msg || "नहीं मिला");
    } catch (e) { setIgMsg(e.message); }
  }

  async function connectYT() {
    try { const { url } = await api(`/api/oauth/google?brand=${cfgBrand}`); window.open(url, "_blank"); }
    catch (e) { setErr(e.message); }
  }

  const b = brands[cfgBrand] || {};
  const Input = ({ k, ph }) => (
    <input value={f[k] ?? ""} placeholder={ph} onChange={(e) => setF({ ...f, [k]: e.target.value })}
      className="w-full bg-neutral-800 rounded-lg p-2.5 text-sm mb-2 outline-none border border-neutral-700" />
  );

  return (
    <div className="pt-2">
      <Err onClose={() => setErr("")}>{err}</Err>

      <select value={cfgBrand} onChange={(e) => setCfgBrand(e.target.value)}
        className="w-full bg-neutral-800 rounded-lg p-2.5 text-sm border border-neutral-700 mb-3 text-white">
        {Object.entries(brands).map(([id, x]) => <option key={id} value={id}>{x.name}</option>)}
      </select>

      {note && <div className="rounded-lg bg-emerald-900/40 border border-emerald-800 text-emerald-300 text-xs p-2 mb-2">{note}</div>}

      <Input k="fbPageId" ph="Facebook Page ID" />
      <Input k="fbToken" ph={cur.fbToken === "••••set" ? "FB Token — भरा हुआ है, बदलना हो तभी लिखें" : "Facebook Page Token"} />

      <div className="flex gap-2 mb-2">
        <input value={f.igUserId ?? ""} placeholder="Instagram Business ID"
          onChange={(e) => setF({ ...f, igUserId: e.target.value })}
          className="flex-1 bg-neutral-800 rounded-lg p-2.5 text-sm outline-none border border-neutral-700" />
        <button onClick={findIg} className="text-xs rounded-lg px-3 border border-neutral-600 text-neutral-300 whitespace-nowrap">
          ख़ुद ढूँढो
        </button>
      </div>
      {igMsg && <div className="text-xs mb-2 p-2 rounded-lg bg-neutral-800 text-neutral-300">{igMsg}</div>}

      <Input k="waPhoneId" ph="WhatsApp Phone ID" />
      <Input k="waToken" ph={cur.waToken === "••••set" ? "WA Token — भरा हुआ है" : "WhatsApp Token"} />
      <Input k="waRecipients" ph="किन नंबरों पर जाए — 919713394738,9198…" />

      <div className="flex gap-2 mt-1">
        <button onClick={() => { vib(); save(); }} disabled={busy} style={{ background: b.accent || accent }}
          className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? "…" : "सुरक्षित करें"}
        </button>
        <button onClick={connectYT} className="rounded-lg px-4 py-2.5 text-sm border border-neutral-700 text-neutral-300">
          ▶ YouTube {cur.ytRefreshToken === "••••set" ? "✓" : "जोड़ें"}
        </button>
      </div>
    </div>
  );
}

// ── Google Business Profile — Search और Maps में दिखना ────────────────────
function GoogleBusiness({ brandId, accent }) {
  const [cfg, setCfg] = useState(null);
  const [locs, setLocs] = useState(null);
  const [f, setF] = useState({ accountId: "", locationId: "", refreshToken: "", defaultCtaUrl: "" });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api(`/api/gbp/${brandId}`).then((c) => {
      setCfg(c);
      setF({
        accountId: c.accountId || "", locationId: c.locationId || "",
        refreshToken: "", defaultCtaUrl: c.defaultCtaUrl || "",
      });
    }).catch(() => setCfg({ connected: false }));
  }, [brandId]);

  async function save() {
    setBusy(true); setErr(""); setMsg("");
    try {
      const c = await api(`/api/gbp/${brandId}`, { method: "PUT", body: JSON.stringify(f) });
      setCfg(c); setMsg("✓ सुरक्षित"); setTimeout(() => setMsg(""), 3000);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  async function loadLocs() {
    setBusy(true); setErr("");
    try { setLocs(await api(`/api/gbp/${brandId}/locations`)); }
    catch (e) { setErr(e.message); }
    setBusy(false);
  }

  return (
    <div className="pt-2 space-y-2">
      <p className="text-[11px] text-neutral-500 leading-relaxed">
        जो आदमी Google पर "Honda showroom भोपाल" खोजता है, वह ख़रीदने के इरादे से खोजता है।
        यहाँ post डालने पर आपकी दुकान Search और Maps में दिखती है।
      </p>
      <Err onClose={() => setErr("")}>{err}</Err>
      {msg && <div className="rounded-lg bg-emerald-900/40 border border-emerald-800 text-emerald-300 text-xs p-2">{msg}</div>}

      {cfg?.lastError && (
        <div className="rounded-lg bg-yellow-900/30 border border-yellow-800 text-yellow-300 text-[11px] p-2">
          पिछली बार: {cfg.lastError}
        </div>
      )}

      <input value={f.refreshToken} placeholder={cfg?.refreshToken === "••••set" ? "Google token — जुड़ा हुआ है" : "Google refresh token"}
        onChange={(e) => setF({ ...f, refreshToken: e.target.value })}
        className="w-full bg-neutral-800 rounded-lg p-2.5 text-sm outline-none border border-neutral-700" />

      <button onClick={loadLocs} disabled={busy}
        className="w-full rounded-lg py-2 text-xs border border-neutral-700 text-neutral-300 disabled:opacity-50">
        {busy ? "…" : "मेरी दुकानें दिखाओ"}
      </button>

      {locs?.locations?.length > 0 && (
        <div className="space-y-1">
          {locs.locations.map((l) => (
            <button key={l.locationId}
              onClick={() => { vib(); setF({ ...f, accountId: l.accountId, locationId: l.locationId }); }}
              className="w-full text-left rounded-lg border px-3 py-2 text-xs"
              style={{ borderColor: f.locationId === l.locationId ? accent : "#333", color: "#d4d4d4" }}>
              {l.title}
            </button>
          ))}
        </div>
      )}

      <input value={f.accountId} placeholder="accounts/1234…" onChange={(e) => setF({ ...f, accountId: e.target.value })}
        className="w-full bg-neutral-800 rounded-lg p-2.5 text-sm outline-none border border-neutral-700" />
      <input value={f.locationId} placeholder="locations/5678…" onChange={(e) => setF({ ...f, locationId: e.target.value })}
        className="w-full bg-neutral-800 rounded-lg p-2.5 text-sm outline-none border border-neutral-700" />

      <button onClick={() => { vib(); save(); }} disabled={busy} style={{ background: accent }}
        className="w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50">सुरक्षित करें</button>

      <p className="text-[10px] text-neutral-600 leading-relaxed">
        पहली बार जोड़ने के लिए Google से मंज़ूरी लेनी पड़ती है — कुछ दिन लगते हैं।
        तरीक़ा: developers.google.com/my-business/content/prereqs
      </p>
    </div>
  );
}

// ── सेहत ─────────────────────────────────────────────────────────────────
function Health({ accent }) {
  const [h, setH] = useState(null);
  const [g, setG] = useState(null);
  useEffect(() => {
    api("/api/health").then(setH).catch(() => {});
    api("/api/growth/health").then(setG).catch(() => {});
  }, []);
  if (!h) return <p className="text-xs text-neutral-600 pt-2">देख रहे हैं…</p>;

  const row = (label, val, good) => (
    <div className="flex justify-between text-xs py-1.5 border-b border-neutral-800 last:border-0">
      <span className="text-neutral-500">{label}</span>
      <span style={{ color: good === undefined ? "#a3a3a3" : good ? "#10B981" : "#EF4444" }}>{val}</span>
    </div>
  );

  return (
    <div className="pt-2">
      {h.testMode && (
        <div className="rounded-xl border border-yellow-700 bg-yellow-900/30 text-yellow-300 text-xs p-3 mb-3 leading-relaxed">
          <b>TEST_MODE चालू है</b> — हाँ कहने पर भी असली post नहीं जाती, सिर्फ़ नक़ल बनती है।
          असली भेजने के लिए Render → Environment → TEST_MODE = false करें।
        </div>
      )}
      {row("Server", h.ok ? "चल रहा है" : "बन्द", h.ok)}
      {row("असली भेजना", h.testMode ? "बन्द (test mode)" : "चालू", !h.testMode)}
      {row("Video बनाना", h.video ? "चालू" : "बन्द", h.video)}
      {row("AI (लिखने वाला)", h.aiTextKey ? "जुड़ा" : "नहीं जुड़ा", h.aiTextKey)}
      {row("AI (तस्वीर वाला)", h.aiImageKey ? "जुड़ा" : "नहीं जुड़ा", h.aiImageKey)}
      {row("जगह बची", h.storage?.freeMB != null ? `${h.storage.freeMB} MB` : "—")}
      {g && <>
        {row("Google Business", g.gbpConnected ? `${g.gbpConnected} दुकान जुड़ी` : "नहीं जुड़ा", !!g.gbpConnected)}
        {row("समय पर जाने वाली posts", g.scheduledWaiting)}
        {row("Tracking links", g.activeLinks)}
      </>}
    </div>
  );
}

// ---------------------------------------------------------------- HUB
export default function SettingsHub({ apiBase, token, brandId, brand, brands, accent, user }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-neutral-600 mb-1">
        ये कभी-कभार के काम हैं। जिसकी ज़रूरत हो, वही डिब्बा खोलिए।
      </p>

      <Fold icon="🔗" title="खाते जोड़ें" sub="Facebook, Instagram, WhatsApp, YouTube" defaultOpen>
        <Accounts brands={brands} accent={accent} />
      </Fold>

      <Fold icon="🌐" title="Google Business" sub="Search और Maps में दिखें — नया">
        <GoogleBusiness brandId={brandId} accent={accent} />
      </Fold>

      <Fold icon="🏍️" title="गाड़ियों की सूची" sub="क़ीमत यहीं से जाती है — AI ख़ुद नहीं बनाता">
        <div className="pt-2"><Vehicles apiBase={apiBase} token={token} brandId={brandId} /></div>
      </Fold>

      <Fold icon="🧠" title="दुकान की पहचान" sub="एक बार भरें, AI हमेशा उसी लहजे में लिखेगा">
        <div className="pt-2"><BrandMemory apiBase={apiBase} token={token} brandId={brandId} /></div>
      </Fold>

      <Fold icon="🖼️" title="Logo" sub="कौन-सा logo कहाँ लगे">
        <div className="pt-2"><LogoSettings apiBase={apiBase} token={token} /></div>
      </Fold>

      <Fold icon="🎛️" title="कितना अपने आप चले" sub="ऑटोमेशन और ख़र्च की सीमा">
        <div className="pt-2"><Automation apiBase={apiBase} token={token} brandId={brandId} /></div>
      </Fold>

      <Fold icon="📱" title="WhatsApp से हाँ/ना" sub="रोज़ का content सीधे WhatsApp पर">
        <div className="pt-2"><WhatsAppApproval apiBase={apiBase} token={token} /></div>
      </Fold>

      <Fold icon="🧹" title="सफ़ाई और रखरखाव" sub="जगह, अटकी posts, पुराना रिकॉर्ड">
        <div className="pt-2"><Maintenance apiBase={apiBase} token={token} brandId={brandId} /></div>
      </Fold>

      <Fold icon="❤️" title="सब ठीक चल रहा है?" sub="server, AI, tokens की हालत">
        <Health accent={accent} />
      </Fold>

      <p className="text-[11px] text-neutral-600 text-center pt-3 pb-2">
        {user?.email} · {user?.role}
      </p>
    </div>
  );
}
