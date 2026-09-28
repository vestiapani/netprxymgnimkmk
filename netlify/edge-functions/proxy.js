export default async (req, context) => {
  const url = new URL(req.url);
  const targetUrl = url.searchParams.get("url");

  if (!targetUrl) {
    return new Response(
      JSON.stringify({ error: "Missing target url parameter" }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }

  const spoofedHeaders = new Headers();
  try {
    const targetHost = new URL(targetUrl).hostname;
    spoofedHeaders.set("Host", targetHost);
    spoofedHeaders.set("Referer", `https://${targetHost}/`);
  } catch (e) {
    return new Response("Invalid target URL format", { status: 400 });
  }

  spoofedHeaders.set(
    "User-Agent",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
  );
  spoofedHeaders.set(
    "Accept",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  );
  spoofedHeaders.set("Accept-Language", "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7");
  spoofedHeaders.set(
    "Sec-Ch-Ua",
    '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
  );
  spoofedHeaders.set("Sec-Ch-Ua-Mobile", "?0");
  spoofedHeaders.set("Sec-Ch-Ua-Platform", '"Windows"');
  spoofedHeaders.set("Sec-Fetch-Dest", "document");
  spoofedHeaders.set("Sec-Fetch-Mode", "navigate");
  spoofedHeaders.set("Sec-Fetch-Site", "none");
  spoofedHeaders.set("Sec-Fetch-User", "?1");
  spoofedHeaders.set("Upgrade-Insecure-Requests", "1");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: spoofedHeaders,
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseHeaders = new Headers(response.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    responseHeaders.delete("x-frame-options");
    responseHeaders.delete("content-security-policy");
    responseHeaders.delete("set-cookie");

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    const isTimeout = error.name === "AbortError";
    return new Response(
      JSON.stringify({
        error: true,
        message: isTimeout ? "Gateway Timeout" : error.message,
      }),
      {
        status: isTimeout ? 504 : 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
};
