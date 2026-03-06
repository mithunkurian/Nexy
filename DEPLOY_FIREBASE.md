# Deploying Nexy to Firebase Hosting

This guide walks you through hosting the Nexy frontend on Firebase so you can
control your home from anywhere in the world.

---

## Prerequisites

- A Google account
- Node.js 18+ installed
- Your backend deployed somewhere publicly accessible
  (e.g. Google Cloud Run, Railway, Render, or a home server with port forwarding)

---

## Step 1 — Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it `nexy-smarthome` (or anything you like)
3. Disable Google Analytics if you don't need it → **Create project**

---

## Step 2 — Install Firebase CLI

```bash
npm install -g firebase-tools
```

---

## Step 3 — Log in

```bash
firebase login
```

---

## Step 4 — Link your project

Inside the `frontend/` folder:

```bash
firebase use --add
```

Select your project from the list and give it the alias `default`.

Or manually edit `frontend/.firebaserc`:

```json
{
  "projects": {
    "default": "YOUR_FIREBASE_PROJECT_ID"
  }
}
```

---

## Step 5 — Set your backend URL

Edit `frontend/.env.production`:

```
NEXT_PUBLIC_API_URL=https://your-backend.run.app
NEXT_PUBLIC_WS_URL=wss://your-backend.run.app/api/v1/ws
```

> **Tip:** If your backend is on the same network as your phone (home Wi-Fi),
> you can use your local IP, e.g. `http://192.168.1.50:8000`.
> For remote access from anywhere, you need a publicly hosted backend.

---

## Step 6 — Build and deploy

```bash
cd frontend
npm install
npm run deploy
```

This runs `next build` (creates `out/`) then `firebase deploy --only hosting`.

Your app will be live at:
```
https://nexy-smarthome.web.app
```

---

## Step 7 — Add to your phone home screen

1. Open the Firebase URL in Chrome (Android) or Safari (iOS)
2. Tap the browser menu → **Add to Home Screen**
3. Nexy will appear as a native-feeling app icon on your phone

---

## Updating the app

Any time you make changes, just run:

```bash
cd frontend
npm run deploy
```

---

## Optional: Preview deployments

Test changes before going live:

```bash
npm run deploy:preview
```

Firebase will give you a temporary URL like `https://nexy-smarthome--preview-abc123.web.app`.
