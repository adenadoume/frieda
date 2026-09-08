// Uploads a file to the Cloudflare Worker (see worker/) which stores it in R2
// and returns a public URL. Mirrors the pattern used in the Seagonia project.
export async function uploadImage(file) {
  const workerUrl = import.meta.env.VITE_UPLOAD_WORKER_URL;
  const secret = import.meta.env.VITE_UPLOAD_SECRET;

  if (!workerUrl || !secret) {
    throw new Error("Image upload isn't configured yet (VITE_UPLOAD_WORKER_URL / VITE_UPLOAD_SECRET missing)");
  }

  const formData = new FormData();
  formData.append("file", file, file.name);

  const res = await fetch(workerUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Upload failed (${res.status})`);
  }

  const { url } = await res.json();
  return url;
}
