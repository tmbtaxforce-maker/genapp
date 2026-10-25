@echo off
title GenApp
cd /d "%~dp0"
echo.
echo  GenApp - starting auth+dev server (Express + bcrypt + SQLite on :8000) ...
start "GenApp Server" cmd /c "node auth-server.js"
timeout /t 1 /nobreak >nul
start "" "http://127.0.0.1:8000"
echo.
echo  Server is running. GenApp should open in your browser.
echo  To stop: close the "GenApp Server" window.
echo.
