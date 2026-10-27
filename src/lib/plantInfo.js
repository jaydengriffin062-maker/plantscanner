// Server-only plant information service, kept separate from identification:
// given a scientific name it looks up a common name and reference photos on
// iNaturalist and a description on Wikipedia. Both are free and keyless.
// Each source fails independently, so the page shows whatever is available
// and never fills gaps with made-up text.

const INAT_API = 'https://api.inaturalist.org/v1';
const WIKIPEDIA_SUMMARY = 'https://en.wikipedia.org/api/rest_v1/page/summary/';
const USER_AGENT = 'PlantScanner/1.0 (plant identification web app)';
const TIMEOUT_MS = 8000;
const REVALIDATE_SECONDS = 60 * 60 * 24 * 7; // species info changes rarely
const MAX_PHOTOS = 3;

const LICENSE_LABELS = {
  cc0: 'CC0',
  'cc-by': 'CC BY',
  'cc-by-sa': 'CC BY-SA',
  'cc-by-nc': 'CC BY-NC',
  'cc-by-nc-sa': 'CC BY-NC-SA',
  'cc-by-nd': 'CC BY-ND',
  'cc-by-nc-nd': 'CC BY-NC-ND',
};

async function getJson(url) {
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!response.ok) throw new Error(`${url} -> ${response.status}`);
  return response.json();
}

/** Finds the iNaturalist plant taxon whose name exactly matches, with its photos. */
async function findINaturalistTaxon(scientificName) {
  const query = new URLSearchParams({ q: scientificName, rank: 'species', is_active: 'true', per_page: '10' });
  const search = await getJson(`${INAT_API}/taxa?${query}`);
  const match = search.results?.find(
    (taxon) => taxon.name?.toLowerCase() === scientificName.toLowerCase() && taxon.iconic_taxon_name === 'Plantae'
  );
  if (!match) return null;
  const details = await getJson(`${INAT_API}/taxa/${match.id}`);
  return details.results?.[0] ?? match;
}

function photosFrom(taxon) {
  return (taxon?.taxon_photos ?? [])
    .map(({ photo }) => photo)
    .filter((photo) => photo?.medium_url && photo.license_code)
    .slice(0, MAX_PHOTOS)
    .map((photo) => ({
      url: photo.medium_url,
      attribution: photo.attribution,
      license: LICENSE_LABELS[photo.license_code] ?? photo.license_code.toUpperCase(),
      sourceUrl: `https://www.inaturalist.org/photos/${photo.id}`,
    }));
}

/** Wikipedia's plain-text page summary, only for a real (non-disambiguation) article. */
async function fetchWikipediaSummary(title) {
  const summary = await getJson(WIKIPEDIA_SUMMARY + encodeURIComponent(title.replace(/ /g, '_')));
  if (summary.type !== 'standard' || !summary.extract) return null;
  return {
    text: summary.extract,
    source: 'Wikipedia',
    url: summary.content_urls?.desktop?.page ?? null,
  };
}

function wikipediaTitle(taxon, scientificName) {
  const url = taxon?.wikipedia_url;
  if (url) {
    const title = decodeURIComponent(url.split('/wiki/')[1] ?? '');
    if (title) return title;
  }
  return scientificName;
}

export async function getPlantInfo(scientificName) {
  let taxon = null;
  let inaturalistOk = true;
  try {
    taxon = await findINaturalistTaxon(scientificName);
  } catch (error) {
    inaturalistOk = false;
    console.warn('iNaturalist lookup failed', error?.message);
  }

  let description = null;
  try {
    description = await fetchWikipediaSummary(wikipediaTitle(taxon, scientificName));
  } catch (error) {
    console.warn('Wikipedia lookup failed', error?.message);
  }

  return {
    scientificName,
    commonName: taxon?.preferred_common_name ?? null,
    description,
    photos: photosFrom(taxon),
    links: {
      inaturalist: taxon ? `https://www.inaturalist.org/taxa/${taxon.id}` : null,
    },
    sourcesAvailable: { inaturalist: inaturalistOk, wikipedia: description !== null },
  };
}
