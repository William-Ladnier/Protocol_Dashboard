import { clearSessionCookie, createSessionCookie, getCookieName, parseCookies, verifySignedValue } from "./cookies.js";
import { refreshGitHubSession, shouldRefreshAccessToken } from "./github-auth.js";

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

export async function getGitHubSession(req, res) {
  const session = readSession(req);
  if (!session?.accessToken) {
    return null;
  }

  if (!shouldRefreshAccessToken(session)) {
    return session;
  }

  try {
    const refreshedSession = await refreshGitHubSession(session);
    writeSession(res, refreshedSession);
    return refreshedSession;
  } catch {
    destroySession(res);
    return null;
  }
}

export async function withGitHubSession(req, res, operation) {
  let session = await getGitHubSession(req, res);
  if (!session?.accessToken) {
    return { ok: false, reason: "unauthenticated" };
  }

  try {
    return { ok: true, value: await operation(session) };
  } catch (error) {
    const isAuthFailure = error?.status === 401;
    if (!isAuthFailure || !session.refreshToken) {
      throw error;
    }

    try {
      session = await refreshGitHubSession(session);
      writeSession(res, session);
    } catch {
      destroySession(res);
      return { ok: false, reason: "unauthenticated" };
    }

    return { ok: true, value: await operation(session) };
  }
}
