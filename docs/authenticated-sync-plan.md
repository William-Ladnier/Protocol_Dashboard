# Authenticated Sync Plan

This document defines the minimal v2 architecture for replacing manual import/export with authenticated GitHub-backed sync.

## Goal

Keep the current app UX mostly intact while adding:

- GitHub sign-in
- Per-profile sync to repository JSON files
- Merge-by-date behavior across devices
- Minimal backend surface area

## Hosting assumption

GitHub Pages alone is not enough for authenticated write-back sync.

Recommended deployment split:

- Frontend + API on Vercel
- GitHub repository remains the source of truth for profile JSON data

The current static app can still be used locally or on Pages until this v2 flow is configured.

## Environment variables

- `GITHUB_APP_CLIENT_ID`
- `GITHUB_APP_CLIENT_SECRET`
- `GITHUB_APP_REDIRECT_URI`
- `GITHUB_SYNC_REPO`
- `GITHUB_SYNC_BRANCH`
- `SESSION_SECRET`

## GitHub App permissions

- Repository contents: Read and write

Install the app only on the target repository.

## Data layout in repo

```text
data/
  profiles/
    profile-abc123.json
    profile-def456.json
```

Each file stores one profile:

```json
{
  "id": "profile-abc123",
  "name": "Will",
  "settings": {
    "startDate": "2026-04-12"
  },
  "entries": []
}
```

## Endpoints

- `GET /api/session`
  Returns whether a GitHub-backed sync session exists.

- `GET /api/auth/start`
  Redirects to GitHub OAuth authorization.

- `GET /api/auth/callback`
  Exchanges code for token and stores an encrypted session cookie.

- `POST /api/auth/logout`
  Clears session cookie.

- `GET /api/sync/pull?profileId=<id>`
  Reads a profile JSON file from the repo.

- `POST /api/sync/push`
  Writes merged profile JSON to the repo.

## Sync behavior

- Pull gets the latest repo file plus blob SHA
- Push uses GitHub Contents API
- Conflicts merge entries by date
- Matching date in imported profile updates that date
- New date appends

## Frontend responsibilities

- Keep local-first behavior
- Detect signed-in sync availability
- Show `Sign in`, `Sync now`, and `Sign out`
- Push current profile only
- Pull current profile only

## Migration strategy

1. Preserve existing local-first behavior
2. Add optional signed-in sync UI
3. Configure GitHub App + hosting
4. Move daily workflow from export/import to sync

