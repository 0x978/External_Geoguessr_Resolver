import atexit
import ctypes
import os
import signal
import subprocess
import sys

PROXY_ADDR = "127.0.0.1:8080"


def set_windows_proxy(enable: bool) -> None:
    if sys.platform != "win32":
        return
    try:
        import winreg

        key = winreg.OpenKey(
            winreg.HKEY_CURRENT_USER,
            r"Software\Microsoft\Windows\CurrentVersion\Internet Settings",
            0,
            winreg.KEY_SET_VALUE,
        )
        winreg.SetValueEx(key, "ProxyEnable", 0, winreg.REG_DWORD, 1 if enable else 0)
        if enable:
            winreg.SetValueEx(key, "ProxyServer", 0, winreg.REG_SZ, PROXY_ADDR)
            winreg.SetValueEx(key, "ProxyOverride", 0, winreg.REG_SZ, "<local>")
        winreg.CloseKey(key)

        # Notify Windows that proxy settings changed
        internet_set_option = ctypes.windll.Wininet.InternetSetOptionW
        internet_set_option(0, 39, 0, 0)  # INTERNET_OPTION_SETTINGS_CHANGED
        internet_set_option(0, 37, 0, 0)  # INTERNET_OPTION_REFRESH
    except Exception as e:
        print(f"[!] Greska pri podesavanju Windows Proxy-ja: {e}")


def start_cleanup_watchdog() -> None:
    """Starts a hidden background watcher that disables the Windows proxy even if CMD is closed via X."""
    if sys.platform != "win32":
        return
    pid = os.getpid()
    ps_cmd = (
        f"Wait-Process -Id {pid} -ErrorAction SilentlyContinue; "
        f"Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings' "
        f"-Name ProxyEnable -Value 0"
    )
    try:
        subprocess.Popen(
            [
                "powershell",
                "-NoProfile",
                "-WindowStyle",
                "Hidden",
                "-Command",
                ps_cmd,
            ],
            creationflags=0x08000000,  # CREATE_NO_WINDOW
        )
    except Exception:
        pass


def cleanup(*_args) -> None:
    set_windows_proxy(False)


def main() -> None:
    script_dir = os.path.dirname(os.path.abspath(__file__))
    addon_path = os.path.join(script_dir, "steam_resolver.py")

    atexit.register(cleanup)
    signal.signal(signal.SIGINT, lambda *_: sys.exit(0))
    signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))
    if hasattr(signal, "SIGBREAK"):
        signal.signal(signal.SIGBREAK, lambda *_: sys.exit(0))

    start_cleanup_watchdog()
    set_windows_proxy(True)

    print("==========================================================")
    print("  GeoGuessr Steam Edition Resolver je AKTIVAN!")
    print("  User ID (na telefonu): 11111111-1111-4111-8111-111111111111")
    print("==========================================================")
    print("Pokreni GeoGuessr na Steam-u i udji u partiju.")
    print("Lokacija ce se automatski slati na tvoju Android aplikaciju.")
    print("(Zatvori ovaj prozor ili pritisni Ctrl+C kada zavrsis igranje)")
    print("----------------------------------------------------------")

    try:
        subprocess.run(
            [
                "mitmdump",
                "-s",
                addon_path,
                "--listen-host",
                "127.0.0.1",
                "--listen-port",
                "8080",
                "--allow-hosts",
                r".*(googleapis\.com|geoguessr\.com).*",
                "--quiet",
            ]
        )
    finally:
        cleanup()


if __name__ == "__main__":
    main()
