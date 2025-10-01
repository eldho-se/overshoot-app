# My FastAPI Project

A simple API server built with FastAPI and Uvicorn.

## Getting Started

Follow these steps to set up and run the project.

### Prerequisites

* **Python 3.12+**: Ensure you have a compatible version of Python installed.
* **Bash**: The `setup.sh` script is written for a Unix-like environment (macOS, Linux, WSL on Windows).

### Installation

1.  **Clone the repository:**

    ```bash
    git clone [https://github.com/your-username/my-fastapi-project.git](https://github.com/your-username/my-fastapi-project.git)
    cd my-fastapi-project
    ```

2.  **Run the setup script:**

    This script will automatically create and activate a virtual environment, then install all the required dependencies from `requirements.txt`.

    ```bash
    chmod +x setup.sh
    ./setup.sh
    ```

    The script will output `Setup complete! To start working, run 'source venv/bin/activate'`.

    ***Note:** The `source venv/bin/activate` command in the script only activates the environment for the script's own session. After the script finishes, you need to run it yourself to activate the environment in your current terminal.*

3.  **Activate the virtual environment (if it's not already active):**

    ```bash
    source venv/bin/activate
    ```

    You will see `(venv)` at the beginning of your terminal prompt, indicating that the virtual environment is active.

### How to Run Docker
You can build and run the docker container on 8080 port.

```bash
 docker build -t overshoot-server .
 docker run -p 8000:8000 overshoot-server