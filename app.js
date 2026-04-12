const STORAGE_KEY = "protocol-dashboard-state-v1";
const ANOMALY_TAGS = [
  "Poor sleep",
  "Illness",
  "Travel",
  "Diet deviation",
  "High stress",
  "Schedule disruption",
  "Heavy workout",
];

const PHASE_RANGES = [
  { label: "Baseline", startWeek: 0, endWeek: 2, color: "rgba(214, 162, 61, 0.18)" },
  { label: "Intervention", startWeek: 3, endWeek: 10, color: "rgba(55, 97, 78, 0.18)" },
  { label: "Washout", startWeek: 11, endWeek: 12, color: "rgba(158, 62, 53, 0.15)" },
];

const LIONS_MANE_PROTOCOL = [
  { startWeek: 0, endWeek: 2, defaultDose: 0, note: "Baseline: 0 capsules." },
  { startWeek: 3, endWeek: 4, defaultDose: 2, note: "Weeks 3-4: 2 capsules daily." },
  { startWeek: 5, endWeek: 10, defaultDose: 4, note: "Weeks 5-10: 4 capsules daily, split dose." },
  { startWeek: 11, endWeek: 12, defaultDose: 0, note: "Washout: 0 capsules." },
];

const DEFAULT_PROTOCOL_SETTINGS = {
  startDate: formatDateInput(new Date()),
};

const state = loadState();

const elements = {
  tabs: [...document.querySelectorAll(".tab")],
  activeProfileHeading: document.getElementById("activeProfileHeading"),
  profileSelect: document.getElementById("profileSelect"),
  createProfileButton: document.getElementById("createProfileButton"),
  renameProfileButton: document.getElementById("renameProfileButton"),
  deleteProfileButton: document.getElementById("deleteProfileButton"),
  tabPanels: {
    entry: document.getElementById("entryPanel"),
    dashboard: document.getElementById("dashboardPanel"),
    protocol: document.getElementById("protocolPanel"),
  },
  entryForm: document.getElementById("entryForm"),
  dateInput: document.getElementById("dateInput"),
  startDateInput: document.getElementById("startDateInput"),
  weekNumberInput: document.getElementById("weekNumberInput"),
  phaseInput: document.getElementById("phaseInput"),
  entryMeta: document.getElementById("entryMeta"),
  entryBriefTitle: document.getElementById("entryBriefTitle"),
  entryBriefSummary: document.getElementById("entryBriefSummary"),
  briefChecklist: document.getElementById("briefChecklist"),
  entryStatusPill: document.getElementById("entryStatusPill"),
  lionsManeDoseInput: document.getElementById("lionsManeDoseInput"),
  supplementFields: document.getElementById("supplementFields"),
  supplementNote: document.getElementById("supplementNote"),
  morningEnergyInput: document.getElementById("morningEnergyInput"),
  middayEnergyInput: document.getElementById("middayEnergyInput"),
  lateAfternoonEnergyInput: document.getElementById("lateAfternoonEnergyInput"),
  brainFogInput: document.getElementById("brainFogInput"),
  didCognitiveTestInput: document.getElementById("didCognitiveTestInput"),
  cognitiveFields: document.getElementById("cognitiveFields"),
  cognitivePrompt: document.getElementById("cognitivePrompt"),
  reactionTimeInput: document.getElementById("reactionTimeInput"),
  memoryScoreInput: document.getElementById("memoryScoreInput"),
  sleepDurationInput: document.getElementById("sleepDurationInput"),
  sleepQualityInput: document.getElementById("sleepQualityInput"),
  awakeningsInput: document.getElementById("awakeningsInput"),
  workoutPerformedInput: document.getElementById("workoutPerformedInput"),
  recoveryQualityInput: document.getElementById("recoveryQualityInput"),
  jointStiffnessInput: document.getElementById("jointStiffnessInput"),
  notesInput: document.getElementById("notesInput"),
  tagGroup: document.getElementById("tagGroup"),
  resetTodayButton: document.getElementById("resetTodayButton"),
  entriesCountPill: document.getElementById("entriesCountPill"),
  currentPhaseStat: document.getElementById("currentPhaseStat"),
  currentWeekStat: document.getElementById("currentWeekStat"),
  energyVariabilityStat: document.getElementById("energyVariabilityStat"),
  testDayStat: document.getElementById("testDayStat"),
  selectedDateStatusStat: document.getElementById("selectedDateStatusStat"),
  recentEntries: document.getElementById("recentEntries"),
  recentEntryTemplate: document.getElementById("recentEntryTemplate"),
  classificationPill: document.getElementById("classificationPill"),
  evaluationGrid: document.getElementById("evaluationGrid"),
  phaseComparison: document.getElementById("phaseComparison"),
  weeklyTableBody: document.querySelector("#weeklyTable tbody"),
  analysisModeButtons: [...document.querySelectorAll("[data-analysis-mode]")],
  analysisComparisonStrip: document.getElementById("analysisComparisonStrip"),
  legends: {
    brainFog: document.getElementById("brainFogLegend"),
    energy: document.getElementById("energyLegend"),
    variability: document.getElementById("variabilityLegend"),
    reaction: document.getElementById("reactionLegend"),
    memory: document.getElementById("memoryLegend"),
    sleep: document.getElementById("sleepLegend"),
    inflammation: document.getElementById("inflammationLegend"),
  },
  exportDataButton: document.getElementById("exportDataButton"),
  importFileInput: document.getElementById("importFileInput"),
  charts: {
    brainFog: document.getElementById("brainFogChart"),
    energy: document.getElementById("energyChart"),
    variability: document.getElementById("variabilityChart"),
    reaction: document.getElementById("reactionChart"),
    memory: document.getElementById("memoryChart"),
    sleep: document.getElementById("sleepChart"),
    inflammation: document.getElementById("inflammationChart"),
  },
};

initialize();

function initialize() {
  renderTagButtons();
  attachRangeOutputs();
  bindEvents();
  hydrateFormFromState();
  renderAll();
}

