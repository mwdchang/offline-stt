# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
# ffmpeg is required for audio processing
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container at /app
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Pre-fetch the faster-whisper model
# This ensures the model is baked into the image
# We use the default 'base' model as defined in config.py
ENV HF_HOME=/app/model_cache
RUN python3 -c "from faster_whisper import WhisperModel; WhisperModel('base', device='cpu', compute_type='int8')"

# Copy the rest of the application code into the container at /app
COPY src/ .

# Set environment variables
ENV PYTHONPATH=/app
ENV MODEL_SIZE=base
ENV DEVICE=cpu
ENV COMPUTE_TYPE=int8

# Expose port 8000 for the FastAPI app
EXPOSE 8000

# Define the command to run the app
CMD ["uvicorn", "input_builder.main:app", "--host", "0.0.0.0", "--port", "8000"]
