export function profilePath(profileId) {
  return `data/profiles/${profileId}.json`;
}

export function mergeEntriesByDate(existingEntries = [], importedEntries = []) {
  const merged = new Map(existingEntries.map((entry) => [entry.date, entry]));
  importedEntries.forEach((entry) => {
    merged.set(entry.date, entry);
  });
  return Array.from(merged.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function mergeProfiles(existingProfile, importedProfile) {
  return {
    ...existingProfile,
    ...importedProfile,
    settings: {
      ...(existingProfile.settings || {}),
      ...(importedProfile.settings || {}),
    },
    entries: mergeEntriesByDate(existingProfile.entries || [], importedProfile.entries || []),
  };
}

