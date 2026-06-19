# Demos
This repo contains a handful of demos for doing speech-to-text (STT) from within a web application.


## simul-streaming
A "real-time/streaming" adaptation based on the Whisper model. This requires running a Python server as well as a proxy server for WebSockets.


## whisper
Fast-whisper based server, transcription done via REST-requests. The client uses a VAD model to detect speech start/end.


## web-api
Transcription using native/browser-based speech-API


## Voxtral-Realtime-Vue3
A ONNX real-time transcription model that runs entirely on the browser. This requires a hefty download, as well as browser WebGPU support. This is a direct conversion of Huggingface space demo.


