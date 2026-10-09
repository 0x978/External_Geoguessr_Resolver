# GeoGuessr Live Viewer — Flutter Android App

This Flutter application replaces the web browser on your Android phone. It displays an interactive map (`flutter_map` + OpenStreetMap) and real-time location details (country, state/region, county, city, road, postcode) while you play GeoGuessr on your PC.

---

## Option A: Build `.apk` Directly via GitHub Actions (No Flutter Install Needed)

This repository includes a GitHub Actions workflow ([`.github/workflows/build-apk.yml`](../.github/workflows/build-apk.yml)) that compiles the Android APK automatically on GitHub's servers:

1. Open your repository on GitHub and click the **Actions** tab at the top.
2. Select **Build Android APK** on the left sidebar.
   - The workflow runs automatically on every push to `flutter_app/`, or you can click **Run workflow** $\rightarrow$ **Run workflow** to trigger it manually.
3. Wait 2–3 minutes for the build to complete (green checkmark ✅).
4. Click the completed workflow run and scroll down to the **Artifacts** section.
5. Click **`GeoResolver-Android-APK`** to download the `.zip` containing **`app-release.apk`**.
6. Transfer `app-release.apk` to your Android phone and install it!

---

## Option B: Build `.apk` Locally on Your PC

If you have the **Flutter SDK** installed on your computer:

```bash
cd flutter_app

# 1. Generate Android platform files (will not overwrite lib/ or pubspec.yaml)
flutter create . --platforms=android --org com.georesolver

# 2. Fetch packages
flutter pub get
```

### Add Internet Permission for Android
Open `flutter_app/android/app/src/main/AndroidManifest.xml` and add the following right above `<application ...>`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

Also add `android:usesCleartextTraffic="true"` inside `<application ...>` (so the app can connect to a local `ws://` server if needed):

```xml
<application
    android:label="GeoResolver"
    android:name="${applicationName}"
    android:icon="@mipmap/ic_launcher"
    android:usesCleartextTraffic="true">
```

### Build the Release APK:
```bash
flutter build apk --release
```
The compiled APK will be located at:
`flutter_app/build/app/outputs/flutter-apk/app-release.apk`
