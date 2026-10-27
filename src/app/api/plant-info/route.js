import { getPlantInfo } from '@/lib/plantInfo';

// Binomial or trinomial plant names, e.g. "Helianthus annuus" or "Acer × freemanii".
const NAME_PATTERN = /^[A-Z][a-z-]+( (×|x|subsp\.|var\.|f\.)?\s?[a-z-]+){1,3}$/;

export async function GET(request) {
  const name = new URL(request.url).searchParams.get('name')?.trim() ?? '';
  if (!NAME_PATTERN.test(name)) {
    return Response.json({ error: 'Expected a scientific name, e.g. ?name=Helianthus annuus' }, { status: 400 });
  }

  const info = await getPlantInfo(name);
  return Response.json(info, {
    headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
  });
}
