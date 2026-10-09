# 🌍 External GeoGuessr Resolver (Steam + Browser + Android Flutter App + Web Dashboard)

A complete system that allows you to **play GeoGuessr on your PC** (either the **Steam Edition** or in a **Web Browser**) while viewing the exact location of the current round in real time on your **Android phone inside a standalone Flutter app** (or in the upgraded **Next.js Web Dashboard**).

Nothing is displayed on your PC screen during gameplay, keeping your monitor and Discord screen shares completely clean.

---

## ✨ Key Features (Android App & Web Dashboard)

Both the **Flutter Android App (`flutter_app/`)** and the **Web Dashboard (`frontend/`)** share the same redesigned interface and controls:

* **Instant Hero Location Banner:** Displays the **Country** in large bold neon text at the very top of the screen, along with **City • State/Region**, **Road**, and a 1-tap **Copy Coordinates** button.
* **4 Map Layer Styles (1-Tap Switcher):**
  * **Clean HD** (Carto Voyager @2x) — high-contrast, modern map with crisp road and city labels.
  * **Streets** (OpenStreetMap) — full street and local POI details.
  * **Satellite** (Esri World Imagery) — aerial/satellite imagery.
  * **Dark** (Carto Dark Matter) — dark-themed map matching the neon UI.
* **1-Tap Quick Zoom Presets:** Jump immediately between zoom levels without pinching repeatedly:
  * 🌍 **World (`z3`)** — continent / global overview.
  * 🏳️ **Country (`z6`)** — country-level overview.
  * 🏙️ **Region (`z11`)** — city and regional highways.
  * 🎯 **5K Pin (`z16`)** — street-level intersection view for 5,000-point pinpointing.
* **Precision Bullseye Target Marker:** A translucent target ring with an exact center dot and a floating `City, Country` chip above it, so the pin never obscures the road intersection underneath.
* **Fullscreen Map Mode (`Expand`):** Expand the map to fill the entire screen with a floating summary bar on top and quick-zoom controls at the bottom.
* **North-Up Rotation Lock (Android):** Two-finger pinch-to-zoom never accidentally twists the map upside down.
* **Tap-to-Copy Details:** Tap any tile in the **Location Details** grid (Country, State, County, City, Area, Road, Postcode, Place) to copy it to your clipboard.
* **Pre-Configured Default User ID:** Comes pre-filled with `11111111-1111-4111-8111-111111111111` across the Android app, Web Dashboard, Steam Resolver, and Browser Userscript so you can connect with a single tap.

---

## 📁 Project Structure

| Folder / File | Description |
| :--- | :--- |
| **[`flutter_app/`](flutter_app/)** | **Android Flutter Application** — standalone native mobile app with an interactive map (`flutter_map`), quick-zoom presets, layer switcher, fullscreen mode, and reverse-geocoded details. |
| **[`Steam_Resolver/`](Steam_Resolver/)** | **GeoGuessr Steam Edition Resolver** — intercepts Street View coordinates directly from the Steam desktop game on Windows and streams them to the Android app / Web Dashboard. |
| **[`Extension/Extension.js`](Extension/Extension.js)** | **Tampermonkey Userscript (Browser Version)** — hooks into Google Maps requests on `geoguessr.com` in Chrome, Edge, Brave, Opera, or Firefox. |
| **[`frontend/`](frontend/)** | **Next.js Web Dashboard** — web version featuring the same interactive Leaflet map, quick-zoom presets, map layers, fullscreen mode, and live location details. |
| **[`Server/server.py`](Server/server.py)** | **FastAPI WebSocket Server** — optional self-hosted server if you want everything to run over your local Wi-Fi network without relying on an external server. |
| **[`.github/workflows/build-apk.yml`](.github/workflows/build-apk.yml)** | **GitHub Actions Workflow** — automatically compiles the Flutter app into a ready-to-install Android `.apk` artifact on GitHub. |

---

## 📱 PART 1: Installing the Android Flutter App

You can either download the pre-built `.apk` directly from GitHub Actions (no Flutter installation required on your PC) or build it locally with the Flutter SDK.

