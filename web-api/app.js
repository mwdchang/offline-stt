// Cross-browser support handle
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let startTime = null;


if (!SpeechRecognition) {
  alert("Target browser does not support the Web Speech API. Try Google Chrome or Safari.");
} else {
  // 1. Initialize the Recognition object
  const recognition = new SpeechRecognition();

  // Crucial settings for real-time dictation:
  recognition.continuous = true;     // Keep listening even if the user pauses
  recognition.interimResults = true; // Show results *while* speaking, not just at the end
  recognition.lang = 'en-US';        // Set language


  // Test boosting - not spported June 2026 :(
  // const phraseData = [
  //   { phrase: "wijk aan zee", boost: 5.0 },
  //   { phrase: "khaki", boost: 3.0 },
  //   { phrase: "tan", boost: 2.0 },
  // ];
  // const phraseObjects = phraseData.map(
  //   (p) => new SpeechRecognitionPhrase(p.phrase, p.boost),
  // );
  // recognition.phrases = phraseObjects;


  // Try to infer punctuations if the feature is available
  if ('unspokenPunctuation' in recognition) {
    recognition.unspokenPunctuation = true; 
  } else {
    console.warn('unspokenPunctuation not supported...');
  }
  console.log(recognition);
  recognition.unspokenPunctuation = true;

  // 2. DOM Elements
  const toggleBtn = document.getElementById('toggle-btn');
  const finalTextSpan = document.getElementById('final-text');
  const interimTextSpan = document.getElementById('interim-text');

  let isRecording = false;


  // 3. Handle the incoming audio stream data
  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    // Loop through all results returned by the engine
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    console.log('debug timestamp', (event.timeStamp - startTime));

    // Update the DOM
    if (finalTranscript) {
      finalTextSpan.innerHTML += finalTranscript + ' ';
    }
    interimTextSpan.innerHTML = interimTranscript;
  };

  // 4. Lifecycle Event Listeners
  recognition.onstart = () => {
    isRecording = true;
    toggleBtn.textContent = 'Stop Dictation';
    toggleBtn.classList.add('recording');

    // Hacky timestamp
    startTime = performance.now();
    console.log('start', startTime);
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error caught: ', event.error);
    if (event.error === 'not-allowed') {
      alert('Permission to use microphone was denied.');
      stopRecognition();
    }
  };

  recognition.onend = () => {
    // The API automatically shuts off sometimes on long silences. 
    // If we intended to keep recording, restart it.
    if (isRecording) {
      recognition.start();
    } else {
      stopRecognition();
    }
  };

  // 5. Helper Functions to trigger states
  function stopRecognition() {
    isRecording = false;
    recognition.stop();
    toggleBtn.textContent = 'Start Dictation';
    toggleBtn.classList.remove('recording');
    interimTextSpan.innerHTML = ''; // Clear trailing interim guesses
  }

  // 6. UI Toggle click handler
  toggleBtn.addEventListener('click', () => {
    if (!isRecording) {
      recognition.start();
    } else {
      stopRecognition();
    }
  });
}
