let mediaRecorder;
let socket;
let isRecording = false;

const micButton = document.getElementById('micButton');
const noSockButton = document.getElementById('noSockButton');
const statusDiv = document.getElementById('status');

micButton.addEventListener('click', async () => {
  if (!isRecording) {
    startRecording();
  } else {
    stopRecording();
  }
});

noSockButton.addEventListener('click', async () => {
  if (!isRecording2) {
    startNoSocket();
  } else {
    stopNoSocket();
  }
});



/****** Using socket to transfer data ******/

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Use a secure websocket if on https, otherwise ws
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    socket = new WebSocket(`${protocol}//${window.location.host}`);

    socket.onopen = () => {
      console.log('WebSocket connected');
      statusDiv.textContent = 'Recording...';
      micButton.textContent = 'Stop Microphone';
      micButton.classList.add('recording');
      
      mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
          socket.send(event.data);
        }
      };

      // Request data every 1000ms (1 second)
      mediaRecorder.start(1000);
      isRecording = true;
    };

    socket.onclose = () => {
      console.log('WebSocket closed');
      resetUI();
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      statusDiv.textContent = 'Error: WebSocket disconnected';
      stopRecording();
    };

  } catch (err) {
    console.error('Error accessing microphone:', err);
    statusDiv.textContent = 'Error: Microphone access denied';
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'stop' }));
    socket.close();
}
  isRecording = false;
  resetUI();
  statusDiv.textContent = 'Processing transcription on server...';
}

function resetUI() {
  micButton.textContent = 'Start Microphone';
  micButton.classList.remove('recording');
}





/****** Using socket to transfer data ******/

// Local buffer to hold speech
let audioChunks = [];
let mediaRecorder2;
let isRecording2 = false;
async function startNoSocket() {
  try {
    // 1. Access Microphone
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // 2. Initialize Recorder
    mediaRecorder2 = new MediaRecorder(stream);
    isRecording2 = true;
    audioChunks = []; // Clear previous recording

    // 3. Collect data as it becomes available
    mediaRecorder2.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    // 4. Start recording (no interval needed since we aren't streaming)
    mediaRecorder2.start();
    noSockButton.textContent = 'Stop Microphone';
    noSockButton.classList.add('recording');


    console.log("Recording started (Local Buffer)");

  } catch (err) {
    console.error('Error accessing microphone:', err);
  }
}


async function stopNoSocket() {
  if (!mediaRecorder2 || mediaRecorder2.state === 'inactive') return;

  // 1. Listen for the 'stop' event to know when the final blob is ready
  mediaRecorder2.onstop = async () => {
    // 2. Combine chunks into a single WebM Blob
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    console.log(`Recording finished. Size: ${audioBlob.size} bytes. Uploading...`);


    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('context', 'Wijk ann see in Netherland');


    // 3. Send to the new HTTP endpoint
    try {
      const response = await fetch('/upload-proxy', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      console.log('Server response:', result);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  // 4. Actually stop the recorder
  isRecording2 = false;
  mediaRecorder2.stop();

  noSockButton.textContent = 'Start no socket';
  noSockButton.classList.remove('recording');

}
