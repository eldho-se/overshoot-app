```bash
@echo off
REM Start backend in a new terminal
start "Backend" cmd /k "cd backend && setup.bat"

REM Go to the ui folder and install the packages
cd .\ || exit /b 1
call npm install

REM Start frontend in a new terminal
start "Frontend" cmd /k "npm run dev"

REM Open browser
start "" "http://localhost:3000"