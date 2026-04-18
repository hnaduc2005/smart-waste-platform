# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install system dependencies required for OpenCV
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Create model_weights directory
RUN mkdir -p /app/model_weights

# Expose port
EXPOSE 8000

# Run the application (download model first, then start server)
CMD ["sh", "-c", "python scripts/download_model.py && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
