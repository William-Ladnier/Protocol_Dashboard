import { clearSessionCookie, createSessionCookie, getCookieName, parseCookies, verifySignedValue } from "./cookies.js";

export function readSession(req) {
  const secret = process.env.SESSION_SECRET;
  const cookies = parseCookies(req.headers.cookie || "");
  const raw = cookies[getCookieName()];
  const value = verifySignedValue(raw, secret);
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export function writeSession(res, payload) {
  const secret = process.env.SESSION_SECRET;
  const value = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  res.setHeader("Set-Cookie", createSessionCookie(value, secret));
}

export function destroySession(res) {
  res.setHeader("Set-Cookie", clearSessionCookie());
}

