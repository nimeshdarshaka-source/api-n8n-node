@echo off
title ClinicPro - First Time Setup
cd /d "%~dp0"
echo ============================================
echo  ClinicPro - First Time Setup
echo  This will take 5-10 minutes. Leave it running.
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed.
  echo Please download and install it from:  https://nodejs.org
  echo Choose the "LTS" version, install with all default options,
  echo then run this file again.
  pause
  exit /b 1
)
echo [OK] Node.js found:
node --version
echo.

findstr /C:"USER:PASSWORD" .env >nul 2>nul
if not errorlevel 1 (
  echo [ERROR] The database line in .env is still the placeholder.
  echo Follow Step 2 in SETUP-GUIDE.md ^(XAMPP^), then run this again.
  pause
  exit /b 1
)

echo [1/4] Installing program components...
call npm install --legacy-peer-deps --no-audit --no-fund
if errorlevel 1 ( echo [ERROR] Install failed. Check your internet connection and try again. & pause & exit /b 1 )

echo.
echo [2/4] Preparing database engine...
call npx prisma generate
if errorlevel 1 ( echo [ERROR] Failed. & pause & exit /b 1 )

echo.
echo [3/4] Creating database tables...
call npx prisma db push --accept-data-loss
if errorlevel 1 ( echo [ERROR] Could not reach the database. Check the DATABASE_URL line in .env ^(see SETUP-GUIDE.md Step 2^). & pause & exit /b 1 )

echo.
echo [4/4] Adding sample data (patients, drugs, suppliers)...
call npx prisma db seed

echo.
echo ============================================
echo  SETUP COMPLETE!
echo  From now on, just double-click 2-START.bat
echo  NOTE: never run 1-SETUP.bat again once you have real data.
echo ============================================
pause
