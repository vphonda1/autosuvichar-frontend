import React, { useEffect, useState } from "react";
import PromoEditor from "./PromoEditor.jsx";
import DeliveryEditor from "./DeliveryEditor.jsx";

// ============================================================================
// AutoSuVichar — पूरा Control Panel (Login + सभी sections)
// API_BASE को अपने backend URL पर सेट करें।
// पहली बार login: admin@vphonda.com / vphonda@123  (बाद में बदल लें)
// ============================================================================
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const media = (u) => (u && u.startsWith("/") ? API_BASE + u : u); // relative path → full backend URL
const STICKER_OPTS = [["", "— कोई sticker नहीं —"], ["1", "लाल तारा"], ["2", "लाल सील"], ["3", "हरा तारा"], ["4", "नीला विस्फोट"], ["5", "नारंगी सील"], ["6", "ब्लैक-गोल्ड मेडल"], ["7", "गोल्ड+लाल सील"], ["8", "लाल टैग (तिरछा)"], ["9", "सफ़ेद-लाल तारा"], ["10", "बैंगनी गोल"]];
const OFFER_OPTS = [["", "— कोई offer नहीं —"], ["cashback", "कैशबैक"], ["lowdp", "कम डाउन पेमेंट"], ["exchange", "एक्सचेंज बोनस"], ["student", "स्टूडेंट स्पेशल"], ["newyear", "नया साल ऑफर"], ["festival", "फेस्टिव ऑफर"], ["freegift", "फ्री गिफ्ट"]];
const DECOR_OPTS = [["star", "⭐ तारा"], ["heart", "❤️ दिल"], ["flame", "🔥 ज्वाला"], ["gift", "🎁 गिफ्ट"], ["sparkle", "✨ चमक"], ["check", "✅ टिक"], ["crown", "👑 ताज"], ["rupee", "₹ रुपया"], ["party", "🎉 पार्टी"]];
const FEATURE_OPTS = ["हाई माइलेज", "ट्यूबलेस टायर", "सेल्फ स्टार्ट", "डिजिटल मीटर", "अलॉय व्हील", "क्रोम प्लेटिंग", "वाइड फ्यूल टैंक", "LED हेडलाइट", "5-स्टेप सस्पेंशन", "डिस्क ब्रेक", "मोबाइल चार्जिंग", "कॉम्बी ब्रेक", "BS6 इंजन", "स्टाइलिश ग्राफिक्स", "कम्फर्ट सीट", "मज़बूत ग्रैब रेल", "साइड स्टैंड इंजन कट", "लो मेंटेनेंस", "इको मोड", "दमदार परफॉर्मेंस"];
const BANK_OPTS = ["HDB", "Jana Small Finance", "Muthoot", "IDFC First", "Shriram Finance", "HDFC", "Bajaj Finance", "TATA Capital", "L&T Finance", "Chola"];

let TOKEN = "";
try { TOKEN = localStorage.getItem("asv_token") || ""; } catch (_) {}
function setToken(t) { TOKEN = t || ""; try { t ? localStorage.setItem("asv_token", t) : localStorage.removeItem("asv_token"); } catch (_) {} }

async function api(p, opts = {}) {
  const res = await fetch(API_BASE + p, {
    headers: { "Content-Type": "application/json", ...(TOKEN ? { Authorization: "Bearer " + TOKEN } : {}) },
    ...opts,
  });
  if (res.status === 401) { setToken(""); throw new Error("session ख़त्म — दुबारा login करें"); }
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
  return res.json();
}

const TYPES = [
  { id: "suvichar", label: "सुविचार", icon: "✨" }, { id: "vigyapan", label: "विज्ञापन", icon: "📣" },
  { id: "festival", label: "त्यौहार", icon: "🎉" }, { id: "suchna", label: "सूचना", icon: "📌" }, { id: "gift", label: "गिफ्ट", icon: "🎁" },
];
const PLATFORMS = [{ id: "fb", label: "Facebook" }, { id: "ig", label: "Instagram" }, { id: "yt", label: "YouTube" }, { id: "wa", label: "WhatsApp" }];
const ADMIN = ["super-admin", "admin"];

const Pill = ({ on, color, children, onClick }) => (
  <button onClick={onClick} style={{ borderColor: on ? color : "#3a3a3a", background: on ? color : "transparent", color: on ? "#fff" : "#9a9a9a" }}
    className="px-3 py-1.5 rounded-full text-sm font-medium border">{children}</button>
);
const Title = ({ children }) => (
  <div className="flex items-center gap-2 mb-3"><h2 className="text-sm font-semibold text-neutral-300">{children}</h2><div className="h-px flex-1 bg-neutral-800" /></div>
);
const Empty = ({ children }) => <p className="text-sm text-neutral-600 mb-6">{children}</p>;

