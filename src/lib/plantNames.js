/** The common name when one is known, otherwise the scientific name. */
export function displayName(match) {
  return match.commonName || match.scientificName;
}

/** True when the match has a common name that differs from its scientific name. */
export function hasCommonName(match) {
  return Boolean(match.commonName) && match.commonName !== match.scientificName;
}

// Plant type derived from the taxonomic class the identification returned.
const PLANT_TYPES = {
  Magnoliopsida: 'Flowering plant (dicot)',
  Liliopsida: 'Flowering plant (monocot)',
  Pinopsida: 'Conifer',
  Polypodiopsida: 'Fern',
  Bryopsida: 'Moss',
};

/** A plain-language plant type for a taxonomic class, or null when unknown. */
export function plantType(taxonClass) {
  return PLANT_TYPES[taxonClass] ?? null;
}