function bindEvents() {
  elements.tabs.forEach((tab) => {
    tab.addEventListener("click", () => setActiveTab(tab.dataset.tab));
  });
  elements.profileSelect.addEventListener("change", () => switchProfile(elements.profileSelect.value));
  elements.createProfileButton.addEventListener("click", createProfileFromPrompt);
  elements.renameProfileButton.addEventListener("click", renameActiveProfileFromPrompt);
  elements.deleteProfileButton.addEventListener("click", deleteActiveProfile);
  elements.analysisModeButtons.forEach((button) => {
    button.addEventListener("click", () => setAnalysisMode(button.dataset.analysisMode));
  });

  elements.startDateInput.addEventListener("change", () => {
    currentProfile().settings.startDate = elements.startDateInput.value;
    currentProfile().entries = currentProfile().entries.map((entry) => {
      const derived = deriveWeekAndPhase(entry.date, currentProfile().settings.startDate);
      return {
        ...entry,
        startDate: currentProfile().settings.startDate,
        weekNumber: derived.weekNumber,
        phase: derived.phase,
      };
    });
    saveState();
    loadEntryForSelectedDate();
    updateDerivedEntryMeta();
    renderAll();
  });

  elements.dateInput.addEventListener("change", () => {
    loadEntryForSelectedDate();
    updateDerivedEntryMeta();
  });
  elements.didCognitiveTestInput.addEventListener("change", updateCognitiveVisibility);
  elements.entryForm.addEventListener("submit", handleSaveEntry);
  elements.resetTodayButton.addEventListener("click", resetFormToDate);
  elements.exportDataButton.addEventListener("click", exportJson);
  elements.importFileInput.addEventListener("change", importJson);
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const profile = createProfileRecord("Default profile");
    return {
      profiles: [profile],
      activeProfileId: profile.id,
      ui: { activeTab: "entry", analysisMode: "all" },
    };
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.profiles) && parsed.profiles.length) {
      const profiles = parsed.profiles.map(normalizeProfile);
      const activeProfileId = profiles.some((profile) => profile.id === parsed.activeProfileId)
        ? parsed.activeProfileId
        : profiles[0].id;
      return {
        profiles,
        activeProfileId,
        ui: {
          activeTab: parsed.ui?.activeTab || "entry",
          analysisMode: parsed.ui?.analysisMode || "all",
        },
      };
    }

    const migratedProfile = {
      ...createProfileRecord("Default profile"),
      settings: {
        ...DEFAULT_PROTOCOL_SETTINGS,
        ...(parsed.settings || {}),
      },
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
    };
    return {
      profiles: [migratedProfile],
      activeProfileId: migratedProfile.id,
      ui: {
        activeTab: parsed.ui?.activeTab || "entry",
        analysisMode: parsed.ui?.analysisMode || "all",
      },
    };
  } catch (error) {
    console.error("Failed to parse saved data", error);
    const profile = createProfileRecord("Default profile");
    return {
      profiles: [profile],
      activeProfileId: profile.id,
      ui: { activeTab: "entry", analysisMode: "all" },
    };
  }
}

function normalizeProfile(profile) {
  return {
    id: profile.id || createProfileId(),
    name: profile.name || "Unnamed profile",
    settings: {
      ...DEFAULT_PROTOCOL_SETTINGS,
      ...(profile.settings || {}),
    },
    entries: Array.isArray(profile.entries) ? profile.entries : [],
  };
}

function createProfileId() {
  return `profile-${Math.random().toString(36).slice(2, 10)}`;
}

function createProfileRecord(name) {
  return {
    id: createProfileId(),
    name,
    settings: { ...DEFAULT_PROTOCOL_SETTINGS },
    entries: [],
  };
}

function currentProfile() {
  return state.profiles.find((profile) => profile.id === state.activeProfileId) || state.profiles[0];
}

function currentEntries() {
  return currentProfile().entries;
}

function currentSettings() {
  return currentProfile().settings;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function hydrateFormFromState() {
  renderProfileControls();
  elements.startDateInput.value = currentSettings().startDate;
  elements.dateInput.value = formatDateInput(new Date());
  resetFormToDate();
  setActiveTab(state.ui.activeTab || "entry");
  setAnalysisMode(state.ui.analysisMode || "all");
}

function resetFormToDate() {
  const currentDate = elements.dateInput.value || formatDateInput(new Date());
  elements.entryForm.reset();
  elements.dateInput.value = currentDate;
  elements.startDateInput.value = currentSettings().startDate;
  setRangeValue(elements.morningEnergyInput, 5);
  setRangeValue(elements.middayEnergyInput, 5);
  setRangeValue(elements.lateAfternoonEnergyInput, 5);
  setRangeValue(elements.brainFogInput, 5);
  setRangeValue(elements.sleepQualityInput, 8);
  setRangeValue(elements.recoveryQualityInput, 5);
  setRangeValue(elements.jointStiffnessInput, 5);
  elements.lionsManeDoseInput.value = "";
  setActiveTags([]);
  updateDerivedEntryMeta();
  updateCognitiveVisibility();
}

function setActiveTab(tabName) {
  state.ui.activeTab = tabName;
  elements.tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === tabName);
  });
  Object.entries(elements.tabPanels).forEach(([name, panel]) => {
    panel.classList.toggle("active", name === tabName);
  });
  saveState();
}

function setAnalysisMode(mode) {
  state.ui.analysisMode = mode;
  elements.analysisModeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.analysisMode === mode);
  });
  saveState();
  renderAll();
}

function renderProfileControls() {
  const profile = currentProfile();
  elements.activeProfileHeading.textContent = profile ? profile.name : "Current profile";
  elements.profileSelect.innerHTML = "";
  state.profiles.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.name;
    option.selected = item.id === state.activeProfileId;
    elements.profileSelect.appendChild(option);
  });
  elements.deleteProfileButton.disabled = state.profiles.length <= 1;
}

function switchProfile(profileId) {
  if (!state.profiles.some((profile) => profile.id === profileId)) {
    return;
  }
  state.activeProfileId = profileId;
  saveState();
  hydrateFormFromState();
  renderAll();
}

function askForProfileName(initialValue = "") {
  const value = window.prompt("Profile name", initialValue)?.trim();
  if (!value) {
    return null;
  }
  return value.slice(0, 40);
}

function createProfileFromPrompt() {
  const name = askForProfileName("");
  if (!name) {
    return;
  }
  if (state.profiles.some((profile) => profile.name.toLowerCase() === name.toLowerCase())) {
    window.alert("A profile with that name already exists.");
    return;
  }
  const profile = createProfileRecord(name);
  state.profiles.push(profile);
  state.activeProfileId = profile.id;
  saveState();
  hydrateFormFromState();
  renderAll();
}

