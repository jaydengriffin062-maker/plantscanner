import { readFile } from 'node:fs/promises';
import path from 'node:path';

import HomeScreen from './HomeScreen';

/** Number of species the bundled model can recognise, read from its label file at build time. */
async function supportedSpeciesCount() {
  try {
    const labels = JSON.parse(await readFile(path.join(process.cwd(), 'model', 'labels.json'), 'utf8'));
    return Array.isArray(labels) && labels.length > 0 ? labels.length : null;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  return <HomeScreen speciesCount={await supportedSpeciesCount()} />;
}