### Option A: Build & Download `.apk` via GitHub Actions (Recommended)

1. Open your repository on GitHub and click the **Actions** tab at the top.
2. If your repository is a fork and Actions are disabled, click **"I understand my workflows, go ahead and enable them"**.
3. Select **Build Android APK** on the left sidebar.
   - It runs automatically whenever `flutter_app/` changes, or you can trigger it manually by clicking **Run workflow** $\rightarrow$ **Run workflow**.
4. Wait 2–3 minutes until the workflow completes with a green checkmark ✅.
5. Click the completed workflow run, scroll down to the **Artifacts** section, and click **`GeoResolver-Android-APK`**.
6. Extract the downloaded `.zip` archive to get **`app-release.apk`**.
7. Transfer `app-release.apk` to your Android phone and install it.

### Option B: Build `.apk` Locally (Using Flutter SDK)

If you have the Flutter SDK installed on your computer:

```bash
cd flutter_app

# 1. Generate Android platform files
flutter create . --platforms=android --org com.georesolver

# 2. Fetch dependencies
flutter pub get

# 3. Build release APK
flutter build apk --release
```
> **Note for manual builds:** Make sure `flutter_app/android/app/src/main/AndroidManifest.xml` includes `<uses-permission android:name="android.permission.INTERNET"/>` above `<application>` and `android:usesCleartextTraffic="true"` inside `<application>` (the GitHub Actions workflow patches this automatically).

### How to Use the Android App:
1. Open the **GeoGuessr Live Viewer** app on your Android phone.
2. The **User ID Token** field comes pre-filled with the default ID:
   ```text
   11111111-1111-4111-8111-111111111111
   ```
3. Tap the green **Connect** button.
4. The app will show **"Waiting for game info"** until a round starts on your PC. As soon as a round loads, the map automatically centers on the exact pin and displays all location details.

---

## 🎮 PART 2: Playing on GeoGuessr STEAM Edition (`Steam_Resolver`)

Because GeoGuessr Steam Edition runs as a standalone desktop application rather than inside a web browser, use the scripts inside **[`Steam_Resolver/`](Steam_Resolver/)**.

