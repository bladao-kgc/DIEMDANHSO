@echo off
setlocal
title Tro ten mien diemdanhso.cokhi.cdkg.vn ve may nay

net session >nul 2>&1
if errorlevel 1 (
    echo [LOI] Can quyen Administrator.
    echo Hay chuot phai file nay -^> "Run as administrator".
    pause
    exit /b 1
)

set "HOSTS=%SystemRoot%\System32\drivers\etc\hosts"

findstr /I /C:"diemdanhso.cokhi.cdkg.vn" "%HOSTS%" >nul 2>&1
if not errorlevel 1 (
    echo [OK] Dong hosts da ton tai:
    findstr /I /C:"diemdanhso.cokhi.cdkg.vn" "%HOSTS%"
    goto :flush
)

echo.>> "%HOSTS%"
echo 127.0.0.1 diemdanhso.cokhi.cdkg.vn>> "%HOSTS%"
echo [OK] Da them: 127.0.0.1 diemdanhso.cokhi.cdkg.vn

:flush
ipconfig /flushdns >nul
echo [OK] Da xoa cache DNS.
echo.
echo Bay gio mo trinh duyet: http://diemdanhso.cokhi.cdkg.vn
echo (Nho chay web o cong 80: scripts\start-web.ps1 -Port 80)
pause
