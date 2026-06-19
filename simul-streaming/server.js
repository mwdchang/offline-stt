import express from 'express';
import { WebSocketServer } from 'ws';
import net from 'net';
import http from 'http';

const HTTP_PORT = 8080;

const PYTHON_HOST = '127.0.0.1';
const PYTHON_PORT = 43007;

const app = express();

app.use(express.static('public'));

const server = http.createServer(app);

const wss = new WebSocketServer({
  server,
  path: '/ws'
});

wss.on('connection', (ws) => {
  console.log('browser connected');

  const tcp = net.createConnection({
    host: PYTHON_HOST,
    port: PYTHON_PORT
  });

  tcp.on('connect', () => {
    console.log('connected to simulstreaming');
  });

  tcp.on('data', (data) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(data.toString('utf8'));
    }
  });

  tcp.on('error', (err) => {
    console.error('tcp error', err);

    if (ws.readyState === ws.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'error',
          message: err.message
        })
      );
    }
  });

  tcp.on('close', () => {
    console.log('tcp closed');

    if (ws.readyState === ws.OPEN) {
      ws.close();
    }
  });

  ws.on('message', (data, isBinary) => {
    if (!tcp.destroyed) {
      tcp.write(data);
    }
  });

  ws.on('close', () => {
    console.log('browser disconnected');
    tcp.destroy();
  });

  ws.on('error', (err) => {
    console.error('ws error', err);
    tcp.destroy();
  });
});

server.listen(HTTP_PORT, () => {
  console.log(`web server: http://localhost:${HTTP_PORT}`);
});