### Prerequisites:
* **Python** installed on Windows ([python.org/downloads](https://www.python.org/downloads/)).
* Make sure **"Add Python to PATH"** is checked during installation.

### Step 1: First-Time Setup (Run once)
1. Download the repository (or the `Steam_Resolver` folder) to your PC.
2. Open the `Steam_Resolver` folder and double-click **`1_INSTALL_FIRST_TIME.bat`**.
3. The script will:
   - Install `mitmproxy`.
   - Generate a local SSL certificate.
   - Prompt Windows to install the certificate into the Trusted Root store — click **Yes**.

### Step 2: Running Before Playing on Steam (Every session)
1. Open `Steam_Resolver` and double-click **`2_START_STEAM_RESOLVER.bat`**.
2. A console window will appear:
   ```text
   ==========================================================
     GeoGuessr Steam Edition Resolver is ACTIVE!
     User ID (on phone): 11111111-1111-4111-8111-111111111111
   ==========================================================
   ```
3. Leave that window open in the background and launch **GeoGuessr on Steam**.
4. Tap **Connect** in the Android app on your phone.
5. As soon as you enter a round (Solo, Duels, Party, etc.), the console will log the detected coordinates and stream them immediately to your phone!

### Step 3: Stopping After Playing
* Simply close the console window (`X` or `Ctrl + C`) when you finish playing.
* [`Steam_Resolver/run.py`](Steam_Resolver/run.py) includes an automatic background watchdog that immediately disables the Windows proxy when the window closes.
* You can also double-click **`3_STOP_PROXY.bat`** at any time to manually turn off the Windows proxy.

---

## 🌐 PART 3: Playing in a Web Browser on PC (`Extension/Extension.js`)

If you play GeoGuessr in a web browser at `https://www.geoguessr.com`, you don't need `Steam_Resolver` — use the **Tampermonkey** userscript instead.

### Step 1: Install & Configure Tampermonkey
1. Install the **Tampermonkey** extension for your browser ([tampermonkey.net](https://www.tampermonkey.net/)).
2. **Required for Chrome, Edge, Brave, and Opera (Manifest V3):**
   - Open `chrome://extensions` (or `edge://extensions` / `brave://extensions`).
   - Enable the **Developer mode** toggle in the **top-right corner**.
   - Find **Tampermonkey**, click **Details**, and enable **Allow User Scripts**.

### Step 2: Add the Userscript
1. Click the **Tampermonkey** icon in your browser $\rightarrow$ **Create a new script...**
2. Delete the default template and paste the entire contents of **[`Extension/Extension.js`](Extension/Extension.js)**.
3. Press **`Ctrl + S`** (or **File $\rightarrow$ Save**).
4. Open or refresh (`F5`) **[https://www.geoguessr.com](https://www.geoguessr.com)**.
5. The script automatically uses the same default ID (`11111111-1111-4111-8111-111111111111`) as the Android app — just tap **Connect** on your phone and play!

---

## 💻 PART 4: Optional — Running the Web Dashboard (`frontend/`) or Local Server (`Server/`)

### Running the Next.js Web Dashboard (`frontend/`)
If you also want to use the upgraded Web Dashboard in a browser:

```bash
cd frontend
npm install
npm run dev -- --hostname 0.0.0.0
```
Then open `http://localhost:3000` (or `http://<YOUR_PC_IP>:3000` from another device on the same Wi-Fi).

### Running Your Own Local WebSocket Server (`Server/server.py`)
By default, the Steam script, Browser userscript, Android app, and Web Dashboard communicate through the public server (`georesolver.0x978.com`).
If the public server is ever offline or you prefer to run everything 100% locally over your home Wi-Fi:

1. **Start the local server on your PC:**
   ```bash
   cd Server
   pip install fastapi uvicorn requests websockets
   python server.py
   ```
   *(The server listens on port `8000`, and `Steam_Resolver` already sends coordinates to `http://127.0.0.1:8000/coords` automatically!).*

2. **Find your PC's local IP address:**
   - Open Command Prompt (`cmd`) and run `ipconfig`.
   - Look for **IPv4 Address** (e.g., `192.168.1.15`).

3. **Connect the Android app (or Web Dashboard) to your PC:**
   - On the Connect screen, tap **"Configure custom / local server (optional)"**.
   - Enter your PC's local IP and port, e.g.:
     ```text
     192.168.1.15:8000
     ```
   - Tap **Connect**.

---

## 🛠️ Troubleshooting / FAQ

| Issue | Solution |
| :--- | :--- |
| **Steam Resolver prints `<urlopen error timed out>`** | Make sure you are using the latest [`Steam_Resolver/steam_resolver.py`](Steam_Resolver/steam_resolver.py), which uses `DIRECT_OPENER` (`ProxyHandler({})`) to bypass the local system proxy. |
| **Steam GeoGuessr says offline / no connection while `Steam_Resolver` is running** | Run **`1_INSTALL_FIRST_TIME.bat`** and click **Yes** when Windows asks to trust the local `mitmproxy` root certificate. |
| **Browser has no internet after closing `Steam_Resolver`** | Double-click **`Steam_Resolver/3_STOP_PROXY.bat`** to disable the Windows system proxy immediately. |
| **Phone stays on `Waiting for game info` when a round starts** | Verify that the User ID in the Android app is `11111111-1111-4111-8111-111111111111`. If playing in a browser, verify **Developer mode** + **Allow User Scripts** are enabled in `chrome://extensions` and refresh `geoguessr.com` (`F5`). |
| **How do I change the User ID if multiple people are playing at once?** | Change `USER_ID` in [`Steam_Resolver/steam_resolver.py`](Steam_Resolver/steam_resolver.py) (or `userId` in [`Extension/Extension.js`](Extension/Extension.js)) to any other valid UUID (e.g. `22222222-2222-4222-8222-222222222222`) and enter the same UUID in the Android app. |
