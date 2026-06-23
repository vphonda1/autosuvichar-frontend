// Vercel Cron Function — शाम 8 बजे Delivery Photos

const BACKEND = process.env.BACKEND_URL || "https://autosuvichar-backend.onrender.com";
const SECRET = process.env.CRON_SECRET || "autosuvichar-cron-2024";

export default async function handler(req, res) {
  try {
    console.log("[Vercel Cron] 8PM Delivery trigger → backend");

    await fetch(`${BACKEND}/api/health`, { signal: AbortSignal.timeout(10000) }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000));

    const response = await fetch(`${BACKEND}/api/cron/trigger`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cron-secret": SECRET,
      },
      body: JSON.stringify({ job: "delivery" }),
      signal: AbortSignal.timeout(30000),
    });

    const data = await response.json();
    console.log("[Vercel Cron] 8PM response:", data);
    return res.status(200).json({ ok: true, job: "delivery", backend: data });
  } catch (e) {
    console.error("[Vercel Cron] 8PM error:", e.message);
    return res.status(500).json({ error: e.message });
  }
}
