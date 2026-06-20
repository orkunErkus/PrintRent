@echo off
title PrintRent - Yerel Tarama Ajanı
cd /d "%~dp0"

:MENU
cls
echo.
echo  ========================================
echo    PrintRent - Yazici Yonetim Sistemi
echo  ========================================
echo.
echo  Bu bilgisayar: YEREL AJAN
echo  (Sadece tarama yapar, veriyi Hostinger'a gonderir)
echo.
echo  1. Yerel Ajan'i Baslat
echo     - Yazicilari tarar, Hostinger MySQL'e kaydeder
echo     - Telefon: http://192.168.x.x:3001
echo.
echo  2. Kurulum (npm install)
echo.
echo  3. Cikis
echo.
echo  ========================================
set /p secim="Secim [1-3]: "

if "%secim%"=="1" goto START_AGENT
if "%secim%"=="2" goto INSTALL
if "%secim%"=="3" exit
goto MENU

:INSTALL
echo Kurulum baslatiliyor...
call npm install
cd agent && call npm install && cd ..
cd client && call npm install && cd ..
echo Kurulum tamam.
pause
goto MENU

:START_AGENT
for /f "tokens=1* delims=:" %%a in ('ipconfig ^| find /i "IPv4"') do set IP=%%b
set IP=%IP: =%
if "%IP%"=="" for /f "tokens=1* delims=:" %%a in ('ipconfig ^| find /i "IP Address"') do set IP=%%b
set IP=%IP: =%

cls
echo.
echo  ========================================
echo    PrintRent Yerel Ajan Baslatiliyor...
echo  ========================================
echo.
echo  Tarayicinizdan acin:  http://%IP%:3001
echo  Telefon:              http://%IP%:3001
echo.
echo  Kapatmak icin Ctrl+C veya pencereyi kapatin.
echo  ========================================
echo.
cd agent && node agent.js
pause
exit
