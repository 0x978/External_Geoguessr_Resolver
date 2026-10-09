# GeoGuessr Steam Edition Resolver (PC $\rightarrow$ Android App)

Because **GeoGuessr Steam Edition** runs as a desktop application rather than inside a web browser, the scripts in this folder (`Steam_Resolver/`) intercept Street View coordinates directly from the **Steam game** on Windows and stream them to your **Android Flutter App**.

---

## How to Use (2 Simple Steps)

### 1. First-Time Setup (Run once):
1. Download the `Steam_Resolver` folder to your PC (make sure [Python](https://www.python.org/downloads/) is installed with **"Add Python to PATH"** checked).
2. Double-click **`1_INSTALL_FIRST_TIME.bat`**.
3. When Windows prompts you to trust the local `mitmproxy` certificate, click **Yes**.

### 2. Every Time You Play GeoGuessr on Steam:
1. Double-click **`2_START_STEAM_RESOLVER.bat`** (leave the console window open in the background).
2. Launch **GeoGuessr on Steam** on your PC.
3. On your Android phone, open the **GeoGuessr Live Viewer** app, verify the User ID is set to:
   `11111111-1111-4111-8111-111111111111`
   and tap **Connect**.
4. As soon as you enter a round on Steam, your phone will immediately display the exact location on the map along with country, city, and street details!
5. When you finish playing, simply close the console window on your PC (the background watchdog automatically disables the local Windows proxy as soon as the window closes).
