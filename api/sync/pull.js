import { fetchRepoFile } from "../../lib/github.js";
import { profilePath } from "../../lib/profiles.js";
import { withGitHubSession } from "../../lib/session.js";

export default async function handler(req, res) {
  const result = await withGitHubSession(req, res, async (session) => {
    const profileId = req.query.profileId;
    if (!profileId) {
      return { status: 400, body: { error: "Missing profileId." } };
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
      return { status: 200, body: { profile: null, sha: null } };
    }

    return {
      status: 200,
      body: {
        profile: JSON.parse(file.content),
        sha: file.sha,
      },
    };
  });

  if (!result.ok) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }
  res.status(result.value.status).json(result.value.body);
}