function renameActiveProfileFromPrompt() {
  const profile = currentProfile();
  const name = askForProfileName(profile.name);
  if (!name) {
    return;
  }
  if (state.profiles.some((item) => item.id !== profile.id && item.name.toLowerCase() === name.toLowerCase())) {
    window.alert("A profile with that name already exists.");
    return;
  }
  profile.name = name;
  saveState();
  renderProfileControls();
}

function deleteActiveProfile() {
  if (state.profiles.length <= 1) {
    window.alert("At least one profile must remain.");
    return;
  }
  const profile = currentProfile();
  const confirmed = window.confirm(`Delete profile "${profile.name}" and all of its data?`);
  if (!confirmed) {
    return;
  }
  state.profiles = state.profiles.filter((item) => item.id !== profile.id);
  state.activeProfileId = state.profiles[0].id;
  saveState();
  hydrateFormFromState();
  renderAll();
}

function renderTagButtons() {
  ANOMALY_TAGS.forEach((tag) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tag-chip";
    button.textContent = tag;
    button.dataset.tag = tag;
    button.addEventListener("click", () => button.classList.toggle("active"));
    elements.tagGroup.appendChild(button);
  });
}

function attachRangeOutputs() {
  document.querySelectorAll('input[type="range"]').forEach((input) => {
    const output = document.querySelector(`output[for="${input.id}"]`);
    input.addEventListener("input", () => {
      if (output) {
        output.value = input.value;
      }
      if (["morningEnergyInput", "middayEnergyInput", "lateAfternoonEnergyInput"].includes(input.id)) {
        elements.energyVariabilityStat.textContent = computeEnergyVariabilityFromForm().toFixed(1);
      }
    });
  });
}

function setRangeValue(input, value) {
  input.value = value;
  const output = document.querySelector(`output[for="${input.id}"]`);
  if (output) {
    output.value = value;
  }
}

function updateDerivedEntryMeta() {
  const startDate = elements.startDateInput.value;
  const selectedDate = elements.dateInput.value;
  const derived = deriveWeekAndPhase(selectedDate, startDate);
  const existing = currentEntries().find((entry) => entry.date === selectedDate);
  const recommended = isRecommendedCognitiveTestDay(selectedDate);
  const needsSupplement = derived.phase === "Intervention";
  const dateRelation = getDateRelationLabel(selectedDate);
  const doseGuidance = getProtocolDoseGuidance(derived.weekNumber);

  elements.weekNumberInput.value = String(derived.weekNumber);
  elements.phaseInput.value = derived.phase;
  elements.entryMeta.textContent = `Week ${derived.weekNumber} • ${derived.phase}`;
  elements.currentPhaseStat.textContent = derived.phase;
  elements.currentWeekStat.textContent = String(derived.weekNumber);
  elements.energyVariabilityStat.textContent = computeEnergyVariabilityFromForm().toFixed(1);
  elements.cognitivePrompt.textContent = recommended
    ? "Recommended test day. Record results if you ran your benchmark."
    : "Optional today. Monday, Wednesday, and Friday are the default recommendations.";
  elements.testDayStat.textContent = recommended ? "Yes" : "No";
  elements.selectedDateStatusStat.textContent = existing ? "Saved" : "Not saved";

  elements.supplementFields.classList.toggle("hidden-block", !needsSupplement);
  elements.supplementNote.textContent = needsSupplement
    ? doseGuidance.note
    : derived.phase === "Post-protocol"
      ? "This date falls after the planned protocol window, so no lion's mane entry is expected here."
      : doseGuidance.note || `Lion's mane is off during ${derived.phase.toLowerCase()}, so no supplement entry is needed for this date.`;
  elements.supplementNote.classList.toggle("visible", Boolean(elements.supplementNote.textContent));
  elements.lionsManeDoseInput.disabled = !needsSupplement;
  if (!needsSupplement) {
    elements.lionsManeDoseInput.value = "";
  } else if (!existing && doseGuidance.defaultDose !== null) {
    elements.lionsManeDoseInput.value = String(doseGuidance.defaultDose);
  }

  if (!existing) {
    elements.didCognitiveTestInput.checked = recommended;
  }

  updateCognitiveVisibility();
  renderEntryBrief({
    existing,
    dateRelation,
    weekNumber: derived.weekNumber,
    phase: derived.phase,
    recommended,
    needsSupplement,
  });
}

function updateCognitiveVisibility() {
  elements.cognitiveFields.classList.toggle("visible", elements.didCognitiveTestInput.checked);
}

function renderEntryBrief({ existing, dateRelation, weekNumber, phase, recommended, needsSupplement }) {
  elements.entryBriefTitle.textContent = `${dateRelation} entry for week ${weekNumber}`;
  elements.entryBriefSummary.textContent = existing
    ? `An entry already exists for this date. Any changes you save will update the existing record.`
    : `The form has been tuned for ${phase.toLowerCase()}. Record the core daily signals below and only add the optional items that apply today.`;
  elements.entryStatusPill.textContent = existing ? "Saved entry" : "New entry";
  elements.entryStatusPill.className = `pill ${existing ? "" : "neutral-pill"}`.trim();

  const items = [
    {
      label: "Core daily signals",
      detail: "Prior night's sleep, morning energy, brain fog, recovery, joint stiffness, and notes if anything unusual happened.",
      status: "required",
    },
    {
      label: "Lion's mane supplement",
      detail: needsSupplement
        ? "This is an intervention day, so confirm the prefilled capsule count or adjust it if needed."
        : `Skip supplement logging for this ${phase.toLowerCase()} day.`,
      status: needsSupplement ? "required" : "skip",
    },
    {
      label: "Cognitive tests",
      detail: recommended
        ? "Recommended today. Record reaction time and memory if you ran your benchmark."
        : "Optional today. The app defaults to Monday, Wednesday, and Friday for test cadence.",
      status: recommended ? "optional" : "skip",
    },
  ];

  elements.briefChecklist.innerHTML = "";
  items.forEach((item) => {
    const row = document.createElement("article");
    row.className = "brief-item";
    row.innerHTML = `
      <div class="brief-badge ${item.status}">${item.status}</div>
      <div>
        <strong>${item.label}</strong>
        <span>${item.detail}</span>
      </div>
    `;
    elements.briefChecklist.appendChild(row);
  });
}

