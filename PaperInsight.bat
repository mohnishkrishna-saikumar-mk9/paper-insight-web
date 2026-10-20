@echo off
cd /d "%~dp0"
TITLE PaperInsight
echo ==============================================
echo        PaperInsight Launcher
echo ==============================================

:: 1. Create Desktop Shortcut automatically if it doesn't exist
    echo [INFO] Creating Desktop Shortcut for easy access...
    echo Set oWS = WScript.CreateObject("WScript.Shell"^) > CreateShortcut.vbs
    echo sLinkFile = oWS.SpecialFolders("Desktop"^) ^& "\PaperInsight.lnk" >> CreateShortcut.vbs
    echo Set oLink = oWS.CreateShortcut(sLinkFile^) >> CreateShortcut.vbs
    echo oLink.TargetPath = "%~dp0core\scripts\Start-Hidden.vbs" >> CreateShortcut.vbs
    echo oLink.WorkingDirectory = "%~dp0" >> CreateShortcut.vbs
    echo oLink.Description = "Launch PaperInsight" >> CreateShortcut.vbs
    echo oLink.IconLocation = "%~dp0core\src\app\favicon.ico" >> CreateShortcut.vbs
    echo oLink.Save >> CreateShortcut.vbs
    cscript //nologo CreateShortcut.vbs
    del CreateShortcut.vbs
    echo [OK] Shortcut created on Desktop!
    echo.

:: 2. Check if this is the first time running (missing dependencies)
set "FIRST_TIME=0"
if not exist "core\node_modules\next\" set "FIRST_TIME=1"
if not exist "core\backend\venv\Scripts\python.exe" set "FIRST_TIME=1"

if "%FIRST_TIME%"=="1" (
    echo [INFO] First time run detected! Installing required dependencies...
    
    echo Checking for Node.js...
    where node >nul 2>nul
    if %errorlevel% neq 0 (
        echo [ERROR] Node.js is not installed. Please install Node.js from https://nodejs.org/
        pause
        exit /b
    )
    
    echo Checking for Python...
    where python >nul 2>nul
    if %errorlevel% neq 0 (
        echo [ERROR] Python is not installed. Please install Python from https://www.python.org/
        pause
        exit /b
    )

    echo Installing Frontend dependencies...
    cd core
    call npm install

    echo Installing Backend dependencies...
    cd backend
    python -m venv venv
    call .\venv\Scripts\pip install -r requirements.txt
    cd ..
    cd ..
    
    echo [OK] All dependencies installed successfully!
    echo.
)

:: 3. Run the App
echo Starting PaperInsight services in the background...
wscript core\scripts\Start-Hidden.vbs

echo All services have been started silently! 
echo A browser window will open shortly.
echo (To stop the services later, run Stop-Servers.bat)
timeout /t 5

