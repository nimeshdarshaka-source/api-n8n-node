@echo off
title ClinicPro - Deploy to the Internet (Vercel)
cd /d "%~dp0"
echo ============================================
echo  ClinicPro - Deploy to sldocpp.22millennial.com
echo ============================================
echo.
echo A browser window may open asking you to log in to Vercel.
echo Sign up / log in (free), then come back to this window.
echo.
echo When asked questions, just press ENTER to accept the defaults.
echo ("Set up and deploy?" = yes, project name = clinic-erp, etc.)
echo.
pause
call npx vercel --prod
echo.
echo ============================================
echo  If this is your FIRST deploy, the app is NOT working yet -
echo  you still need to add the 3 settings and the domain.
echo  Follow DEPLOY-GUIDE.md steps 3 and 4, then run this file once more.
echo ============================================
pause
