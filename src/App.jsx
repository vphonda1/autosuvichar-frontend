// ============================================================================
//  App.jsx — AutoSuVichar  (नया ढाँचा)
//  ---------------------------------------------------------------------------
//  पहले: 28 tabs एक ही लाइन में लिपटे हुए। हर काम ढूँढना पड़ता था।
//  अब:   5 हिस्से, नीचे की पट्टी में — अँगूठे की पहुँच में।
//
//      🏠 आज      — अभी क्या करना है (कुछ छूटे नहीं)
//      ✨ बनाओ     — सारे 9 poster editors + AI, एक ही जगह
//      🗓️ कैलेंडर  — महीने भर की योजना
//      📈 नतीजा    — कितना पहुँचा, कितने ग्राहक आए
//      ⚙️ सेटिंग   — बाक़ी सब (सिर्फ़ admin)
//
//  कोई feature हटाया नहीं गया — सिर्फ़ जगह पर रखा गया है।
// ============================================================================

import React, { useEffect, useState } from "react";
import { API_BASE, api, getToken, setToken, vib, Err, ADMIN } from "./shared.js";
import { BRANDS as BRAND_CFG, getBrand } from "./brands.js";

import InstallPrompt from "./InstallPrompt.jsx";
import Today from "./Today.jsx";
import Studio from "./Studio.jsx";
import GrowthCalendar from "./GrowthCalendar.jsx";
import Results from "./Results.jsx";
import SettingsHub from "./SettingsHub.jsx";

