# Input Builder: Offline Speech-to-Text Service
A lightweight, offline RESTful web service for transcribing audio to text. 

## Features
- **Offline Transcription**: Uses `faster-whisper` for high-accuracy local speech-to-text.
- **Async API**: Built with FastAPI for high performance.
- **Configurable**: Easily change model size and concurrency settings via environment variables.
- **Optimized**: Transcription runs in a thread pool to avoid blocking the event loop.

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

## API Endpoints

### `POST /upload`
Upload an `audio/webm` file for transcription.

**Request:**
- `Content-Type: multipart/form-data`
- `file`: The audio file blob.

**Example using `curl`:**
```bash
curl -X POST http://127.0.0.1:8000/upload \
  -F "file=@/path/to/your/audio.webm;type=audio/webm"
```

**Response:**
```json
{
  "text": "The transcribed text goes here."
}
```
