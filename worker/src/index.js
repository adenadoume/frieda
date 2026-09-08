// Cloudflare Worker: accepts an authenticated image upload and stores it in R2.
// Mirrors the pattern used in the Seagonia project (worker/src/index.js there).

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
  };
}

function json(data, status, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(env) },
  });
}

function extensionFor(file) {
  const fromName = file.name?.match(/\.[a-zA-Z0-9]+$/)?.[0];
  if (fromName) return fromName.toLowerCase();
  const fromType = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif" };
  return fromType[file.type] || ".jpg";
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(env) });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, env);
    }

    const auth = request.headers.get("Authorization") || "";
    if (auth !== `Bearer ${env.UPLOAD_SECRET}`) {
      return json({ error: "Unauthorized" }, 401, env);
    }

    let formData;
    try {
      formData = await request.formData();
    } catch {
      return json({ error: "Invalid form data" }, 400, env);
    }

    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return json({ error: "Missing file" }, 400, env);
    }

    const key = `${crypto.randomUUID()}${extensionFor(file)}`;

    try {
      await env.IMAGES_BUCKET.put(key, file.stream(), {
        httpMetadata: { contentType: file.type || "image/jpeg" },
      });
    } catch (err) {
      return json({ error: `Upload failed: ${err.message}` }, 500, env);
    }

    return json({ url: `${env.PUBLIC_BASE_URL}/${key}` }, 200, env);
  },
};
