const API_ROOT = "https://api.github.com";

function authHeaders(token) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "User-Agent": "protocol-dashboard",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export async function fetchRepoFile({ token, repo, path, ref }) {
  const url = `${API_ROOT}/repos/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(ref)}`;
  const response = await fetch(url, { headers: authHeaders(token) });

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`GitHub fetch failed: ${response.status}`);
  }

  const payload = await response.json();
  return {
    sha: payload.sha,
    content: Buffer.from(payload.content, "base64").toString("utf8"),
  };
}

export async function writeRepoFile({ token, repo, path, branch, content, sha, message }) {
  const url = `${API_ROOT}/repos/${repo}/contents/${encodeURIComponent(path)}`;
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      branch,
      sha,
      content: Buffer.from(content, "utf8").toString("base64"),
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub write failed: ${response.status}`);
  }

  return response.json();
}

export async function listRepoDirectory({ token, repo, path, ref }) {
  const url = `${API_ROOT}/repos/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(ref)}`;
  const response = await fetch(url, { headers: authHeaders(token) });

  if (response.status === 404) {
    return [];
  }
  if (!response.ok) {
    throw new Error(`GitHub directory listing failed: ${response.status}`);
  }

  const payload = await response.json();
  return Array.isArray(payload) ? payload : [];
}
