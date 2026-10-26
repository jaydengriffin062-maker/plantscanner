// Pl@ntNet identifies plants but does not return care information, so the app
// ships a small offline guide keyed by botanical family (and a few genera).
// Advice is general; individual species can differ.

const GENERIC = {
  light: 'Most plants do best in bright, indirect light. Avoid sudden moves between very dark and very sunny spots.',
  water: 'Water when the top 2–3 cm of soil is dry, then let excess water drain away. Overwatering is the most common problem.',
  soil: 'Use a well-draining potting mix and a pot with drainage holes.',
  extra: 'Feed lightly during spring and summer, and check leaves regularly for pests.',
};

const BY_FAMILY = {
  Araceae: {
    light: 'Bright, indirect light. Direct midday sun can scorch the leaves.',
    water: 'Water when the top third of the soil is dry. Yellowing leaves usually mean too much water.',
    soil: 'Chunky, airy aroid mix (potting soil with bark and perlite).',
    extra: 'Likes humidity. Sap is irritating, so keep away from pets and children.',
  },
  Cactaceae: {
    light: 'Full sun or the brightest window you have.',
    water: 'Soak thoroughly, then let the soil dry out completely. Water rarely in winter.',
    soil: 'Gritty cactus mix with sand or pumice.',
    extra: 'Protect from frost and from sitting in wet soil.',
  },
  Crassulaceae: {
    light: 'Lots of direct or very bright light keeps growth compact.',
    water: '"Soak and dry": water deeply only when the soil is fully dry.',
    soil: 'Fast-draining succulent mix.',
    extra: 'Stretched, leggy growth means it needs more light.',
  },
  Asparagaceae: {
    light: 'Tolerates low light but grows best in bright, indirect light.',
    water: 'Allow the soil to dry out between waterings, especially in winter.',
    soil: 'Free-draining potting mix.',
    extra: 'Very forgiving and drought-tolerant. Root rot is the main risk.',
  },
  Orchidaceae: {
    light: 'Bright, indirect light, such as an east-facing window.',
    water: 'Water about weekly. Let the bark drain fully and never leave roots standing in water.',
    soil: 'Orchid bark mix, not regular potting soil.',
    extra: 'A small day/night temperature drop helps trigger new flower spikes.',
  },
  Lamiaceae: {
    light: '6+ hours of sun for most herbs (basil, mint, rosemary, lavender).',
    water: 'Keep evenly moist for basil and mint. Let rosemary, thyme and lavender dry between waterings.',
    soil: 'Light, well-draining soil.',
    extra: 'Pinch tips regularly to keep plants bushy and delay flowering.',
  },
  Rosaceae: {
    light: 'Full sun (6+ hours) for the best flowers and fruit.',
    water: 'Water deeply once or twice a week at the base, not over the leaves.',
    soil: 'Rich, loamy soil with added compost.',
    extra: 'Prune dead wood in late winter and watch for aphids and black spot.',
  },
  Asteraceae: {
    light: 'Full sun for most daisies and sunflowers.',
    water: 'Moderate watering. Let the surface dry between waterings.',
    soil: 'Average, well-draining garden soil.',
    extra: 'Deadhead spent flowers to encourage more blooms.',
  },
  Moraceae: {
    light: 'Bright, indirect light. Figs dislike being moved around.',
    water: 'Water when the top few cm are dry. Dropping leaves often signal a draught or overwatering.',
    soil: 'Well-draining indoor potting mix.',
    extra: 'Wipe large leaves to remove dust. Sap may irritate skin.',
  },
  Arecaceae: {
    light: 'Bright, filtered light.',
    water: 'Keep lightly moist but never soggy.',
    soil: 'Peat-free palm or general-purpose mix with good drainage.',
    extra: 'Brown tips often come from dry air or hard tap water.',
  },
  Nephrolepidaceae: {
    light: 'Medium, indirect light.',
    water: 'Keep the soil consistently moist.',
    soil: 'Rich, moisture-retentive mix.',
    extra: 'Loves humidity, so bathrooms or a pebble tray work well.',
  },
  Polypodiaceae: {
    light: 'Medium, indirect light.',
    water: 'Keep evenly moist and mist occasionally.',
    soil: 'Loose, organic mix.',
    extra: 'Avoid dry air and direct sun.',
  },
  Marantaceae: {
    light: 'Medium to bright indirect light. Direct sun fades the leaf patterns.',
    water: 'Keep lightly moist. Use filtered or rain water if the edges turn brown.',
    soil: 'Peaty, well-draining mix.',
    extra: 'Needs high humidity. Leaves fold up at night, which is normal.',
  },
  Bromeliaceae: {
    light: 'Bright, indirect light.',
    water: 'Keep a little water in the central cup and refresh it weekly.',
    soil: 'Very airy orchid or bromeliad mix.',
    extra: 'Each rosette flowers once, then produces pups you can repot.',
  },
  Gesneriaceae: {
    light: 'Bright, indirect light.',
    water: 'Water from below with room-temperature water and keep the leaves dry.',
    soil: 'Light African violet mix.',
    extra: 'Cold water on leaves causes spots.',
  },
  Solanaceae: {
    light: 'Full sun (6–8 hours).',
    water: 'Water deeply and consistently. Irregular watering causes fruit splitting.',
    soil: 'Rich soil with plenty of compost.',
    extra: 'Stake or cage tall plants and feed with a tomato fertiliser once fruiting.',
  },
  Begoniaceae: {
    light: 'Bright, indirect light.',
    water: 'Let the top of the soil dry slightly. Avoid wetting the leaves.',
    soil: 'Light, well-draining mix.',
    extra: 'Prone to powdery mildew, so give it good airflow.',
  },
  Euphorbiaceae: {
    light: 'Bright light. Many species enjoy direct sun.',
    water: 'Let the soil dry between waterings.',
    soil: 'Well-draining mix.',
    extra: 'Milky sap is toxic and irritating, so wear gloves when pruning.',
  },
  Poaceae: {
    light: 'Full sun for most ornamental grasses.',
    water: 'Water regularly until established. Most grasses are then drought-tolerant.',
    soil: 'Average, well-draining soil.',
    extra: 'Cut back dead growth in late winter before new shoots appear.',
  },
};