function handleSaveEntry(event) {
  event.preventDefault();
  const formData = new FormData(elements.entryForm);
  const date = formData.get("date");
  const derived = deriveWeekAndPhase(date, currentSettings().startDate);
  const entry = {
    date,
    startDate: currentSettings().startDate,
    weekNumber: derived.weekNumber,
    phase: derived.phase,
    lionsManeDose: toNumberOrNull(formData.get("lionsManeDose")),
    morningEnergy: toNumberOrNull(formData.get("morningEnergy")),
    middayEnergy: toNumberOrNull(formData.get("middayEnergy")),
    lateAfternoonEnergy: toNumberOrNull(formData.get("lateAfternoonEnergy")),
    energyVariability: computeEnergyVariability({
      morningEnergy: formData.get("morningEnergy"),
      middayEnergy: formData.get("middayEnergy"),
      lateAfternoonEnergy: formData.get("lateAfternoonEnergy"),
    }),
    brainFog: toNumberOrNull(formData.get("brainFog")),
    didCognitiveTest: Boolean(formData.get("didCognitiveTest")),
    reactionTime: Boolean(formData.get("didCognitiveTest")) ? toNumberOrNull(formData.get("reactionTime")) : null,
    memoryScore: Boolean(formData.get("didCognitiveTest")) ? toNumberOrNull(formData.get("memoryScore")) : null,
    sleepDuration: toNumberOrNull(formData.get("sleepDuration")),
    sleepQuality: toNumberOrNull(formData.get("sleepQuality")),
    awakenings: toNumberOrNull(formData.get("awakenings")),
    workoutPerformed: Boolean(formData.get("workoutPerformed")),
    recoveryQuality: toNumberOrNull(formData.get("recoveryQuality")),
    jointStiffness: toNumberOrNull(formData.get("jointStiffness")),
    anomalyTags: getActiveTags(),
    notes: (formData.get("notes") || "").trim(),
    createdAt: new Date().toISOString(),
  };

  currentProfile().entries = upsertEntry(currentEntries(), entry).sort((a, b) => a.date.localeCompare(b.date));
  saveState();
  loadEntryForSelectedDate();
  renderAll();
}

function upsertEntry(entries, nextEntry) {
  const existingIndex = entries.findIndex((entry) => entry.date === nextEntry.date);
  if (existingIndex === -1) {
    return [...entries, nextEntry];
  }
  const copy = [...entries];
  copy[existingIndex] = nextEntry;
  return copy;
}

function getActiveTags() {
  return [...elements.tagGroup.querySelectorAll(".tag-chip.active")].map((button) => button.dataset.tag);
}

function setActiveTags(tags) {
  const tagSet = new Set(tags);
  [...elements.tagGroup.querySelectorAll(".tag-chip")].forEach((button) => {
    button.classList.toggle("active", tagSet.has(button.dataset.tag));
  });
}

function loadEntryForSelectedDate() {
  const selectedDate = elements.dateInput.value;
  const existing = currentEntries().find((entry) => entry.date === selectedDate);

  if (!existing) {
    const preservedDate = selectedDate;
    resetFormToDate();
    elements.dateInput.value = preservedDate;
    updateDerivedEntryMeta();
    return;
  }

  elements.startDateInput.value = currentSettings().startDate;
  elements.dateInput.value = existing.date;
  elements.lionsManeDoseInput.value = existing.lionsManeDose ?? "";
  setRangeValue(elements.morningEnergyInput, existing.morningEnergy ?? 5);
  setRangeValue(elements.middayEnergyInput, existing.middayEnergy ?? 5);
  setRangeValue(elements.lateAfternoonEnergyInput, existing.lateAfternoonEnergy ?? 5);
  setRangeValue(elements.brainFogInput, existing.brainFog ?? 5);
  elements.didCognitiveTestInput.checked = Boolean(existing.didCognitiveTest);
  elements.reactionTimeInput.value = existing.reactionTime ?? "";
  elements.memoryScoreInput.value = existing.memoryScore ?? "";
  elements.sleepDurationInput.value = existing.sleepDuration ?? "";
  setRangeValue(elements.sleepQualityInput, existing.sleepQuality ?? 8);
  elements.awakeningsInput.value = existing.awakenings ?? "";
  elements.workoutPerformedInput.checked = Boolean(existing.workoutPerformed);
  setRangeValue(elements.recoveryQualityInput, existing.recoveryQuality ?? 5);
  setRangeValue(elements.jointStiffnessInput, existing.jointStiffness ?? 5);
  elements.notesInput.value = existing.notes || "";
  setActiveTags(existing.anomalyTags || []);
  updateCognitiveVisibility();
}

function renderAll() {
  renderProfileControls();
  const sortedEntries = [...currentEntries()].sort((a, b) => a.date.localeCompare(b.date));
  const allAggregates = buildAggregates(sortedEntries);
  const cleanEntries = sortedEntries.filter(isCleanEntry);
  const cleanAggregates = buildAggregates(cleanEntries);
  const activeAggregates = state.ui.analysisMode === "clean" ? cleanAggregates : allAggregates;
  const activeEntries = state.ui.analysisMode === "clean" ? cleanEntries : sortedEntries;

  renderAnalysisComparison({
    all: { entries: sortedEntries, aggregates: allAggregates },
    clean: { entries: cleanEntries, aggregates: cleanAggregates },
    activeMode: state.ui.analysisMode,
  });
  renderHeaderStats(sortedEntries);
  renderRecentEntries(sortedEntries);
  renderWeeklyTable(activeAggregates.weekly);
  renderPhaseComparison(activeAggregates.phaseAverages);
  renderEvaluation(activeAggregates.evaluation);
  renderCharts(activeEntries, activeAggregates.rolling);
}

function renderAnalysisComparison({ all, clean, activeMode }) {
  elements.analysisModeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.analysisMode === activeMode);
  });

  elements.analysisComparisonStrip.innerHTML = "";
  [
    { key: "all", label: "All days", data: all },
    { key: "clean", label: "Clean days", data: clean },
  ].forEach((group) => {
    const card = document.createElement("article");
    card.className = "comparison-card";
    const classification = group.data.aggregates.evaluation.classification;
    const label =
      classification === "Success"
        ? "Strong success signal"
        : classification === "Partial"
          ? "Partial signal"
          : "No clear signal yet";
    card.innerHTML = `
      <p>${group.label}</p>
      <strong>${group.data.entries.length} days</strong>
      <p>${label}</p>
    `;
    elements.analysisComparisonStrip.appendChild(card);
  });
}

