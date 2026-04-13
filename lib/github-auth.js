const TOKEN_URL = "https://github.com/login/oauth/access_token";
const USER_URL = "https://api.github.com/user";
const ACCESS_TOKEN_TTL_FALLBACK_MS = 8 * 60 * 60 * 1000;

function getGitHubAppCredentials() {
  return {
    clientId: process.env.GITHUB_APP_CLIENT_ID,
    clientSecret: process.env.GITHUB_APP_CLIENT_SECRET,
  };
}

function assertGitHubAppCredentials() {
  const { clientId, clientSecret } = getGitHubAppCredentials();
  if (!clientId || !clientSecret) {
    throw new Error("Missing GitHub App client credentials.");
  }
  return { clientId, clientSecret };
}

function buildTokenPayload(tokenPayload, previousSession = {}) {
  const now = Date.now();
  const nextSession = {
    ...previousSession,
    accessToken: tokenPayload.access_token,
    tokenType: tokenPayload.token_type || previousSession.tokenType || "bearer",
  };

  if (typeof tokenPayload.expires_in === "number") {
    nextSession.accessTokenExpiresAt = now + tokenPayload.expires_in * 1000;
  } else if (!previousSession.accessTokenExpiresAt) {
    nextSession.accessTokenExpiresAt = now + ACCESS_TOKEN_TTL_FALLBACK_MS;
  }

  if (tokenPayload.refresh_token) {
    nextSession.refreshToken = tokenPayload.refresh_token;
  }
  if (typeof tokenPayload.refresh_token_expires_in === "number") {
    nextSession.refreshTokenExpiresAt = now + tokenPayload.refresh_token_expires_in * 1000;
  }

  return nextSession;
}

async function requestToken(body) {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json();
  if (!response.ok || payload.error || !payload.access_token) {
    const error = new Error(payload.error_description || payload.error || "GitHub token exchange failed.");
    error.status = response.status || 400;
    error.code = payload.error || "github_token_exchange_failed";
    throw error;
  }

  return payload;
}

export async function exchangeCodeForUserToken(code) {
  const { clientId, clientSecret } = assertGitHubAppCredentials();
  return requestToken({
    client_id: clientId,
    client_secret: clientSecret,
    code,
  });
}

export async function refreshUserAccessToken(refreshToken) {
  const { clientId, clientSecret } = assertGitHubAppCredentials();
  return requestToken({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
}

export async function fetchGitHubUser(accessToken) {
  const response = await fetch(USER_URL, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "protocol-dashboard",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    const error = new Error(`GitHub user lookup failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export function buildGitHubSession(tokenPayload, userPayload, previousSession = {}) {
  return {
    ...buildTokenPayload(tokenPayload, previousSession),
    githubLogin: userPayload?.login || previousSession.githubLogin || "",
  };
}

export function shouldRefreshAccessToken(session) {
  if (!session?.refreshToken || !session?.accessTokenExpiresAt) {
    return false;
  }
  return Date.now() >= session.accessTokenExpiresAt - 60 * 1000;
}

export async function refreshGitHubSession(session) {
  if (!session?.refreshToken) {
    return session;
  }
  const tokenPayload = await refreshUserAccessToken(session.refreshToken);
  return buildGitHubSession(tokenPayload, null, session);
}
