# Input Builder: Offline Speech-to-Text Service
A lightweight, offline RESTful web service for transcribing audio to text. 

## Installation
Note `ffmpeg` is needed by `fast-whisper`, eg `brew install ffmpeg` or `apt update && apt install ffmpeg`

```bash
pip install -r requirements.txt
```

## Configuration

You can configure the service using environment variables or a `.env` file:

| Variable | Default | Description |
|----------|---------|-------------|
| `MODEL_SIZE` | `base` | Whisper model size (`tiny`, `base`, `small`, `medium`, `large-v3`) |
| `DEVICE` | `cpu` | Device to run on (`cpu` or `cuda`) |
| `COMPUTE_TYPE` | `int8` | Quantization type (`int8`, `float16`, etc.) |
| `THREAD_POOL_SIZE` | `4` | Number of concurrent transcription workers |

## Running the Service

Start the server using `uvicorn`:

```bash
uvicorn src.input_builder.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`.


## Docker
```bash
# build
docker build -t <name> -f docker/Dockerfile .

# run
docker run -p 8000:8000 <name>
```

## Testing
```bash
#!/usr/bin/env bash

END_POINT=http://localhost:8000/upload
FILE_PATH=$1
PROMPT="$2"

echo "File path: ${FILE_PATH}"
echo "Prompt: ${PROMPT}"

curl -X POST ${END_POINT} \
  -F "audio=@/${FILE_PATH}" \
  -F "context=${PROMPT}"
```