function renderHeaderStats(entries) {
  elements.entriesCountPill.textContent = `${entries.length} entr${entries.length === 1 ? "y" : "ies"}`;
}

function renderRecentEntries(entries) {
  const recent = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  elements.recentEntries.innerHTML = "";

  if (!recent.length) {
    elements.recentEntries.textContent = "No entries yet.";
    elements.recentEntries.classList.add("empty-state");
    return;
  }

  elements.recentEntries.classList.remove("empty-state");
  recent.forEach((entry) => {
    const fragment = elements.recentEntryTemplate.content.cloneNode(true);
    fragment.querySelector("[data-date]").textContent = formatHumanDate(entry.date);
    fragment.querySelector("[data-phase]").textContent = `Week ${entry.weekNumber} • ${entry.phase}`;
    const summary = [
      `Fog ${formatMaybeNumber(entry.brainFog)}`,
      `Var ${formatMaybeNumber(entry.energyVariability)}`,
      entry.didCognitiveTest && entry.reactionTime ? `RT ${entry.reactionTime} ms` : null,
      entry.didCognitiveTest && entry.memoryScore !== null ? `Digit ${entry.memoryScore}` : null,
    ]
      .filter(Boolean)
      .join(" • ");
    fragment.querySelector("[data-summary]").textContent = summary;
    elements.recentEntries.appendChild(fragment);
  });
}

function buildAggregates(entries) {
  const weeklyMap = new Map();

  entries.forEach((entry) => {
    if (!weeklyMap.has(entry.weekNumber)) {
      weeklyMap.set(entry.weekNumber, []);
    }
    weeklyMap.get(entry.weekNumber).push(entry);
  });

  const weekly = Array.from(weeklyMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([weekNumber, weekEntries]) => summarizeWeek(weekNumber, weekEntries));

  const phaseAverages = PHASE_RANGES.map((phaseRange) => {
    const phaseEntries = entries.filter((entry) => entry.phase === phaseRange.label);
    return {
      phase: phaseRange.label,
      count: phaseEntries.length,
      metrics: summarizeEntries(phaseEntries),
    };
  });

  const baseline = phaseAverages.find((item) => item.phase === "Baseline")?.metrics || {};
  const intervention = phaseAverages.find((item) => item.phase === "Intervention")?.metrics || {};
  const washout = phaseAverages.find((item) => item.phase === "Washout")?.metrics || {};

  return {
    weekly,
    phaseAverages,
    evaluation: evaluateSuccess(baseline, intervention, washout),
    rolling: computeRollingAverages(entries, 7),
  };
}

function summarizeWeek(weekNumber, entries) {
  return {
    weekNumber,
    phase: entries[0]?.phase || derivePhaseFromWeek(weekNumber),
    metrics: summarizeEntries(entries),
  };
}

function summarizeEntries(entries) {
  return {
    brainFog: average(entries.map((entry) => entry.brainFog)),
    lionsManeDose: average(entries.map((entry) => entry.lionsManeDose)),
    morningEnergy: average(entries.map((entry) => entry.morningEnergy)),
    middayEnergy: average(entries.map((entry) => entry.middayEnergy)),
    lateAfternoonEnergy: average(entries.map((entry) => entry.lateAfternoonEnergy)),
    energyVariability: average(entries.map((entry) => entry.energyVariability)),
    sleepDuration: average(entries.map((entry) => entry.sleepDuration)),
    sleepQuality: average(entries.map((entry) => entry.sleepQuality)),
    recoveryQuality: average(entries.map((entry) => entry.recoveryQuality)),
    jointStiffness: average(entries.map((entry) => entry.jointStiffness)),
    reactionTime: average(entries.map((entry) => entry.reactionTime)),
    memoryScore: average(entries.map((entry) => entry.memoryScore)),
  };
}

function evaluateSuccess(baseline, intervention, washout) {
  const fogImprovement = safeDelta(baseline.brainFog, intervention.brainFog, "lower-is-better");
  const variabilityImprovement = safeDelta(baseline.energyVariability, intervention.energyVariability, "lower-is-better");
  const reactionImprovementPct = safePercentChange(baseline.reactionTime, intervention.reactionTime, "lower-is-better");
  const memoryImprovementPct = safePercentChange(baseline.memoryScore, intervention.memoryScore, "higher-is-better");
  const cognitiveImprovementPct = Math.max(reactionImprovementPct || 0, memoryImprovementPct || 0);
  const washoutFogRegression = safeRegression(intervention.brainFog, washout.brainFog, baseline.brainFog, "lower-is-better");
  const washoutVariabilityRegression = safeRegression(
    intervention.energyVariability,
    washout.energyVariability,
    baseline.energyVariability,
    "lower-is-better",
  );
  const washoutRegression = Math.max(washoutFogRegression || 0, washoutVariabilityRegression || 0);

  const strongSuccess =
    fogImprovement !== null &&
    fogImprovement >= 1.5 &&
    variabilityImprovement !== null &&
    variabilityImprovement > 0 &&
    cognitiveImprovementPct !== null &&
    cognitiveImprovementPct >= 10 &&
    washoutRegression !== null &&
    washoutRegression > 0.35;

  const partialSignal =
    !strongSuccess &&
    ((fogImprovement !== null && fogImprovement > 0.4) ||
      (variabilityImprovement !== null && variabilityImprovement > 0) ||
      (cognitiveImprovementPct !== null && cognitiveImprovementPct > 0));

  const classification = strongSuccess ? "Success" : partialSignal ? "Partial" : "Failure";

  return {
    classification,
    metrics: [
      {
        label: "Brain fog improvement",
        value: fogImprovement,
        formatted: fogImprovement === null ? "Not enough data" : `${fogImprovement.toFixed(2)} points`,
        status: fogImprovement !== null && fogImprovement >= 1.5 ? "positive" : fogImprovement !== null && fogImprovement > 0 ? "neutral" : "negative",
      },
      {
        label: "Energy variability reduction",
        value: variabilityImprovement,
        formatted:
          variabilityImprovement === null ? "Not enough data" : `${variabilityImprovement.toFixed(2)} points lower`,
        status:
          variabilityImprovement !== null && variabilityImprovement > 0 ? "positive" : variabilityImprovement === null ? "neutral" : "negative",
      },
      {
        label: "Best cognitive improvement",
        value: cognitiveImprovementPct,
        formatted:
          cognitiveImprovementPct === null ? "Not enough data" : `${cognitiveImprovementPct.toFixed(1)}%`,
        status:
          cognitiveImprovementPct !== null && cognitiveImprovementPct >= 10
            ? "positive"
            : cognitiveImprovementPct !== null && cognitiveImprovementPct > 0
              ? "neutral"
              : "negative",
      },
      {
        label: "Washout regression signal",
        value: washoutRegression,
        formatted:
          washoutRegression === null ? "Not enough data" : `${(washoutRegression * 100).toFixed(0)}% toward baseline`,
        status:
          washoutRegression !== null && washoutRegression > 0.35
            ? "positive"
            : washoutRegression !== null && washoutRegression > 0
              ? "neutral"
              : "negative",
      },
    ],
  };
}

