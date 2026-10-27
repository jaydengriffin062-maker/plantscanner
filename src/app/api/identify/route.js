import { identifyWithBotanicalModel } from '@/lib/botanicalModel';
import { IdentificationError } from '@/lib/identificationError';
import { hasLocalModel, identifyWithLocalModel } from '@/lib/localModel';
import { identifyWithPlantNet } from '@/lib/plantNet';

// Vercel rejects request bodies over 4.5 MB; the browser resizes photos well below this.
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Allows for a cold start loading the model (~1-3 s) plus inference.
export const maxDuration = 30;

/**
 * Picks the identification backend. IDENTIFY_PROVIDER=remote|local|plantnet forces one;
 * otherwise: the remote model service if INFERENCE_API_URL is set, then the bundled
 * ONNX model in /model (runs inside this function), then Pl@ntNet if PLANTNET_API_KEY is set.
 */
function selectProvider() {
  const url = process.env.INFERENCE_API_URL;
  const plantNetKey = process.env.PLANTNET_API_KEY;
  const forced = process.env.IDENTIFY_PROVIDER;

  if (forced === 'remote' || (!forced && url)) {
    if (!url) {
      throw new IdentificationError('The server is missing INFERENCE_API_URL. Add it in your Vercel project settings and redeploy.', 500);
    }
    return {
      id: 'botanical-vision',
      identify: (image) => identifyWithBotanicalModel(image, { url, token: process.env.INFERENCE_API_TOKEN }),
    };
  }
  if (forced === 'local' || (!forced && hasLocalModel())) {
    return { id: 'botanical-vision', identify: identifyWithLocalModel };
  }
  if (!plantNetKey) {
    throw new IdentificationError(
      'No plant identification service is configured. Add the model to /model, or set INFERENCE_API_URL or PLANTNET_API_KEY.',
      500
    );
  }
  return { id: 'plantnet', identify: (image) => identifyWithPlantNet(image, plantNetKey) };
}

export async function POST(request) {
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
    return errorResponse('Please upload a JPG, PNG or WebP photo.', 415);
  }
  if (image.size > MAX_UPLOAD_BYTES) {
    return errorResponse('The photo is too large to upload.', 413);
  }

  try {
    const provider = selectProvider();
    const result = await provider.identify(image);
    return Response.json({ ...result, provider: provider.id });
  } catch (error) {
    if (error instanceof IdentificationError) {
      return errorResponse(error.message, error.status);
    }
    console.error('Unexpected identification error', error);
    return errorResponse('Something went wrong while identifying the plant.', 500);
  }
}

function errorResponse(message, status) {
  return Response.json({ error: message }, { status });
}
