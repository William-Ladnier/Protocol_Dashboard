import { fetchRepoFile } from "../../lib/github.js";
import { profilePath } from "../../lib/profiles.js";
import { readSession } from "../../lib/session.js";

export default async function handler(req, res) {
  const session = readSession(req);
  if (!session?.accessToken) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }

  const profileId = req.query.profileId;
  if (!profileId) {
    res.status(400).json({ error: "Missing profileId." });
    return;
  }

  const repo = process.env.GITHUB_SYNC_REPO;
  const branch = process.env.GITHUB_SYNC_BRANCH || "main";
  const file = await fetchRepoFile({
    token: session.accessToken,
    repo,
    path: profilePath(profileId),
    ref: branch,
  });

  if (!file) {
    res.status(200).json({ profile: null, sha: null });
    return;
  }

  res.status(200).json({
    profile: JSON.parse(file.content),
    sha: file.sha,
  });
}