// ---------------------- LOGIN ----------------------
function Login({ onIn }) {
  const [email, setEmail] = useState(""); const [pass, setPass] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function go() {
    setErr(""); setBusy(true);
    try { const r = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password: pass }) }); setToken(r.token); onIn(r.user); }
    catch (e) { setErr(e.message); } setBusy(false);
  }
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-4" style={{ fontFamily: "system-ui" }}>
      <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-6">
        <h1 className="text-2xl font-bold mb-1">Auto<span className="text-red-500">SuVichar</span></h1>
        <p className="text-sm text-neutral-400 mb-5">Staff login</p>
        {err && <div className="mb-3 text-sm bg-red-950/60 border border-red-800 text-red-200 rounded-lg px-3 py-2">{err}</div>}
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" className="w-full bg-neutral-800 rounded-lg p-2.5 text-sm mb-3 outline-none" />
        <input value={pass} onChange={(e) => setPass(e.target.value)} type="password" placeholder="password" onKeyDown={(e) => e.key === "Enter" && go()} className="w-full bg-neutral-800 rounded-lg p-2.5 text-sm mb-4 outline-none" />
        <button onClick={go} disabled={busy} className="w-full rounded-lg py-2.5 font-semibold text-white bg-red-600 disabled:opacity-50">{busy ? "…" : "Login"}</button>
      </div>
    </div>
  );
}

