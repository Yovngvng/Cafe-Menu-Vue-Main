export default async function handler(req, res) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    res.status(500).json({ ok: false, error: "missing supabase env" });
    return;
  }

  try {
    const ping = await fetch(`${url}/rest/v1/rpc/keepalive`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    });

    res.status(ping.ok ? 200 : 502).json({
      ok: ping.ok,
      via: "keepalive",
      status: ping.status,
    });
  } catch (error) {
    res.status(502).json({ ok: false, error: String(error) });
  }
}
