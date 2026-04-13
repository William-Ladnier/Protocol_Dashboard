# Protocol Dashboard

Local-first static dashboard for a structured lion's mane self-experiment.

## What it does

- Fast daily entry optimized for phone-sized screens
- Daily entry grouped around morning, midday, and evening, with prior night's sleep captured during the morning check-in
- Automatic week and phase assignment from the experiment start date
- Date-aware guidance that shows what is required, optional, or skipped for the selected day
- Protocol-based lion's mane capsule prefills based on baseline, intervention, and washout weeks
- Local browser storage with no login and no backend
- Multiple named profiles in one shared app, each with separate settings and entries
- Weekly summaries and phase comparisons
- Trend charts for cognition, energy, sleep, and recovery/inflammation with phase overlays
- Built-in success evaluation based on your experiment rules
- Importable/exportable profile JSON for backup and transfer between devices

## Files

- `index.html`: app shell
- `styles.css`: responsive UI styling
- `app.js`: data model, persistence, aggregation, charts, and protocol logic
- `sync-client.js`: frontend hooks for future authenticated GitHub sync
- `api/`: serverless auth and sync endpoints for v2
- `lib/`: shared GitHub/session/profile helpers for v2
- `docs/authenticated-sync-plan.md`: concrete v2 architecture and setup notes

## How to use

1. Open `index.html` in a browser.
2. Create or select a profile.
3. Set that profile's experiment start date.
4. Use the `Daily Entry` tab on phone or desktop.
5. Review outcomes in the `Dashboard` tab.
6. Use `Export data` regularly if you want versioned backups in GitHub.

## Mobile workflow

For iPhone use, the simplest path is to open the static app in Safari and optionally add it to the home screen.

## Authenticated Sync V2

The repo now includes an initial scaffold for a GitHub-authenticated sync version that can replace manual import/export after configuration.

To finish that v2 path, you still need to:

1. Create and configure a GitHub App with contents write permission.
2. Set the environment variables from `.env.example`.
3. Deploy the app to a platform that supports serverless functions, such as Vercel.
4. Point the frontend at that deployment instead of plain GitHub Pages.

When authenticated sync is configured:

- `Sync now` pushes the active profile to GitHub.
- `Pull profiles` fetches repo-backed profiles into the local app.
- On a fresh device with only an empty default profile, the app attempts an automatic pull after sign-in.
- Expiring GitHub user tokens are refreshed automatically during session checks and sync calls when a valid refresh token is available.

## Notes

- The app follows your provided week labels `0-12`, which creates 13 labeled weeks.
- Cognitive testing defaults to Monday, Wednesday, and Friday, but you can log results on any day.
- Daily data remains local to the browser until you explicitly export it.
- `Export data` exports the active profile as JSON.
- `Import data` supports two outcomes when importing a profile JSON:
- If the hidden profile ID matches an existing profile, you can merge the imported entries into that profile.
- If you choose not to merge, the import is added as a new profile instead.
- Profile merges are additive by date: new dates are added, and matching dates are updated by the imported entry.
