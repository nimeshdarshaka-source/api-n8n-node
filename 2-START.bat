@echo off
title ClinicPro - Running (keep this window open)
cd /d "%~dp0"
echo Starting ClinicPro...
echo The app will open in your browser in about 15 seconds.
echo KEEP THIS BLACK WINDOW OPEN while using the app.
echo To stop the app, simply close this window.
start "" cmd /c "timeout /t 15 >nul && start http://localhost:3000"
call npm run dev
pause
