// Vercel Cron Function — सुबह 11 बजे विज्ञापन

const BACKEND = process.env.BACKEND_URL || "https://autosuvichar-backend.onrender.com";
const SECRET = process.env.CRON_SECRET || "autosuvichar-cron-2024";

export default async function handler(req, res) {
  try {
    console.log("[Vercel Cron] 11AM विज्ञापन trigger → backend");

    await fetch(`${BACKEND}/api/health`, { signal: AbortSignal.timeout(10000) }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000));

    const response = await fetch(`${BACKEND}/api/cron/trigger`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cron-secret": SECRET,
      },
      body: JSON.stringify({ job: "promo" }),
      signal: AbortSignal.timeout(30000),
    });

    const data = await response.json();
    console.log("[Vercel Cron] 11AM response:", data);
    return res.status(200).json({ ok: true, job: "promo", backend: data });
  } catch (e) {
    console.error("[Vercel Cron] 11AM error:", e.message);
    return res.status(500).json({ error: e.message });
  }
}
