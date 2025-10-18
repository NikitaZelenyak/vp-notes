const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function uploadToStorage(
  path: string,
  file: Buffer | Uint8Array | Blob,
  contentType = "image/png"
) {
  if (!SUPABASE_URL || !SERVICE_KEY)
    throw new Error("Supabase env not configured");
  const url = `${SUPABASE_URL}/storage/v1/object/${path}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": contentType,
    },
    body: file as any,
  });
  if (!res.ok) throw new Error(`upload failed: ${res.status}`);
  return { path };
}

export async function deleteFromStorage(path: string) {
  if (!SUPABASE_URL || !SERVICE_KEY)
    throw new Error("Supabase env not configured");
  const url = `${SUPABASE_URL}/storage/v1/object/${path}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`delete failed: ${res.status} ${text}`);
  }
  return true;
}

export async function getSignedUrl(
  bucket: string,
  objectPath: string,
  expiresIn = 60 * 60
) {
  if (!SUPABASE_URL || !SERVICE_KEY)
    throw new Error("Supabase env not configured");
  const url = `${SUPABASE_URL}/storage/v1/object/sign/${bucket}/${encodeURIComponent(
    objectPath
  )}?expires_in=${expiresIn}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`getSignedUrl failed: ${res.status} ${text}`);
  }
  const payload = await res.json();
  // Normalise to a plain string URL. Supabase returns { signedURL } for this endpoint.
  let signed =
    payload &&
    (payload.signedURL || payload.signed_url || payload.signedUrl || null);
  if (!signed && typeof payload === "string") {
    signed = payload;
  }
  if (!signed) {
    throw new Error("unable to parse signed url from storage response");
  }
  const signedString = String(signed);
  if (signedString.startsWith("http://") || signedString.startsWith("https://")) {
    return signedString;
  }
  const normalisedPath = signedString.startsWith("/")
    ? signedString
    : `/${signedString}`;
  return `${SUPABASE_URL}${normalisedPath}`;
}