function renderEvaluation(evaluation) {
  const labelMap = {
    Success: "Strong success signal",
    Partial: "Partial signal",
    Failure: "No clear signal yet",
  };
  elements.classificationPill.textContent = labelMap[evaluation.classification];
  elements.classificationPill.style.background =
    evaluation.classification === "Success"
      ? "rgba(55, 97, 78, 0.15)"
      : evaluation.classification === "Partial"
        ? "rgba(214, 162, 61, 0.15)"
        : "rgba(158, 62, 53, 0.12)";
  elements.classificationPill.style.color =
    evaluation.classification === "Success"
      ? "#37614e"
      : evaluation.classification === "Partial"
        ? "#8b6820"
        : "#9e3e35";

  elements.evaluationGrid.innerHTML = "";
  evaluation.metrics.forEach((metric) => {
    const card = document.createElement("article");
    card.className = "metric-card";
    card.innerHTML = `
      <p>${metric.label}</p>
      <strong class="${metric.status}">${metric.formatted}</strong>
    `;
    elements.evaluationGrid.appendChild(card);
  });
}

function renderPhaseComparison(phaseAverages) {
  elements.phaseComparison.innerHTML = "";
  phaseAverages.forEach((phase) => {
    const row = document.createElement("article");
    row.className = "phase-row";
    row.innerHTML = `
      <h3>${phase.phase}</h3>
      <p>${phase.count} logged days</p>
      <p>Brain fog: ${formatMaybeNumber(phase.metrics.brainFog)}</p>
      <p>Energy variability: ${formatMaybeNumber(phase.metrics.energyVariability)}</p>
      <p>Sleep quality: ${formatMaybeNumber(phase.metrics.sleepQuality)}</p>
      <p>Lion's mane: ${formatMaybeNumber(phase.metrics.lionsManeDose)} capsules</p>
      <p>Reaction time: ${formatMaybeNumber(phase.metrics.reactionTime)}</p>
      <p>Digit span: ${formatMaybeNumber(phase.metrics.memoryScore)}</p>
    `;
    elements.phaseComparison.appendChild(row);
  });
}

