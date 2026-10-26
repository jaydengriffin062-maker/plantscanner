# Plant Scanner 🌿

A cross-platform (iOS and Android) React Native + Expo app that identifies plants from a photo, using the free [Pl@ntNet API](https://my.plantnet.org/).

- **Live camera** with a shutter button, flash toggle (off / auto / on), front/back switch and a framing guide
- **Gallery upload** through the system photo picker, with optional cropping
- **Identification**: common name, scientific name, family/genus, a confidence percentage and other possible matches
- **Results screen**: card layout with care tips (light, watering, soil and extra notes)
- **Offline history**: past scans and their photos are stored on the device, so you can view them without a connection

Built on **Expo SDK 58** (React Native 0.88, React 19.3).

---

## 1. Prerequisites

| Tool | Notes |
| --- | --- |
| [Node.js](https://nodejs.org/) LTS (20+) | `node -v` to check |
| A phone with **Expo Go** | [iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent). Or use an iOS Simulator or Android emulator. |
| A free **Pl@ntNet API key** | See step 3 |

## 2. Install

### Option A: use this repository

```bash
git clone https://github.com/jaydengriffin062-maker/plantscanner.git
cd plantscanner
npm install
```

### Option B: build it from scratch

These are the commands this project was created with:

```bash
# 1. Create a blank Expo app
npx create-expo-app@latest plantscanner --template blank
cd plantscanner

# 2. Add the dependencies. `npx expo install` picks versions that match your Expo SDK.
npx expo install expo-camera expo-image-picker expo-file-system expo-image-manipulator \
  @react-native-async-storage/async-storage \
  @react-navigation/native @react-navigation/native-stack \
  react-native-screens react-native-safe-area-context @expo/vector-icons

# 3. Copy App.js, app.json, .env.example and the src/ folder from this repo into the project.
```

Always use `npx expo install <pkg>` instead of `npm install <pkg>` for native libraries, so the versions stay compatible with your Expo SDK.

## 3. Get a Pl@ntNet API key

1. Create a free account at **https://my.plantnet.org/**.
2. Open **My account → Settings** and copy your **API key**. The free tier includes 500 identifications per day.
3. In the project root, copy the example env file and paste the key in:

   ```bash
   cp .env.example .env
   ```

   ```env
   EXPO_PUBLIC_PLANTNET_API_KEY=2b10xxxxxxxxxxxxxxxxxxxxxx
   ```

4. If you get `401` errors, check the key's settings on my.plantnet.org (for example, any authorized-domain restriction).

> **Security note:** variables prefixed with `EXPO_PUBLIC_` are compiled into the app bundle, so the key can be extracted from a published app. That is fine for development and personal use. For a public release, put a small backend or serverless proxy in front of Pl@ntNet that holds the key, then point `PLANTNET_BASE_URL` in `src/constants/config.js` at your proxy.

## 4. Run

```bash
npx expo start
```

- Scan the QR code with **Expo Go** (Android) or the Camera app (iOS).
- Press `a` for an Android emulator or `i` for an iOS simulator.
- Restart with `npx expo start --clear` after you change `.env`.

The emulator and simulator cameras are simulated, so test the camera on a real device. Gallery upload works everywhere.

> If your Expo Go app doesn't support SDK 58 yet, make a development build instead: `npx expo run:android` / `npx expo run:ios`, or `npx eas-cli@latest build --profile development`.

### Lint

```bash
npm run lint
```

## 5. Project structure

```
plantscanner/
├── App.js                      # Navigation container and stack (Home, Camera, Results, History)
├── index.js                    # Expo entry point
├── app.json                    # App config and camera/photo permission strings
├── .env.example                # Template for EXPO_PUBLIC_PLANTNET_API_KEY
└── src/
    ├── constants/
    │   ├── config.js           # API URL, key, limits (timeouts, upload size, history cap)
    │   └── theme.js            # Colours, spacing, radii, shadows
    ├── services/
    │   ├── plantNetApi.js      # Calls Pl@ntNet and normalises results; friendly error messages
    │   ├── imageService.js     # Resizes photos before upload; saves photos for offline history
    │   ├── galleryPicker.js    # Opens the system photo picker
    │   ├── historyStorage.js   # AsyncStorage CRUD for scan history
    │   └── careTips.js         # Offline care-tip guide by plant family/genus
    ├── components/
    │   ├── PrimaryButton.js
    │   ├── ConfidenceBar.js
    │   ├── ResultCard.js       # Best-match card
    │   ├── AlternativeMatches.js
    │   ├── CareTipsCard.js
    │   ├── HistoryItem.js
    │   └── EmptyState.js
    └── screens/
        ├── HomeScreen.js       # Take photo / upload buttons and recent scans
        ├── CameraScreen.js     # Live camera viewport
        ├── ResultsScreen.js    # Runs the identification and shows the results
        └── HistoryScreen.js    # Full history with delete / clear all
```

## 6. How it works

```
Camera / Gallery ──► ResultsScreen
                         │ 1. imageService.prepareImageForUpload()  (resize to ≤1280px JPEG)
                         │ 2. plantNetApi.identifyPlant()           (multipart POST)
                         │ 3. imageService.persistImage()           (copy into the document directory)
                         │ 4. historyStorage.addToHistory()         (AsyncStorage)
                         ▼
                   ResultCard + CareTipsCard + AlternativeMatches
```

- **Pl@ntNet request:** `POST https://my-api.plantnet.org/v2/identify/all?api-key=…&lang=en&nb-results=4` with multipart fields `images` (the photo) and `organs=auto`.
- **Confidence:** Pl@ntNet's `score` (0–1) is shown as a percentage. 70% and above is green, 40–70% amber, below 40% red with a tip to retake the photo.
- **Care tips:** Pl@ntNet does not return care information, so `careTips.js` has an offline guide for about 20 common plant families (aroids, cacti, succulents, orchids, herbs, ferns, palms, and more), with extra tips for some genera. Anything else gets general houseplant advice. Add entries to `BY_FAMILY` / `BY_GENUS` to extend it.
- **History:** stored under the AsyncStorage key `@plantscanner/history`, newest first, up to 100 entries. Photos live in `<documentDirectory>/scans/` so the OS can't clear them like cache files.

## 7. Tips for better identifications

- Photograph **one organ**: a single leaf, flower, fruit or bark, filling most of the frame.
- Use even daylight and avoid blur. Turn on the flash in dim light.
- A plain background helps. Cropping in the gallery picker also helps.

## 8. Troubleshooting

| Problem | Fix |
| --- | --- |
| "No Pl@ntNet API key found" | Create `.env` (step 3), then run `npx expo start --clear` |
| `401` / key rejected | Check the key and its settings on my.plantnet.org |
| `429` | You've used the daily free quota. Try again tomorrow. |
| "Couldn't recognise a plant" (404) | Retake the photo closer, with a single leaf or flower |
| Black camera screen | Grant camera permission in system Settings and restart the app |
| Version mismatch warnings | `npx expo install --fix` |

Plant identification is powered by [Pl@ntNet](https://plantnet.org/). Species links go to [GBIF](https://www.gbif.org/).
