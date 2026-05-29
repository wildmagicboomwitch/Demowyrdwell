// ═══════════════════════════════════════════════════════════════
//  AUDHD HQ — Condition Pools  (Phase B1)
//  Maps conditions to their symptom ids from HQSymptomRegistry.
//  NEVER store symptom text here — always reference by id.
// ═══════════════════════════════════════════════════════════════

window.HQConditionPools = {

  // ── Neurodevelopmental ────────────────────────────────────────

  adhd: {
    id: 'adhd',
    name: 'ADHD',
    emoji: '🌀',
    color: '#C8BAFF',
    categories: ['cognitive'],
    symptoms: [
      'brainFog',
      'inattention',
      'executiveDysfunction',
      'taskParalysis',
      'timeBlindness',
      'workingMemoryLoss',
      'wordFinding',
      'emotionalDysreg',
      'anxiety',
      'irritability',
      'lowMotivation',
      'fatigue',
      'sensoryOverload',
      'sleepDisturbance'
    ]
  },

  autism: {
    id: 'autism',
    name: 'Autism',
    emoji: '🧩',
    color: '#7EC8E3',
    categories: ['cognitive', 'sensory'],
    symptoms: [
      'sensoryOverload',
      'lightSensitivity',
      'soundSensitivity',
      'smellSensitivity',
      'touchSensitivity',
      'socialExhaustion',
      'fatigue',
      'emotionalDysreg',
      'executiveDysfunction',
      'dissociation',
      'anxiety',
      'irritability',
      'socialWithdrawal'
    ]
  },

  // ── Pain Conditions ───────────────────────────────────────────

  crps: {
    id: 'crps',
    name: 'CRPS',
    emoji: '🔥',
    color: '#FF6B35',
    categories: ['pain', 'neurological'],
    symptoms: [
      'burningPain',
      'electricShockPain',
      'allodynia',
      'hyperalgesia',
      'achingPain',
      'touchSensitivity',
      'temperatureSensitivity',
      'numbnessTingling',
      'inflammation',
      'flushing',
      'colorChangeSkin',
      'sweatingChanges',
      'muscleSpasms',
      'flareFlag',
      'stressTrigger'
    ]
  },

  fibromyalgia: {
    id: 'fibromyalgia',
    name: 'Fibromyalgia',
    emoji: '🦴',
    color: '#FFB347',
    categories: ['pain', 'physical'],
    symptoms: [
      'fatigue',
      'brainFog',
      'headache',
      'jointPain',
      'muscleAches',
      'achingPain',
      'allodynia',
      'hyperalgesia',
      'muscleSpasms',
      'stiffness',
      'sleepDisturbance',
      'nonRestorativeSleep',
      'postExertionCrash',
      'lowMotivation',
      'workingMemoryLoss',
      'flareFlag'
    ]
  },

  endometriosis: {
    id: 'endometriosis',
    name: 'Endometriosis',
    emoji: '🌸',
    color: '#E8A0B4',
    categories: ['pain', 'hormonal'],
    symptoms: [
      'pelvicPain',
      'dysmenorrhea',
      'abdominalPain',
      'achingPain',
      'heavyBleeding',
      'cyclicalSymptoms',
      'hormoneFluctuation',
      'fatigue',
      'nausea',
      'acneHormonal',
      'flareFlag'
    ]
  },

  // ── Migraine ─────────────────────────────────────────────────

  migraine: {
    id: 'migraine',
    name: 'Migraine',
    emoji: '🤕',
    color: '#FF6666',
    categories: ['pain', 'neurological'],
    symptoms: [
      'headache',
      'lightSensitivity',
      'soundSensitivity',
      'smellSensitivity',
      'nausea',
      'vomiting',
      'aura',
      'allodynia',
      'dizziness',
      'wordFinding',
      'brainFog',
      'irritability',
      'tinnitus',
      'alcoholTrigger',
      'stressTrigger'
    ]
  },

  // ── Autonomic / Cardiovascular ────────────────────────────────

  pots: {
    id: 'pots',
    name: 'POTS',
    emoji: '💓',
    color: '#FF6BA8',
    categories: ['autonomic', 'physical'],
    symptoms: [
      'dizziness',
      'orthostatic',
      'fatigue',
      'heartRacing',
      'breathShortness',
      'nausea',
      'headache',
      'brainFog',
      'balanceDifficulty',
      'bloodPressureChanges',
      'sweatingChanges',
      'anxiety'
    ]
  },

  raynauds: {
    id: 'raynauds',
    name: "Raynaud's",
    emoji: '🧊',
    color: '#A8D8EA',
    categories: ['autonomic'],
    symptoms: [
      'colorChangeSkin',
      'coldIntolerance',
      'flushing',
      'temperatureSensitivity',
      'numbnessTingling'
    ]
  },

  // ── Fatigue / Post-Viral ──────────────────────────────────────

  mecfs: {
    id: 'mecfs',
    name: 'ME / CFS',
    emoji: '⚡',
    color: '#90EE90',
    categories: ['physical'],
    symptoms: [
      'fatigue',
      'postExertionCrash',
      'brainFog',
      'cognitiveSlowing',
      'workingMemoryLoss',
      'weakness',
      'muscleAches',
      'achingPain',
      'sleepDisturbance',
      'nonRestorativeSleep',
      'excessiveDaytimeSleepiness',
      'headache',
      'nausea',
      'lowMotivation',
      'depression'
    ]
  },

  longCovid: {
    id: 'longCovid',
    name: 'Long COVID',
    emoji: '🦠',
    color: '#4ECDC4',
    categories: ['physical', 'immune'],
    symptoms: [
      'fatigue',
      'brainFog',
      'cognitiveSlowing',
      'breathShortness',
      'muscleAches',
      'sleepDisturbance',
      'postExertionCrash',
      'headache',
      'anosmia',
      'depression',
      'anxiety'
    ]
  },

  // ── Autoimmune ────────────────────────────────────────────────

  lupus: {
    id: 'lupus',
    name: 'Lupus (SLE)',
    emoji: '🦋',
    color: '#DDA0DD',
    categories: ['immune'],
    symptoms: [
      'fatigue',
      'jointPain',
      'muscleAches',
      'rash',
      'butterflyRash',
      'photosensitivity',
      'inflammation',
      'brainFog',
      'headache',
      'numbnessTingling',
      'hairLoss',
      'stiffness',
      'flareFlag'
    ]
  },

  // KEY INTEGRITY NOTE: This condition uses the accented key 'sjögrens' (with ö).
  // ALL references across symptom-registry.js conditions arrays use the EXACT string 'sjögrens'.
  // Do NOT add an unaccented alias 'sjogrens' — it will create a ghost key that never matches.
  sjögrens: {
    id: 'sjögrens',
    name: "Sjögren's",
    emoji: '💧',
    color: '#87CEEB',
    categories: ['immune'],
    symptoms: [
      'drySensation',
      'drySkin',
      'difficultySwallowing',
      'fatigue',
      'jointPain',
      'stiffness',
      'numbnessTingling',
      'coldIntolerance',
      'inflammation',
      'vaginalDryness'
    ]
  },

  celiac: {
    id: 'celiac',
    name: 'Celiac Disease',
    emoji: '🌾',
    color: '#F4A460',
    categories: ['gi', 'immune'],
    symptoms: [
      'abdominalPain',
      'abdominalDiscomfort',
      'diarrhea',
      'constipation',
      'alternatingBowel',
      'malabsorption',
      'fatigue',
      'brainFog',
      'jointPain',
      'hairLoss',
      'weightChanges',
      'glutenExposure'
    ]
  },

  // ── GI ───────────────────────────────────────────────────────

  gerd: {
    id: 'gerd',
    name: 'GERD / Acid Reflux',
    emoji: '🌋',
    color: '#FFA07A',
    categories: ['gi'],
    symptoms: [
      'heartburn',
      'acidRegurgitation',
      'chestPain',
      'chestTightness',
      'abdominalPain',
      'abdominalDiscomfort',
      'nausea',
      'difficultySwallowing',
      'cough'
    ]
  },

  // ── Neurological ─────────────────────────────────────────────

  tbiPostConcussion: {
    id: 'tbiPostConcussion',
    name: 'TBI / Post-Concussion',
    emoji: '🧠',
    color: '#98D8C8',
    categories: ['neurological', 'cognitive'],
    symptoms: [
      'headache',
      'brainFog',
      'cognitiveSlowing',
      'workingMemoryLoss',
      'wordFinding',
      'inattention',
      'lightSensitivity',
      'soundSensitivity',
      'dizziness',
      'balanceDifficulty',
      'tinnitus',
      'sleepDisturbance',
      'numbnessTingling',
      'speechDifficulty',
      'expressiveAphasia',
      'limbWeakness',
      'tremor',
      'irritability',
      'depression',
      'anxiety',
      'moodCognitionPostConcussion'
    ]
  },

  fnd: {
    id: 'fnd',
    name: 'FND',
    emoji: '⚡',
    color: '#FFD700',
    categories: ['neurological'],
    symptoms: [
      'seizureActivity',
      'nonEpilepticAttack',
      'tremor',
      'weakness',
      'limbWeakness',
      'balanceDifficulty',
      'speechDifficulty',
      'expressiveAphasia',
      'numbnessTingling',
      'dizziness',
      'dissociation',
      'stressTrigger'
    ]
  },

  narcolepsy: {
    id: 'narcolepsy',
    name: 'Narcolepsy',
    emoji: '💤',
    color: '#9B59B6',
    categories: ['sleep', 'neurological'],
    symptoms: [
      'excessiveDaytimeSleepiness',
      'sleepAttacks',
      'cataplexy',
      'sleepParalysis',
      'hypnagogicHallucinations',
      'sleepDisturbance',
      'brainFog'
    ]
  },

  // ── Hormonal ─────────────────────────────────────────────────

  perimenopause: {
    id: 'perimenopause',
    name: 'Perimenopause',
    emoji: '🌙',
    color: '#F8C8D4',
    categories: ['hormonal'],
    symptoms: [
      'hotFlashes',
      'sleepDisturbance',
      'heavyBleeding',
      'cyclicalSymptoms',
      'hormoneFluctuation',
      'fatigue',
      'moodCycle',
      'irritability',
      'depression',
      'anxiety',
      'weightChanges',
      'vaginalDryness',
      'acneHormonal',
      'hairLoss',
      'heartRacing',
      'flushing'
    ]
  },

  // ── Respiratory ───────────────────────────────────────────────

  asthma: {
    id: 'asthma',
    name: 'Asthma',
    emoji: '🫁',
    color: '#87CEFA',
    categories: ['respiratory'],
    symptoms: [
      'breathShortness',
      'wheeze',
      'chestTightness',
      'cough',
      'heartRacing',
      'fatigue',
      'asthmaAttackFlag'
    ]
  },

  // ── Mental Health ─────────────────────────────────────────────

  mdd: {
    id: 'mdd',
    name: 'MDD / Depression',
    emoji: '🌫️',
    color: '#B8C4D0',
    categories: ['mood'],
    symptoms: [
      'depression',
      'anhedonia',
      'emotionalNumbing',
      'lowMotivation',
      'socialWithdrawal',
      'sleepDisturbance',
      'fatigue',
      'brainFog',
      'irritability',
      'anxiety',
      'moodCycle',
      'appetiteLoss'
    ]
  },

  // ── New condition pools (Phase B1 completion) ─────────────────

  seizure: {
    id: 'seizure',
    name: 'Seizure Disorders',
    emoji: '⚡',
    color: '#C9B1FF',
    categories: ['neurological'],
    symptoms: [
      'absenceEpisode',
      'tonicClonicSeizure',
      'focalSeizure',
      'myoclonicJerks',
      'seizureAura',
      'automatisms',
      'preictalMoodChange',
      'postIctalFatigue',
      'postIctalConfusion',
      'postSeizureHeadache',
      'muscleAches',
      'sleepDisturbance',
      'stressTrigger'
    ]
  },

  pcos: {
    id: 'pcos',
    name: 'PCOS',
    emoji: '🌸',
    color: '#FFB3DE',
    categories: ['hormonal'],
    symptoms: [
      'irregularPeriods',
      'hirsutism',
      'hairThinning',
      'acneHormonal',
      'oilySkin',
      'acanthosisPatch',
      'ibsBloating',
      'pelvicPain',
      'ovarianCystPain',
      'ovulationPain',
      'insulinResistanceSymptoms',
      'energyCrashAfterEating',
      'fatigue',
      'weightGain',
      'premenstrualRage',
      'anxiety',
      'depression',
      'brainFog'
    ]
  },

  eds: {
    id: 'eds',
    name: 'EDS / hEDS / HSD',
    emoji: '🤸',
    color: '#FFDAB9',
    categories: ['musculoskeletal', 'pain'],
    symptoms: [
      'jointHypermobility',
      'jointSubluxation',
      'jointDislocation',
      'jointClicking',
      'jointPain',
      'muscleSpasms',
      'weakness',
      'slowWoundHealing',
      'stretchySkin',
      'easyBruising',
      'postExertionalPainIncrease',
      'proprioceptionDifficulty',
      'tmjPain',
      'fatigue',
      'dizziness',
      'tinnitus',
      'constipation',
      'nausea',
      'orthostatic'
    ]
  },

  anxietyGad: {
    id: 'anxietyGad',
    name: 'Anxiety (GAD / Panic)',
    emoji: '😰',
    color: '#FFE4B5',
    categories: ['mood'],
    symptoms: [
      'rumination',
      'catastrophizing',
      'racingThoughts',
      'hypervigilance',
      'dreadDoom',
      'avoidanceUrge',
      'decisionParalysis',
      'panicAttack',
      'nighttimeRumination',
      'chestTightness',
      'heartRacing',
      'breathShortness',
      'nausea',
      'dizziness',
      'muscleAches',
      'headache',
      'anxiety',
      'irritability',
      'sleepDisturbance'
    ]
  },

  cptsd: {
    id: 'cptsd',
    name: 'C-PTSD / PTSD',
    emoji: '🌊',
    color: '#B0C4DE',
    categories: ['mood'],
    symptoms: [
      'emotionalFlashback',
      'shameSpiral',
      'hypervigilance',
      'dissociation',
      'emotionalNumbing',
      'intrusiveThoughts',
      'griefWave',
      'feelingUnsafe',
      'freezeResponse',
      'fawnResponse',
      'somaticFlare',
      'triggerActivated',
      'fatigue',
      'nausea',
      'muscleAches',
      'sleepDisturbance',
      'anxiety',
      'irritability',
      'socialWithdrawal',
      'depression'
    ]
  },

  ms: {
    id: 'ms',
    name: 'Multiple Sclerosis (MS)',
    emoji: '🧠',
    color: '#90C8A0',
    categories: ['neurological'],
    symptoms: [
      'numbnessTingling',
      'electricShockSensation',
      'opticNeuritis',
      'spasticity',
      'tremor',
      'walkingDifficulty',
      'dropFoot',
      'balanceDifficulty',
      'dizziness',
      'fatigue',
      'heatSensitivity',
      'weakness',
      'brainFog',
      'cognitiveSlowing',
      'workingMemoryLoss',
      'wordFinding',
      'urinaryUrgency',
      'urinaryRetention',
      'constipation',
      'bowelUrgency',
      'pseudobulbarAffect',
      'depression',
      'anxiety',
      'relapseFlag'
    ]
  },

  mcas: {
    id: 'mcas',
    name: 'MCAS',
    emoji: '🛡️',
    color: '#FFDEAD',
    categories: ['immune'],
    symptoms: [
      'flushing',
      'hives',
      'itchingNoRash',
      'angioedema',
      'dermatographia',
      'nausea',
      'vomiting',
      'diarrhea',
      'ibsCramping',
      'ibsBloating',
      'difficultySwallowing',
      'nasalCongestion',
      'breathShortness',
      'throatTightness',
      'cough',
      'heartRacing',
      'hypotensionDrop',
      'anaphylaxisFlag',
      'headache',
      'mcasBrainFog',
      'anxiety',
      'tinnitus',
      'foodTrigger',
      'environmentalTrigger',
      'stressTrigger'
    ]
  },

  ibs: {
    id: 'ibs',
    name: 'IBS',
    emoji: '🫃',
    color: '#90EE90',
    categories: ['gi'],
    symptoms: [
      'ibsCramping',
      'ibsBloating',
      'gasFlatus',
      'constipation',
      'diarrhea',
      'alternatingBowel',
      'bowelUrgency',
      'incompleteEvacuation',
      'mucusInStool',
      'nausea',
      'fatigue',
      'stressTrigger',
      'foodTrigger'
    ]
  },

  crohns: {
    id: 'crohns',
    name: "Crohn's Disease",
    emoji: '🦠',
    color: '#DAA520',
    categories: ['gi', 'immune'],
    symptoms: [
      'abdominalPain',
      'diarrhea',
      'bloodInStool',
      'mucusInStool',
      'bowelUrgency',
      'incompleteEvacuation',
      'ibsBloating',
      'crohnsFatigue',
      'unexplainedFever',
      'appetiteLoss',
      'unexplainedWeightLoss',
      'nausea',
      'mouthUlcers',
      'jointPain',
      'rash',
      'malabsorption',
      'flareFlag',
      'remissionFlag'
    ]
  },

  insomnia: {
    id: 'insomnia',
    name: 'Insomnia / Sleep Disorders',
    emoji: '😴',
    color: '#8B9EB7',
    categories: ['sleep'],
    symptoms: [
      'difficultyFallingAsleep',
      'frequentWaking',
      'earlyMorningWaking',
      'hyperarousalBedtime',
      'physicalRestlessness',
      'hypnicJerks',
      'sleepParalysis',
      'vivid',
      'nonRestorativeSleep',
      'excessiveDaytimeSleepiness',
      'fatigue',
      'brainFog',
      'irritability',
      'nighttimeRumination'
    ]
  },

  ocd: {
    id: 'ocd',
    name: 'OCD',
    emoji: '🔁',
    color: '#DA70D6',
    categories: ['cognitive', 'mood'],
    symptoms: [
      'intrusiveThoughtOcd',
      'checkingCompulsion',
      'washingCompulsion',
      'mentalReviewing',
      'ocdAnxietySpike',
      'ocdExhaustion',
      'anxiety',
      'rumination',
      'avoidanceUrge'
    ]
  },

  diabetesT1: {
    id: 'diabetesT1',
    name: 'Diabetes — Type 1',
    emoji: '💉',
    color: '#5B9BD5',
    categories: ['physical', 'hormonal'],
    symptoms: [
      'hypoglycemiaShaking',
      'hypoglycemiaMoodChange',
      'hypoglycemiaConfusion',
      'hypoglycemiaFlag',
      'hyperglycemiaFlag',
      'increasedThirst',
      'fatigue',
      'blurredVisionBG',
      'headache',
      'nausea',
      'slowWoundHealing',
      'dkaFlag'
    ]
  },

  diabetesT2: {
    id: 'diabetesT2',
    name: 'Diabetes — Type 2',
    emoji: '🩸',
    color: '#7BAFD4',
    categories: ['physical', 'hormonal'],
    symptoms: [
      'energyCrashAfterEating',
      'brainFog',
      'fatigue',
      'increasedThirst',
      'slowWoundHealing',
      'peripheralNeuropathy',
      'blurredVisionBG',
      'hypoglycemiaFlag',
      'hyperglycemiaFlag'
    ]
  },

  hypothyroidism: {
    id: 'hypothyroidism',
    name: 'Hypothyroidism',
    emoji: '🌡️',
    color: '#87CEEB',
    categories: ['hormonal', 'physical'],
    symptoms: [
      'fatigue',
      'coldIntolerance',
      'coldHands',
      'weightGain',
      'constipation',
      'drySkin',
      'hairLoss',
      'brittleNails',
      'puffyFace',
      'hoarseVoice',
      'slowHeartRate',
      'brainFog',
      'slowedThinking',
      'workingMemoryLoss',
      'depression',
      'lowMotivation'
    ]
  },

  hyperthyroidism: {
    id: 'hyperthyroidism',
    name: 'Hyperthyroidism / Graves\'',
    emoji: '🔥',
    color: '#FF7F7F',
    categories: ['hormonal', 'physical'],
    symptoms: [
      'heatIntolerance',
      'sweatingChanges',
      'unexplainedWeightLoss',
      'increasedAppetite',
      'tremor',
      'heartRacing',
      'weakness',
      'eyeBulging',
      'eyeIrritation',
      'nervousness',
      'irritability',
      'sleepDisturbance',
      'racingThoughts',
      'anxiety'
    ]
  },

  ra: {
    id: 'ra',
    name: 'Rheumatoid Arthritis (RA)',
    emoji: '🦴',
    color: '#E8A87C',
    categories: ['musculoskeletal', 'immune'],
    symptoms: [
      'jointPain',
      'symmetricJointSwelling',
      'morningStiffness',
      'tenderJoints',
      'reducedGripStrength',
      'rheumatoidNodules',
      'raFatigue',
      'unexplainedFever',
      'raFlareFlag',
      'drySensation',
      'breathShortness'
    ]
  },

  chronicPain: {
    id: 'chronicPain',
    name: 'Chronic Pain Syndrome',
    emoji: '🌐',
    color: '#CD853F',
    categories: ['pain'],
    symptoms: [
      'widespreadPain',
      'burningPain',
      'achingPain',
      'migratingPain',
      'allodynia',
      'hyperalgesia',
      'postExertionalPainIncrease',
      'stiffness',
      'fatigue',
      'brainFog',
      'depression',
      'painAnxiety',
      'sleepDisruptionPain'
    ]
  }

};
