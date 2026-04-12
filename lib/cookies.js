import crypto from "node:crypto";

const COOKIE_NAME = "protocol_dashboard_session";

export function getCookieName() {
  return COOKIE_NAME;
}

export function parseCookies(header = "") {
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      }),
  );
}

export function signValue(value, secret) {
  const signature = crypto.createHmac("sha256", secret).update(value).digest("hex");
  return `${value}.${signature}`;
}

export function verifySignedValue(raw, secret) {
  if (!raw || !secret) {
    return null;
  }
  const lastDot = raw.lastIndexOf(".");
  if (lastDot === -1) {
    return null;
  }
  const value = raw.slice(0, lastDot);
  const signature = raw.slice(lastDot + 1);
  const expected = crypto.createHmac("sha256", secret).update(value).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected)) ? value : null;
}

export function createSessionCookie(value, secret) {
  const signed = signValue(value, secret);
  return `${COOKIE_NAME}=${encodeURIComponent(signed)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

