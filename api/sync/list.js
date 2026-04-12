import { fetchRepoFile, listRepoDirectory } from "../../lib/github.js";
import { readSession } from "../../lib/session.js";

export default async function handler(req, res) {
  const session = readSession(req);
  if (!session?.accessToken) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }

  const repo = process.env.GITHUB_SYNC_REPO;
  const branch = process.env.GITHUB_SYNC_BRANCH || "main";
  const items = await listRepoDirectory({
    token: session.accessToken,
    repo,
    path: "data/profiles",
    ref: branch,
  });

  const profiles = [];
  for (const item of items) {
    if (item.type !== "file" || !item.name.endsWith(".json")) {
      continue;
    }
    const file = await fetchRepoFile({
      token: session.accessToken,
      repo,
      path: item.path,
      ref: branch,
    });
    if (!file) {
      continue;
    }
    const profile = JSON.parse(file.content);
    profiles.push({
      profile,
      sha: file.sha,
      path: item.path,
    });
  }

  res.status(200).json({ profiles });
}
