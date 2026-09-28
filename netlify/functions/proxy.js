const fetchAPI = async (endpoint) => {
  const fullUrl = `${SHINIGAMI_BASE_URL}${endpoint}`;
  const proxyUrl = buildProxyUrl(fullUrl);

  try {
    const res = await fetch(proxyUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
      },
    });

    if (!res.ok) throw new Error(`API Error: ${res.status}`);

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
      throw new Error("Terjebak WAF/Cloudflare HTML");
    }

    const data = await res.json(); // ← cukup sekali

    console.log(
      `📦 [DEBUG API ${endpoint}]`,
      JSON.stringify(data).substring(0, 200),
    );

    return data; // ← return variable-nya, bukan res.json() lagi
  } catch (error) {
    console.error(`Fetch API Error (${endpoint}):`, error.message);
    return null;
  }
};
