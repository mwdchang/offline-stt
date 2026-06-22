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

2. Download model checkpoint, see https://github.com/ufal/SimulStreaming/blob/077ea37d5ab4ff98bc567e4507f140dc4e5d5ad6/simulstreaming/whisper/simul_whisper/whisper/__init__.py

```bash
e.g.

curl https://openaipublic.azureedge.net/main/whisper/models/d3dd57d32accea0b295c96e26691aa14d8822fac7d9d27d5dc00b4ca2826dd03/tiny.en.pt -o tiny.en.pt
```


3. Run the streaming server and set parameters.

```
python3 simulstreaming_whisper_server.py \
  --host 127.0.0.1 \
  --port 43007 \
  --model_path <path_to_checkpoint> \
  --init_prompt [optional context text]
```

### Proxying
The provided Python server uses TCP socket, not Websocket, it doesn't look like a webpage client can connect to it directly, but we can proxying via node.

Run the follow, the demo will be available on http://localhost:8080
```
npm run start
```
