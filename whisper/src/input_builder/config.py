import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Model configuration
    MODEL_SIZE: str = os.getenv("MODEL_SIZE", "base")

    # "cpu", "cuda"
    DEVICE: str = os.getenv("DEVICE", "cpu")

    # "int8", "float16" for GPU
    COMPUTE_TYPE: str = os.getenv("COMPUTE_TYPE", "int8")

    # Server configuration
    THREAD_POOL_SIZE: int = int(os.getenv("THREAD_POOL_SIZE", "4"))

    class Config:
        env_file = ".env"


settings = Settings()