const BY_GENUS = {
  Monstera: { extra: 'Give it a moss pole to climb for bigger, more split leaves.' },
  Epipremnum: { extra: 'Trailing vines can be trimmed and rooted in water.' },
  Sansevieria: { water: 'Water only every 2–4 weeks. It thrives on neglect.' },
  Dracaena: { extra: 'Sensitive to fluoride, so use filtered water if the tips brown.' },
  Aloe: { extra: 'The gel is soothing, but the plant is toxic to pets.' },
  Ficus: { extra: 'Keep away from draughts and radiators to prevent leaf drop.' },
};

const LABELS = {
  light: { title: 'Light', icon: 'sunny-outline' },
  water: { title: 'Watering', icon: 'water-outline' },
  soil: { title: 'Soil', icon: 'leaf-outline' },
  extra: { title: 'Good to know', icon: 'information-circle-outline' },
};

/**
 * Returns care tips for a match as an array of { key, title, icon, text },
 * plus `basis`: a short description of what the advice is based on, or null
 * when only generic advice was available.
 */
export function getCareTips({ family, genus } = {}) {
  const familyTips = family ? BY_FAMILY[family] : undefined;
  const genusTips = genus ? BY_GENUS[genus] : undefined;
  const merged = { ...GENERIC, ...familyTips, ...genusTips };

  let basis = null;
  if (familyTips) basis = `the ${family} family`;
  else if (genusTips) basis = `the genus ${genus}`;

  return {
    basis,
    tips: Object.keys(LABELS).map((key) => ({
      key,
      ...LABELS[key],
      text: merged[key],
    })),
  };
}
