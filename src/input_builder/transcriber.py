import concurrent.futures
import io
import logging
import time
from faster_whisper import WhisperModel
from .config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Transcriber:
    def __init__(self):
        # The model is loaded once when the transcriber is initialized
        logger.info(f"Loading Whisper model: {settings.MODEL_SIZE} on {settings.DEVICE}")
        self.model = WhisperModel(
            settings.MODEL_SIZE,
            device=settings.DEVICE,
            compute_type=settings.COMPUTE_TYPE
        )
        self.executor = concurrent.futures.ThreadPoolExecutor(
            max_workers=settings.THREAD_POOL_SIZE
        )
        logger.info("Transcriber initialized")

    def transcribe_sync(self, audio_data: io.BytesIO) -> str:
        """Synchronous transcription logic intended to run in a thread pool."""
        start_time = time.time()
        logger.info("Starting transcription...")

        segments, info = self.model.transcribe(audio_data, beam_size=5)

        # Combine segments into a single string
        text = " ".join([segment.text for segment in segments]).strip()

        duration = time.time() - start_time
        logger.info(f"Transcription completed in {duration:.2f}s. Result: {text[:50]}...")
        return text

    async def transcribe(self, audio_data: io.BytesIO) -> str:
        """Asynchronous wrapper for the transcription logic."""
        import asyncio
        logger.info("Queuing transcription task...")
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(
            self.executor,
            self.transcribe_sync,
            audio_data
        )


# Global instance
transcriber = Transcriber()
