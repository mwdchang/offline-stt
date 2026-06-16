<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useVoxtral } from './useVoxtral';
// import { MicVAD } from "@ricky0123/vad-web"


const { 
  loadModel,
  loadingProgress,
  status,
  transcript,
  startRecording,
  stopRecording,
  // resetSession,
  error,
} = useVoxtral();

const transcriptions = ref<string[]>([]);


const isRecording = ref(false);
const toggle = async () => {
  isRecording.value = !isRecording.value;
  if (isRecording.value === true) {
    await startRecording()
  } else {
    stopRecording()
  }
};



onMounted(async () => {
  await loadModel();
 
  /*
  const myvad = await MicVAD.new({
    model: 'v5',
    positiveSpeechThreshold: 0.8,
    negativeSpeechThreshold: 0.3,
    onSpeechStart: () => {
      console.log('speech started');
    },
    onSpeechEnd: () => {
      console.log('speech ended');
      transcriptions.value.push(transcript.value);
      resetSession();
    },
    onnxWASMBasePath: "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/",
    baseAssetPath: "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.29/dist/",
  });
  myvad.start();
  */
});


</script>

<template>
  <div v-if="error" style="color: red"> {{ error }} </div>
  <h2> 
    Status: {{ status }} <span v-if="status === 'loading'">{{ loadingProgress.toFixed(2) }}%</span>
  </h2>
  <button v-if="status === 'ready'" @click="toggle"> 
    {{ isRecording === false ? 'Start recording' : 'Stop recording' }}
  </button>

  <p v-for="t of transcriptions"> {{ t }} </p>
  <hr/>
  <p v-if="transcript"> {{ transcript }} </p>
</template>

<style scoped>
</style>
