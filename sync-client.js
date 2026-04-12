(function () {
  const root = document.querySelector(".hero-actions");
  if (!root) {
    return;
  }

  const group = document.createElement("div");
  group.className = "sync-actions";
  group.innerHTML = `
    <button class="secondary" id="signInGitHubButton" type="button">Sign in with GitHub</button>
    <button class="secondary" id="syncNowButton" type="button" disabled>Sync now</button>
    <button class="secondary" id="pullProfilesButton" type="button" disabled>Pull profiles</button>
    <button class="secondary" id="signOutGitHubButton" type="button" hidden>Sign out</button>
    <p class="muted" id="syncStatusText">Sync backend not connected yet.</p>
  `;
  root.appendChild(group);

  const signInButton = document.getElementById("signInGitHubButton");
  const signOutButton = document.getElementById("signOutGitHubButton");
  const syncButton = document.getElementById("syncNowButton");
  const pullButton = document.getElementById("pullProfilesButton");
  const statusText = document.getElementById("syncStatusText");
  let attemptedAutoPull = false;

  async function pullProfiles({ silent = false } = {}) {
    if (!window.protocolDashboardApp) {
      return;
    }
    if (!silent) {
      statusText.textContent = "Pulling remote profiles...";
    }
    try {
      const response = await fetch("/api/sync/list");
      if (!response.ok) {
        throw new Error("List failed");
      }
      const payload = await response.json();
      let importedCount = 0;
      payload.profiles.forEach((item) => {
        if (window.protocolDashboardApp.importRemoteProfile(item.profile)) {
          importedCount += 1;
        }
      });
      if (!silent || importedCount > 0) {
        statusText.textContent =
          importedCount > 0
            ? `Pulled ${importedCount} profile${importedCount === 1 ? "" : "s"} from GitHub.`
            : "No new profile data was pulled.";
      }
    } catch {
      if (!silent) {
        statusText.textContent = "Pull failed. Check auth/configuration.";
      }
    }
  }

  async function refreshSession() {
    try {
      const response = await fetch("/api/session");
      if (!response.ok) {
        throw new Error("No sync session");
      }
      const payload = await response.json();
      if (payload.authenticated) {
        statusText.textContent = `Signed in to GitHub as ${payload.profile.githubLogin}.`;
        signInButton.hidden = true;
        signOutButton.hidden = false;
        syncButton.disabled = false;
        pullButton.disabled = false;
        if (!attemptedAutoPull) {
          attemptedAutoPull = true;
          const profiles = window.protocolDashboardApp?.getProfiles?.() || [];
          const hasOnlyEmptyDefault =
            profiles.length === 1 &&
            profiles[0].name === "Default profile" &&
            Array.isArray(profiles[0].entries) &&
            profiles[0].entries.length === 0;
          if (hasOnlyEmptyDefault) {
            await pullProfiles({ silent: false });
          }
        }
      } else {
        statusText.textContent = "Sign in with GitHub to enable repo-backed sync.";
        signInButton.hidden = false;
        signOutButton.hidden = true;
        syncButton.disabled = true;
        pullButton.disabled = true;
      }
    } catch {
      statusText.textContent = "Sync backend not connected yet.";
      signInButton.hidden = false;
      signOutButton.hidden = true;
      syncButton.disabled = true;
      pullButton.disabled = true;
    }
  }

  signInButton.addEventListener("click", () => {
    window.location.href = "/api/auth/start";
  });

  signOutButton.addEventListener("click", async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    attemptedAutoPull = false;
    await refreshSession();
  });

  pullButton.addEventListener("click", async () => {
    await pullProfiles({ silent: false });
  });

  syncButton.addEventListener("click", async () => {
    if (!window.protocolDashboardApp) {
      return;
    }
    statusText.textContent = "Syncing current profile...";
    try {
      const profile = window.protocolDashboardApp.getCurrentProfile();
      const response = await fetch("/api/sync/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      if (!response.ok) {
        throw new Error("Sync failed");
      }
      statusText.textContent = `Synced ${profile.name} to GitHub.`;
    } catch {
      statusText.textContent = "Sync failed. Check auth/configuration.";
    }
  });

  refreshSession();
})();
