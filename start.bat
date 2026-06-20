@echo off
title PrintRent
cd /d "%~dp0"

:MENU
cls
echo.
echo  ========================================
echo    PrintRent - Yazici Yonetim Sistemi
echo  ========================================
echo.
echo  1. Baslat (npm start)
echo  2. Kurulum (npm install)
echo  3. Cikis
echo.
set /p secim="Secim [1-3]: "

if "%secim%"=="1" goto START
if "%secim%"=="2" goto INSTALL
if "%secim%"=="3" exit
goto MENU

:INSTALL
echo Kurulum...
call npm install
cd server && call npm install && cd ..
cd client && call npm install && cd ..
echo Tamam.
pause
goto MENU

:START
cls
echo Baslatiliyor...
npm start
pause
exit
