FROM python:3.13-slim

# Set working directory
WORKDIR /app

# Install system dependencies (if needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
	build-essential \
	&& rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt ./
RUN python -m venv /opt/venv \
	&& /opt/venv/bin/pip install --upgrade pip \
	&& /opt/venv/bin/pip install -r requirements.txt

# Ensure venv is used by default
ENV PATH="/opt/venv/bin:$PATH"

# Copy project files
COPY . .

# Use PORT environment variable from Cloud Run
ENV PORT=8080
EXPOSE ${PORT}

# Default command to run main.py with proper port binding
CMD ["sh", "-c", "python main.py"]
