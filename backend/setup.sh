#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Change to the directory where the script is located
cd "$(dirname "$0")"

echo "Creating a virtual environment..."
python3 -m venv venv

echo "Activating the virtual environment..."
source venv/bin/activate

echo "Installing dependencies from requirements.txt..."
pip install -r requirements.txt

echo "Setup complete! To start working, run 'source venv/bin/activate'"