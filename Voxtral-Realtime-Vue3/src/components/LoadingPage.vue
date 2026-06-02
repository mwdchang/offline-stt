<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useVoxtral } from '../composables/useVoxtral';
import { THEME } from '../constants';
import AppGridBackground from './AppGridBackground.vue';
import ErrorMessageBox from './ErrorMessageBox.vue';

const { loadModel, loadingProgress, loadingMessage, error } = useVoxtral();
const mounted = ref(false);

onMounted(async () => {
  await loadModel();
  mounted.value = true;
});

const progressClamped = computed(() => Math.min(100, Math.max(0, loadingProgress.value)));
const isError = computed(() => !!error.value);

const reloadApp = () => {
  window.location.reload();
};
</script>

<template>
  <AppGridBackground className="min-h-screen flex items-center justify-center p-8">
    <div
      class="max-w-md w-full backdrop-blur-sm rounded-sm border shadow-xl transition-all duration-700 transform"
      :class="mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
      :style="{
        backgroundColor: `${THEME.beigeLight}F2`,
        borderColor: THEME.beigeDark,
      }"
    >
      <div
        class="h-1 w-full transition-colors duration-300"
        :class="isError ? 'bg-[var(--mistral-red)]' : 'bg-[var(--mistral-orange)]'"
      />

      <div class="p-8 space-y-8">
        <div class="flex justify-center">
          <div v-if="isError"
            class="w-20 h-20 rounded-full flex items-center justify-center border"
            :style="{
              backgroundColor: `${THEME.errorRed}1A`,
              borderColor: `${THEME.errorRed}33`,
            }"
          >
            <svg
              class="w-10 h-10"
              :style="{ color: THEME.errorRed }"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
          </div>
          <div v-else class="relative">
            <div
              class="w-20 h-20 border-4 rounded-full animate-spin"
              :style="{
                borderColor: THEME.beigeDark,
                borderTopColor: THEME.mistralOrange,
              }"
            />
            <div class="absolute inset-0 flex items-center justify-center">
              <div
                class="w-2 h-2 rounded-full animate-pulse"
                :style="{ backgroundColor: THEME.mistralOrange }"
              />
            </div>
          </div>
        </div>

        <div class="text-center space-y-2">
          <h2
            class="text-2xl font-bold tracking-tight"
            :style="{ color: THEME.textBlack }"
          >
            {{ isError ? "Initialization Failed" : "Loading Model" }}
          </h2>
          <p class="text-sm text-gray-500 font-mono uppercase tracking-widest">
            {{ isError ? "Voxtral-Mini-4B-Realtime" : loadingMessage }}
          </p>
        </div>

        <div v-if="!isError" class="space-y-4">
          <div class="flex justify-between text-xs font-mono font-bold text-gray-500">
            <span>PROGRESS</span>
            <span>{{ Math.round(progressClamped) }}%</span>
          </div>

          <div
            class="w-full rounded-full h-4 overflow-hidden border"
            :style="{
              backgroundColor: `${THEME.beigeDark}80`,
              borderColor: THEME.beigeDark,
            }"
          >
            <div
              class="h-full progress-stripe transition-all duration-500 ease-out"
              :style="{
                width: `${progressClamped}%`,
                backgroundColor: THEME.mistralOrange,
              }"
            />
          </div>

          <div
            class="bg-white border p-3 rounded-sm"
            :style="{ borderColor: THEME.beigeDark }"
          >
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p class="font-mono text-xs text-gray-600 truncate">
                {{ `> ${loadingMessage}` }}
              </p>
            </div>
          </div>
        </div>

        <div v-if="isError" class="space-y-4">
          <ErrorMessageBox
            className="border p-4 rounded text-left"
            :message="error!"
          />
          <button
            @click="reloadApp"
            class="w-full py-3 text-white font-bold transition-colors shadow-lg hover:bg-black cursor-pointer"
            :style="{ backgroundColor: THEME.textBlack }"
          >
            RELOAD APPLICATION
          </button>
        </div>
      </div>
    </div>
  </AppGridBackground>
</template>
