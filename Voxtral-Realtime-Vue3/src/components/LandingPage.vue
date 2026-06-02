<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useVoxtral } from '../composables/useVoxtral';
import { THEME } from '../constants';
import AppGridBackground from './AppGridBackground.vue';
import MicrophoneIcon from './MicrophoneIcon.vue';

const { loadModel } = useVoxtral();
const mounted = ref(false);

onMounted(() => {
  mounted.value = true;
});

const FEATURES = [
  {
    step: "1",
    title: "Load Model",
    description:
      "This demo downloads and caches Voxtral-Mini-4B, a realtime transcription model optimized for in-browser inference (~2.8 GB).",
  },
  {
    step: "2",
    title: "Private & Local",
    description:
      "Your audio is processed locally and never sent to a server. All inference runs on-device with Transformers.js and WebGPU.",
  },
  {
    step: "3",
    title: "Real-time Streaming",
    description:
      "The model is capable of sub-500ms latency with support for 13 languages and a native streaming architecture.",
  },
] as const;
</script>

<template>
  <AppGridBackground
    className="min-h-screen flex items-center justify-center p-6 overflow-y-auto"
    :style="{ color: THEME.textBlack }"
  >
    <div
      class="relative max-w-4xl w-full backdrop-blur-sm p-10 md:p-12 rounded-sm border shadow-2xl transition-all duration-700"
      :class="mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
      :style="{
        backgroundColor: `${THEME.beigeLight}F2`,
        borderColor: THEME.beigeDark,
      }"
    >
      <div class="absolute top-6 right-6 group cursor-help z-10">
        <span class="absolute right-full mr-4 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs font-mono uppercase tracking-widest text-gray-500 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 pointer-events-none">
          System Ready
        </span>
        <div class="relative flex h-3 w-3">
          <span
            class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            :style="{ backgroundColor: THEME.mistralOrange }"
          />
          <span
            class="relative inline-flex rounded-sm h-3 w-3"
            :style="{ backgroundColor: THEME.mistralOrange }"
          />
        </div>
      </div>

      <div class="space-y-12">
        <div class="text-center space-y-4 animate-enter">
          <div class="flex flex-col items-center justify-center space-y-5">
            <div
              class="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
              :style="{ backgroundColor: `${THEME.mistralOrange}1A` }"
            >
              <MicrophoneIcon
                class="w-10 h-10"
                :stroke-width="1.5"
                :style="{ color: THEME.mistralOrange }"
              />
            </div>

            <h1
              class="text-6xl md:text-7xl font-semibold tracking-tighter"
              :style="{ color: THEME.textBlack }"
            >
              Voxtral Realtime
            </h1>
          </div>

          <p class="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
            Real-time speech transcription, entirely in your browser.
            <br />
            Powered by
            <a
              href="https://huggingface.co/onnx-community/Voxtral-Mini-4B-Realtime-2602-ONNX"
              class="font-medium underline decoration-2 underline-offset-4 transition-all hover:decoration-[3px]"
              :style="{
                color: THEME.mistralOrange,
                textDecorationColor: THEME.mistralOrange,
              }"
              target="_blank"
              rel="noopener noreferrer"
            >
              Voxtral-Mini-4B
            </a>
          </p>
        </div>

        <div
          class="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-b py-10 animate-enter delay-100"
          :style="{ borderColor: THEME.beigeDark }"
        >
          <div v-for="feature in FEATURES" :key="feature.step" class="space-y-3 group">
            <div
              class="w-10 h-10 flex items-center justify-center text-white font-bold text-lg shadow-sm transition-transform duration-300 group-hover:-translate-y-1"
              :style="{ backgroundColor: THEME.mistralOrange }"
            >
              {{ feature.step }}
            </div>
            <h4
              class="font-semibold text-xl"
              :style="{ color: THEME.textBlack }"
            >
              {{ feature.title }}
            </h4>
            <p class="text-gray-600 leading-relaxed">
              {{ feature.description }}
            </p>
          </div>
        </div>

        <div class="flex flex-col items-center animate-enter delay-200">
          <button
            @click="loadModel"
            class="group relative px-8 py-5 text-white overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-0.5 rounded-xl border-none cursor-pointer outline-none"
            :style="{ backgroundColor: THEME.mistralOrange }"
          >
            <div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <span class="relative font-bold text-xl tracking-wide flex items-center gap-3">
              START TRANSCRIPTION
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2.5"
                stroke="currentColor"
                class="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                />
              </svg>
            </span>
          </button>

          <p class="text-xs text-gray-400 mt-4">
            Requires a browser that supports WebGPU (w/ shader-f16)
          </p>
        </div>
      </div>
    </div>
  </AppGridBackground>
</template>
