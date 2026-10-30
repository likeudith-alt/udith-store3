import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";

// Netlify Blobs = built-in storage. No extra account or database needed.
export const dataStore = () => getStore({ name: "udith-store", consistency: "strong" });
export const imgStore = () => getStore({ name: "udith-images", consistency: "strong" });

export const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

// ---- admin login (password lives in the Netlify env var ADMIN_PASSWORD) ----
const secret = () => process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
const sign = (payload) => crypto.createHmac("sha256", secret()).update(payload).digest("base64url");

export function makeToken(hours = 12) {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + hours * 3600e3 })).toString("base64url");
  return payload + "." + sign(payload);
}

export function verifyToken(token) {
  if (!secret() || !token) return false;
  const [payload, sig] = String(token).split(".");
  if (!payload || !sig) return false;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(payload));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()).exp > Date.now();
  } catch {
    return false;
  }
}

export const isAdmin = (req) => verifyToken((req.headers.get("authorization") || "").replace(/^Bearer\s+/i, ""));

export function checkPassword(pw) {
  const real = process.env.ADMIN_PASSWORD || "";
  if (!real) return false;
  const h = (s) => crypto.createHash("sha256").update(String(s)).digest();
  return crypto.timingSafeEqual(h(pw), h(real));
}
