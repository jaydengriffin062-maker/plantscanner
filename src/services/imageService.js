import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { UPLOAD_MAX_DIMENSION } from '../constants/config';

const SCANS_DIR_NAME = 'scans';

/**
 * Downscales a photo so its longest edge is at most UPLOAD_MAX_DIMENSION and
 * re-encodes it as JPEG. Returns the URI of the new (cached) file.
 */
export async function prepareImageForUpload(uri, width, height) {
  const context = ImageManipulator.manipulate(uri);

  if (width && height && Math.max(width, height) > UPLOAD_MAX_DIMENSION) {
    context.resize(
      width >= height ? { width: UPLOAD_MAX_DIMENSION } : { height: UPLOAD_MAX_DIMENSION }
    );
  } else if (!width || !height) {
    // Unknown dimensions: constrain the width, which is safe for typical photos.
    context.resize({ width: UPLOAD_MAX_DIMENSION });
  }

  const image = await context.renderAsync();
  const result = await image.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
  return result.uri;
}

/**
 * Copies an image from the temporary cache into the app's document directory
 * so it survives cache clean-up and is available offline in the history.
 */
export async function persistImage(uri, id) {
  const dir = new Directory(Paths.document, SCANS_DIR_NAME);
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }

  const destination = new File(dir, `${id}.jpg`);
  if (destination.exists) {
    destination.delete();
  }

  await new File(uri).copy(destination);
  return destination.uri;
}

export function deleteImage(uri) {
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    console.warn('Failed to delete image', uri, error);
  }
}

export function deleteAllImages() {
  try {
    const dir = new Directory(Paths.document, SCANS_DIR_NAME);
    if (dir.exists) {
      dir.delete();
    }
  } catch (error) {
    console.warn('Failed to delete scans directory', error);
  }
}
