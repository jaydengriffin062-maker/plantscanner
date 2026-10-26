import { identifyWithPlantNet, PlantNetError } from '@/lib/plantNet';

// Vercel rejects request bodies over 4.5 MB; the browser resizes photos well below this.
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

export async function POST(request) {
  const apiKey = process.env.PLANTNET_API_KEY;
  if (!apiKey) {
    return errorResponse(
      'The server is missing PLANTNET_API_KEY. Add it in your Vercel project settings and redeploy.',
      500
    );
  }

  // Only accept requests from this site, so other sites can't spend the API quota.
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== request.headers.get('host')) {
    return errorResponse('Requests from other sites are not allowed.', 403);
  }

  let image;
  try {
    image = (await request.formData()).get('image');
  } catch {
    return errorResponse('Expected a multipart form with an "image" field.', 400);
  }

  if (!(image instanceof Blob) || image.size === 0) {
    return errorResponse('No photo was received.', 400);
  }
  if (!ALLOWED_TYPES.includes(image.type)) {
    return errorResponse('Please upload a JPEG or PNG photo.', 415);
  }
  if (image.size > MAX_UPLOAD_BYTES) {
    return errorResponse('The photo is too large to upload.', 413);
  }

  try {
    const result = await identifyWithPlantNet(image, apiKey);
    return Response.json(result);
  } catch (error) {
    if (error instanceof PlantNetError) {
      return errorResponse(error.message, error.status);
    }
    console.error('Unexpected identification error', error);
    return errorResponse('Something went wrong while identifying the plant.', 500);
  }
}

function errorResponse(message, status) {
  return Response.json({ error: message }, { status });
}
