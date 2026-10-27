# Plant Scanner 🌿

A mobile-first web app that identifies plants from a photo, built with **Next.js** for **Vercel**. Identification uses either our own classifier trained on [Botanical Vision](https://huggingface.co/datasets/dbabnigg/botanical-vision-256) (4,094 species; see [`ml/`](ml/README.md)) or, as a fallback, the free [Pl@ntNet API](https://my.plantnet.org/).

- **Take a picture.** A live in-browser camera has a shutter button, a flash/torch toggle (where the phone supports it), a front/back camera switch and a framing guide. If the live camera is blocked or unavailable, **Open phone camera** opens the phone's own camera app instead.
- **Upload photo.** Pick a JPG, PNG or WebP photo, then preview, replace or remove it before tapping **Scan plant**.
- **Identification.** Shows the common name, scientific name, genus, family, order and class, and a confidence percentage. Results are labelled *Plant identified* (≥70%), *Possible match* (40–70%), or *We couldn't confidently identify this plant* with the top 3 candidates.
- **About this plant & more photos.** A description from Wikipedia and licensed reference photos from iNaturalist, shown with their sources.
- **Results.** Card layout with care tips for light, watering, soil and more.
- **History.** Scans are saved on the device and still open offline.
- **Installable.** Use *Add to Home Screen* to get an app icon and full-screen app.

API keys and tokens stay on the server (in Vercel environment variables) and are never sent to the browser.

### Identification provider

By default the trained classifier (`model/plant-classifier.onnx`, int8, ~31 MB) runs **inside the
`/api/identify` Vercel function** with ONNX Runtime, so no extra service or environment variable is needed.

| Variable | Effect |
| --- | --- |
| `INFERENCE_API_URL` (+ optional `INFERENCE_API_TOKEN`) | Use a separately hosted `ml/serve.py` instead of the bundled model |
| `PLANTNET_API_KEY` | Use Pl@ntNet when there is no bundled model |
| `IDENTIFY_PROVIDER` | Optional override: `local`, `remote` or `plantnet` |

To update the model, retrain and run `python -m ml.export_onnx` (see [ml/README.md](ml/README.md)).

---

## Deploy to Vercel

1. *(Optional)* The bundled model needs no key. Only if you want the Pl@ntNet fallback, get a free key at **https://my.plantnet.org/**.
2. Go to **https://vercel.com/new**, sign in with GitHub, and **Import** the `plantscanner` repository.
3. *(Optional)* Under **Environment Variables**, add `PLANTNET_API_KEY` or `INFERENCE_API_URL` (see above).
4. Click **Deploy**. Vercel detects Next.js automatically, so there's nothing else to configure.
5. Open the `https://….vercel.app` link on your phone. To install it:
   - **iPhone (Safari):** Share → **Add to Home Screen**
   - **Android (Chrome):** ⋮ menu → **Add to Home screen** / **Install app**

> The camera only works over **https**, which Vercel provides automatically.
> If you add or change `PLANTNET_API_KEY` after deploying, redeploy (**Deployments → ⋯ → Redeploy**) so it takes effect.
> Vercel builds the repository's default branch for Production; other branches get Preview URLs. You can change this under **Settings → Git**.

## Run locally

Requires Node.js 20.9 or newer.

```bash
npm install
cp .env.example .env.local     # then paste your key into .env.local
npm run dev                    # http://localhost:3000
```

Browsers only allow the camera on `https` or `localhost`. To test on your phone, deploy to Vercel or use an https tunnel.

```bash
npm run lint    # ESLint
npm run build   # production build
```

## Project structure

```
src/
├── app/
│   ├── layout.js               # Root layout, metadata, theme colour, service worker
│   ├── manifest.js             # PWA manifest (Add to Home Screen)
│   ├── globals.css             # All styles (mobile-first)
│   ├── page.js                 # Home: take photo / upload / recent scans
│   ├── camera/page.js          # Live camera viewport, shutter, flash, switch, fallback
│   ├── identify/page.js        # Preview (replace/remove), Scan plant, scanning state, errors
│   ├── plant/page.js           # Results page (/plant?id=…)
│   ├── plant/PlantDetails.js
│   ├── history/page.js         # Full history with delete / clear all
│   ├── api/identify/route.js   # Validates upload, calls the model service or Pl@ntNet
│   └── api/plant-info/route.js # Description, common name and reference photos for a species
├── components/                 # ResultCard, ConfidenceBar, CareTipsCard, AlternativeMatches,
│                               # HistoryItem, EmptyState, PageHeader, FileButton, ServiceWorkerRegister
└── lib/
    ├── botanicalModel.js       # Server-only client for the Botanical Vision inference service
    ├── plantNet.js             # Server-only Pl@ntNet client and response normalisation
    ├── plantInfo.js            # Server-only iNaturalist + Wikipedia lookups
    ├── usePlantInfo.js         # Client hook for /api/plant-info
    ├── imageUtils.js           # Resize camera frames and uploads in the browser
    ├── scanStorage.js          # localStorage history and sessionStorage hand-off between pages
    ├── useStartScan.js         # Shared "photo → identify" hook
    └── careTips.js             # Offline care-tip guide by plant family/genus
ml/                             # Training, evaluation and inference service (see ml/README.md)
download_dataset.py             # Fetches the Botanical Vision dataset into the Hugging Face cache
public/
├── sw.js                       # Service worker for offline app shell and history
└── icon-*.png                  # App icons
```

## How it works

```
Camera frame / uploaded file
   │  resized in the browser (≤1280px JPEG upload, 480px thumbnail)
   ▼
/identify (preview → Scan plant) ── POST /api/identify ──► Vercel function ──► model service (INFERENCE_API_URL)
   │                                                                     or Pl@ntNet (PLANTNET_API_KEY)
   ▼
saved to localStorage history ──► /plant?id=… ──► GET /api/plant-info ──► iNaturalist + Wikipedia
                                   (result, taxonomy, about, more photos, care tips)
```

- **Pl@ntNet request:** `POST https://my-api.plantnet.org/v2/identify/all` with `images` (the photo) and `organs=auto`, asking for the top 4 matches.
- **Confidence:** Pl@ntNet's score (0–1) is shown as a percentage. 70% and above is green, 40–70% amber, below 40% red with a tip to retake the photo.
- **Care tips:** Pl@ntNet doesn't return care information, so `src/lib/careTips.js` has an offline guide for about 20 common plant families, with general advice for anything else. Add entries to `BY_FAMILY` / `BY_GENUS` to extend it.
- **Flash:** browsers can only control the torch on some Android phones (Chrome). The flash button appears only when the phone supports it. iPhones don't allow it from the web.
- **Quota protection:** the API route rejects requests from other websites, uploads over 4 MB and anything that isn't a JPG, PNG or WebP. The browser rejects other file types and files over 25 MB before resizing.
- **Plant information** is looked up only for *Plant identified* / *Possible match* results. If a source is unavailable, that section says so instead of showing made-up text.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| "No plant identification service is configured" | Set `INFERENCE_API_URL` or `PLANTNET_API_KEY` in Vercel, then redeploy |
| "Could not reach the plant recognition service" | The model host is down or asleep. Check `INFERENCE_API_URL` and its `/health` endpoint |
| "API key was rejected" | Check the key on my.plantnet.org |
| "Daily limit reached" | The free quota is used up. Try again tomorrow. |
| "Couldn't recognise a plant" | Retake the photo closer, with a single leaf or flower |
| "Live camera unavailable" | Allow camera access for the site in your browser settings, or tap **Open phone camera** |

Plant identification by [Pl@ntNet](https://plantnet.org/). Species links go to [GBIF](https://www.gbif.org/).
