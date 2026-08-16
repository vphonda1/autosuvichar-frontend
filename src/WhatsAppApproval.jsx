import React, { useState, useEffect } from "react";
import { getBrand, BRAND_IDS } from "./brands.js";
const vib = (ms = 40) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };

// ═══════════════════════════════════════════════════════════════
//  WHATSAPP APPROVAL
//  रोज़ का तैयार content सीधे आपके WhatsApp पर — वहीं से भेजो/रोको
//  तीनों brands के लिए अलग-अलग नंबर और अलग सेटिंग
// ═══════════════════════════════════════════════════════════════

const card = "rounded-2xl bg-neutral-900 border border-neutral-800 p-4";
const inp = "w-full bg-neutral-800 rounded-lg p-2.5 text-sm outline-none border border-neutral-700 text-white";
const lbl = "text-xs text-neutral-400 mb-1";

function Toggle({ on, onClick, accent }) {
  return (
    <button onClick={onClick} className="w-12 h-6 rounded-full relative transition-colors shrink-0"
      style={{ background: on ? accent : "#3a3a3a" }}>
      <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
        style={{ left: on ? "26px" : "2px" }} />
    </button>
  );
}

export default function WhatsAppApproval({ apiBase, token }) {
  const H = { "Content-Type": "application/json", Authorization: "Bearer " + token };
  const [data, setData] = useState(null);
  const [nums, setNums] = useState({});
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(BRAND_IDS[0]);

  async function api(url, opts) {
    const r = await fetch(apiBase + url, { headers: H, ...opts });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "Error");
    return j;
  }

  async function load() {
    try {
      const j = await api("/api/wa-approval");
      setData(j);
      const n = {};
      for (const id of BRAND_IDS) n[id] = (j.brands?.[id]?.numbers || []).join(", ");
      setNums(n);
    } catch (e) { setErr(e.message); }
  }
  useEffect(() => { load(); }, [apiBase]);

  async function save(brand, patch) {
    setErr(""); setNote(""); vib(25);
    try {
      await api("/api/wa-approval", { method: "PATCH", body: JSON.stringify({ brand, ...patch }) });
      await load();
      setNote("✅ सेव हो गया");
    } catch (e) { setErr(e.message); }
  }

  async function act(brand, path, label) {
    setErr(""); setNote(""); setBusy(label); vib(40);
    try {
      const j = await api(path, { method: "POST", body: JSON.stringify({ brand }) });
      setNote(j.message || "हो गया");
      await load();
    } catch (e) { setErr(e.message); }
    setBusy("");
  }

  return (
    <div className="space-y-3">
      {/* समझाइश */}
      <div className="rounded-2xl border border-green-900/60 bg-green-950/25 p-3">
        <p className="text-sm text-green-100 font-semibold mb-1">📱 App खोलने की ज़रूरत नहीं</p>
        <p className="text-xs text-green-100/75 leading-relaxed">
          हर रोज़ जो भी बनेगा — सुविचार, गाड़ी का प्रचार, प्रमोशन वीडियो, डिलीवरी पोस्ट —
          सब सीधे आपके WhatsApp पर आ जाएगा। नीचे तीन बटन होंगे:
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="text-[11px] px-2 py-1 rounded-lg bg-green-900/50 text-green-100">✅ भेज दो</span>
          <span className="text-[11px] px-2 py-1 rounded-lg bg-red-900/40 text-red-100">❌ रहने दो</span>
          <span className="text-[11px] px-2 py-1 rounded-lg bg-neutral-700 text-neutral-200">📥 मैं भेजूँगा</span>
        </div>
        <p className="text-xs text-green-100/60 mt-2 leading-relaxed">
          "📥 मैं भेजूँगा" दबाने पर file का link और caption आपको मिल जाएगा — खुद जहाँ चाहें भेज दीजिए।
        </p>
      </div>

      {err && <div className="text-sm bg-red-950/60 border border-red-800 text-red-200 rounded-lg px-3 py-2">{err}</div>}
      {note && <div className="text-sm bg-green-950/50 border border-green-800 text-green-200 rounded-lg px-3 py-2">{note}</div>}
      {busy && <div className="text-sm bg-neutral-800 rounded-lg px-3 py-2 text-neutral-300">⏳ {busy}</div>}

      {BRAND_IDS.map((id) => {
        const B = getBrand(id);
        const c = data?.brands?.[id] || {};
        const isOpen = open === id;
        return (
          <div key={id} className={card} style={{ borderColor: c.enabled ? B.accent + "77" : "#2a2a2a" }}>
            <button onClick={() => { vib(15); setOpen(isOpen ? null : id); }}
              className="w-full flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-bold" style={{ color: B.accent }}>{B.name}</p>
                <p className="text-[11px] text-neutral-500">
                  {!c.ready ? "⚠️ WhatsApp सेटिंग अधूरी" :
                    c.enabled ? `चालू · ${(c.numbers || []).length} नंबर · ${c.sentCount || 0} भेजे` : "बंद"}
                </p>
              </div>
              <span className="text-neutral-500 text-sm">{isOpen ? "▲" : "▼"}</span>
            </button>

            {isOpen && (
              <div className="mt-4 space-y-3 border-t border-neutral-800 pt-4">
                {!c.ready && (
                  <p className="text-xs text-amber-300/80 leading-relaxed bg-amber-950/30 rounded-lg p-2.5">
                    ⚠️ पहले <b>Settings</b> tab में इस brand का <b>waPhoneId</b> और <b>waToken</b> भरिए,
                    तभी WhatsApp चालू हो पाएगा।
                  </p>
                )}

                <div>
                  <p className={lbl}>आपका WhatsApp नंबर (कई हों तो comma से अलग करें)</p>
                  <input className={inp} value={nums[id] ?? ""} inputMode="numeric"
                    placeholder="9713394738"
                    onChange={(e) => setNums((x) => ({ ...x, [id]: e.target.value }))}
                    onBlur={() => save(id, { numbers: nums[id] })} />
                  <p className="text-[11px] text-neutral-600 mt-1">
                    10 अंक लिखिए, 91 अपने आप लग जाएगा। ज़्यादा से ज़्यादा 5 नंबर।
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-200 font-medium">WhatsApp पर भेजना चालू</span>
                  <Toggle on={!!c.enabled} accent={B.accent}
                    onClick={() => save(id, { enabled: !c.enabled })} />
                </div>

                {c.enabled && (<>
                  {/* आपको क्या-क्या आए */}
                  <div className="space-y-2.5 border-t border-neutral-800 pt-3">
                    <p className="text-[11px] text-neutral-500 uppercase tracking-wide">आपको क्या आए</p>
                    {[["sendPosters", "पोस्टर"], ["sendVideos", "वीडियो"],
                      ["sendDeliveries", "डिलीवरी पोस्ट"], ["leadAlert", "नया lead आते ही खबर"],
                      ["monthlyReport", "हर महीने का हिसाब"],
                      ["voiceCommands", "बोलकर command (voice note)"]].map(([k, label]) => (
                      <div key={k} className="flex items-center justify-between">
                        <span className="text-sm text-neutral-300">{label}</span>
                        <Toggle on={c[k] !== false} accent={B.accent} onClick={() => save(id, { [k]: !(c[k] !== false) })} />
                      </div>
                    ))}
                  </div>

                  {/* ⚠️ ग्राहक को सीधे — दोनों डिफ़ॉल्ट बंद */}
                  <div className="space-y-2.5 border-t border-neutral-800 pt-3">
                    <p className="text-[11px] text-amber-400/80 uppercase tracking-wide">ग्राहक को सीधे भेजना</p>

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-neutral-300">डिलीवरी photo ग्राहक को भेजो</p>
                        <p className="text-[11px] text-neutral-500">approve करते ही उसके नंबर पर चली जाएगी</p>
                      </div>
                      <Toggle on={c.sendToCustomer === true} accent={B.accent}
                        onClick={() => save(id, { sendToCustomer: !c.sendToCustomer })} />
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-neutral-300">नए lead को अपने आप जवाब</p>
                        <p className="text-[11px] text-neutral-500">"धन्यवाद, हमारी टीम संपर्क करेगी"</p>
                      </div>
                      <Toggle on={c.leadAutoReply === true} accent={B.accent}
                        onClick={() => save(id, { leadAutoReply: !c.leadAutoReply })} />
                    </div>

                    {(c.sendToCustomer || c.leadAutoReply) && (
                      <p className="text-[11px] text-amber-300/75 leading-relaxed bg-amber-950/25 rounded-lg p-2.5">
                        ⚠️ WhatsApp का नियम: अगर ग्राहक ने पिछले <b>24 घंटे</b> में आपको message नहीं किया,
                        तो सीधा message नहीं जाता। ऐसे में वो message <b>आपके पास</b> आ जाएगा —
                        copy करके खुद भेज दीजिएगा। (चाहें तो Meta से approved template बनवा लें,
                        फिर हर बार सीधे चला जाएगा।)
                      </p>
                    )}
                  </div>

                  <div className="border-t border-neutral-800 pt-3">
                    <p className={lbl}>इस समय के बीच कोई message न आए (रात में शांति)</p>
                    <div className="flex items-center gap-2">
                      <input type="time" className={inp} value={c.quietFrom || "22:00"}
                        onChange={(e) => save(id, { quietFrom: e.target.value })} />
                      <span className="text-neutral-500 text-sm">से</span>
                      <input type="time" className={inp} value={c.quietTo || "07:00"}
                        onChange={(e) => save(id, { quietTo: e.target.value })} />
                    </div>
                  </div>

                  {(c.waiting > 0 || c.answered > 0) && (
                    <div className="flex gap-3 text-center border-t border-neutral-800 pt-3">
                      <div className="flex-1 rounded-xl bg-neutral-800/60 p-2">
                        <p className="text-xl font-bold text-amber-400">{c.waiting}</p>
                        <p className="text-[11px] text-neutral-500">जवाब का इंतज़ार</p>
                      </div>
                      <div className="flex-1 rounded-xl bg-neutral-800/60 p-2">
                        <p className="text-xl font-bold" style={{ color: B.accent }}>{c.answered}</p>
                        <p className="text-[11px] text-neutral-500">जवाब मिले</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button onClick={() => act(id, "/api/wa-approval/test", "test भेज रहे हैं…")} disabled={!!busy}
                      className="text-xs py-2.5 rounded-lg border border-neutral-700 text-neutral-300 disabled:opacity-50">
                      📨 Test message
                    </button>
                    <button onClick={() => act(id, "/api/wa-approval/push", "पोस्ट भेज रहे हैं…")} disabled={!!busy}
                      className="text-xs py-2.5 rounded-lg text-white disabled:opacity-50" style={{ background: B.accent }}>
                      📤 बची पोस्ट भेजो
                    </button>
                  </div>
                  <button onClick={() => act(id, "/api/wa-approval/report", "रिपोर्ट भेज रहे हैं…")} disabled={!!busy}
                    className="w-full text-xs py-2.5 rounded-lg border border-neutral-700 text-neutral-300 disabled:opacity-50">
                    📊 महीने का हिसाब अभी भेजो
                  </button>
                </>)}
              </div>
            )}
          </div>
        );
      })}

      {/* WhatsApp से क्या-क्या लिख सकते हैं */}
      <div className={card}>
        <h3 className="text-sm font-semibold text-neutral-300 mb-2">WhatsApp पर ये भी लिख सकते हैं</h3>
        <div className="space-y-1.5 text-xs text-neutral-400">
          <p><b className="text-neutral-200">A7 हाँ</b> — कोड बताकर भेजने को कहें</p>
          <p><b className="text-neutral-200">बाकी</b> — जो पोस्ट बची हैं वो मँगाएँ</p>
          <p><b className="text-neutral-200">हिसाब</b> — इस महीने का हिसाब</p>
          <p><b className="text-neutral-200">मदद</b> — सारी बातें एक बार में</p>
          <p className="pt-1.5 border-t border-neutral-800 mt-2">
            🎙️ <b className="text-neutral-200">voice note भेजिए</b> — जैसे
            <i> "आज Shine का ऑफर पोस्ट बनाओ"</i> — पोस्ट बनकर वापस आ जाएगी
          </p>
        </div>
      </div>

      {data?.webhookUrl && (
        <div className={card}>
          <p className={lbl}>Meta के webhook में यह URL डला होना चाहिए</p>
          <p className="text-[11px] text-neutral-400 break-all bg-neutral-800 rounded-lg p-2">{data.webhookUrl}</p>
          <p className="text-[11px] text-neutral-600 mt-1.5 leading-relaxed">
            बटन का जवाब आने के लिए यह ज़रूरी है। Meta डैशबोर्ड में
            <b> messages</b> field subscribe होना चाहिए।
          </p>
        </div>
      )}

      <p className="text-[11px] text-neutral-600 leading-relaxed">
        ℹ️ ये message सिर्फ़ आपको आते हैं, ग्राहकों को नहीं। आप जब तक ✅ नहीं दबाएँगे,
        कोई पोस्ट कहीं नहीं जाएगी। 48 घंटे में जवाब न दें तो वो अपने आप हट जाती है
        (Review में फिर भी बनी रहती है)।
      </p>
    </div>
  );
}
