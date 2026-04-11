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
- JSON and CSV export for backup and analysis

## Files

- `index.html`: app shell
- `styles.css`: responsive UI styling
- `app.js`: data model, persistence, aggregation, charts, and protocol logic

## How to use

1. Open `index.html` in a browser.
2. Create or select a profile.
3. Set that profile's experiment start date.
4. Use the `Daily Entry` tab on phone or desktop.
5. Review outcomes in the `Dashboard` tab.
6. Export JSON regularly if you want versioned backups in GitHub.

## Mobile workflow

For iPhone use, the simplest path is to open the static app in Safari and optionally add it to the home screen.

## Notes

- The app follows your provided week labels `0-12`, which creates 13 labeled weeks.
- Cognitive testing defaults to Monday, Wednesday, and Friday, but you can log results on any day.
- Daily data remains local to the browser until you explicitly export it.
- JSON exports now export the active profile, and importing a profile JSON adds it as a separate profile in the app.
