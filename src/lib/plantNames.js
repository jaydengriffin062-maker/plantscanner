/** The common name when one is known, otherwise the scientific name. */
export function displayName(match) {
  return match.commonName || match.scientificName;
}

/** True when the match has a common name that differs from its scientific name. */
export function hasCommonName(match) {
  return Boolean(match.commonName) && match.commonName !== match.scientificName;
}
