import { ref, shallowRef, computed } from "vue";
import {
  BaseStreamer,
  VoxtralRealtimeForConditionalGeneration,
  VoxtralRealtimeProcessor,
  type ProgressInfo,
} from "@huggingface/transformers";

export type AppStatus = "idle" | "loading" | "ready" | "recording" | "error";

const MODEL_ID = "onnx-community/Voxtral-Mini-4B-Realtime-2602-ONNX";
const SAMPLE_RATE = 16000;
const MODEL_FILE_COUNT = 3;
const CAPTURE_PROCESSOR_NAME = "capture-processor";
const CAPTURE_WORKLET_SOURCE = `
  class CaptureProcessor extends AudioWorkletProcessor {
    process(inputs) {
      const input = inputs[0];
      if (input.length > 0 && input[0].length > 0) {
        this.port.postMessage(input[0]);
      }
      return true;
    }
  }
  registerProcessor("capture-processor", CaptureProcessor);
`;

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function waitUntil(condition: () => boolean): Promise<void> {
  return new Promise((resolve) => {
    if (condition()) return resolve();
    const interval = setInterval(() => {
      if (condition()) {
        clearInterval(interval);
        resolve();
      }
    }, 50);
  });
}

// Global state
const status = ref<AppStatus>("idle");
const loadingProgress = ref(0);
const loadingMessage = ref("Ready to load model");
const transcript = ref("");
const error = ref<string | null>(null);

const modelRef = shallowRef<any>(null);
const processorRef = shallowRef<any>(null);
const audioContextRef = shallowRef<AudioContext | null>(null);
const mediaStreamRef = shallowRef<MediaStream | null>(null);
const workletNodeRef = shallowRef<AudioWorkletNode | null>(null);
const audioBuffer = shallowRef<Float32Array>(new Float32Array(0));
const isRecording = ref(false);
const stopRequested = ref(false);

const cleanupAudio = () => {
  isRecording.value = false;

  workletNodeRef.value?.disconnect();
  workletNodeRef.value = null;

  mediaStreamRef.value?.getTracks().forEach((track) => track.stop());
  mediaStreamRef.value = null;

  void audioContextRef.value?.close();
  audioContextRef.value = null;
};

const appendAudio = (newSamples: Float32Array) => {
  if (newSamples.length === 0) {
    return;
  }

  const previousSamples = audioBuffer.value;
  const mergedSamples = new Float32Array(
    previousSamples.length + newSamples.length,
  );
  mergedSamples.set(previousSamples);
  mergedSamples.set(newSamples, previousSamples.length);
  audioBuffer.value = mergedSamples;
};

const loadModel = async () => {
  if (status.value === "loading" || status.value === "ready") {
    return;
  }

  status.value = "loading";
  loadingProgress.value = 0;
  loadingMessage.value = "Preparing model download...";
  error.value = null;

  try {
    const progressMap = new Map<string, number>();
    const progressCallback = (info: ProgressInfo) => {
      if (
        info.status !== "progress" ||
        !info.file.endsWith(".onnx_data") ||
        info.total === 0
      ) {
        return;
      }

      progressMap.set(info.file, info.loaded / info.total);

      const totalProgress = Array.from(progressMap.values()).reduce(
        (sum, value) => sum + value,
        0,
      );

      loadingMessage.value = "Downloading model...";
      loadingProgress.value = Math.min(
        (totalProgress / MODEL_FILE_COUNT) * 100,
        100,
      );
    };

    const model = await VoxtralRealtimeForConditionalGeneration.from_pretrained(
      MODEL_ID,
      {
        dtype: {
          audio_encoder: "q4f16",
          embed_tokens: "q4f16",
          decoder_model_merged: "q4f16",
        },
        device: "webgpu",
        progress_callback: progressCallback,
      },
    );

    loadingMessage.value = "Loading processor...";
    const processor = await VoxtralRealtimeProcessor.from_pretrained(MODEL_ID);

    modelRef.value = model;
    processorRef.value = processor;
    loadingProgress.value = 100;
    loadingMessage.value = "Model ready";
    status.value = "ready";
  } catch (err) {
    console.error("Failed to load model:", err);
    error.value = getErrorMessage(err, "Failed to load model");
    loadingMessage.value = "Initialization failed";
    status.value = "error";
  }
};

