# Whisper/FastWhisper transcription
A lightweight, offline RESTful web service for transcribing audio to text. 


## Installation
Note `ffmpeg` is needed by `fast-whisper`, eg `brew install ffmpeg` or `apt update && apt install ffmpeg`

```bash
pip install -r requirements.txt
```


## Running the Service

Start the server using `uvicorn`:

```bash
uvicorn src.input_builder.main:app --reload
```
The API will be available at `http://127.0.0.1:8000`.


## Web client demo
The `web` folder has a simple web app that calls the fast-whisper model as a micro-service
```bash
cd web
npm install
npm run dev
```
Open localhost:3000 in browser



## Docker build:
```bash
# build
docker build -t <name> -f docker/Dockerfile .

# run
docker run -p 8000:8000 <name> --gpus all
```

