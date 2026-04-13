import { fetchRepoFile, listRepoDirectory } from "../../lib/github.js";
import { withGitHubSession } from "../../lib/session.js";

export default async function handler(req, res) {
  const result = await withGitHubSession(req, res, async (session) => {
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

    return { status: 200, body: { profiles } };
  });

  if (!result.ok) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }
  res.status(result.value.status).json(result.value.body);
}
