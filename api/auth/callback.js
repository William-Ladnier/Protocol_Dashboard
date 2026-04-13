import { buildGitHubSession, exchangeCodeForUserToken, fetchGitHubUser } from "../../lib/github-auth.js";
import { writeSession } from "../../lib/session.js";

export default async function handler(req, res) {
  const code = req.query.code;
  const clientId = process.env.GITHUB_APP_CLIENT_ID;
  const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET;

  if (!code || !clientId || !clientSecret) {
    res.status(400).send("Missing OAuth callback parameters.");
    return;
  }

  try {
    const tokenPayload = await exchangeCodeForUserToken(code);
    const userPayload = await fetchGitHubUser(tokenPayload.access_token);

    writeSession(res, buildGitHubSession(tokenPayload, userPayload));
  } catch (error) {
    res.status(error?.status || 400).send(error.message || "GitHub token exchange failed.");
    return;
  }

  res.writeHead(302, { Location: "/" });
  res.end();
}