// ---------------------- MAIN ----------------------
export default function App() {
  const [user, setUser] = useState(null);
  const [brands, setBrands] = useState({});
  const [brandId, setBrandId] = useState("vp_honda");
  const [tab, setTab] = useState("content");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const [unread, setUnread] = useState(0);

  // data
  const [type, setType] = useState("vigyapan");
  const [cOffers, setCOffers] = useState([]);
  const [cStickers, setCStickers] = useState([]);
  const [cDecor, setCDecor] = useState([]);
  const [festivals, setFestivals] = useState([]);
  const [cFestival, setCFestival] = useState("");
  const [music, setMusic] = useState([]);
  const [pending, setPending] = useState([]); const [sent, setSent] = useState([]); const [deliv, setDeliv] = useState([]);
  const [leads, setLeads] = useState([]); const [stats, setStats] = useState(null); const [notifs, setNotifs] = useState([]); const [settings, setSettings] = useState({});
  const [form, setForm] = useState({ customerName: "", bikeName: "", offer: "", file: null, music: "" });
  const [promoForm, setPromoForm] = useState({ model: "", price: "", downPayment: "", cashback: "", features: "", file: null, bg: "light", vehicle: "", cutout: true, aiPrompt: "", offers: [], stickers: [], decor: [], banks: [] });
  const [vehicles, setVehicles] = useState([]);

  const brand = brands[brandId] || { accent: "#E4002B", name: "VP Honda" };
  const isAdmin = user && ADMIN.includes(user.role);

  useEffect(() => {
    if (!TOKEN) return;
    api("/api/auth/me").then(setUser).catch(() => setToken(""));
  }, []);
  useEffect(() => {
    if (!user) return;
    api("/api/brands").then(setBrands).catch(() => {});
    api("/api/music").then(setMusic).catch(() => {});  }, [user]);
  useEffect(() => { if (user) load(); /* eslint-disable-next-line */ }, [user, brandId, tab]);

  async function load() {
    try {
      const n = await api("/api/notifications"); setNotifs(n.items); setUnread(n.unread);
      if (tab === "content") { const [p, s] = await Promise.all([api(`/api/content?brand=${brandId}&status=pending`), api(`/api/content?brand=${brandId}&status=sent`)]); setPending(p); setSent(s.slice(0, 10)); }
      if (tab === "delivery") setDeliv(await api(`/api/deliveries?brand=${brandId}&status=pending`));
      if (tab === "leads") setLeads(await api(`/api/leads?brand=${brandId}`));
      if (tab === "analytics") setStats(await api(`/api/analytics?brand=${brandId}`));
      if (tab === "settings" && isAdmin) setSettings(await api("/api/settings"));
      if (tab === "promo") setVehicles(await api(`/api/vehicles?brand=${brandId}`));
    } catch (e) { setErr(e.message); }
  }
  function logout() { setToken(""); setUser(null); }

  // actions
  const toggleIn = (arr, v) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  async function doGenerate() { setErr(""); setBusy(true); try { await api("/api/generate", { method: "POST", body: JSON.stringify({ brand: brandId, type, offer: cOffers.join(","), sticker: cStickers.join(","), decor: cDecor.join(","), festival: type === "festival" ? cFestival : undefined }) }); await load(); } catch (e) { setErr(e.message); } setBusy(false); }
  useEffect(() => { (async () => { try { const r = await api("/api/festivals"); setFestivals(r.festivals || []); setCFestival((prev) => prev || r.upcoming || ""); } catch (_) {} })(); }, []);
  async function patchItem(id, body) { const u = await api(`/api/content/${id}`, { method: "PATCH", body: JSON.stringify(body) }); setPending((p) => p.map((x) => (x._id === id ? u : x))); }
  async function makeVideo(item, m) { setBusy(true); setErr(""); try { const u = await api(`/api/content/${item._id}/video`, { method: "POST", body: JSON.stringify({ music: m || null }) }); setPending((p) => p.map((x) => (x._id === item._id ? u : x))); } catch (e) { setErr(e.message); } setBusy(false); }
  async function approve(kind, id) { setBusy(true); setErr(""); try { await api(`/api/${kind}/${id}/approve`, { method: "POST" }); await load(); } catch (e) { setErr(e.message); } setBusy(false); }
  async function reject(kind, id) { await api(`/api/${kind}/${id}/reject`, { method: "POST" }); await load(); }
  async function submitDelivery() {
    if (!form.file) { setErr("पहले customer फोटो चुनें"); return; }
    setErr(""); setBusy(true);
    try {
      const fd = new FormData(); fd.append("brand", brandId); fd.append("customerName", form.customerName); fd.append("bikeName", form.bikeName); fd.append("offer", form.offer); if (form.music) fd.append("music", form.music); fd.append("photo", form.file);
      const res = await fetch(API_BASE + "/api/delivery", { method: "POST", headers: { Authorization: "Bearer " + TOKEN }, body: fd });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "upload failed");
      setForm({ customerName: "", bikeName: "", offer: "", file: null, music: "" }); await load();
    } catch (e) { setErr(e.message); } setBusy(false);
  }
  async function submitPromo() {
    if (!promoForm.file && !promoForm.vehicle) { setErr("गाड़ी की फोटो चुनें या library से select करें"); return; }
    setErr(""); setBusy(true);
    try {
      const fd = new FormData(); fd.append("brand", brandId);
      fd.append("model", promoForm.model); fd.append("price", promoForm.price);
      fd.append("downPayment", promoForm.downPayment); fd.append("cashback", promoForm.cashback);
      fd.append("features", promoForm.features); fd.append("bg", promoForm.bg);
      fd.append("cutout", promoForm.cutout ? "true" : "false");
      if (promoForm.bg === "ai" && promoForm.aiPrompt) fd.append("aiPrompt", promoForm.aiPrompt);
      if (promoForm.offers.length) fd.append("offer", promoForm.offers.join(","));
      if (promoForm.stickers.length) fd.append("sticker", promoForm.stickers.join(","));
      if (promoForm.decor.length) fd.append("decor", promoForm.decor.join(","));
      if (promoForm.banks.length) fd.append("banks", promoForm.banks.join(","));
      if (promoForm.vehicle) fd.append("vehicle", promoForm.vehicle);
      if (promoForm.file) fd.append("photo", promoForm.file);
      const res = await fetch(API_BASE + "/api/promo", { method: "POST", headers: { Authorization: "Bearer " + TOKEN }, body: fd });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "upload failed");
      setPromoForm({ model: "", price: "", downPayment: "", cashback: "", features: "", file: null, bg: "light", vehicle: "", cutout: true, aiPrompt: "", offers: [], stickers: [], decor: [], banks: [] });
      setTab("content");
    } catch (e) { setErr(e.message); } setBusy(false);
  }
  async function uploadVehicle(file) {
    if (!file) return;
    setBusy(true); setErr("");
    try {
      const fd = new FormData(); fd.append("brand", brandId); fd.append("photo", file);
      const res = await fetch(API_BASE + "/api/vehicles/upload", { method: "POST", headers: { Authorization: "Bearer " + TOKEN }, body: fd });
      if (!res.ok) throw new Error("vehicle upload failed");
      const list = await api(`/api/vehicles?brand=${brandId}`); setVehicles(list);
      const { file: fn } = await res.json(); setPromoForm((p) => ({ ...p, vehicle: fn, file: null }));
    } catch (e) { setErr(e.message); } setBusy(false);
  }
  async function setLeadStatus(id, status) { await api(`/api/leads/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); setLeads((l) => l.map((x) => (x._id === id ? { ...x, status } : x))); }
  async function saveSetting(bId, body) { setBusy(true); setErr(""); try { await api(`/api/settings/${bId}`, { method: "PUT", body: JSON.stringify(body) }); setSettings(await api("/api/settings")); } catch (e) { setErr(e.message); } setBusy(false); }
  async function connectYouTube(bId) { try { const { url } = await api(`/api/oauth/google?brand=${bId}`); window.open(url, "_blank"); } catch (e) { setErr(e.message); } }
  async function markNotifsRead() { await api("/api/notifications/read", { method: "POST" }); setUnread(0); }

  if (!user) return <Login onIn={setUser} />;

  const TABS = [["content", "📝 कंटेंट"], ["promo", "📣 विज्ञापन+"], ["delivery", "🎥 Delivery"], ["leads", "👥 Leads"], ["analytics", "📊 Analytics"], ["notif", "🔔"], ...(isAdmin ? [["settings", "⚙️ Settings"]] : [])];

  return (
    <div style={{ fontFamily: "system-ui" }} className="min-h-screen bg-neutral-950 text-neutral-100 px-4 py-5">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">Auto<span style={{ color: brand.accent }}>SuVichar</span></h1>
          <div className="text-xs text-neutral-400 flex items-center gap-3">
            <span>{user.name || user.role} · {user.role}</span>
            <button onClick={logout} className="text-neutral-400 underline">logout</button>
          </div>
        </div>
        <p className="text-sm text-neutral-400 mb-4">कुछ भी अपने आप पोस्ट नहीं होता — पहले Approve करें।</p>
        {err && <div className="mb-4 text-sm bg-red-950/60 border border-red-800 text-red-200 rounded-lg px-3 py-2">{err}</div>}

        {/* brands */}
        <div className="flex gap-2 mb-4">
          {Object.entries(brands).map(([id, b]) => (
            <button key={id} onClick={() => setBrandId(id)} style={{ borderColor: brandId === id ? b.accent : "#2a2a2a", boxShadow: brandId === id ? `0 0 0 1px ${b.accent}` : "none" }}
              className="flex-1 text-left rounded-xl border px-3 py-2.5 bg-neutral-900">
              <div className="text-sm font-semibold" style={{ color: brandId === id ? b.accent : "#e5e5e5" }}>{b.name}</div>
              <div className="text-[11px] text-neutral-500 leading-tight">{b.sub}</div>
            </button>
          ))}
        </div>

        {/* tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          {TABS.map(([id, label]) => (
            <button key={id} onClick={() => { setTab(id); if (id === "notif") markNotifsRead(); }}
              style={{ borderColor: tab === id ? brand.accent : "#3a3a3a", background: tab === id ? brand.accent : "transparent", color: tab === id ? "#fff" : "#9a9a9a" }}
              className="px-3 py-1.5 rounded-full text-sm font-medium border relative">
              {label}{id === "notif" && unread > 0 && <span className="ml-1 text-[10px] bg-red-600 text-white rounded-full px-1.5">{unread}</span>}
            </button>
          ))}
        </div>

        {/* ===== CONTENT ===== */}
        {tab === "content" && (<>
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4 mb-5">
            <div className="flex flex-wrap gap-2 mb-4">{TYPES.map((t) => <Pill key={t.id} on={type === t.id} color={brand.accent} onClick={() => setType(t.id)}>{t.icon} {t.label}</Pill>)}</div>
            {type === "festival" && (
              <label className="text-xs text-neutral-400 block mb-3">कौन-सा त्यौहार? (अगला अपने-आप चुना है — रंग/बधाई बदल जाएगी)
                <select value={cFestival} onChange={(e) => setCFestival(e.target.value)} className="w-full bg-neutral-800 rounded-lg p-2 text-sm border border-neutral-700 mt-1 text-white">
                  {festivals.map((fst) => <option key={fst.name} value={fst.name}>{fst.name} ({fst.date.slice(5)})</option>)}
                </select></label>
            )}
            <div className="mb-3">
              <span className="text-xs text-neutral-400">Offers (एक या कई चुनें)</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {OFFER_OPTS.filter(([v]) => v).map(([v, l]) => (
                  <Pill key={v} on={cOffers.includes(v)} color={brand.accent} onClick={() => setCOffers((a) => toggleIn(a, v))}>{l}</Pill>
                ))}
              </div>
              <span className="text-xs text-neutral-400 block mt-2">Sticker design (एक या कई)</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {STICKER_OPTS.filter(([v]) => v).map(([v, l]) => (
                  <Pill key={v} on={cStickers.includes(v)} color={brand.accent} onClick={() => setCStickers((a) => toggleIn(a, v))}>{l}</Pill>
                ))}
              </div>
              <span className="text-xs text-neutral-400 block mt-2">Emoji / सजावट (एक या कई)</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {DECOR_OPTS.map(([v, l]) => (
                  <Pill key={v} on={cDecor.includes(v)} color={brand.accent} onClick={() => setCDecor((a) => toggleIn(a, v))}>{l}</Pill>
                ))}
              </div>
            </div>
            <button onClick={doGenerate} disabled={busy} style={{ background: brand.accent }} className="w-full rounded-xl py-3 font-semibold text-white disabled:opacity-50">{busy ? "बना रहे हैं…" : "✨ Generate करें"}</button>
          </div>
          <Title>Review करें ({pending.length})</Title>
          {pending.length === 0 && <Empty>कुछ pending नहीं है।</Empty>}
          <div className="space-y-3 mb-8">{pending.map((p) => (
            <div key={p._id} className="rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden">
              {p.video ? <video src={media(p.video)} controls className="w-full max-h-96 bg-black" /> : <img src={media(p.images?.square)} alt="" className="w-full" />}
              <div className="p-3">
                <textarea value={p.text} rows={3} onChange={(e) => setPending((pr) => pr.map((x) => x._id === p._id ? { ...x, text: e.target.value } : x))} onBlur={(e) => patchItem(p._id, { text: e.target.value })} className="w-full bg-neutral-800 rounded-lg p-2 text-sm outline-none resize-none mb-3" />
                <div className="flex flex-wrap gap-2 mb-3">{PLATFORMS.map((pl) => <Pill key={pl.id} on={p.platforms?.[pl.id]} color={brand.accent} onClick={() => patchItem(p._id, { platforms: { ...p.platforms, [pl.id]: !p.platforms[pl.id] } })}>{pl.label}</Pill>)}</div>
                <div className="flex items-center gap-2 mb-3">
                  <button onClick={() => makeVideo(p, music[0])} disabled={busy} className="text-xs rounded-lg px-3 py-1.5 border border-neutral-700 text-neutral-300 disabled:opacity-50">🎬 {p.video ? "Video दुबारा" : "Short video"}</button>
                  {music.length > 0 && <select onChange={(e) => makeVideo(p, e.target.value)} className="text-xs bg-neutral-800 rounded-lg px-2 py-1.5 border border-neutral-700"><option>music…</option>{music.map((m) => <option key={m} value={m}>{m}</option>)}</select>}
                </div>
                {ADMIN.concat("manager").includes(user.role)
                  ? <Actions onA={() => approve("content", p._id)} onR={() => reject("content", p._id)} busy={busy} color={brand.accent} />
                  : <p className="text-xs text-neutral-500">Approve सिर्फ़ manager/admin कर सकते हैं</p>}
              </div>
            </div>))}
          </div>
          <Title>भेजे गए (last 10)</Title>
          <div className="space-y-2 pb-10">{sent.length === 0 && <Empty>अभी कुछ नहीं भेजा गया।</Empty>}{sent.map((s) => <SentRow key={s._id} s={s} />)}</div>
        </>)}

        {/* ===== PROMO (गाड़ी वाला विज्ञापन) ===== */}
        {tab === "promo" && (
          <>
            <PromoEditor apiBase={API_BASE} token={TOKEN} brandId={brandId} onSent={load} />
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4 mb-5 space-y-3">
            <p className="text-xs text-neutral-400">गाड़ी चुनें/upload करें + कीमत डालें — आकर्षक विज्ञापन poster बनेगा (Review में आएगा)।</p>

            <div>
              <span className="text-xs text-neutral-400">Background डिज़ाइन</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {[["light", "साफ़ (Honda जैसा)"], ["brand", "ब्रांड रंग"], ["dark", "डार्क"], ["ai", "🤖 AI नज़ारा"]].map(([v, lbl]) => (
                  <Pill key={v} on={promoForm.bg === v} color={brand.accent} onClick={() => setPromoForm({ ...promoForm, bg: v })}>{lbl}</Pill>
                ))}
              </div>
              {promoForm.bg === "ai" && (
                <input placeholder="AI background कैसा हो? (खाली छोड़ें = showroom). जैसे: पहाड़, शहर रात, समुद्र" value={promoForm.aiPrompt} onChange={(e) => setPromoForm({ ...promoForm, aiPrompt: e.target.value })} className="w-full bg-neutral-800 rounded-lg p-2 text-sm outline-none mt-2 border border-neutral-700" />
              )}
            </div>

            <div>
              <span className="text-xs text-neutral-400">गाड़ी चुनें (library से)</span>
              {vehicles.length > 0 ? (
                <select value={promoForm.vehicle} onChange={(e) => setPromoForm({ ...promoForm, vehicle: e.target.value, file: null })} className="w-full bg-neutral-800 rounded-lg p-2 text-sm border border-neutral-700 mt-1">
                  <option value="">— गाड़ी चुनें —</option>
                  {vehicles.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              ) : <p className="text-[11px] text-neutral-600 mt-1">अभी कोई गाड़ी नहीं — नीचे से upload करें।</p>}
            </div>

            <label className="block"><span className="text-xs text-neutral-400">नई गाड़ी की फोटो library में जोड़ें (transparent PNG सबसे अच्छा)</span>
              <input type="file" accept="image/*" onChange={(e) => uploadVehicle(e.target.files[0])} className="block w-full text-sm mt-1 text-neutral-300" /></label>

            <input placeholder="गाड़ी का नाम (Honda Shine 100)" value={promoForm.model} onChange={(e) => setPromoForm({ ...promoForm, model: e.target.value })} className="w-full bg-neutral-800 rounded-lg p-2 text-sm outline-none" />
            <input placeholder="एक्स-शोरूम कीमत (70196)" value={promoForm.price} onChange={(e) => setPromoForm({ ...promoForm, price: e.target.value })} className="w-full bg-neutral-800 rounded-lg p-2 text-sm outline-none" />
            <div className="flex gap-2">
              <input placeholder="डाउन पेमेंट (4999)" value={promoForm.downPayment} onChange={(e) => setPromoForm({ ...promoForm, downPayment: e.target.value })} className="w-1/2 bg-neutral-800 rounded-lg p-2 text-sm outline-none" />
              <input placeholder="कैशबैक (10000)" value={promoForm.cashback} onChange={(e) => setPromoForm({ ...promoForm, cashback: e.target.value })} className="w-1/2 bg-neutral-800 rounded-lg p-2 text-sm outline-none" />
            </div>
            <label className="flex items-center gap-2 text-sm text-neutral-300 select-none">
              <input type="checkbox" checked={promoForm.cutout} onChange={(e) => setPromoForm({ ...promoForm, cutout: e.target.checked })} />
              गाड़ी का सफ़ेद background अपने-आप हटाएँ (catalog फोटो के लिए)
            </label>
            <div>
              <span className="text-xs text-neutral-400">Offers (एक या कई चुनें — सब poster पर लगेंगे)</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {OFFER_OPTS.filter(([v]) => v).map(([v, l]) => (
                  <Pill key={v} on={promoForm.offers.includes(v)} color={brand.accent} onClick={() => setPromoForm((f) => ({ ...f, offers: toggleIn(f.offers, v) }))}>{l}</Pill>
                ))}
              </div>
              <span className="text-xs text-neutral-400 block mt-2">Sticker design (एक या कई)</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {STICKER_OPTS.filter(([v]) => v).map(([v, l]) => (
                  <Pill key={v} on={promoForm.stickers.includes(v)} color={brand.accent} onClick={() => setPromoForm((f) => ({ ...f, stickers: toggleIn(f.stickers, v) }))}>{l}</Pill>
                ))}
              </div>
              <span className="text-xs text-neutral-400 block mt-2">Emoji / सजावट (एक या कई)</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {DECOR_OPTS.map(([v, l]) => (
                  <Pill key={v} on={promoForm.decor.includes(v)} color={brand.accent} onClick={() => setPromoForm((f) => ({ ...f, decor: toggleIn(f.decor, v) }))}>{l}</Pill>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs text-neutral-400">फीचर चुनें (एक या कई — फिर text भी edit कर सकते हैं)</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {FEATURE_OPTS.map((ft) => { const arr = promoForm.features.split(",").map((s) => s.trim()).filter(Boolean); const on = arr.includes(ft); return (
                  <Pill key={ft} on={on} color={brand.accent} onClick={() => setPromoForm((f) => { const a = f.features.split(",").map((s) => s.trim()).filter(Boolean); return { ...f, features: (on ? a.filter((x) => x !== ft) : [...a, ft]).join(", ") }; })}>{ft}</Pill>
                ); })}
              </div>
              <input placeholder="फीचर (comma से, खुद भी लिख सकते हैं)" value={promoForm.features} onChange={(e) => setPromoForm({ ...promoForm, features: e.target.value })} className="w-full bg-neutral-800 rounded-lg p-2 text-sm outline-none mt-2" />
              <span className="text-xs text-neutral-400 block mt-2">फाइनेंस — बैंक चुनें (एक या कई)</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {BANK_OPTS.map((bk) => (
                  <Pill key={bk} on={promoForm.banks.includes(bk)} color="#16a34a" onClick={() => setPromoForm((f) => ({ ...f, banks: toggleIn(f.banks, bk) }))}>{bk}</Pill>
                ))}
              </div>
            </div>
            {promoForm.vehicle && <p className="text-[11px] text-emerald-400">चुनी गई गाड़ी: {promoForm.vehicle}</p>}
            <button onClick={submitPromo} disabled={busy} style={{ background: brand.accent }} className="w-full rounded-xl py-3 font-semibold text-white disabled:opacity-50">{busy ? "Poster बना रहे हैं…" : "📣 विज्ञापन Poster बनाएँ"}</button>
          </div>
          </>
        )}

        {/* ===== DELIVERY ===== */}
        {tab === "delivery" && (<>
          <DeliveryEditor apiBase={API_BASE} token={TOKEN} brandId={brandId} onSent={load} />
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4 mb-5 space-y-3">
            <label className="block"><span className="text-xs text-neutral-400">Customer फोटो</span>
              <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, file: e.target.files[0] })} className="block w-full text-sm mt-1 text-neutral-300" /></label>
            <input placeholder="Customer नाम (S.S TOMAR)" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="w-full bg-neutral-800 rounded-lg p-2 text-sm outline-none" />
            <input placeholder="गाड़ी (Honda Shine)" value={form.bikeName} onChange={(e) => setForm({ ...form, bikeName: e.target.value })} className="w-full bg-neutral-800 rounded-lg p-2 text-sm outline-none" />
            <input placeholder="ऑफर (Free Helmet 🎁)" value={form.offer} onChange={(e) => setForm({ ...form, offer: e.target.value })} className="w-full bg-neutral-800 rounded-lg p-2 text-sm outline-none" />
            {music.length > 0 && <select value={form.music} onChange={(e) => setForm({ ...form, music: e.target.value })} className="w-full bg-neutral-800 rounded-lg p-2 text-sm border border-neutral-700"><option value="">music (optional)…</option>{music.map((m) => <option key={m} value={m}>{m}</option>)}</select>}
            <button onClick={submitDelivery} disabled={busy} style={{ background: brand.accent }} className="w-full rounded-xl py-3 font-semibold text-white disabled:opacity-50">{busy ? "Video बना रहे हैं…" : "🎬 Delivery Video बनाएँ"}</button>
          </div>
          <Title>Delivery Review ({deliv.length})</Title>
          {deliv.length === 0 && <Empty>कोई delivery pending नहीं।</Empty>}
          <div className="space-y-3 pb-10">{deliv.map((d) => (
            <div key={d._id} className="rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden">
              {d.video && <video src={media(d.video)} controls className="w-full max-h-[28rem] bg-black" />}
              <div className="p-3">
                <p className="text-sm text-neutral-300 whitespace-pre-line mb-3">{d.text}</p>
                <div className="flex flex-wrap gap-2 mb-3">{PLATFORMS.map((pl) => <Pill key={pl.id} on={d.platforms?.[pl.id]} color={brand.accent} onClick={() => {}}>{pl.label}</Pill>)}</div>
                {ADMIN.concat("manager").includes(user.role)
                  ? <Actions onA={() => approve("delivery", d._id)} onR={() => reject("delivery", d._id)} busy={busy} color={brand.accent} />
                  : <p className="text-xs text-neutral-500">Approve सिर्फ़ manager/admin कर सकते हैं</p>}
              </div>
            </div>))}
          </div>
        </>)}

        {/* ===== LEADS ===== */}
        {tab === "leads" && (<>
          <Title>Leads ({leads.length})</Title>
          {leads.length === 0 && <Empty>कोई lead नहीं।</Empty>}
          <div className="space-y-2 pb-10">{leads.map((l) => (
            <div key={l._id} className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2.5">
              <div className="flex justify-between items-start gap-2">
                <div><div className="text-sm font-medium">{l.name || "—"} · {l.mobile}</div>
                  <div className="text-[11px] text-neutral-500">{l.vehicleInterest || "—"} · {new Date(l.createdAt).toLocaleDateString("hi-IN")}</div></div>
                <select value={l.status} onChange={(e) => setLeadStatus(l._id, e.target.value)} className="text-xs bg-neutral-800 rounded-lg px-2 py-1 border border-neutral-700">
                  <option value="new">new</option><option value="contacted">contacted</option><option value="won">won</option><option value="lost">lost</option>
                </select>
              </div>
            </div>))}
          </div>
        </>)}

        {/* ===== ANALYTICS ===== */}
        {tab === "analytics" && stats && (<>
          <Title>Analytics · {brand.name}</Title>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <Stat label="पोस्ट भेजी" v={stats.contentSent} c={brand.accent} />
            <Stat label="pending" v={stats.contentPending} c="#888" />
            <Stat label="Delivery भेजी" v={stats.deliveriesSent} c={brand.accent} />
            <Stat label="कुल Leads" v={stats.leadsTotal} c="#0EA36A" />
            <Stat label="नए Leads" v={stats.leadsNew} c="#0EA36A" />
            <Stat label="Delivery pending" v={stats.deliveriesPending} c="#888" />
          </div>
          <Title>किस गाड़ी में रुचि</Title>
          <div className="space-y-1 mb-5">{(stats.leadsByVehicle || []).map((v, i) => <div key={i} className="flex justify-between text-sm bg-neutral-900 rounded-lg px-3 py-2"><span>{v._id || "—"}</span><span className="text-neutral-400">{v.n}</span></div>)}</div>
          <p className="text-[11px] text-neutral-500 pb-10">{stats.note}</p>
        </>)}

        {/* ===== NOTIFICATIONS ===== */}
        {tab === "notif" && (<>
          <Title>Notifications</Title>
          <div className="space-y-2 pb-10">{notifs.length === 0 && <Empty>कोई notification नहीं।</Empty>}
            {notifs.map((n) => <div key={n._id} className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2.5"><div className="text-sm">{n.message}</div><div className="text-[11px] text-neutral-500">{new Date(n.createdAt).toLocaleString("hi-IN")}</div></div>)}</div>
        </>)}

        {/* ===== SETTINGS (admin) ===== */}
        {tab === "settings" && isAdmin && (<>
          <Title>Settings — हर brand के account tokens</Title>
          {Object.entries(brands).map(([id, b]) => <SettingCard key={id} id={id} b={b} cur={settings[id] || {}} onSave={saveSetting} onYT={connectYouTube} busy={busy} />)}
          <p className="text-[11px] text-neutral-500 pb-10 mt-2">tokens कैसे लें — deploy guide देखें। YouTube के लिए "Connect" बटन से login करें।</p>
        </>)}
      </div>
    </div>
  );
}

const Actions = ({ onA, onR, busy, color }) => (
  <div className="flex gap-2">
    <button onClick={onA} disabled={busy} style={{ background: color }} className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50">✓ Approve & Send</button>
    <button onClick={onR} className="rounded-lg py-2.5 px-4 text-sm text-neutral-400 border border-neutral-700">Reject</button>
  </div>
);
const SentRow = ({ s }) => (
  <div className="rounded-xl bg-neutral-900/60 border border-neutral-800 px-3 py-2.5">
    <div className="flex justify-between items-start gap-2"><p className="text-sm text-neutral-300 line-clamp-2">{s.text}</p>
      <span className={`text-[10px] whitespace-nowrap ${s.status === "sent" ? "text-emerald-400" : "text-red-400"}`}>{s.status === "sent" ? "भेजा ✓" : "failed"}</span></div>
    <div className="text-[11px] text-neutral-500 mt-1">{s.sentAt ? new Date(s.sentAt).toLocaleString("hi-IN") : ""} · {(s.channels || []).join(", ") || "—"}</div>
  </div>
);
const Stat = ({ label, v, c }) => (
  <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-3">
    <div className="text-2xl font-bold" style={{ color: c }}>{v ?? 0}</div><div className="text-xs text-neutral-400">{label}</div>
  </div>
);
function SettingCard({ id, b, cur, onSave, onYT, busy }) {
  const [f, setF] = useState({ fbPageId: cur.fbPageId || "", fbToken: "", igUserId: cur.igUserId || "", waPhoneId: cur.waPhoneId || "", waRecipients: (cur.waRecipients || []).join(",") });
  return (
    <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4 mb-3">
      <div className="font-semibold mb-2" style={{ color: b.accent }}>{b.name}</div>
      {[["fbPageId", "FB Page ID"], ["fbToken", cur.fbToken === "••••set" ? "FB Token (set ✓ — बदलने पर ही भरें)" : "FB Page Token"], ["igUserId", "Instagram User ID"], ["waPhoneId", "WhatsApp Phone ID"], ["waRecipients", "WA Recipients (comma)"]].map(([k, ph]) => (
        <input key={k} value={f[k]} placeholder={ph} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="w-full bg-neutral-800 rounded-lg p-2 text-sm mb-2 outline-none" />
      ))}
      <div className="flex gap-2 mt-1">
        <button onClick={() => onSave(id, { ...f, waRecipients: f.waRecipients.split(",").map((s) => s.trim()).filter(Boolean) })} disabled={busy} style={{ background: b.accent }} className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save</button>
        <button onClick={() => onYT(id)} className="rounded-lg px-4 py-2 text-sm border border-neutral-700 text-neutral-300">▶ YouTube Connect {cur.ytRefreshToken === "••••set" ? "✓" : ""}</button>
      </div>
    </div>
  );
}