function renderWeeklyTable(weeklySummaries) {
  elements.weeklyTableBody.innerHTML = "";

  if (!weeklySummaries.length) {
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="12" class="empty-state">Add entries to build weekly averages.</td>';
    elements.weeklyTableBody.appendChild(row);
    return;
  }

  weeklySummaries.forEach((summary) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${summary.weekNumber}</td>
      <td>${summary.phase}</td>
      <td>${formatMaybeNumber(summary.metrics.brainFog)}</td>
      <td>${formatMaybeNumber(summary.metrics.morningEnergy)}</td>
      <td>${formatMaybeNumber(summary.metrics.middayEnergy)}</td>
      <td>${formatMaybeNumber(summary.metrics.lateAfternoonEnergy)}</td>
      <td>${formatMaybeNumber(summary.metrics.energyVariability)}</td>
      <td>${formatMaybeNumber(summary.metrics.sleepQuality)}</td>
      <td>${formatMaybeNumber(summary.metrics.recoveryQuality)}</td>
      <td>${formatMaybeNumber(summary.metrics.jointStiffness)}</td>
      <td>${formatMaybeNumber(summary.metrics.reactionTime)}</td>
      <td>${formatMaybeNumber(summary.metrics.memoryScore)}</td>
    `;
    elements.weeklyTableBody.appendChild(row);
  });
}

function renderCharts(entries, rollingData) {
  const brainFogConfig = {
    entries,
    series: [
      {
        label: "Daily",
        color: "#c4642f",
        values: entries.map((entry) => entry.brainFog),
      },
      {
        label: "7-day avg",
        color: "#37614e",
        values: rollingData.map((row) => row.brainFog),
      },
    ],
    yLabel: "Score",
  };
  renderChartLegend(elements.legends.brainFog, brainFogConfig.series);
  drawLineChart(elements.charts.brainFog, brainFogConfig);

  const energyConfig = {
    entries,
    series: [
      { label: "Morning", color: "#c4642f", values: entries.map((entry) => entry.morningEnergy) },
      { label: "Midday", color: "#37614e", values: entries.map((entry) => entry.middayEnergy) },
      { label: "Late afternoon", color: "#d6a23d", values: entries.map((entry) => entry.lateAfternoonEnergy) },
    ],
    yLabel: "Energy",
  };
  renderChartLegend(elements.legends.energy, energyConfig.series);
  drawLineChart(elements.charts.energy, energyConfig);

  const variabilityConfig = {
    entries,
    series: [{ label: "Variability", color: "#9e3e35", values: entries.map((entry) => entry.energyVariability) }],
    yLabel: "Range",
  };
  renderChartLegend(elements.legends.variability, variabilityConfig.series);
  drawLineChart(elements.charts.variability, variabilityConfig);

  const reactionConfig = {
    entries,
    series: [
      {
        label: "Reaction time",
        color: "#37614e",
        values: entries.map((entry) => entry.reactionTime),
        connectAcrossGaps: true,
      },
    ],
    yLabel: "ms",
  };
  renderChartLegend(elements.legends.reaction, reactionConfig.series);
  drawLineChart(elements.charts.reaction, reactionConfig);

  const memoryConfig = {
    entries,
    series: [
      {
        label: "Digit span",
        color: "#c4642f",
        values: entries.map((entry) => entry.memoryScore),
        connectAcrossGaps: true,
      },
    ],
    yLabel: "Score",
  };
  renderChartLegend(elements.legends.memory, memoryConfig.series);
  drawLineChart(elements.charts.memory, memoryConfig);

  const sleepConfig = {
    entries,
    series: [
      { label: "Sleep duration", color: "#37614e", values: entries.map((entry) => entry.sleepDuration) },
      { label: "Sleep quality", color: "#d6a23d", values: entries.map((entry) => entry.sleepQuality) },
    ],
    yLabel: "Sleep",
  };
  renderChartLegend(elements.legends.sleep, sleepConfig.series);
  drawLineChart(elements.charts.sleep, sleepConfig);

  const inflammationConfig = {
    entries,
    series: [
      { label: "Recovery quality", color: "#37614e", values: entries.map((entry) => entry.recoveryQuality) },
      { label: "Joint stiffness", color: "#9e3e35", values: entries.map((entry) => entry.jointStiffness) },
    ],
    yLabel: "Score",
  };
  renderChartLegend(elements.legends.inflammation, inflammationConfig.series);
  drawLineChart(elements.charts.inflammation, inflammationConfig);
}

function renderChartLegend(container, series) {
  if (!container) {
    return;
  }
  container.innerHTML = "";
  series.forEach((item) => {
    const legendItem = document.createElement("div");
    legendItem.className = "legend-item";
    legendItem.innerHTML = `
      <span class="legend-swatch" style="background:${item.color}"></span>
      <span>${item.label}</span>
    `;
    container.appendChild(legendItem);
  });
}

function drawLineChart(canvas, config) {
  const context = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const padding = { top: 18, right: 18, bottom: 30, left: 38 };

  context.clearRect(0, 0, width, height);
  context.fillStyle = "rgba(255,255,255,0.5)";
  context.fillRect(0, 0, width, height);

  if (!config.entries.length) {
    context.fillStyle = "#786457";
    context.font = '14px "Avenir Next", sans-serif';
    context.fillText("Add entries to render this chart.", 20, height / 2);
    return;
  }

  const allValues = config.series.flatMap((series) => series.values.filter((value) => Number.isFinite(value)));
  if (!allValues.length) {
    context.fillStyle = "#786457";
    context.font = '14px "Avenir Next", sans-serif';
    context.fillText("No values available yet.", 20, height / 2);
    return;
  }

  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const span = maxValue - minValue || 1;
  const xStep = config.entries.length > 1 ? (width - padding.left - padding.right) / (config.entries.length - 1) : 0;

  drawPhaseBands(context, config.entries, width, height, padding, xStep);

  context.strokeStyle = "rgba(79,57,41,0.18)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(padding.left, padding.top);
  context.lineTo(padding.left, height - padding.bottom);
  context.lineTo(width - padding.right, height - padding.bottom);
  context.stroke();

  config.series.forEach((series) => {
    context.strokeStyle = series.color;
    context.lineWidth = 2;
    context.beginPath();
    let started = false;
    const points = [];

    series.values.forEach((value, index) => {
      if (!Number.isFinite(value)) {
        if (!series.connectAcrossGaps) {
          started = false;
        }
        return;
      }
      const x = padding.left + xStep * index;
      const y = height - padding.bottom - ((value - minValue) / span) * (height - padding.top - padding.bottom);
      points.push({ x, y });

      if (!started) {
        context.moveTo(x, y);
        started = true;
      } else {
        context.lineTo(x, y);
      }
    });

    context.stroke();

    points.forEach((point) => {
      context.fillStyle = series.color;
      context.beginPath();
      context.arc(point.x, point.y, 3, 0, Math.PI * 2);
      context.fill();
    });
  });

  context.fillStyle = "#786457";
  context.font = '12px "Avenir Next", sans-serif';
  context.fillText(`${maxValue.toFixed(1)} ${config.yLabel}`, 8, padding.top + 6);
  context.fillText(`${minValue.toFixed(1)}`, 8, height - padding.bottom);

  const firstDate = formatShortDate(config.entries[0].date);
  const lastDate = formatShortDate(config.entries[config.entries.length - 1].date);
  context.fillText(firstDate, padding.left, height - 8);
  context.fillText(lastDate, width - padding.right - 34, height - 8);
}

function drawPhaseBands(context, entries, width, height, padding, xStep) {
  const positions = entries.map((entry, index) => ({
    phase: entry.phase,
    x: padding.left + xStep * index,
  }));

  PHASE_RANGES.forEach((phaseRange) => {
    const phasePositions = positions.filter((position) => position.phase === phaseRange.label);
    if (!phasePositions.length) {
      return;
    }
    const startX = phasePositions[0].x;
    const endX = phasePositions[phasePositions.length - 1].x;
    context.fillStyle = phaseRange.color;
    context.fillRect(startX, padding.top, Math.max(endX - startX, 6), height - padding.top - padding.bottom);
  });
}

function computeRollingAverages(entries, windowSize) {
  return entries.map((entry, index) => {
    const slice = entries.slice(Math.max(0, index - windowSize + 1), index + 1);
    return {
      date: entry.date,
      brainFog: average(slice.map((item) => item.brainFog)),
    };
  });
}

function deriveWeekAndPhase(dateString, startDateString) {
  if (!dateString || !startDateString) {
    return { weekNumber: 0, phase: "Baseline" };
  }

  const oneDay = 1000 * 60 * 60 * 24;
  const start = new Date(`${startDateString}T00:00:00`);
  const selected = new Date(`${dateString}T00:00:00`);
  const deltaDays = Math.floor((selected.getTime() - start.getTime()) / oneDay);
  const rawWeek = Math.floor(deltaDays / 7);
  const weekNumber = Math.max(0, rawWeek);
  return {
    weekNumber,
    phase: derivePhaseFromWeek(weekNumber),
  };
}

function derivePhaseFromWeek(weekNumber) {
  const match = PHASE_RANGES.find((range) => weekNumber >= range.startWeek && weekNumber <= range.endWeek);
  return match ? match.label : "Post-protocol";
}

function isRecommendedCognitiveTestDay(dateString) {
  if (!dateString) {
    return false;
  }
  const day = new Date(`${dateString}T12:00:00`).getDay();
  return [1, 3, 5].includes(day);
}

function computeEnergyVariabilityFromForm() {
  return computeEnergyVariability({
    morningEnergy: elements.morningEnergyInput.value,
    middayEnergy: elements.middayEnergyInput.value,
    lateAfternoonEnergy: elements.lateAfternoonEnergyInput.value,
  });
}

function computeEnergyVariability(entry) {
  const values = [entry.morningEnergy, entry.middayEnergy, entry.lateAfternoonEnergy]
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  if (!values.length) {
    return null;
  }

  return Math.max(...values) - Math.min(...values);
}

function average(values) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) {
    return null;
  }
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function safeDelta(baseline, intervention, direction) {
  if (!Number.isFinite(baseline) || !Number.isFinite(intervention)) {
    return null;
  }
  return direction === "lower-is-better" ? baseline - intervention : intervention - baseline;
}

function safePercentChange(baseline, intervention, direction) {
  if (!Number.isFinite(baseline) || !Number.isFinite(intervention) || baseline === 0) {
    return null;
  }
  const raw = direction === "lower-is-better" ? ((baseline - intervention) / baseline) * 100 : ((intervention - baseline) / baseline) * 100;
  return raw;
}

function safeRegression(intervention, washout, baseline, direction) {
  if (!Number.isFinite(intervention) || !Number.isFinite(washout) || !Number.isFinite(baseline)) {
    return null;
  }

  const distanceFromBaseline =
    direction === "lower-is-better" ? baseline - intervention : intervention - baseline;

  if (distanceFromBaseline <= 0) {
    return 0;
  }

  const regressionAmount =
    direction === "lower-is-better" ? washout - intervention : intervention - washout;

  return Math.max(0, regressionAmount / distanceFromBaseline);
}

function toNumberOrNull(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function exportJson() {
  const profile = currentProfile();
  downloadFile(
    `${slugifyName(profile.name)}-protocol-dashboard.json`,
    JSON.stringify(
      {
        exportType: "protocol-dashboard-profile",
        exportedAt: new Date().toISOString(),
        profile,
      },
      null,
      2,
    ),
    "application/json",
  );
}

function importJson(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (parsed.exportType === "protocol-dashboard-profile" && parsed.profile) {
        const imported = normalizeProfile(parsed.profile);
        const existingMatch = state.profiles.find((profile) => profile.id === imported.id);
        if (existingMatch) {
          const shouldMerge = window.confirm(
            `A matching profile named "${existingMatch.name}" already exists.\n\nPress OK to merge imported entries into that profile, or Cancel to import this as a new profile.`,
          );

          if (shouldMerge) {
            existingMatch.name = imported.name || existingMatch.name;
            existingMatch.settings = {
              ...existingMatch.settings,
              ...imported.settings,
            };
            existingMatch.entries = mergeEntriesByDate(existingMatch.entries, imported.entries);
            state.activeProfileId = existingMatch.id;
          } else {
            imported.id = createProfileId();
            imported.name = uniqueProfileName(imported.name);
            state.profiles.push(imported);
            state.activeProfileId = imported.id;
          }
        } else {
          imported.name = uniqueProfileName(imported.name);
          state.profiles.push(imported);
          state.activeProfileId = imported.id;
        }
      } else if (Array.isArray(parsed.profiles)) {
        state.profiles = parsed.profiles.map(normalizeProfile);
        if (!state.profiles.length) {
          const profile = createProfileRecord("Default profile");
          state.profiles = [profile];
          state.activeProfileId = profile.id;
        } else if (state.profiles.some((profile) => profile.id === parsed.activeProfileId)) {
          state.activeProfileId = parsed.activeProfileId;
        } else if (!state.profiles.some((profile) => profile.id === state.activeProfileId)) {
          state.activeProfileId = state.profiles[0].id;
        }
      } else {
        const profile = currentProfile();
        profile.settings = {
          ...DEFAULT_PROTOCOL_SETTINGS,
          ...(parsed.settings || {}),
        };
        profile.entries = Array.isArray(parsed.entries) ? parsed.entries : [];
      }
      saveState();
      hydrateFormFromState();
      renderAll();
    } catch (error) {
      window.alert("Import failed. Please choose a valid JSON export from this app.");
    } finally {
      elements.importFileInput.value = "";
    }
  };
  reader.readAsText(file);
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function uniqueProfileName(baseName) {
  let candidate = baseName;
  let index = 2;
  const existing = new Set(state.profiles.map((profile) => profile.name.toLowerCase()));
  while (existing.has(candidate.toLowerCase())) {
    candidate = `${baseName} (${index})`;
    index += 1;
  }
  return candidate;
}

function slugifyName(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "profile";
}

function mergeEntriesByDate(existingEntries, importedEntries) {
  const merged = new Map(existingEntries.map((entry) => [entry.date, entry]));
  importedEntries.forEach((entry) => {
    merged.set(entry.date, entry);
  });
  return Array.from(merged.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function clampOneDecimal(value) {
  return Math.round(value * 10) / 10;
}

function formatDateInput(date) {
  return date.toISOString().slice(0, 10);
}

function formatHumanDate(dateString) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(dateString) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatMaybeNumber(value) {
  if (!Number.isFinite(value)) {
    return "—";
  }
  return value >= 100 ? value.toFixed(0) : value.toFixed(1);
}

function isCleanEntry(entry) {
  return !Array.isArray(entry.anomalyTags) || entry.anomalyTags.length === 0;
}

function getDateRelationLabel(dateString) {
  const today = formatDateInput(new Date());
  if (!dateString) {
    return "Selected";
  }
  if (dateString === today) {
    return "Today";
  }
  return dateString < today ? "Past" : "Upcoming";
}

function getProtocolDoseGuidance(weekNumber) {
  const match = LIONS_MANE_PROTOCOL.find((step) => weekNumber >= step.startWeek && weekNumber <= step.endWeek);
  if (!match) {
    return { defaultDose: null, note: "" };
  }
  return match;
}

window.protocolDashboardApp = {
  getCurrentProfile() {
    return structuredClone(currentProfile());
  },
  getProfiles() {
    return structuredClone(state.profiles);
  },
};
