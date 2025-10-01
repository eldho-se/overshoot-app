@echo off
REM Exit immediately if a command fails
SETLOCAL ENABLEEXTENSIONS
cd /d %~dp0

echo Creating a virtual environment...
python -m venv venv
IF %ERRORLEVEL% NEQ 0 (
	echo Failed to create virtual environment.
	exit /b 1
)

echo Activating the virtual environment...
call venv\Scripts\activate.bat
IF %ERRORLEVEL% NEQ 0 (
	echo Failed to activate virtual environment.
	exit /b 1
)

echo Installing dependencies from requirements.txt...
pip install -r requirements.txt
IF %ERRORLEVEL% NEQ 0 (
	echo Failed to install dependencies.
	exit /b 1
)

echo Setup complete! Activating environment and running main.py...
call venv\Scripts\activate.bat
python main.py