const runTranscription = async (model: any, processor: any) => {
  const runtimeProcessor = processor as any;
  const audio = () => audioBuffer.value;
  const numSamplesFirst = runtimeProcessor.num_samples_first_audio_chunk;
  await waitUntil(
    () => audio().length >= numSamplesFirst || stopRequested.value,
  );

  if (stopRequested.value) {
    cleanupAudio();
    status.value = "ready";
    return;
  }

  const firstChunkInputs = await runtimeProcessor(
    audio().subarray(0, numSamplesFirst),
    { is_streaming: true, is_first_audio_chunk: true },
  );

  const featureExtractor = runtimeProcessor.feature_extractor;
  const { hop_length, n_fft } = featureExtractor.config;
  const winHalf = Math.floor(n_fft / 2);
  const samplesPerTok = runtimeProcessor.audio_length_per_tok * hop_length;

  async function* inputFeaturesGenerator() {
    yield firstChunkInputs.input_features;

    let melFrameIdx = runtimeProcessor.num_mel_frames_first_audio_chunk;
    let startIdx = melFrameIdx * hop_length - winHalf;

    while (!stopRequested.value) {
      const endNeeded = startIdx + runtimeProcessor.num_samples_per_audio_chunk;

      await waitUntil(
        () => audio().length >= endNeeded || stopRequested.value,
      );

      if (stopRequested.value) break;

      const availableSamples = audio().length;
      let batchEndSample = endNeeded;
      while (batchEndSample + samplesPerTok <= availableSamples) {
        batchEndSample += samplesPerTok;
      }

      const chunkInputs = await runtimeProcessor(
        audio().slice(startIdx, batchEndSample),
        { is_streaming: true, is_first_audio_chunk: false },
      );

      yield chunkInputs.input_features;

      melFrameIdx += chunkInputs.input_features.dims[2];
      startIdx = melFrameIdx * hop_length - winHalf;
    }
  }

  const tokenizer = runtimeProcessor.tokenizer;
  const specialIds = new Set(tokenizer.all_special_ids.map(BigInt));
  let tokenCache: bigint[] = [];
  let printLen = 0;
  let isPrompt = true;

  const flushDecodedText = () => {
    if (tokenCache.length === 0) {
      return;
    }

    const text = tokenizer.decode(tokenCache, {
      skip_special_tokens: true,
    });
    const printableText = text.slice(printLen);
    printLen = text.length;

    if (printableText.length > 0) {
      transcript.value += printableText;
    }

    console.log('debug', printableText);
  };

  const streamer = new (class extends BaseStreamer {
    put(value: bigint[][]) {
      if (stopRequested.value) {
        return;
      }

      if (isPrompt) {
        isPrompt = false;
        return;
      }

      const tokens = value[0];
      if (!tokens) return;

      if (tokens.length === 1 && specialIds.has(tokens[0])) {
        return;
      }

      tokenCache = tokenCache.concat(tokens);
      flushDecodedText();
    }

    end() {
      if (stopRequested.value) {
        tokenCache = [];
        printLen = 0;
        isPrompt = true;
        return;
      }

      flushDecodedText();
      tokenCache = [];
      printLen = 0;
      isPrompt = true;
    }
  })();

  try {
    await (model as any).generate({
      input_ids: firstChunkInputs.input_ids,
      input_features: inputFeaturesGenerator(),
      max_new_tokens: 4096,
      streamer: streamer as any,
    });
  } catch (err) {
    if (!stopRequested.value) {
      console.error("Transcription error:", err);
      error.value = getErrorMessage(err, "Transcription failed");
    }
  } finally {
    cleanupAudio();
    status.value = "ready";
  }
};

const startRecording = async () => {
  const model = modelRef.value;
  const processor = processorRef.value;

  if (!model || !processor || isRecording.value) {
    return;
  }

  transcript.value = "";
  error.value = null;
  audioBuffer.value = new Float32Array(0);
  isRecording.value = true;
  stopRequested.value = false;
  status.value = "recording";

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: SAMPLE_RATE,
      },
    });
    mediaStreamRef.value = stream;

    const audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
    audioContextRef.value = audioContext;
    await audioContext.resume();

    const sourceNode = audioContext.createMediaStreamSource(stream);
    const silentGainNode = audioContext.createGain();
    silentGainNode.gain.value = 0;

    const workletBlob = new Blob([CAPTURE_WORKLET_SOURCE], {
      type: "application/javascript",
    });
    const workletUrl = URL.createObjectURL(workletBlob);
    await audioContext.audioWorklet.addModule(workletUrl);
    URL.revokeObjectURL(workletUrl);

    const workletNode = new AudioWorkletNode(
      audioContext,
      CAPTURE_PROCESSOR_NAME,
    );
    workletNode.port.onmessage = (event: MessageEvent<Float32Array>) => {
      if (isRecording.value) {
        appendAudio(new Float32Array(event.data));
      }
    };

    sourceNode.connect(workletNode);
    workletNode.connect(silentGainNode);
    silentGainNode.connect(audioContext.destination);
    workletNodeRef.value = workletNode;

    await runTranscription(model, processor);
  } catch (err) {
    console.error("Recording error:", err);
    error.value = getErrorMessage(err, "Recording failed");
    cleanupAudio();
    status.value = "ready";
  }
};

const stopRecording = () => {
  stopRequested.value = true;
  isRecording.value = false;
  cleanupAudio();
};

const resetSession = () => {
  stopRequested.value = false;
  audioBuffer.value = new Float32Array(0);
  transcript.value = "";
  error.value = null;
  status.value = "ready";
};

export const useVoxtral = () => {
  return {
    status,
    loadingProgress,
    loadingMessage,
    transcript,
    error,
    loadModel,
    resetSession,
    startRecording,
    stopRecording,
  };
};
