# Plant Scanner 🌿

A mobile-first web app that identifies plants from a photo, built with **Next.js** for **Vercel** and powered by the free [Pl@ntNet API](https://my.plantnet.org/).

- **Take a picture.** A live in-browser camera has a shutter button, a flash/torch toggle (where the phone supports it), a front/back camera switch and a framing guide. If the live camera is blocked or unavailable, **Open phone camera** opens the phone's own camera app instead.
- **Upload from gallery.** Pick any existing photo.
- **Identification.** Shows the common name, scientific name, family and genus, a confidence percentage and other possible matches.
- **Results.** Card layout with care tips for light, watering, soil and more.
- **History.** Scans are saved on the device and still open offline.
- **Installable.** Use *Add to Home Screen* to get an app icon and full-screen app.

Your Pl@ntNet API key stays on the server (in a Vercel environment variable) and is never sent to the browser.

---

## Deploy to Vercel

1. Get a free Pl@ntNet API key: sign up at **https://my.plantnet.org/**, then go to **My account → Settings → API key**. The free tier allows 500 identifications a day.
2. Go to **https://vercel.com/new**, sign in with GitHub, and **Import** the `plantscanner` repository.
3. Before clicking Deploy, open **Environment Variables** and add:
   - **Key:** `PLANTNET_API_KEY`
   - **Value:** your Pl@ntNet key
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
│   ├── identify/page.js        # Sends the photo to /api/identify, saves the result
│   ├── plant/page.js           # Results page (/plant?id=…)
│   ├── plant/PlantDetails.js
│   ├── history/page.js         # Full history with delete / clear all
│   └── api/identify/route.js   # Server route: validates upload, calls Pl@ntNet with the secret key
├── components/                 # ResultCard, ConfidenceBar, CareTipsCard, AlternativeMatches,
│                               # HistoryItem, EmptyState, PageHeader, FileButton, ServiceWorkerRegister
└── lib/
    ├── plantNet.js             # Server-only Pl@ntNet client and response normalisation
    ├── imageUtils.js           # Resize camera frames and uploads in the browser
    ├── scanStorage.js          # localStorage history and sessionStorage hand-off between pages
    ├── useStartScan.js         # Shared "photo → identify" hook
    └── careTips.js             # Offline care-tip guide by plant family/genus
public/
├── sw.js                       # Service worker for offline app shell and history
└── icon-*.png                  # App icons
```

## How it works

```
Camera frame / uploaded file
   │  resized in the browser (≤1280px JPEG upload, 480px thumbnail)
   ▼
/identify ── POST /api/identify (multipart "image") ──► Vercel function ──► Pl@ntNet
   │                                                     (adds PLANTNET_API_KEY)
   ▼
saved to localStorage history ──► /plant?id=… (results, care tips, alternatives)
```

- **Pl@ntNet request:** `POST https://my-api.plantnet.org/v2/identify/all` with `images` (the photo) and `organs=auto`, asking for the top 4 matches.
- **Confidence:** Pl@ntNet's score (0–1) is shown as a percentage. 70% and above is green, 40–70% amber, below 40% red with a tip to retake the photo.
- **Care tips:** Pl@ntNet doesn't return care information, so `src/lib/careTips.js` has an offline guide for about 20 common plant families, with general advice for anything else. Add entries to `BY_FAMILY` / `BY_GENUS` to extend it.
- **Flash:** browsers can only control the torch on some Android phones (Chrome). The flash button appears only when the phone supports it. iPhones don't allow it from the web.
- **Quota protection:** the API route rejects requests from other websites, uploads over 4 MB and anything that isn't a JPEG or PNG.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| "The server is missing PLANTNET_API_KEY" | Add it in Vercel → Settings → Environment Variables, then redeploy |
| "API key was rejected" | Check the key on my.plantnet.org |
| "Daily limit reached" | The free quota is used up. Try again tomorrow. |
| "Couldn't recognise a plant" | Retake the photo closer, with a single leaf or flower |
| "Live camera unavailable" | Allow camera access for the site in your browser settings, or tap **Open phone camera** |

Plant identification by [Pl@ntNet](https://plantnet.org/). Species links go to [GBIF](https://www.gbif.org/).
