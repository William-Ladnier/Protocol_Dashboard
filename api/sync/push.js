import { fetchRepoFile, writeRepoFile } from "../../lib/github.js";
import { mergeProfiles, profilePath } from "../../lib/profiles.js";
import { readSession } from "../../lib/session.js";

export default async function handler(req, res) {
  const session = readSession(req);
  if (!session?.accessToken) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }

  const profile = req.body?.profile;
  if (!profile?.id) {
    res.status(400).json({ error: "Missing profile payload." });
    return;
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

  res.status(200).json({
    ok: true,
    sha: response.content?.sha || null,
    profile: mergedProfile,
  });
}
