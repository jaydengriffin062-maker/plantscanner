import * as ImagePicker from 'expo-image-picker';

/**
 * Opens the system photo picker. Returns { uri, width, height } for the chosen
 * image, or null if the user cancelled.
 *
 * The system picker does not need a media-library permission prompt.
 */
export async function pickImageFromGallery() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true, // lets the user crop to the plant
    quality: 0.9,
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  const { uri, width, height } = result.assets[0];
  return { uri, width, height };
}
