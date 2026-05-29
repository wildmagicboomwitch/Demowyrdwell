// ═══════════════════════════════════════════════════════════════
//  AUDHD HQ — Symptom Registry  (Phase B1)
//  Single source of truth. Every symptom defined ONCE here.
//  Condition pools and UI layers reference by id only.
//
//  Schema per entry:
//    id              — camelCase, stable, never auto-regenerated
//    label           — display string
//    emoji           — single emoji for quick-log chips
//    categories      — array of category ids (first = primary)
//    conditions      — array of condition ids that share this symptom
//    tags            — optional free-form search hints
//    severitySupported — boolean, whether 1-10 severity slider applies
//    quickLog        — boolean, surfaces in quick-log chip grid
//    notes           — optional clarifying note for the user
// ═══════════════════════════════════════════════════════════════

window.HQSymptomRegistry = {

  // ─────────────────────────────────────────────────────────────
  //  COGNITIVE
  // ─────────────────────────────────────────────────────────────

  brainFog: {
    id: 'brainFog',
    label: 'Brain Fog',
    emoji: '🧠',
    categories: ['cognitive'],
    conditions: ['adhd', 'fibromyalgia', 'longCovid', 'mecfs', 'lupus', 'pots', 'migraine', 'tbiPostConcussion'],
    severitySupported: true,
    quickLog: true
  },

  inattention: {
    id: 'inattention',
    label: 'Inattention / Difficulty Focusing',
    emoji: '🌀',
    categories: ['cognitive'],
    conditions: ['adhd', 'tbiPostConcussion'],
    severitySupported: true,
    quickLog: true
  },

  executiveDysfunction: {
    id: 'executiveDysfunction',
    label: 'Executive Dysfunction',
    emoji: '📋',
    categories: ['cognitive'],
    conditions: ['adhd', 'autism'],
    severitySupported: true,
    quickLog: true
  },

  taskParalysis: {
    id: 'taskParalysis',
    label: 'Task Paralysis',
    emoji: '🧊',
    categories: ['cognitive'],
    conditions: ['adhd'],
    severitySupported: true,
    quickLog: true
  },

  timeBlindness: {
    id: 'timeBlindness',
    label: 'Time Blindness',
    emoji: '⏰',
    categories: ['cognitive'],
    conditions: ['adhd'],
    severitySupported: false,
    quickLog: true
  },

  workingMemoryLoss: {
    id: 'workingMemoryLoss',
    label: 'Working Memory Difficulty',
    emoji: '💭',
    categories: ['cognitive'],
    conditions: ['adhd', 'tbiPostConcussion', 'mecfs', 'fibromyalgia'],
    severitySupported: true,
    quickLog: true
  },

  cognitiveSlowing: {
    id: 'cognitiveSlowing',
    label: 'Cognitive Slowing / Processing Delays',
    emoji: '🐢',
    categories: ['cognitive'],
    conditions: ['tbiPostConcussion', 'mecfs', 'fibromyalgia', 'longCovid'],
    severitySupported: true,
    quickLog: true
  },

  wordFinding: {
    id: 'wordFinding',
    label: 'Word-Finding Difficulty',
    emoji: '💬',
    categories: ['cognitive'],
    conditions: ['adhd', 'tbiPostConcussion', 'migraine', 'fibromyalgia'],
    severitySupported: true,
    quickLog: true
  },

  dissociation: {
    id: 'dissociation',
    label: 'Dissociation / Derealization',
    emoji: '🫥',
    categories: ['cognitive', 'neurological'],
    conditions: ['autism', 'fnd'],
    severitySupported: true,
    quickLog: true
  },

  // ─────────────────────────────────────────────────────────────
  //  MOOD / EMOTIONAL
  // ─────────────────────────────────────────────────────────────

  emotionalDysreg: {
    id: 'emotionalDysreg',
    label: 'Emotional Dysregulation',
    emoji: '🌊',
    categories: ['mood', 'cognitive'],
    conditions: ['adhd', 'autism'],
    severitySupported: true,
    quickLog: true
  },

  anxiety: {
    id: 'anxiety',
    label: 'Anxiety',
    emoji: '😰',
    categories: ['mood'],
    conditions: ['adhd', 'autism', 'pots', 'mdd'],
    severitySupported: true,
    quickLog: true
  },

  depression: {
    id: 'depression',
    label: 'Low Mood / Depression',
    emoji: '🌫️',
    categories: ['mood'],
    conditions: ['mdd', 'fibromyalgia', 'longCovid', 'mecfs', 'tbiPostConcussion'],
    severitySupported: true,
    quickLog: true
  },

  irritability: {
    id: 'irritability',
    label: 'Irritability',
    emoji: '😤',
    categories: ['mood'],
    conditions: ['adhd', 'autism', 'migraine', 'mdd', 'tbiPostConcussion'],
    severitySupported: true,
    quickLog: true
  },

  moodCycle: {
    id: 'moodCycle',
    label: 'Mood Cycling',
    emoji: '🔄',
    categories: ['mood'],
    conditions: ['mdd', 'perimenopause'],
    severitySupported: false,
    quickLog: false
  },

  anhedonia: {
    id: 'anhedonia',
    label: 'Anhedonia / Loss of Pleasure',
    emoji: '😶',
    categories: ['mood'],
    conditions: ['mdd'],
    severitySupported: true,
    quickLog: true
  },

  emotionalNumbing: {
    id: 'emotionalNumbing',
    label: 'Emotional Numbing / Blunted Affect',
    emoji: '🧱',
    categories: ['mood'],
    conditions: ['mdd'],
    severitySupported: true,
    quickLog: false
  },

  lowMotivation: {
    id: 'lowMotivation',
    label: 'Low Motivation / Avolition',
    emoji: '🔋',
    categories: ['mood', 'cognitive'],
    conditions: ['mdd', 'adhd', 'mecfs', 'fibromyalgia'],
    severitySupported: true,
    quickLog: true
  },

  socialWithdrawal: {
    id: 'socialWithdrawal',
    label: 'Social Withdrawal',
    emoji: '🏠',
    categories: ['mood'],
    conditions: ['mdd', 'autism'],
    severitySupported: false,
    quickLog: false
  },

  // ─────────────────────────────────────────────────────────────
  //  PHYSICAL / FATIGUE
  // ─────────────────────────────────────────────────────────────

  fatigue: {
    id: 'fatigue',
    label: 'Fatigue',
    emoji: '😩',
    categories: ['physical'],
    conditions: ['adhd', 'autism', 'fibromyalgia', 'pots', 'longCovid', 'mecfs', 'lupus', 'sjögrens', 'endometriosis', 'perimenopause', 'celiac', 'asthma'],
    severitySupported: true,
    quickLog: true
  },

  postExertionCrash: {
    id: 'postExertionCrash',
    label: 'Post-Exertion Crash (PEM)',
    emoji: '⚡',
    categories: ['physical'],
    conditions: ['fibromyalgia', 'longCovid', 'mecfs'],
    severitySupported: true,
    quickLog: true,
    notes: 'Symptom worsening after minimal physical or mental effort'
  },

  heartRacing: {
    id: 'heartRacing',
    label: 'Heart Racing / Palpitations',
    emoji: '💓',
    categories: ['physical', 'autonomic'],
    conditions: ['pots', 'perimenopause', 'asthma'],
    severitySupported: true,
    quickLog: true
  },

  breathShortness: {
    id: 'breathShortness',
    label: 'Shortness of Breath',
    emoji: '🌬️',
    categories: ['respiratory', 'physical'],
    conditions: ['pots', 'longCovid', 'asthma'],
    severitySupported: true,
    quickLog: true
  },

  nausea: {
    id: 'nausea',
    label: 'Nausea',
    emoji: '🤢',
    categories: ['physical', 'gi'],
    conditions: ['migraine', 'pots', 'mecfs', 'endometriosis', 'gerd'],
    severitySupported: true,
    quickLog: true
  },

  weakness: {
    id: 'weakness',
    label: 'Weakness / Low Strength',
    emoji: '🦿',
    categories: ['physical', 'musculoskeletal'],
    conditions: ['mecfs', 'fibromyalgia', 'fnd', 'longCovid'],
    severitySupported: true,
    quickLog: true
  },

  tremor: {
    id: 'tremor',
    label: 'Tremor / Shaking',
    emoji: '✋',
    categories: ['neurological', 'physical'],
    conditions: ['fnd', 'tbiPostConcussion'],
    severitySupported: true,
    quickLog: true
  },

  weightChanges: {
    id: 'weightChanges',
    label: 'Unexplained Weight Changes',
    emoji: '⚖️',
    categories: ['physical', 'hormonal'],
    conditions: ['celiac', 'perimenopause'],
    severitySupported: false,
    quickLog: false
  },

  hotFlashes: {
    id: 'hotFlashes',
    label: 'Hot Flashes / Night Sweats',
    emoji: '🔥',
    categories: ['hormonal', 'autonomic'],
    conditions: ['perimenopause'],
    severitySupported: true,
    quickLog: true
  },

  coldIntolerance: {
    id: 'coldIntolerance',
    label: 'Cold Intolerance / Feeling Cold',
    emoji: '🥶',
    categories: ['autonomic', 'physical'],
    conditions: ['raynauds', 'sjögrens'],
    severitySupported: false,
    quickLog: true
  },

  // ─────────────────────────────────────────────────────────────
  //  PAIN
  // ─────────────────────────────────────────────────────────────

  headache: {
    id: 'headache',
    label: 'Headache',
    emoji: '🤕',
    categories: ['pain'],
    conditions: ['fibromyalgia', 'migraine', 'pots', 'tbiPostConcussion', 'longCovid'],
    severitySupported: true,
    quickLog: true
  },

  jointPain: {
    id: 'jointPain',
    label: 'Joint Pain',
    emoji: '🦴',
    categories: ['pain', 'musculoskeletal'],
    conditions: ['fibromyalgia', 'lupus', 'sjögrens', 'celiac'],
    severitySupported: true,
    quickLog: true
  },

  muscleAches: {
    id: 'muscleAches',
    label: 'Muscle Aches / Myalgia',
    emoji: '💪',
    categories: ['pain', 'musculoskeletal'],
    conditions: ['fibromyalgia', 'longCovid', 'lupus', 'mecfs'],
    severitySupported: true,
    quickLog: true
  },

  burningPain: {
    id: 'burningPain',
    label: 'Burning Pain',
    emoji: '🔥',
    categories: ['pain', 'neurological'],
    conditions: ['crps'],
    tags: ['crps', 'nerve', 'neuropathic'],
    severitySupported: true,
    quickLog: true
  },

  electricShockPain: {
    id: 'electricShockPain',
    label: 'Electric Shock Pain',
    emoji: '⚡',
    categories: ['pain', 'neurological'],
    conditions: ['crps'],
    tags: ['crps', 'nerve'],
    severitySupported: true,
    quickLog: true
  },

  allodynia: {
    id: 'allodynia',
    label: 'Allodynia (Touch Sensitivity)',
    emoji: '🫷',
    categories: ['pain', 'sensory'],
    conditions: ['crps', 'migraine', 'fibromyalgia'],
    tags: ['crps', 'light touch hurts'],
    severitySupported: true,
    quickLog: true
  },

  hyperalgesia: {
    id: 'hyperalgesia',
    label: 'Hyperalgesia (Heightened Pain Response)',
    emoji: '📡',
    categories: ['pain', 'neurological'],
    conditions: ['crps', 'fibromyalgia'],
    severitySupported: true,
    quickLog: false
  },

  achingPain: {
    id: 'achingPain',
    label: 'Aching Pain',
    emoji: '😣',
    categories: ['pain'],
    conditions: ['fibromyalgia', 'mecfs', 'endometriosis'],
    severitySupported: true,
    quickLog: true
  },

  pelvicPain: {
    id: 'pelvicPain',
    label: 'Pelvic / Abdominal Pain',
    emoji: '🌀',
    categories: ['pain', 'gi'],
    conditions: ['endometriosis'],
    severitySupported: true,
    quickLog: true
  },

  dysmenorrhea: {
    id: 'dysmenorrhea',
    label: 'Severe Menstrual Cramps',
    emoji: '🩸',
    categories: ['pain', 'hormonal'],
    conditions: ['endometriosis'],
    severitySupported: true,
    quickLog: true
  },

  chestPain: {
    id: 'chestPain',
    label: 'Chest Pain / Tightness',
    emoji: '💔',
    categories: ['pain', 'respiratory'],
    conditions: ['asthma', 'gerd'],
    severitySupported: true,
    quickLog: true
  },

  // ─────────────────────────────────────────────────────────────
  //  SENSORY
  // ─────────────────────────────────────────────────────────────

  sensoryOverload: {
    id: 'sensoryOverload',
    label: 'Sensory Overload',
    emoji: '🔊',
    categories: ['sensory'],
    conditions: ['adhd', 'autism'],
    severitySupported: true,
    quickLog: true
  },

  lightSensitivity: {
    id: 'lightSensitivity',
    label: 'Light Sensitivity',
    emoji: '💡',
    categories: ['sensory'],
    conditions: ['autism', 'migraine', 'tbiPostConcussion'],
    severitySupported: true,
    quickLog: true
  },

  soundSensitivity: {
    id: 'soundSensitivity',
    label: 'Sound Sensitivity',
    emoji: '👂',
    categories: ['sensory'],
    conditions: ['autism', 'migraine', 'tbiPostConcussion'],
    severitySupported: true,
    quickLog: true
  },

  socialExhaustion: {
    id: 'socialExhaustion',
    label: 'Social Exhaustion / Autistic Burnout',
    emoji: '🫠',
    categories: ['sensory', 'physical'],
    conditions: ['autism'],
    severitySupported: true,
    quickLog: true
  },

  smellSensitivity: {
    id: 'smellSensitivity',
    label: 'Smell Sensitivity',
    emoji: '👃',
    categories: ['sensory'],
    conditions: ['autism', 'migraine'],
    severitySupported: true,
    quickLog: false
  },

  touchSensitivity: {
    id: 'touchSensitivity',
    label: 'Touch / Texture Sensitivity',
    emoji: '🤲',
    categories: ['sensory'],
    conditions: ['autism', 'crps'],
    severitySupported: true,
    quickLog: false
  },

  temperatureSensitivity: {
    id: 'temperatureSensitivity',
    label: 'Temperature Sensitivity',
    emoji: '🌡️',
    categories: ['sensory', 'autonomic'],
    conditions: ['crps', 'raynauds'],
    severitySupported: true,
    quickLog: false
  },

  drySensation: {
    id: 'drySensation',
    label: 'Dry Eyes / Dry Mouth',
    emoji: '👁️',
    categories: ['sensory', 'immune'],
    conditions: ['sjögrens'],
    severitySupported: true,
    quickLog: true
  },

  // ─────────────────────────────────────────────────────────────
  //  NEUROLOGICAL
  // ─────────────────────────────────────────────────────────────

  dizziness: {
    id: 'dizziness',
    label: 'Dizziness / Lightheadedness',
    emoji: '💫',
    categories: ['neurological', 'autonomic'],
    conditions: ['pots', 'migraine', 'fnd', 'tbiPostConcussion'],
    severitySupported: true,
    quickLog: true
  },

  aura: {
    id: 'aura',
    label: 'Migraine Aura / Visual Disturbance',
    emoji: '🌈',
    categories: ['neurological', 'sensory'],
    conditions: ['migraine'],
    severitySupported: false,
    quickLog: true,
    notes: 'Migraine-specific visual/sensory aura. For pre-seizure warning sensation see seizureAura.'
  },

  numbnessTingling: {
    id: 'numbnessTingling',
    label: 'Numbness / Tingling',
    emoji: '⚡',
    categories: ['neurological'],
    conditions: ['crps', 'lupus', 'sjögrens', 'fnd', 'tbiPostConcussion'],
    severitySupported: true,
    quickLog: true
  },

  seizureActivity: {
    id: 'seizureActivity',
    label: 'Seizure / Absence Episode',
    emoji: '🔴',
    categories: ['neurological', 'flag'],
    conditions: ['fnd'],
    severitySupported: false,
    quickLog: true,
    notes: 'Flag-type symptom — log as an event'
  },

  nonEpilepticAttack: {
    id: 'nonEpilepticAttack',
    label: 'Non-Epileptic Attack',
    emoji: '⚠️',
    categories: ['neurological', 'flag'],
    conditions: ['fnd'],
    severitySupported: false,
    quickLog: true
  },

  balanceDifficulty: {
    id: 'balanceDifficulty',
    label: 'Balance / Coordination Difficulty',
    emoji: '🤸',
    categories: ['neurological'],
    conditions: ['fnd', 'tbiPostConcussion', 'pots'],
    severitySupported: true,
    quickLog: false
  },

  speechDifficulty: {
    id: 'speechDifficulty',
    label: 'Speech Difficulty / Slurred Speech',
    emoji: '🗣️',
    categories: ['neurological'],
    conditions: ['fnd', 'tbiPostConcussion'],
    severitySupported: true,
    quickLog: false
  },

  expressiveAphasia: {
    id: 'expressiveAphasia',
    label: 'Expressive Aphasia',
    emoji: '💬',
    categories: ['neurological', 'cognitive'],
    conditions: ['fnd', 'tbiPostConcussion'],
    severitySupported: true,
    quickLog: false
  },

  tinnitus: {
    id: 'tinnitus',
    label: 'Tinnitus / Ringing in Ears',
    emoji: '🔔',
    categories: ['neurological', 'sensory'],
    conditions: ['tbiPostConcussion', 'migraine'],
    severitySupported: true,
    quickLog: true
  },

  cataplexy: {
    id: 'cataplexy',
    label: 'Cataplexy (Sudden Muscle Weakness)',
    emoji: '🫙',
    categories: ['neurological', 'physical'],
    conditions: ['narcolepsy'],
    severitySupported: false,
    quickLog: true
  },

  sleepParalysis: {
    id: 'sleepParalysis',
    label: 'Sleep Paralysis',
    emoji: '😶',
    categories: ['neurological', 'sleep'],
    conditions: ['narcolepsy'],
    severitySupported: false,
    quickLog: true
  },

  hypnagogicHallucinations: {
    id: 'hypnagogicHallucinations',
    label: 'Hypnagogic Hallucinations',
    emoji: '👁️',
    categories: ['neurological', 'sleep'],
    conditions: ['narcolepsy'],
    severitySupported: false,
    quickLog: true
  },

  // ─────────────────────────────────────────────────────────────
  //  SLEEP
  // ─────────────────────────────────────────────────────────────

  sleepDisturbance: {
    id: 'sleepDisturbance',
    label: 'Sleep Disturbance / Insomnia',
    emoji: '😴',
    categories: ['sleep'],
    conditions: ['adhd', 'fibromyalgia', 'longCovid', 'mecfs', 'mdd', 'perimenopause', 'tbiPostConcussion'],
    severitySupported: true,
    quickLog: true
  },

  nonRestorativeSleep: {
    id: 'nonRestorativeSleep',
    label: 'Non-Restorative Sleep',
    emoji: '🌙',
    categories: ['sleep'],
    conditions: ['fibromyalgia', 'mecfs'],
    severitySupported: true,
    quickLog: true
  },

  excessiveDaytimeSleepiness: {
    id: 'excessiveDaytimeSleepiness',
    label: 'Excessive Daytime Sleepiness',
    emoji: '😪',
    categories: ['sleep'],
    conditions: ['narcolepsy', 'mecfs'],
    severitySupported: true,
    quickLog: true
  },

  sleepAttacks: {
    id: 'sleepAttacks',
    label: 'Sleep Attacks (Sudden Onset Sleep)',
    emoji: '💤',
    categories: ['sleep', 'neurological'],
    conditions: ['narcolepsy'],
    severitySupported: false,
    quickLog: true
  },

  // ─────────────────────────────────────────────────────────────
  //  GI / DIGESTIVE
  // ─────────────────────────────────────────────────────────────

  abdominalPain: {
    id: 'abdominalPain',
    label: 'Abdominal Pain / Cramping',
    emoji: '🫃',
    categories: ['gi', 'pain'],
    conditions: ['celiac', 'endometriosis', 'gerd'],
    severitySupported: true,
    quickLog: true
  },

  abdominalDiscomfort: {
    id: 'abdominalDiscomfort',
    label: 'Abdominal Discomfort / Bloating',
    emoji: '💨',
    categories: ['gi'],
    conditions: ['celiac', 'gerd'],
    severitySupported: true,
    quickLog: true
  },

  diarrhea: {
    id: 'diarrhea',
    label: 'Diarrhea',
    emoji: '🚽',
    categories: ['gi'],
    conditions: ['celiac'],
    severitySupported: false,
    quickLog: true
  },

  constipation: {
    id: 'constipation',
    label: 'Constipation',
    emoji: '🧱',
    categories: ['gi'],
    conditions: ['celiac'],
    severitySupported: false,
    quickLog: true
  },

  alternatingBowel: {
    id: 'alternatingBowel',
    label: 'Alternating C / D (IBS-M pattern)',
    emoji: '🔄',
    categories: ['gi'],
    conditions: ['celiac'],
    severitySupported: false,
    quickLog: false
  },

  acidRegurgitation: {
    id: 'acidRegurgitation',
    label: 'Acid Regurgitation / Reflux',
    emoji: '🌋',
    categories: ['gi'],
    conditions: ['gerd'],
    severitySupported: true,
    quickLog: true
  },

  heartburn: {
    id: 'heartburn',
    label: 'Heartburn',
    emoji: '🔥',
    categories: ['gi', 'pain'],
    conditions: ['gerd'],
    severitySupported: true,
    quickLog: true
  },

  difficultySwallowing: {
    id: 'difficultySwallowing',
    label: 'Difficulty Swallowing',
    emoji: '🍶',
    categories: ['gi'],
    conditions: ['gerd', 'sjögrens'],
    severitySupported: true,
    quickLog: false
  },

  vomiting: {
    id: 'vomiting',
    label: 'Vomiting',
    emoji: '🤮',
    categories: ['gi'],
    conditions: ['migraine'],
    severitySupported: false,
    quickLog: true
  },

  malabsorption: {
    id: 'malabsorption',
    label: 'Malabsorption / Nutritional Deficiency',
    emoji: '⚗️',
    categories: ['gi'],
    conditions: ['celiac'],
    severitySupported: false,
    quickLog: false
  },

  // ─────────────────────────────────────────────────────────────
  //  IMMUNE / INFLAMMATORY
  // ─────────────────────────────────────────────────────────────

  flareFlag: {
    id: 'flareFlag',
    label: 'Active Flare',
    emoji: '🚩',
    categories: ['flag', 'immune'],
    conditions: ['crps', 'lupus', 'fibromyalgia', 'sjögrens', 'endometriosis'],
    severitySupported: false,
    quickLog: true,
    notes: 'Binary event flag — marks start of a flare'
  },

  inflammation: {
    id: 'inflammation',
    label: 'Inflammation / Swelling',
    emoji: '🔴',
    categories: ['immune'],
    conditions: ['lupus', 'crps', 'sjögrens'],
    severitySupported: true,
    quickLog: true
  },

  rash: {
    id: 'rash',
    label: 'Rash / Skin Reaction',
    emoji: '🩹',
    categories: ['skin', 'immune'],
    conditions: ['lupus'],
    severitySupported: true,
    quickLog: true
  },

  butterflyRash: {
    id: 'butterflyRash',
    label: 'Butterfly / Malar Rash',
    emoji: '🦋',
    categories: ['skin', 'immune'],
    conditions: ['lupus'],
    severitySupported: false,
    quickLog: true
  },

  anaphylaxisFlag: {
    id: 'anaphylaxisFlag',
    label: 'Anaphylactic Reaction',
    emoji: '🆘',
    categories: ['flag', 'immune'],
    conditions: [],
    severitySupported: false,
    quickLog: true,
    notes: 'Emergency flag — log as an event'
  },

  angioedema: {
    id: 'angioedema',
    label: 'Angioedema (Swelling)',
    emoji: '💢',
    categories: ['immune', 'skin'],
    conditions: [],
    severitySupported: true,
    quickLog: false
  },

  // ─────────────────────────────────────────────────────────────
  //  AUTONOMIC / CARDIOVASCULAR
  // ─────────────────────────────────────────────────────────────

  orthostatic: {
    id: 'orthostatic',
    label: 'Orthostatic Intolerance / Standing Difficulty',
    emoji: '🧍',
    categories: ['autonomic'],
    conditions: ['pots'],
    severitySupported: true,
    quickLog: true
  },

  bloodPressureChanges: {
    id: 'bloodPressureChanges',
    label: 'Blood Pressure Drops / Fluctuations',
    emoji: '📉',
    categories: ['autonomic'],
    conditions: ['pots'],
    severitySupported: false,
    quickLog: false
  },

  flushing: {
    id: 'flushing',
    label: 'Flushing / Redness',
    emoji: '🫧',
    categories: ['autonomic', 'skin'],
    conditions: ['crps', 'raynauds', 'perimenopause'],
    severitySupported: true,
    quickLog: true
  },

  colorChangeSkin: {
    id: 'colorChangeSkin',
    label: 'Skin Color Changes (Blue/White/Red)',
    emoji: '🎨',
    categories: ['autonomic', 'skin'],
    conditions: ['raynauds', 'crps'],
    severitySupported: false,
    quickLog: true,
    notes: 'Classic Raynaud\'s triphasic color change'
  },

  sweatingChanges: {
    id: 'sweatingChanges',
    label: 'Abnormal Sweating',
    emoji: '💧',
    categories: ['autonomic'],
    conditions: ['crps', 'pots', 'perimenopause'],
    severitySupported: false,
    quickLog: true
  },

  // ─────────────────────────────────────────────────────────────
  //  RESPIRATORY
  // ─────────────────────────────────────────────────────────────

  wheeze: {
    id: 'wheeze',
    label: 'Wheezing',
    emoji: '🌬️',
    categories: ['respiratory'],
    conditions: ['asthma'],
    severitySupported: true,
    quickLog: true
  },

  cough: {
    id: 'cough',
    label: 'Cough',
    emoji: '😮‍💨',
    categories: ['respiratory', 'gi'],
    conditions: ['asthma', 'gerd'],
    severitySupported: true,
    quickLog: true
  },

  chestTightness: {
    id: 'chestTightness',
    label: 'Chest Tightness',
    emoji: '🫁',
    categories: ['respiratory'],
    conditions: ['asthma'],
    severitySupported: true,
    quickLog: true
  },

  asthmaAttackFlag: {
    id: 'asthmaAttackFlag',
    label: 'Asthma Attack / Episode',
    emoji: '🆘',
    categories: ['flag', 'respiratory'],
    conditions: ['asthma'],
    severitySupported: false,
    quickLog: true
  },

  // ─────────────────────────────────────────────────────────────
  //  HORMONAL / METABOLIC
  // ─────────────────────────────────────────────────────────────

  hormoneFluctuation: {
    id: 'hormoneFluctuation',
    label: 'Hormone Fluctuation Symptoms',
    emoji: '🔬',
    categories: ['hormonal'],
    conditions: ['endometriosis', 'perimenopause'],
    severitySupported: false,
    quickLog: false
  },

  heavyBleeding: {
    id: 'heavyBleeding',
    label: 'Heavy / Irregular Bleeding',
    emoji: '🩸',
    categories: ['hormonal'],
    conditions: ['endometriosis', 'perimenopause'],
    severitySupported: true,
    quickLog: true
  },

  cyclicalSymptoms: {
    id: 'cyclicalSymptoms',
    label: 'Cyclical / Cycle-Linked Symptoms',
    emoji: '🔄',
    categories: ['hormonal', 'flag'],
    conditions: ['endometriosis', 'perimenopause'],
    severitySupported: false,
    quickLog: false
  },

  vaginalDryness: {
    id: 'vaginalDryness',
    label: 'Vaginal Dryness / GSM',
    emoji: '🌵',
    categories: ['hormonal'],
    conditions: ['perimenopause', 'sjögrens'],
    severitySupported: true,
    quickLog: false
  },

  acneHormonal: {
    id: 'acneHormonal',
    label: 'Hormonal Acne (chin/jaw/back)',
    emoji: '😶',
    categories: ['skin', 'hormonal'],
    conditions: ['endometriosis', 'perimenopause'],
    severitySupported: false,
    quickLog: false
  },

  // ─────────────────────────────────────────────────────────────
  //  MUSCULOSKELETAL
  // ─────────────────────────────────────────────────────────────

  stiffness: {
    id: 'stiffness',
    label: 'Morning Stiffness / Stiffness',
    emoji: '🦿',
    categories: ['musculoskeletal'],
    conditions: ['fibromyalgia', 'lupus', 'sjögrens'],
    severitySupported: true,
    quickLog: true
  },

  limbWeakness: {
    id: 'limbWeakness',
    label: 'Limb Weakness (One Side)',
    emoji: '🦾',
    categories: ['musculoskeletal', 'neurological'],
    conditions: ['fnd', 'tbiPostConcussion'],
    severitySupported: true,
    quickLog: false
  },

  muscleSpasms: {
    id: 'muscleSpasms',
    label: 'Muscle Spasms / Cramps',
    emoji: '⚡',
    categories: ['musculoskeletal'],
    conditions: ['fibromyalgia', 'crps'],
    severitySupported: true,
    quickLog: true
  },

  // ─────────────────────────────────────────────────────────────
  //  TRIGGERS
  // ─────────────────────────────────────────────────────────────

  alcoholTrigger: {
    id: 'alcoholTrigger',
    label: 'Alcohol Trigger',
    emoji: '🍷',
    categories: ['trigger'],
    conditions: ['migraine'],
    severitySupported: false,
    quickLog: true
  },

  glutenExposure: {
    id: 'glutenExposure',
    label: 'Gluten Exposure',
    emoji: '🌾',
    categories: ['trigger'],
    conditions: ['celiac'],
    severitySupported: false,
    quickLog: true
  },

  stressTrigger: {
    id: 'stressTrigger',
    label: 'Stress Trigger',
    emoji: '😵',
    categories: ['trigger'],
    conditions: ['migraine', 'crps', 'fnd'],
    severitySupported: false,
    quickLog: true
  },

  // ─────────────────────────────────────────────────────────────
  //  MISC / CROSS-CONDITION
  // ─────────────────────────────────────────────────────────────

  anosmia: {
    id: 'anosmia',
    label: 'Anosmia / Ageusia (Lost Smell / Taste)',
    emoji: '👃',
    categories: ['neurological', 'sensory'],
    conditions: ['longCovid'],
    severitySupported: false,
    quickLog: true
  },

  hairLoss: {
    id: 'hairLoss',
    label: 'Hair Loss',
    emoji: '💇',
    categories: ['skin', 'hormonal'],
    conditions: ['lupus', 'celiac', 'perimenopause'],
    severitySupported: false,
    quickLog: false
  },

  drySkin: {
    id: 'drySkin',
    label: 'Dry Skin / Skin Fragility',
    emoji: '🏜️',
    categories: ['skin'],
    conditions: ['sjögrens'],
    severitySupported: false,
    quickLog: false
  },

  acanthosisPatch: {
    id: 'acanthosisPatch',
    label: 'Acanthosis Nigricans (Dark Skin Patches)',
    emoji: '🎨',
    categories: ['skin'],
    conditions: [],
    severitySupported: false,
    quickLog: false
  },

  photosensitivity: {
    id: 'photosensitivity',
    label: 'Photosensitivity (Skin)',
    emoji: '☀️',
    categories: ['skin', 'immune'],
    conditions: ['lupus'],
    severitySupported: false,
    quickLog: false
  },

  moodCognitionPostConcussion: {
    id: 'moodCognitionPostConcussion',
    label: 'Mood / Cognition Changes Post-Injury',
    emoji: '🧩',
    categories: ['cognitive', 'mood'],
    conditions: ['tbiPostConcussion'],
    severitySupported: true,
    quickLog: false
  },

  // ─────────────────────────────────────────────────────────────
  //  SEIZURE DISORDERS
  // ─────────────────────────────────────────────────────────────

  absenceEpisode: {
    id: 'absenceEpisode',
    label: 'Absence / Blank Episode',
    emoji: '⚪',
    categories: ['neurological', 'flag'],
    conditions: ['seizure'],
    severitySupported: false,
    quickLog: true,
    notes: 'Brief loss of awareness / blank stare episode'
  },

  tonicClonicSeizure: {
    id: 'tonicClonicSeizure',
    label: 'Tonic-Clonic Seizure',
    emoji: '🔴',
    categories: ['neurological', 'flag'],
    conditions: ['seizure'],
    severitySupported: false,
    quickLog: true
  },

  focalSeizure: {
    id: 'focalSeizure',
    label: 'Focal / Partial Seizure',
    emoji: '⚠️',
    categories: ['neurological', 'flag'],
    conditions: ['seizure'],
    severitySupported: false,
    quickLog: true
  },

  myoclonicJerks: {
    id: 'myoclonicJerks',
    label: 'Myoclonic Jerks',
    emoji: '⚡',
    categories: ['neurological'],
    conditions: ['seizure'],
    severitySupported: false,
    quickLog: true
  },

  postIctalFatigue: {
    id: 'postIctalFatigue',
    label: 'Post-Ictal Fatigue / Exhaustion',
    emoji: '😩',
    categories: ['neurological', 'physical'],
    conditions: ['seizure'],
    severitySupported: true,
    quickLog: true,
    notes: 'Extreme fatigue after a seizure event'
  },

  postIctalConfusion: {
    id: 'postIctalConfusion',
    label: 'Post-Ictal Confusion',
    emoji: '🌀',
    categories: ['neurological', 'cognitive'],
    conditions: ['seizure'],
    severitySupported: false,
    quickLog: true
  },

  seizureAura: {
    id: 'seizureAura',
    label: 'Seizure Aura / Pre-Seizure Sensation',
    emoji: '⚡',
    categories: ['neurological'],
    conditions: ['seizure'],
    severitySupported: false,
    quickLog: true,
    notes: 'Sensory warning before seizure onset — distinct from migraine aura (see aura). May include smell, taste, déjà vu, tingling, or mood shift.'
  },

  preictalMoodChange: {
    id: 'preictalMoodChange',
    label: 'Mood Change Before Seizure',
    emoji: '🌊',
    categories: ['mood', 'neurological'],
    conditions: ['seizure'],
    severitySupported: false,
    quickLog: true
  },

  automatisms: {
    id: 'automatisms',
    label: 'Automatisms (Repetitive Movements)',
    emoji: '🔄',
    categories: ['neurological'],
    conditions: ['seizure'],
    severitySupported: false,
    quickLog: true,
    notes: 'Involuntary repetitive movements during a seizure'
  },

  postSeizureHeadache: {
    id: 'postSeizureHeadache',
    label: 'Headache After Seizure',
    emoji: '🤕',
    categories: ['pain', 'neurological'],
    conditions: ['seizure'],
    severitySupported: true,
    quickLog: true
  },

  // ─────────────────────────────────────────────────────────────
  //  PCOS
  // ─────────────────────────────────────────────────────────────

  irregularPeriods: {
    id: 'irregularPeriods',
    label: 'Irregular / Absent Periods',
    emoji: '🗓️',
    categories: ['hormonal'],
    conditions: ['pcos'],
    severitySupported: false,
    quickLog: true
  },

  hirsutism: {
    id: 'hirsutism',
    label: 'Excess Facial / Body Hair (Hirsutism)',
    emoji: '🪒',
    categories: ['skin', 'hormonal'],
    conditions: ['pcos'],
    severitySupported: false,
    quickLog: false
  },

  hairThinning: {
    id: 'hairThinning',
    label: 'Hair Thinning / Scalp Hair Loss',
    emoji: '💇',
    categories: ['skin', 'hormonal'],
    conditions: ['pcos'],
    severitySupported: false,
    quickLog: false
  },

  oilySkin: {
    id: 'oilySkin',
    label: 'Oily Skin',
    emoji: '✨',
    categories: ['skin', 'hormonal'],
    conditions: ['pcos'],
    severitySupported: false,
    quickLog: false
  },

  insulinResistanceSymptoms: {
    id: 'insulinResistanceSymptoms',
    label: 'Insulin Resistance Symptoms',
    emoji: '📉',
    categories: ['hormonal', 'physical'],
    conditions: ['pcos'],
    severitySupported: false,
    quickLog: false
  },

  energyCrashAfterEating: {
    id: 'energyCrashAfterEating',
    label: 'Energy Crash After Eating',
    emoji: '🥱',
    categories: ['hormonal', 'physical'],
    conditions: ['pcos', 'diabetesT2'],
    severitySupported: true,
    quickLog: true
  },

  ovulationPain: {
    id: 'ovulationPain',
    label: 'Ovulation Pain',
    emoji: '🌀',
    categories: ['pain', 'hormonal'],
    conditions: ['pcos'],
    severitySupported: true,
    quickLog: true
  },

  ovarianCystPain: {
    id: 'ovarianCystPain',
    label: 'Ovarian Cyst Pain / Rupture',
    emoji: '⚠️',
    categories: ['pain', 'hormonal'],
    conditions: ['pcos'],
    severitySupported: true,
    quickLog: true
  },

  premenstrualRage: {
    id: 'premenstrualRage',
    label: 'Premenstrual Rage / Dysphoria',
    emoji: '😤',
    categories: ['mood', 'hormonal'],
    conditions: ['pcos'],
    severitySupported: true,
    quickLog: true
  },

  // ─────────────────────────────────────────────────────────────
  //  EDS / hEDS / HSD
  // ─────────────────────────────────────────────────────────────

  jointHypermobility: {
    id: 'jointHypermobility',
    label: 'Joint Hypermobility',
    emoji: '🤸',
    categories: ['musculoskeletal'],
    conditions: ['eds'],
    severitySupported: false,
    quickLog: false
  },

  jointSubluxation: {
    id: 'jointSubluxation',
    label: 'Joint Subluxation (Partial Dislocation)',
    emoji: '⚠️',
    categories: ['musculoskeletal', 'pain'],
    conditions: ['eds'],
    severitySupported: true,
    quickLog: true
  },

  jointDislocation: {
    id: 'jointDislocation',
    label: 'Joint Dislocation',
    emoji: '🔴',
    categories: ['musculoskeletal', 'pain', 'flag'],
    conditions: ['eds'],
    severitySupported: false,
    quickLog: true
  },

  jointClicking: {
    id: 'jointClicking',
    label: 'Joint Clicking / Popping',
    emoji: '🔊',
    categories: ['musculoskeletal'],
    conditions: ['eds'],
    severitySupported: false,
    quickLog: false
  },

  stretchySkin: {
    id: 'stretchySkin',
    label: 'Stretchy / Velvety Skin',
    emoji: '🫱',
    categories: ['skin'],
    conditions: ['eds'],
    severitySupported: false,
    quickLog: false
  },

  easyBruising: {
    id: 'easyBruising',
    label: 'Easy Bruising',
    emoji: '🩹',
    categories: ['skin'],
    conditions: ['eds'],
    severitySupported: false,
    quickLog: true
  },

  slowWoundHealing: {
    id: 'slowWoundHealing',
    label: 'Slow Wound Healing',
    emoji: '🩹',
    categories: ['skin', 'immune'],
    conditions: ['eds'],
    severitySupported: false,
    quickLog: false
  },

  proprioceptionDifficulty: {
    id: 'proprioceptionDifficulty',
    label: 'Proprioception Difficulty / Poor Body Awareness',
    emoji: '🧭',
    categories: ['sensory', 'neurological'],
    conditions: ['eds'],
    severitySupported: false,
    quickLog: false
  },

  tmjPain: {
    id: 'tmjPain',
    label: 'TMJ Pain / Jaw Clicking',
    emoji: '🦷',
    categories: ['pain', 'musculoskeletal'],
    conditions: ['eds'],
    severitySupported: true,
    quickLog: true
  },

  postExertionalPainIncrease: {
    id: 'postExertionalPainIncrease',
    label: 'Pain Increase After Activity',
    emoji: '📈',
    categories: ['pain', 'physical'],
    conditions: ['eds', 'fibromyalgia'],
    severitySupported: true,
    quickLog: true
  },

  // ─────────────────────────────────────────────────────────────
  //  ANXIETY (GAD / PANIC)
  // ─────────────────────────────────────────────────────────────

  rumination: {
    id: 'rumination',
    label: 'Rumination / Looping Thoughts',
    emoji: '🔁',
    categories: ['cognitive', 'mood'],
    conditions: ['anxietyGad'],
    severitySupported: true,
    quickLog: true
  },

  catastrophizing: {
    id: 'catastrophizing',
    label: 'Catastrophizing',
    emoji: '🌪️',
    categories: ['cognitive', 'mood'],
    conditions: ['anxietyGad'],
    severitySupported: true,
    quickLog: false
  },

  hypervigilance: {
    id: 'hypervigilance',
    label: 'Hypervigilance',
    emoji: '👀',
    categories: ['mood', 'neurological'],
    conditions: ['anxietyGad', 'cptsd'],
    severitySupported: true,
    quickLog: true
  },

  dreadDoom: {
    id: 'dreadDoom',
    label: 'Dread / Sense of Doom',
    emoji: '😨',
    categories: ['mood'],
    conditions: ['anxietyGad'],
    severitySupported: true,
    quickLog: true
  },

  avoidanceUrge: {
    id: 'avoidanceUrge',
    label: 'Avoidance Urge',
    emoji: '🚪',
    categories: ['mood'],
    conditions: ['anxietyGad'],
    severitySupported: false,
    quickLog: true
  },

  panicAttack: {
    id: 'panicAttack',
    label: 'Panic Attack',
    emoji: '🆘',
    categories: ['mood', 'autonomic', 'flag'],
    conditions: ['anxietyGad'],
    severitySupported: false,
    quickLog: true
  },

  decisionParalysis: {
    id: 'decisionParalysis',
    label: 'Decision Paralysis',
    emoji: '⚖️',
    categories: ['cognitive', 'mood'],
    conditions: ['anxietyGad'],
    severitySupported: true,
    quickLog: true
  },

  nighttimeRumination: {
    id: 'nighttimeRumination',
    label: 'Nighttime Rumination / Anxious Waking',
    emoji: '🌙',
    categories: ['sleep', 'mood'],
    conditions: ['anxietyGad'],
    severitySupported: false,
    quickLog: true
  },

  // ─────────────────────────────────────────────────────────────
  //  C-PTSD / PTSD
  // ─────────────────────────────────────────────────────────────

  emotionalFlashback: {
    id: 'emotionalFlashback',
    label: 'Emotional Flashback',
    emoji: '🌊',
    categories: ['mood', 'neurological'],
    conditions: ['cptsd'],
    severitySupported: true,
    quickLog: true
  },

  shameSpiral: {
    id: 'shameSpiral',
    label: 'Shame Spiral',
    emoji: '🌀',
    categories: ['mood'],
    conditions: ['cptsd'],
    severitySupported: true,
    quickLog: true
  },

  freezeResponse: {
    id: 'freezeResponse',
    label: 'Freeze Response',
    emoji: '🧊',
    categories: ['mood', 'autonomic'],
    conditions: ['cptsd'],
    severitySupported: false,
    quickLog: true
  },

  fawnResponse: {
    id: 'fawnResponse',
    label: 'Fawn Response Fatigue',
    emoji: '🦌',
    categories: ['mood', 'physical'],
    conditions: ['cptsd'],
    severitySupported: false,
    quickLog: false
  },

  intrusiveThoughts: {
    id: 'intrusiveThoughts',
    label: 'Intrusive Thoughts / Memories',
    emoji: '💭',
    categories: ['cognitive', 'mood'],
    conditions: ['cptsd'],
    severitySupported: true,
    quickLog: true
  },

  griefWave: {
    id: 'griefWave',
    label: 'Grief Wave',
    emoji: '😢',
    categories: ['mood'],
    conditions: ['cptsd'],
    severitySupported: true,
    quickLog: true
  },

  feelingUnsafe: {
    id: 'feelingUnsafe',
    label: 'Feeling Unsafe (No Clear Trigger)',
    emoji: '⚠️',
    categories: ['mood'],
    conditions: ['cptsd'],
    severitySupported: true,
    quickLog: true
  },

  somaticFlare: {
    id: 'somaticFlare',
    label: 'Somatic Symptom Flare (Body Memories)',
    emoji: '🫀',
    categories: ['physical', 'autonomic'],
    conditions: ['cptsd'],
    severitySupported: true,
    quickLog: true
  },

  triggerActivated: {
    id: 'triggerActivated',
    label: 'Triggered by Person / Place / Date',
    emoji: '🚩',
    categories: ['flag', 'mood'],
    conditions: ['cptsd'],
    severitySupported: false,
    quickLog: true
  },

  // ─────────────────────────────────────────────────────────────
  //  MULTIPLE SCLEROSIS (MS)
  // ─────────────────────────────────────────────────────────────

  electricShockSensation: {
    id: 'electricShockSensation',
    label: "Electric Shock Sensation (Lhermitte's Sign)",
    emoji: '⚡',
    categories: ['neurological'],
    conditions: ['ms'],
    severitySupported: true,
    quickLog: true
  },

  opticNeuritis: {
    id: 'opticNeuritis',
    label: 'Optic Neuritis (Eye Pain / Blurred Vision)',
    emoji: '👁️',
    categories: ['neurological', 'sensory'],
    conditions: ['ms'],
    severitySupported: true,
    quickLog: true
  },

  spasticity: {
    id: 'spasticity',
    label: 'Spasticity / Muscle Stiffness',
    emoji: '🦾',
    categories: ['musculoskeletal', 'neurological'],
    conditions: ['ms'],
    severitySupported: true,
    quickLog: true
  },

  walkingDifficulty: {
    id: 'walkingDifficulty',
    label: 'Walking Difficulty / Gait Changes',
    emoji: '🚶',
    categories: ['musculoskeletal', 'neurological'],
    conditions: ['ms'],
    severitySupported: true,
    quickLog: true
  },

  dropFoot: {
    id: 'dropFoot',
    label: 'Drop Foot',
    emoji: '🦶',
    categories: ['neurological', 'musculoskeletal'],
    conditions: ['ms'],
    severitySupported: false,
    quickLog: false
  },

  heatSensitivity: {
    id: 'heatSensitivity',
    label: 'Heat Sensitivity / Uhthoff\'s Phenomenon',
    emoji: '🌡️',
    categories: ['sensory', 'neurological'],
    conditions: ['ms'],
    severitySupported: false,
    quickLog: true,
    notes: 'Symptom worsening with heat exposure'
  },

  urinaryUrgency: {
    id: 'urinaryUrgency',
    label: 'Urinary Urgency / Incontinence',
    emoji: '💧',
    categories: ['urological'],
    conditions: ['ms'],
    severitySupported: true,
    quickLog: false
  },

  urinaryRetention: {
    id: 'urinaryRetention',
    label: 'Urinary Retention',
    emoji: '🚽',
    categories: ['urological'],
    conditions: ['ms'],
    severitySupported: false,
    quickLog: false
  },

  pseudobulbarAffect: {
    id: 'pseudobulbarAffect',
    label: 'Pseudobulbar Affect (Uncontrolled Emotion)',
    emoji: '😅',
    categories: ['mood', 'neurological'],
    conditions: ['ms'],
    severitySupported: false,
    quickLog: false
  },

  relapseFlag: {
    id: 'relapseFlag',
    label: 'Relapse / New Symptom Onset',
    emoji: '🔴',
    categories: ['flag', 'neurological'],
    conditions: ['ms'],
    severitySupported: false,
    quickLog: true,
    notes: 'Flag to mark start of a confirmed or suspected relapse'
  },

  // ─────────────────────────────────────────────────────────────
  //  MCAS (Mast Cell Activation Syndrome)
  // ─────────────────────────────────────────────────────────────

  hives: {
    id: 'hives',
    label: 'Hives (Urticaria)',
    emoji: '🔴',
    categories: ['skin', 'immune'],
    conditions: ['mcas'],
    severitySupported: true,
    quickLog: true
  },

  itchingNoRash: {
    id: 'itchingNoRash',
    label: 'Itching Without Rash',
    emoji: '😖',
    categories: ['skin', 'immune'],
    conditions: ['mcas'],
    severitySupported: true,
    quickLog: true
  },

  dermatographia: {
    id: 'dermatographia',
    label: 'Dermatographia (Skin Writing)',
    emoji: '✍️',
    categories: ['skin', 'immune'],
    conditions: ['mcas'],
    severitySupported: false,
    quickLog: false
  },

  nasalCongestion: {
    id: 'nasalCongestion',
    label: 'Nasal Congestion / Runny Nose',
    emoji: '🤧',
    categories: ['respiratory'],
    conditions: ['mcas'],
    severitySupported: false,
    quickLog: true
  },

  throatTightness: {
    id: 'throatTightness',
    label: 'Throat Tightness / Hoarseness',
    emoji: '🗣️',
    categories: ['respiratory', 'immune'],
    conditions: ['mcas'],
    severitySupported: true,
    quickLog: true,
    notes: 'Flag if severe — may indicate anaphylaxis'
  },

  hypotensionDrop: {
    id: 'hypotensionDrop',
    label: 'Blood Pressure Drop (Hypotension)',
    emoji: '📉',
    categories: ['autonomic', 'cardiovascular'],
    conditions: ['mcas'],
    severitySupported: false,
    quickLog: true
  },

  mcasBrainFog: {
    id: 'mcasBrainFog',
    label: 'Brain Fog (Mast Cell)',
    emoji: '🧠',
    categories: ['cognitive'],
    conditions: ['mcas'],
    severitySupported: true,
    quickLog: true,
    notes: 'Brain fog with a mast cell / histamine pattern'
  },

  foodTrigger: {
    id: 'foodTrigger',
    label: 'Food Trigger Reaction',
    emoji: '🍽️',
    categories: ['trigger'],
    conditions: ['mcas'],
    severitySupported: false,
    quickLog: true
  },

  environmentalTrigger: {
    id: 'environmentalTrigger',
    label: 'Environmental Trigger (Mold / Chemical / Pollen)',
    emoji: '🌿',
    categories: ['trigger'],
    conditions: ['mcas'],
    severitySupported: false,
    quickLog: true
  },

  // ─────────────────────────────────────────────────────────────
  //  IBS
  // ─────────────────────────────────────────────────────────────

  gasFlatus: {
    id: 'gasFlatus',
    label: 'Gas / Flatulence',
    emoji: '💨',
    categories: ['gi'],
    conditions: ['ibs'],
    severitySupported: false,
    quickLog: true
  },

  bowelUrgency: {
    id: 'bowelUrgency',
    label: 'Bowel Urgency',
    emoji: '⚡',
    categories: ['gi'],
    conditions: ['ibs', 'crohns'],
    severitySupported: false,
    quickLog: true
  },

  incompleteEvacuation: {
    id: 'incompleteEvacuation',
    label: 'Incomplete Evacuation Feeling',
    emoji: '🔄',
    categories: ['gi'],
    conditions: ['ibs', 'crohns'],
    severitySupported: false,
    quickLog: false
  },

  mucusInStool: {
    id: 'mucusInStool',
    label: 'Mucus in Stool',
    emoji: '💛',
    categories: ['gi'],
    conditions: ['ibs', 'crohns'],
    severitySupported: false,
    quickLog: false
  },

  ibsBloating: {
    id: 'ibsBloating',
    label: 'Bloating',
    emoji: '🫃',
    categories: ['gi'],
    conditions: ['ibs', 'mcas', 'crohns', 'pcos', 'endometriosis'],
    severitySupported: true,
    quickLog: true
  },

  ibsCramping: {
    id: 'ibsCramping',
    label: 'Abdominal Cramping (IBS)',
    emoji: '🌀',
    categories: ['gi', 'pain'],
    conditions: ['ibs'],
    severitySupported: true,
    quickLog: true
  },

  // ─────────────────────────────────────────────────────────────
  //  CROHN'S DISEASE
  // ─────────────────────────────────────────────────────────────

  bloodInStool: {
    id: 'bloodInStool',
    label: 'Blood in Stool',
    emoji: '🩸',
    categories: ['gi', 'flag'],
    conditions: ['crohns'],
    severitySupported: false,
    quickLog: true,
    notes: 'Flag — always worth logging'
  },

  unexplainedFever: {
    id: 'unexplainedFever',
    label: 'Unexplained / Low-Grade Fever',
    emoji: '🌡️',
    categories: ['immune', 'physical'],
    conditions: ['crohns', 'lupus'],
    severitySupported: false,
    quickLog: true
  },

  appetiteLoss: {
    id: 'appetiteLoss',
    label: 'Appetite Loss / Weight Loss',
    emoji: '🍽️',
    categories: ['physical', 'gi'],
    conditions: ['crohns', 'mdd'],
    severitySupported: false,
    quickLog: true
  },

  mouthUlcers: {
    id: 'mouthUlcers',
    label: 'Mouth / Canker Sores',
    emoji: '👄',
    categories: ['gi', 'immune'],
    conditions: ['crohns', 'lupus'],
    severitySupported: false,
    quickLog: true
  },

  remissionFlag: {
    id: 'remissionFlag',
    label: 'In Remission',
    emoji: '✅',
    categories: ['flag'],
    conditions: ['crohns'],
    severitySupported: false,
    quickLog: false,
    notes: 'Track remission periods'
  },

  crohnsFatigue: {
    id: 'crohnsFatigue',
    label: 'Fatigue (Crohn\'s / Active Inflammation)',
    emoji: '😩',
    categories: ['physical', 'immune'],
    conditions: ['crohns'],
    severitySupported: true,
    quickLog: true
  },

  // ─────────────────────────────────────────────────────────────
  //  INSOMNIA / SLEEP DISORDERS
  // ─────────────────────────────────────────────────────────────

  difficultyFallingAsleep: {
    id: 'difficultyFallingAsleep',
    label: 'Difficulty Falling Asleep',
    emoji: '😶',
    categories: ['sleep'],
    conditions: ['insomnia'],
    severitySupported: true,
    quickLog: true
  },

  frequentWaking: {
    id: 'frequentWaking',
    label: 'Frequent Night Waking',
    emoji: '🌙',
    categories: ['sleep'],
    conditions: ['insomnia'],
    severitySupported: false,
    quickLog: true
  },

  earlyMorningWaking: {
    id: 'earlyMorningWaking',
    label: 'Early Morning Waking (Can\'t Return to Sleep)',
    emoji: '🌅',
    categories: ['sleep'],
    conditions: ['insomnia'],
    severitySupported: false,
    quickLog: true
  },

  hyperarousalBedtime: {
    id: 'hyperarousalBedtime',
    label: 'Hyperarousal at Bedtime',
    emoji: '😬',
    categories: ['sleep', 'autonomic'],
    conditions: ['insomnia'],
    severitySupported: true,
    quickLog: true
  },

  physicalRestlessness: {
    id: 'physicalRestlessness',
    label: 'Physical Restlessness at Night',
    emoji: '🔀',
    categories: ['sleep', 'physical'],
    conditions: ['insomnia'],
    severitySupported: false,
    quickLog: true
  },

  hypnicJerks: {
    id: 'hypnicJerks',
    label: 'Hypnic Jerks (Sleep Starts)',
    emoji: '⚡',
    categories: ['sleep', 'neurological'],
    conditions: ['insomnia'],
    severitySupported: false,
    quickLog: true
  },

  vivid: {
    id: 'vivid',
    label: 'Vivid Dreams / Nightmares',
    emoji: '🌌',
    categories: ['sleep'],
    conditions: ['insomnia'],
    severitySupported: false,
    quickLog: true
  },

  // ─────────────────────────────────────────────────────────────
  //  OCD
  // ─────────────────────────────────────────────────────────────

  intrusiveThoughtOcd: {
    id: 'intrusiveThoughtOcd',
    label: 'Intrusive / Unwanted Thought',
    emoji: '💭',
    categories: ['cognitive', 'mood'],
    conditions: ['ocd'],
    severitySupported: true,
    quickLog: true
  },

  checkingCompulsion: {
    id: 'checkingCompulsion',
    label: 'Checking Compulsion',
    emoji: '✅',
    categories: ['behavioral'],
    conditions: ['ocd'],
    severitySupported: true,
    quickLog: true
  },

  washingCompulsion: {
    id: 'washingCompulsion',
    label: 'Washing / Cleaning Compulsion',
    emoji: '🧼',
    categories: ['behavioral'],
    conditions: ['ocd'],
    severitySupported: true,
    quickLog: true
  },

  mentalReviewing: {
    id: 'mentalReviewing',
    label: 'Mental Reviewing / Reassurance Loop',
    emoji: '🔁',
    categories: ['cognitive', 'behavioral'],
    conditions: ['ocd'],
    severitySupported: true,
    quickLog: true
  },

  ocdAnxietySpike: {
    id: 'ocdAnxietySpike',
    label: 'OCD Anxiety Spike / Distress',
    emoji: '😰',
    categories: ['mood'],
    conditions: ['ocd'],
    severitySupported: true,
    quickLog: true
  },

  ocdExhaustion: {
    id: 'ocdExhaustion',
    label: 'Exhaustion from OCD Cycle',
    emoji: '😮‍💨',
    categories: ['physical', 'mood'],
    conditions: ['ocd'],
    severitySupported: true,
    quickLog: true
  },

  // ─────────────────────────────────────────────────────────────
  //  DIABETES TYPE 1
  // ─────────────────────────────────────────────────────────────

  hypoglycemiaShaking: {
    id: 'hypoglycemiaShaking',
    label: 'Shakiness / Tremor (Low Blood Sugar)',
    emoji: '✋',
    categories: ['neurological', 'physical'],
    conditions: ['diabetesT1'],
    severitySupported: true,
    quickLog: true
  },

  hypoglycemiaMoodChange: {
    id: 'hypoglycemiaMoodChange',
    label: 'Irritability / Mood Change (Low Blood Sugar)',
    emoji: '😤',
    categories: ['mood'],
    conditions: ['diabetesT1'],
    severitySupported: false,
    quickLog: true
  },

  hypoglycemiaConfusion: {
    id: 'hypoglycemiaConfusion',
    label: 'Confusion / Difficulty Thinking (Low BG)',
    emoji: '🌀',
    categories: ['cognitive'],
    conditions: ['diabetesT1'],
    severitySupported: false,
    quickLog: true
  },

  hypoglycemiaFlag: {
    id: 'hypoglycemiaFlag',
    label: 'Hypoglycemia Episode (Low Blood Sugar)',
    emoji: '📉',
    categories: ['flag', 'physical'],
    conditions: ['diabetesT1', 'diabetesT2'],
    severitySupported: false,
    quickLog: true
  },

  hyperglycemiaFlag: {
    id: 'hyperglycemiaFlag',
    label: 'Hyperglycemia Episode (High Blood Sugar)',
    emoji: '📈',
    categories: ['flag', 'physical'],
    conditions: ['diabetesT1', 'diabetesT2'],
    severitySupported: false,
    quickLog: true
  },

  increasedThirst: {
    id: 'increasedThirst',
    label: 'Increased Thirst / Frequent Urination',
    emoji: '💧',
    categories: ['physical', 'urological'],
    conditions: ['diabetesT1', 'diabetesT2'],
    severitySupported: false,
    quickLog: true
  },

  blurredVisionBG: {
    id: 'blurredVisionBG',
    label: 'Blurred Vision (Blood Sugar-Related)',
    emoji: '👁️',
    categories: ['sensory', 'physical'],
    conditions: ['diabetesT1', 'diabetesT2'],
    severitySupported: false,
    quickLog: true
  },

  dkaFlag: {
    id: 'dkaFlag',
    label: 'DKA Symptoms (Emergency Flag)',
    emoji: '🆘',
    categories: ['flag', 'physical'],
    conditions: ['diabetesT1'],
    severitySupported: false,
    quickLog: true,
    notes: 'Diabetic ketoacidosis — emergency. Log and seek care.'
  },

  peripheralNeuropathy: {
    id: 'peripheralNeuropathy',
    label: 'Peripheral Neuropathy (Tingling / Numbness)',
    emoji: '⚡',
    categories: ['neurological'],
    conditions: ['diabetesT2', 'longCovid'],
    severitySupported: true,
    quickLog: true
  },

  // ─────────────────────────────────────────────────────────────
  //  HYPOTHYROIDISM
  // ─────────────────────────────────────────────────────────────

  coldHands: {
    id: 'coldHands',
    label: 'Cold Hands / Feet',
    emoji: '🥶',
    categories: ['autonomic', 'physical'],
    conditions: ['hypothyroidism'],
    severitySupported: false,
    quickLog: true
  },

  weightGain: {
    id: 'weightGain',
    label: 'Weight Gain (Despite Normal Eating)',
    emoji: '⚖️',
    categories: ['hormonal', 'physical'],
    conditions: ['hypothyroidism'],
    severitySupported: false,
    quickLog: false
  },

  brittleNails: {
    id: 'brittleNails',
    label: 'Brittle Nails',
    emoji: '💅',
    categories: ['skin'],
    conditions: ['hypothyroidism'],
    severitySupported: false,
    quickLog: false
  },

  puffyFace: {
    id: 'puffyFace',
    label: 'Puffy Face / Eyelids',
    emoji: '😶',
    categories: ['physical', 'hormonal'],
    conditions: ['hypothyroidism'],
    severitySupported: false,
    quickLog: false
  },

  hoarseVoice: {
    id: 'hoarseVoice',
    label: 'Hoarse Voice',
    emoji: '🗣️',
    categories: ['respiratory', 'physical'],
    conditions: ['hypothyroidism', 'gerd'],
    severitySupported: false,
    quickLog: false
  },

  slowHeartRate: {
    id: 'slowHeartRate',
    label: 'Slow Heart Rate (Bradycardia)',
    emoji: '💙',
    categories: ['autonomic'],
    conditions: ['hypothyroidism'],
    severitySupported: false,
    quickLog: false
  },

  slowedThinking: {
    id: 'slowedThinking',
    label: 'Slowed Thinking / Cognitive Sluggishness',
    emoji: '🐢',
    categories: ['cognitive'],
    conditions: ['hypothyroidism'],
    severitySupported: true,
    quickLog: true
  },

  // ─────────────────────────────────────────────────────────────
  //  HYPERTHYROIDISM / GRAVES'
  // ─────────────────────────────────────────────────────────────

  heatIntolerance: {
    id: 'heatIntolerance',
    label: 'Heat Intolerance / Excessive Sweating',
    emoji: '🌡️',
    categories: ['autonomic', 'physical'],
    conditions: ['hyperthyroidism'],
    severitySupported: false,
    quickLog: true
  },

  unexplainedWeightLoss: {
    id: 'unexplainedWeightLoss',
    label: 'Weight Loss (Despite Eating)',
    emoji: '⚖️',
    categories: ['physical', 'hormonal'],
    conditions: ['hyperthyroidism', 'crohns'],
    severitySupported: false,
    quickLog: false
  },

  increasedAppetite: {
    id: 'increasedAppetite',
    label: 'Increased Appetite',
    emoji: '🍽️',
    categories: ['physical'],
    conditions: ['hyperthyroidism'],
    severitySupported: false,
    quickLog: false
  },

  eyeBulging: {
    id: 'eyeBulging',
    label: 'Eye Bulging / Proptosis (Graves\')',
    emoji: '👁️',
    categories: ['sensory'],
    conditions: ['hyperthyroidism'],
    severitySupported: false,
    quickLog: false
  },

  eyeIrritation: {
    id: 'eyeIrritation',
    label: 'Eye Irritation / Dryness (Graves\')',
    emoji: '😤',
    categories: ['sensory'],
    conditions: ['hyperthyroidism'],
    severitySupported: true,
    quickLog: false
  },

  racingThoughts: {
    id: 'racingThoughts',
    label: 'Racing Thoughts',
    emoji: '🌪️',
    categories: ['cognitive', 'mood'],
    conditions: ['hyperthyroidism', 'anxietyGad'],
    severitySupported: true,
    quickLog: true
  },

  nervousness: {
    id: 'nervousness',
    label: 'Nervousness / Anxiety (Hyperthyroid)',
    emoji: '😰',
    categories: ['mood'],
    conditions: ['hyperthyroidism'],
    severitySupported: true,
    quickLog: true
  },

  // ─────────────────────────────────────────────────────────────
  //  RHEUMATOID ARTHRITIS (RA)
  // ─────────────────────────────────────────────────────────────

  morningStiffness: {
    id: 'morningStiffness',
    label: 'Morning Stiffness (RA — 30+ min)',
    emoji: '🌅',
    categories: ['musculoskeletal', 'pain'],
    conditions: ['ra'],
    severitySupported: true,
    quickLog: true,
    notes: 'Classic RA sign — log duration if possible'
  },

  symmetricJointSwelling: {
    id: 'symmetricJointSwelling',
    label: 'Symmetric Joint Swelling',
    emoji: '🦴',
    categories: ['musculoskeletal', 'immune'],
    conditions: ['ra'],
    severitySupported: true,
    quickLog: true
  },

  reducedGripStrength: {
    id: 'reducedGripStrength',
    label: 'Reduced Grip Strength',
    emoji: '✊',
    categories: ['musculoskeletal'],
    conditions: ['ra'],
    severitySupported: true,
    quickLog: false
  },

  tenderJoints: {
    id: 'tenderJoints',
    label: 'Tender Joints',
    emoji: '🦿',
    categories: ['musculoskeletal', 'pain'],
    conditions: ['ra'],
    severitySupported: true,
    quickLog: true
  },

  rheumatoidNodules: {
    id: 'rheumatoidNodules',
    label: 'Rheumatoid Nodules',
    emoji: '🔴',
    categories: ['musculoskeletal', 'skin'],
    conditions: ['ra'],
    severitySupported: false,
    quickLog: false
  },

  raFlareFlag: {
    id: 'raFlareFlag',
    label: 'RA Flare (Active)',
    emoji: '🚩',
    categories: ['flag', 'immune'],
    conditions: ['ra'],
    severitySupported: false,
    quickLog: true
  },

  raFatigue: {
    id: 'raFatigue',
    label: 'Fatigue (RA / Inflammatory)',
    emoji: '😩',
    categories: ['physical', 'immune'],
    conditions: ['ra'],
    severitySupported: true,
    quickLog: true
  },

  // ─────────────────────────────────────────────────────────────
  //  CHRONIC PAIN SYNDROME
  // ─────────────────────────────────────────────────────────────

  widespreadPain: {
    id: 'widespreadPain',
    label: 'Widespread Pain',
    emoji: '🌐',
    categories: ['pain'],
    conditions: ['chronicPain', 'fibromyalgia'],
    severitySupported: true,
    quickLog: true
  },

  migratingPain: {
    id: 'migratingPain',
    label: 'Migrating / Moving Pain',
    emoji: '🔀',
    categories: ['pain'],
    conditions: ['chronicPain'],
    severitySupported: true,
    quickLog: true
  },

  painAnxiety: {
    id: 'painAnxiety',
    label: 'Anxiety About Pain',
    emoji: '😨',
    categories: ['mood', 'pain'],
    conditions: ['chronicPain'],
    severitySupported: true,
    quickLog: false
  },

  sleepDisruptionPain: {
    id: 'sleepDisruptionPain',
    label: 'Sleep Disruption from Pain',
    emoji: '😴',
    categories: ['sleep', 'pain'],
    conditions: ['chronicPain', 'fibromyalgia'],
    severitySupported: true,
    quickLog: true
  }

};
