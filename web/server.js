const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;
const TEMP_DIR = path.join(__dirname, 'temp');


// Clean up
// if (fs.existsSync(TEMP_DIR)) {
//   console.log(`Cleaning dir ${TEMP_DIR}`);
//   fs.rmSync(TEMP_DIR, {
//     recursive: true,
//     force: true,
//   });
// }

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR);
}

/**
 * Reusable transcription logic using Whisper
 */
function handleTranscription(filePath) {
  console.log(`Starting transcription for: ${filePath}`);
  
  // Run whisper command
  // Using --model base and --output_format txt for simplicity
  // const whisper = spawn('whisper', [filePath, '--model', 'base', '--output_format', 'txt', '--output_dir', TEMP_DIR]);
  const whisper = spawn('whisper', [filePath, '--initial_prompt', 'Dutch place names like: Wijk aan Zee, IJmuiden, Scheveningen', '--model', 'base', '--output_format', 'txt', '--output_dir', TEMP_DIR]);

  whisper.stdout.on('data', (data) => {
    console.log(`Whisper STDOUT: ${data}`);
  });

  whisper.stderr.on('data', (data) => {
    console.error(`Whisper STDERR: ${data}`);
  });

  whisper.on('close', (code) => {
    if (code === 0) {
      const txtPath = filePath.replace('.webm', '.txt');
      if (fs.existsSync(txtPath)) {
        const transcription = fs.readFileSync(txtPath, 'utf8');
        console.log('--- Transcription Start ---');
        console.log(transcription);
        console.log('--- Transcription End ---');
        console.log('');
        console.log('');

        // Test: Hook into cli-helper (kept for consistency with original)
        // const cliHelp = spawn('/Users/dchang/bin/cli-help', [`"${transcription}"`]);
        // cliHelp.stdout.on('data', (data) => {
        //   console.log(`>>> CLI: : ${data}`);
        // });
      } else {
        console.error('Transcription file not found.');
      }
    } else {
      console.error(`Whisper process exited with code ${code}`);
    }
  });
}

app.use(express.static('public'));




app.post('/upload-proxy', async (req, res) => {
  try {
    // console.log('Forwarding upload to Python server...', req.headers);
    console.log('Forwarding upload to Python server...');

    const response = await fetch('http://127.0.0.1:8000/upload', {
      method: 'POST',
      headers: {
        'content-type': req.headers['content-type'],
      },
      // headers: {
      //   'Content-Type': req.headers['content-type'] || 'application/octet-stream',
      // },
      body: req,
      // REQUIRED in Node.js for streaming bodies
      duplex: 'half',
    });

    if (!response.ok) {
      const text = await response.text();

      return res.status(response.status).json({
        error: 'Python server failed',
        details: text,
      });
    }

    const result = await response.json();
    console.log('transcribe result: ', result);

    res.json({
      success: true,
      python: result,
    });

  } catch (err) {
    console.error('Proxy error:', err);

    res.status(500).json({
      error: 'Failed to proxy upload',
    });
  }
});


/**
 * Non-socket endpoint for intermittent audio uploads
 */
app.post('/upload', (req, res) => {
    const fileName = `audio_${Date.now()}.webm`;
    const filePath = path.join(TEMP_DIR, fileName);
    const writeStream = fs.createWriteStream(filePath);

    console.log(`Receiving HTTP upload: ${fileName}`);

    req.pipe(writeStream);

    writeStream.on('finish', () => {
      console.log('HTTP upload complete');
      handleTranscription(filePath);
      res.status(200).json({ 
        success: true, 
        message: 'Audio received and processing started' 
      });
    });

    writeStream.on('error', (err) => {
      console.error('File system error during HTTP upload:', err);
      res.status(500).json({ error: 'Failed to save audio file' });
    });

    req.on('error', (err) => {
      console.error('Network error during HTTP upload:', err);
      res.status(500).json({ error: 'Network error during upload' });
    });
});

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  const fileName = `audio_${Date.now()}.webm`;
  const filePath = path.join(TEMP_DIR, fileName);
  const writeStream = fs.createWriteStream(filePath);

  ws.on('message', (message) => {
    // Assume messages are binary chunks of audio
    if (Buffer.isBuffer(message)) {
      writeStream.write(message);
    } else if (typeof message === 'string') {
      const data = JSON.parse(message);
      if (data.type === 'stop') {
        console.log('Recording stopped by client');
        ws.close();
      }
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected, starting transcription...');
    writeStream.end();
    handleTranscription(filePath);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});




// Clean up on start
// console.log('Clean up temp folder...');
// const filePath = path.join(TEMP_DIR);
// fs.unlinkSync(filePath);
//
