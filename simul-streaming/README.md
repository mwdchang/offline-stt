## SimulStreaming
This demo uses https://github.com/ufal/SimulStreaming which is a whisper-based model adapted to do realtime/streaming transcriptions.


### Setup
Setup the whisper server somewhere:

1. Clone the repo and get deps

```
git clone git@github.com:ufal/SimulStreaming.git
cd SimulStreaming.git
pip install -r requirements_whisper.txt
```

2. Download the model, see https://github.com/ufal/SimulStreaming/blob/077ea37d5ab4ff98bc567e4507f140dc4e5d5ad6/simulstreaming/whisper/simul_whisper/whisper/__init__.py


3. Run the streaming server and set parameters

```
python3 simulstreaming_whisper_server.py --host 127.0.0.1 --port 43007 --model_path <path_to_checkpoint>
```

### Proxying
The provided Python server uses TCP socket but not Websocket, it doesn't look like a webpage client can connect to it, but we can proxying via node.

Run, and the page will be available on http://localhost:8080
```
npm run start
```