// ---------------------------------------------------------------- LOGIN
function Login({ onIn }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function go() {
    setErr(""); setBusy(true);
    try {
      const r = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password: pass }) });
      setToken(r.token); onIn(r.user);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-4" style={{ fontFamily: "system-ui" }}>
      <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-6">
        <h1 className="text-2xl font-bold mb-1">Auto<span className="text-red-500">SuVichar</span></h1>
        <p className="text-sm text-neutral-400 mb-5">शोरूम का प्रचार — एक ही जगह</p>
        <Err>{err}</Err>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email"
          autoComplete="username" className="w-full bg-neutral-800 rounded-lg p-2.5 text-sm mb-3 outline-none" />
        <input value={pass} onChange={(e) => setPass(e.target.value)} type="password" placeholder="password"
          autoComplete="current-password" onKeyDown={(e) => e.key === "Enter" && go()}
          className="w-full bg-neutral-800 rounded-lg p-2.5 text-sm mb-4 outline-none" />
        <button onClick={() => { vib(40); go(); }} disabled={busy}
          className="w-full rounded-lg py-2.5 font-semibold text-white bg-red-600 disabled:opacity-50">
          {busy ? "…" : "अन्दर आएँ"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- NAV
const SECTIONS = [
  { id: "today",    icon: "🏠", label: "आज" },
  { id: "studio",   icon: "✨", label: "बनाओ" },
  { id: "calendar", icon: "🗓️", label: "कैलेंडर" },
  { id: "results",  icon: "📈", label: "नतीजा" },
  { id: "settings", icon: "⚙️", label: "सेटिंग", adminOnly: true },
];

// ---------------------------------------------------------------- APP
export default function App() {
  const [user, setUser] = useState(null);
  const [brands, setBrands] = useState({});
  const [brandId, setBrandId] = useState(() => {
    try { return localStorage.getItem("asv_brand") || "vp_honda"; } catch (_) { return "vp_honda"; }
  });
  const [sec, setSec] = useState(() => {
    try {
      const t = new URLSearchParams(window.location.search).get("tab");
      return SECTIONS.some((s) => s.id === t) ? t : "today";
    } catch (_) { return "today"; }
  });
  const [err, setErr] = useState("");
  const [unread, setUnread] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [brandOpen, setBrandOpen] = useState(false);

  const brand = brands[brandId] || getBrand(brandId) || BRAND_CFG.vp_honda;
  const isAdmin = user && ADMIN.includes(user.role);
  const visible = SECTIONS.filter((s) => !s.adminOnly || isAdmin);

  useEffect(() => { if (getToken()) api("/api/auth/me").then(setUser).catch(() => setToken("")); }, []);
  useEffect(() => { if (user) api("/api/brands").then(setBrands).catch(() => {}); }, [user]);
  useEffect(() => { try { localStorage.setItem("asv_brand", brandId); } catch (_) {} }, [brandId]);

  // बिल्ला (badge) — कितना pending है, कितनी notification अनदेखी है
  async function refreshBadges() {
    if (!user) return;
    try {
      const [n, p] = await Promise.all([
        api("/api/notifications").catch(() => ({ unread: 0 })),
        api(`/api/content?brand=${brandId}&status=pending`).catch(() => []),
      ]);
      setUnread(n.unread || 0);
      setPendingCount(Array.isArray(p) ? p.length : 0);
    } catch (_) {}
  }
  useEffect(() => { refreshBadges(); /* eslint-disable-next-line */ }, [user, brandId, reloadKey]);

  // बच्चों से "कुछ बदला" आने पर सब ताज़ा कर दो
  const refresh = () => { setReloadKey((k) => k + 1); };

  function logout() { setToken(""); setUser(null); }

  if (!user) return <><Login onIn={setUser} /><InstallPrompt /></>;

  const shared = {
    apiBase: API_BASE, token: getToken(), brandId, brand, user, isAdmin,
    accent: brand.accent, onChange: refresh, reloadKey, setSec, setErr,
  };

  return (
    <div style={{
      fontFamily: "system-ui",
      paddingTop: "max(0.75rem, env(safe-area-inset-top))",
      paddingBottom: "calc(4.5rem + env(safe-area-inset-bottom))",
    }} className="min-h-screen bg-neutral-950 text-neutral-100">

      <InstallPrompt />

      {/* ── ऊपर की पट्टी: brand + नाम ──────────────────────────────── */}
      <header className="px-4 pb-3 max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-2">
          <button onClick={() => { vib(15); setBrandOpen(!brandOpen); }}
            className="flex items-center gap-2 rounded-full border px-3 py-1.5 bg-neutral-900"
            style={{ borderColor: brand.accent + "66" }}>
            <span className="w-2 h-2 rounded-full" style={{ background: brand.accent }} />
            <span className="text-sm font-semibold" style={{ color: brand.accent }}>{brand.name}</span>
            <span className="text-neutral-600 text-xs">{brandOpen ? "▴" : "▾"}</span>
          </button>

          <div className="flex items-center gap-3 text-xs text-neutral-500">
            <span className="truncate max-w-[7rem]">{user.name || user.email}</span>
            <button onClick={logout} className="underline">बाहर</button>
          </div>
        </div>

        {/* brand बदलें — खुलने पर ही दिखे, वरना जगह न घेरे */}
        {brandOpen && (
          <div className="mt-2 grid gap-1.5">
            {Object.entries(brands).map(([id, b]) => (
              <button key={id} onClick={() => { vib(); setBrandId(id); setBrandOpen(false); }}
                className="flex items-center gap-3 text-left rounded-xl border px-3 py-2.5 bg-neutral-900"
                style={{ borderColor: brandId === id ? b.accent : "#262626" }}>
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: b.accent }} />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold" style={{ color: brandId === id ? b.accent : "#e5e5e5" }}>{b.name}</span>
                  <span className="block text-[11px] text-neutral-500 truncate">{b.sub}</span>
                </span>
                {brandId === id && <span className="text-xs" style={{ color: b.accent }}>✓</span>}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── बीच का हिस्सा ──────────────────────────────────────────── */}
      <main className="px-4 max-w-3xl mx-auto">
        <Err onClose={() => setErr("")}>{err}</Err>

        {sec === "today"    && <Today    {...shared} unread={unread} />}
        {sec === "studio"   && <Studio   {...shared} />}
        {sec === "calendar" && (
          <GrowthCalendar apiBase={API_BASE} token={getToken()} brandId={brandId}
            accent={brand.accent} onChange={refresh} />
        )}
        {sec === "results"  && <Results  {...shared} />}
        {sec === "settings" && isAdmin && <SettingsHub {...shared} brands={brands} />}
      </main>

      {/* ── नीचे की पट्टी ─────────────────────────────────────────── */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-neutral-950/95 backdrop-blur border-t border-neutral-800"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="max-w-3xl mx-auto flex">
          {visible.map((s) => {
            const on = sec === s.id;
            const badge = s.id === "today" ? unread + pendingCount : 0;
            return (
              <button key={s.id} onClick={() => { vib(15); setSec(s.id); setBrandOpen(false); }}
                className="flex-1 flex flex-col items-center gap-0.5 py-2.5 relative">
                <span className="text-lg leading-none" style={{ opacity: on ? 1 : 0.45 }}>{s.icon}</span>
                <span className="text-[10px]" style={{ color: on ? brand.accent : "#525252", fontWeight: on ? 600 : 400 }}>
                  {s.label}
                </span>
                {badge > 0 && (
                  <span className="absolute top-1.5 right-[22%] text-[9px] min-w-[15px] h-[15px] px-1 rounded-full bg-red-600 text-white flex items-center justify-center font-semibold">
                    {badge > 99 ? "99" : badge}
                  </span>
                )}
                {on && <span className="absolute top-0 inset-x-[30%] h-0.5 rounded-full" style={{ background: brand.accent }} />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
