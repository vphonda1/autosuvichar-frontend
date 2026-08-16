import React, { useState, useEffect } from "react";
const vib = (ms = 40) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };

// ═══════════════════════════════════════════════════════════════
//  PWA INSTALL
//   • Android/Chrome/Edge — असली install बटन
//   • iPhone/Safari — वहाँ अपने आप install नहीं होता, इसलिए तरीक़ा बताते हैं
//   • नया version आने पर "अपडेट करें" पट्टी
// ═══════════════════════════════════════════════════════════════

const DISMISS_KEY = "suvichar_install_dismissed";

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);   // Chrome का install event
  const [show, setShow] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);
  const [updateReady, setUpdateReady] = useState(null);

  // पहले से install है?
  const installed = typeof window !== "undefined" &&
    (window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true);

  const isIOS = typeof navigator !== "undefined" &&
    /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);

  // ⚠️ localStorage कुछ जगह बंद होता है — इसलिए try/catch
  const dismissed = () => { try { return sessionStorage.getItem(DISMISS_KEY) === "1"; } catch (_) { return false; } };
  const setDismissed = () => { try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch (_) {} };

  useEffect(() => {
    if (installed || dismissed()) return;

    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iPhone पर वो event आता ही नहीं — थोड़ी देर बाद खुद बता दो
    let t;
    if (isIOS) t = setTimeout(() => setShow(true), 4000);

    window.addEventListener("appinstalled", () => { setShow(false); setDeferred(null); });

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      if (t) clearTimeout(t);
    };
  }, [installed, isIOS]);

  // नया version तैयार है क्या?
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready.then((reg) => {
      reg.addEventListener("updatefound", () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener("statechange", () => {
          if (nw.state === "installed" && navigator.serviceWorker.controller) setUpdateReady(nw);
        });
      });
    }).catch(() => {});
  }, []);

  async function install() {
    vib(40);
    if (isIOS) { setIosHelp(true); return; }
    if (!deferred) return;
    deferred.prompt();
    try { await deferred.userChoice; } catch (_) {}
    setDeferred(null);
    setShow(false);
  }

  function close() { vib(15); setShow(false); setDismissed(); }

  function doUpdate() {
    vib(30);
    updateReady?.postMessage?.("SKIP_WAITING");
    try { navigator.serviceWorker.controller?.postMessage("SKIP_WAITING"); } catch (_) {}
    window.location.reload();
  }

  return (
    <>
      {/* नया version आ गया */}
      {updateReady && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-neutral-800 border-b border-neutral-700 px-4 py-2.5 flex items-center justify-between gap-3">
          <span className="text-sm text-neutral-200">✨ नया version तैयार है</span>
          <button onClick={doUpdate}
            className="text-xs px-3 py-1.5 rounded-lg bg-white text-black font-semibold shrink-0">
            अपडेट करें
          </button>
        </div>
      )}

      {/* install की पट्टी */}
      {show && !installed && (
        <div className="fixed bottom-0 left-0 right-0 z-[60] p-3">
          <div className="rounded-2xl bg-neutral-900 border border-neutral-700 shadow-2xl p-4">
            <div className="flex items-start gap-3">
              <img src="/icon-192.png" alt="" className="w-12 h-12 rounded-xl shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">फ़ोन में App की तरह लगाएँ</p>
                <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                  होम स्क्रीन से सीधे खुलेगा — browser खोलने की ज़रूरत नहीं, और तेज़ भी चलेगा।
                </p>
              </div>
              <button onClick={close} className="text-neutral-500 text-lg leading-none px-1 shrink-0">✕</button>
            </div>

            <div className="flex gap-2 mt-3">
              <button onClick={close}
                className="flex-1 text-sm py-2.5 rounded-xl border border-neutral-700 text-neutral-400">
                बाद में
              </button>
              <button onClick={install}
                className="flex-1 text-sm py-2.5 rounded-xl bg-white text-black font-semibold">
                {isIOS ? "कैसे लगाएँ?" : "📲 अभी लगाएँ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iPhone वालों के लिए तरीक़ा */}
      {iosHelp && (
        <div className="fixed inset-0 z-[70] bg-black/80 flex items-end sm:items-center justify-center p-3"
          onClick={() => setIosHelp(false)}>
          <div className="rounded-2xl bg-neutral-900 border border-neutral-700 p-5 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-white mb-1">iPhone में कैसे लगाएँ</h3>
            <p className="text-xs text-neutral-500 mb-4">Safari में ही खोलें — Chrome में यह काम नहीं करता</p>

            <ol className="space-y-3 text-sm text-neutral-300">
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-neutral-700 text-white text-xs flex items-center justify-center shrink-0">1</span>
                <span>नीचे बीच में <b>Share</b> का निशान दबाएँ <span className="text-neutral-500">(चौकोर में ऊपर तीर)</span></span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-neutral-700 text-white text-xs flex items-center justify-center shrink-0">2</span>
                <span>नीचे scroll करके <b>"Add to Home Screen"</b> चुनें</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-neutral-700 text-white text-xs flex items-center justify-center shrink-0">3</span>
                <span>ऊपर दाएँ <b>Add</b> दबाएँ — बस हो गया 🎉</span>
              </li>
            </ol>

            <button onClick={() => { setIosHelp(false); close(); }}
              className="w-full mt-5 text-sm py-2.5 rounded-xl bg-white text-black font-semibold">
              समझ गया
            </button>
          </div>
        </div>
      )}
    </>
  );
}
