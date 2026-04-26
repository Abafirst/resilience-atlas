# Android App — Capacitor Setup & Developer Guide

The Resilience Atlas Android app is a **native wrapper** around the React SPA,
built with [Capacitor](https://capacitorjs.com/).  The web assets are bundled
inside the APK/AAB so the app works fully offline (for static UI) and uses
absolute HTTPS URLs to reach the production backend.

---

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18 + | https://nodejs.org |
| npm | 9 + | (bundled with Node) |
| Android Studio | Hedgehog (2023.1) or newer | https://developer.android.com/studio |
| JDK | 17 (bundled with Android Studio) | — |
| Android SDK | API 35 (set in Android Studio SDK Manager) | — |

> **Tip:** After installing Android Studio, open it once and let it finish
> downloading the default SDK components before running any Gradle tasks.

---

## Environment setup (one-time)

```bash
# 1. Clone the repo
git clone https://github.com/Abafirst/resilience-atlas.git
cd resilience-atlas/client

# 2. Install dependencies (includes Capacitor)
npm install
```

---

## Build & sync workflow

Whenever you change the React SPA you must re-build and sync to the Android
project before testing on a device/emulator.

```bash
# From the client/ directory:

# Build the Vite SPA and sync the output into the Android project in one step:
npm run cap:build

# — or as two separate steps —
npm run build        # compile Vite → dist/
npm run cap:sync     # copy dist/ into android/app/src/main/assets/public/
```

---

## Open in Android Studio

```bash
# From the client/ directory:
npm run android:open
```

This runs `npx cap open android` which launches Android Studio with the
`client/android/` project already loaded.  From there you can:

- Build & run on a connected device or emulator (**Run ▶**)
- Inspect the Gradle project structure
- Edit native manifest / resources

---

## Run directly from the CLI (optional)

With a device connected (USB debugging on) or an emulator running:

```bash
npm run android:run
```

---

## How the native → backend connection works

Inside the Capacitor WebView, `window.Capacitor.isNativePlatform()` returns
`true`.  The helper in `src/api/baseUrl.js` detects this and prefixes every API
path with `https://theresilienceatlas.com`, so requests go directly to
production instead of relying on the Vite dev proxy.

On the web (browser), the helper returns the path unchanged and the existing
same-origin / Vite-proxy behavior is preserved.

---

## Bumping versionCode / versionName for a release

Edit `client/android/app/build.gradle`:

```groovy
android {
    defaultConfig {
        versionCode  2        // increment by 1 for every Play Store upload
        versionName "1.1.0"   // human-readable semantic version
        ...
    }
}
```

> **Rule:** `versionCode` must always increase.  Play Store rejects uploads
> with a `versionCode` ≤ the previously uploaded version.

---

## Generating a signed AAB (for Play Store)

1. In Android Studio: **Build → Generate Signed Bundle / APK**
2. Choose **Android App Bundle (.aab)**
3. Create or select your keystore file (`.jks`)
4. Fill in key alias, key password, and store password
5. Select **release** build variant
6. Click **Finish** — the `.aab` will appear in
   `android/app/release/app-release.aab`

> Store the keystore file and passwords in a secure password manager.
> **You cannot update an app on Play Store if you lose the signing key.**

---

## Internal testing upload checklist

Before uploading to Google Play Internal Testing:

- [ ] `npm run cap:build` completed without errors
- [ ] `versionCode` and `versionName` bumped in `android/app/build.gradle`
- [ ] Signed `.aab` generated in `android/app/release/`
- [ ] App tested on a physical Android device (not only the emulator)
- [ ] All critical flows verified:
  - [ ] Homepage loads
  - [ ] Auth0 login / logout round-trip
  - [ ] Assessment quiz completes and saves
  - [ ] Results page renders PDF download button
  - [ ] Gamification dashboard shows progress
- [ ] No console errors or crashes in `adb logcat`

Upload the `.aab` at:
<https://play.google.com/console> → select app → **Internal testing → Create new release**
