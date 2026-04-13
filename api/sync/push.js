import { fetchRepoFile, writeRepoFile } from "../../lib/github.js";
import { mergeProfiles, profilePath } from "../../lib/profiles.js";
import { withGitHubSession } from "../../lib/session.js";

export default async function handler(req, res) {
  const result = await withGitHubSession(req, res, async (session) => {
    const profile = req.body?.profile;
    if (!profile?.id) {
      return { status: 400, body: { error: "Missing profile payload." } };
    }

    const repo = process.env.GITHUB_SYNC_REPO;
    const branch = process.env.GITHUB_SYNC_BRANCH || "main";
    const path = profilePath(profile.id);
    const existing = await fetchRepoFile({
      token: session.accessToken,
      repo,
      path,
      ref: branch,
    });

    const mergedProfile = existing ? mergeProfiles(JSON.parse(existing.content), profile) : profile;
    const response = await writeRepoFile({
      token: session.accessToken,
      repo,
      path,
      branch,
      sha: existing?.sha,
      message: `Sync profile ${profile.name}`,
      content: JSON.stringify(mergedProfile, null, 2),
    });

    return {
      status: 200,
      body: {
        ok: true,
        sha: response.content?.sha || null,
        profile: mergedProfile,
      },
    };
  });

  if (!result.ok) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }
  res.status(result.value.status).json(result.value.body);
}
