import { readSession } from "../lib/session.js";

export default async function handler(req, res) {
  const session = readSession(req);
  res.status(200).json({
    authenticated: Boolean(session?.accessToken),
    profile: session?.githubLogin ? { githubLogin: session.githubLogin } : null,
  });
}

