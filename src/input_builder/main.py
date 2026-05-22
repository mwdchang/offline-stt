import io
from fastapi import FastAPI, Request, HTTPException, File, Form, UploadFile
from .transcriber import transcriber

app = FastAPI(title="Speech-to-Text Service")


@app.post("/upload")
# async def upload_audio(request: Request):
async def upload_audio(
    audio: UploadFile = File(...),
    context: str = Form(...)
):
    # Validate Content-Type header if present
    # Note: When proxying, Content-Type might be audio/webm or application/octet-stream
    # content_type = request.headers.get("content-type", "")

    # We allow audio/webm or octet-stream (common for raw blobs)
    # if content_type and "audio/webm" not in content_type and "application/octet-stream" not in content_type:
    #     # We can be lenient here or strict. Let's log a warning but try to proceed
    #     # as ffmpeg might still be able to decode it.
    #     pass

    try:
        # Read the raw request body
        # content = await request.body()
        # if not content:
        #     raise HTTPException(status_code=400, detail="Empty request body")
        # audio_stream = io.BytesIO(content)

        content = await audio.read()
        audio_stream = io.BytesIO(content)

        # Perform transcription
        print(f">> context is: {context}")
        text = await transcriber.transcribe(audio_stream, context)

        return {"text": text}

    except Exception as e:
        # Log error or handle specific exceptions as needed
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    return {"status": "ok"}
