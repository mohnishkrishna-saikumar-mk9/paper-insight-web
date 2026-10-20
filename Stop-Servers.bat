@echo off
echo ==============================================
echo      Stopping PaperInsight AI Services
echo ==============================================
echo.
echo Closing Node.js (Frontend) and Python (Backend) processes...
echo.

taskkill /F /IM node.exe /T 2>NUL
taskkill /F /IM python.exe /T 2>NUL

echo.
echo All background servers have been stopped!
pause
