// Browser-only helpers for turning camera frames and uploaded files into
// small JPEGs suitable for upload and for storing in history.

export const UPLOAD_MAX_DIMENSION = 1280;
// Large enough to show the user's photo prominently on the results page.
export const THUMBNAIL_MAX_DIMENSION = 720;

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ACCEPT_ATTRIBUTE = ACCEPTED_IMAGE_TYPES.join(',');
const ACCEPTED_EXTENSIONS = /\.(jpe?g|png|webp)$/i;
// Photos are resized before upload, so this only guards against absurd files.
export const MAX_FILE_BYTES = 25 * 1024 * 1024;

/** Throws an Error with a friendly message if the file isn't a usable photo. */
export function validateImageFile(file) {
  // Some browsers leave `type` empty, so fall back to the file extension.
  const typeOk = file.type ? ACCEPTED_IMAGE_TYPES.includes(file.type) : ACCEPTED_EXTENSIONS.test(file.name);
  if (!typeOk) {
    throw new Error('That file type isn’t supported. Please choose a JPG, PNG or WebP photo.');
  }
  if (file.size === 0) {
    throw new Error('That file is empty. Please choose another photo.');
  }
  if (file.size > MAX_FILE_BYTES) {
    const mb = Math.round(file.size / (1024 * 1024));
    throw new Error(`That photo is ${mb} MB. Please choose one smaller than ${MAX_FILE_BYTES / (1024 * 1024)} MB.`);
  }
}

/** Loads an uploaded File/Blob into something drawable, respecting EXIF rotation. */
export async function loadImage(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // Fall through to <img> decoding (e.g. HEIC on some browsers).
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } catch {
    throw new Error("This photo couldn't be opened. Please choose a JPG, PNG or WebP image.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

function sourceSize(source) {
  return {
    width: source.videoWidth || source.naturalWidth || source.width,
    height: source.videoHeight || source.naturalHeight || source.height,
  };
}

/** Draws a video frame or image onto a canvas, scaled so its longest edge is <= maxDimension. */
function drawScaled(source, maxDimension) {
  const { width, height } = sourceSize(source);
  if (!width || !height) {
    throw new Error('The image is empty. Please try again.');
  }

  const scale = Math.min(1, maxDimension / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * Produces the upload image and a smaller thumbnail (both JPEG data URLs) from
 * a <video> frame, an ImageBitmap or an <img>.
 */
export function createScanImages(source) {
  return {
    uploadDataUrl: drawScaled(source, UPLOAD_MAX_DIMENSION).toDataURL('image/jpeg', 0.85),
    thumbnailDataUrl: drawScaled(source, THUMBNAIL_MAX_DIMENSION).toDataURL('image/jpeg', 0.7),
  };
}

export async function dataUrlToBlob(dataUrl) {
  const response = await fetch(dataUrl);
  return response.blob();
}
