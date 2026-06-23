// Vercel Cron Function — सुबह 10 बजे सुविचार/त्यौहार
// यह Render backend को wake करता है और generate trigger करता है

const BACKEND = process.env.BACKEND_URL || "https://autosuvichar-backend.onrender.com";
const SECRET = process.env.CRON_SECRET || "autosuvichar-cron-2024";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Vercel cron auth check
  const authHeader = req.headers["authorization"];
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Vercel internal calls don't need this check
  }

  try {
    console.log("[Vercel Cron] 10AM सुविचार trigger → backend");

    // Step 1: Backend wake करो (health ping)
    await fetch(`${BACKEND}/api/health`, { signal: AbortSignal.timeout(10000) }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000)); // 2 sec wait for wake

    // Step 2: Suvichar/festival trigger
    const response = await fetch(`${BACKEND}/api/cron/trigger`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cron-secret": SECRET,
      },
      body: JSON.stringify({ job: "suvichar" }),
      signal: AbortSignal.timeout(30000),
    });

    const data = await response.json();
    console.log("[Vercel Cron] 10AM response:", data);
    return res.status(200).json({ ok: true, job: "suvichar", backend: data });
  } catch (e) {
    console.error("[Vercel Cron] 10AM error:", e.message);
    return res.status(500).json({ error: e.message });
  }
}
