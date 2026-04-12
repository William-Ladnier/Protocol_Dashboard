import { writeSession } from "../../lib/session.js";

export default async function handler(req, res) {
  const code = req.query.code;
  const clientId = process.env.GITHUB_APP_CLIENT_ID;
  const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET;

  if (!code || !clientId || !clientSecret) {
    res.status(400).send("Missing OAuth callback parameters.");
    return;
  }

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  const tokenPayload = await tokenResponse.json();
  if (!tokenPayload.access_token) {
    res.status(400).send("GitHub token exchange failed.");
    return;
  }

  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${tokenPayload.access_token}`,
      "User-Agent": "protocol-dashboard",
    },
  });
  const userPayload = await userResponse.json();

  writeSession(res, {
    accessToken: tokenPayload.access_token,
    githubLogin: userPayload.login || "",
  });

  res.writeHead(302, { Location: "/" });
  res.end();
}
