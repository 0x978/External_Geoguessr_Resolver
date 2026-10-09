@echo off
title GeoGuessr Steam Resolver - Prva Instalacija
echo ==========================================================
echo   Instalacija za GeoGuessr Steam Edition Resolver
echo ==========================================================
echo.
echo [1/3] Instaliranje mitmproxy paketa...
pip install mitmproxy
echo.
echo [2/3] Generisanje lokalnog sertifikata...
start /B "" mitmdump --listen-port 18080 --quiet
timeout /t 4 /nobreak >nul
taskkill /F /IM mitmdump.exe >nul 2>&1
echo.
echo [3/3] Dodavanje sertifikata u Windows (klikni YES ako iskoci prozor)...
certutil -user -addstore root "%USERPROFILE%\.mitmproxy\mitmproxy-ca-cert.cer"
echo.
echo ==========================================================
echo   GOTOVO! Sada mozes pokrenuti 2_START_STEAM_RESOLVER.bat
echo ==========================================================
pause
