<script setup lang="ts">
import { computed } from 'vue';
import { useVoxtral } from '../composables/useVoxtral';
import { THEME } from '../constants';
import AppGridBackground from './AppGridBackground.vue';
import ErrorMessageBox from './ErrorMessageBox.vue';
import MicrophoneIcon from './MicrophoneIcon.vue';
import VoiceMeter from './VoiceMeter.vue';

const {
  status,
  transcript,
  startRecording,
  stopRecording,
  resetSession,
  error,
} = useVoxtral();

const isRecording = computed(() => status.value === 'recording');
const transcriptText = computed(() => transcript.value.trimStart());
const hasTranscript = computed(() => transcriptText.value.length > 0);

const statusConfig = computed(() => {
  if (error.value) {
    return {
      bg: `${THEME.errorRed}0D`,
      border: THEME.errorRed,
      dot: THEME.errorRed,
      label: "SYSTEM ERROR",
    };
  }
  if (isRecording.value) {
    return {
      bg: `${THEME.mistralOrange}0D`,
      border: THEME.mistralOrange,
      dot: THEME.mistralOrange,
      label: "LIVE TRANSCRIPTION",
    };
  }
  return {
    bg: "transparent",
    border: THEME.beigeDark,
    dot: "#9CA3AF",
    label: "STANDBY",
  };
});

const controlLabel = computed(() => isRecording.value ? "Stop" : "Start");
const helperText = computed(() => {
  if (error.value) return "Resolve the error and start again.";
  if (isRecording.value) return "Listening live. Tap stop when you're done.";
  return "Tap the microphone to begin.";
});
</script>

<template>
  <AppGridBackground
    className="min-h-screen flex items-center justify-center px-4 py-4 md:px-6 md:py-6"
    :style="{ color: THEME.textBlack }"
  >
    <div
      class="w-full max-w-4xl rounded-[2rem] border bg-white/84 p-4 shadow-2xl backdrop-blur-sm md:p-5"
      :style="{ borderColor: error ? `${THEME.errorRed}55` : THEME.beigeDark }"
    >
      <section
        class="flex min-h-[min(78vh,720px)] flex-col overflow-hidden rounded-[1.6rem] border bg-white/90"
        :style="{
          borderColor: error ? `${THEME.errorRed}55` : THEME.beigeDark,
        }"
      >
        <div
          class="flex min-h-[76px] items-center justify-between border-b px-5 py-4"
          :style="{ borderColor: THEME.beigeDark }"
        >
          <div class="flex min-h-[40px] flex-col justify-center">
            <p class="text-xs font-mono uppercase tracking-[0.3em] text-gray-500">
              Voxtral Realtime
            </p>
            <h1 class="mt-1 text-xl font-semibold leading-none tracking-tight md:text-2xl">
              Real-time transcription
            </h1>
          </div>

          <div
            class="flex h-8 items-center gap-2 rounded-full border px-3 py-1.5"
            :style="{
              backgroundColor: statusConfig.bg,
              borderColor: `${statusConfig.border}4D`,
            }"
          >
            <span class="relative flex h-2.5 w-2.5">
              <span v-if="isRecording"
                class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                :style="{ backgroundColor: statusConfig.dot }"
              />
              <span
                class="relative inline-flex h-2.5 w-2.5 rounded-full"
                :style="{ backgroundColor: statusConfig.dot }"
              />
            </span>
            <span
              class="text-[10px] font-bold tracking-[0.2em]"
              :style="{ color: statusConfig.dot }"
            >
              {{ statusConfig.label }}
            </span>
          </div>
        </div>

        <div class="flex flex-1 flex-col">
          <ErrorMessageBox v-if="error"
            className="mx-5 mt-5 rounded-2xl border px-4 py-3"
            :message="error"
          />

          <div class="relative flex-1 overflow-hidden">
            <div
              class="absolute inset-0 opacity-[0.03] pointer-events-none"
              :style="{
                backgroundImage: `linear-gradient(${THEME.black} 1px, transparent 1px), linear-gradient(90deg, ${THEME.black} 1px, transparent 1px)`,
                backgroundSize: '20px 20px',
              }"
            />

            <div
              class="relative z-10 flex h-full flex-col px-5 py-5 md:px-6 md:py-6"
              :class="isRecording ? 'justify-start' : 'justify-center'"
            >
              <div v-if="!isRecording && !transcriptText" class="mx-auto flex max-w-md flex-col items-center text-center">
                <div class="relative">
                  <button
                    @click="startRecording"
                    class="relative flex h-28 w-28 cursor-pointer items-center justify-center rounded-full border-none outline-none transition-all duration-300 hover:-translate-y-1 active:scale-95 md:h-32 md:w-32"
                    :style="{
                      background: `linear-gradient(135deg, ${THEME.mistralOrange}, ${THEME.mistralOrangeLight})`,
                      boxShadow: `0 22px 44px ${THEME.mistralOrange}30`,
                    }"
                    :aria-label="controlLabel"
                  >
                    <span
                      class="absolute inset-0 rounded-full opacity-25"
                      :style="{
                        boxShadow: `0 0 0 14px ${THEME.mistralOrange}20`,
                      }"
                    />
                    <MicrophoneIcon class="relative h-12 w-12 text-white" />
                  </button>
                </div>

                <div class="mt-8 space-y-3">
                  <p class="text-2xl font-semibold tracking-tight md:text-3xl">
                    Start transcription
                  </p>
                  <p class="text-sm text-gray-500 md:text-base">
                    {{ helperText }}
                  </p>
                </div>

                <div
                  class="mt-8 w-full rounded-2xl border px-4 py-4"
                  :style="{
                    backgroundColor: `${THEME.beigeLight}CC`,
                    borderColor: THEME.beigeDark,
                  }"
                >
                  <VoiceMeter :color="THEME.beigeDark" />
                  <p class="mt-3 text-xs font-mono uppercase tracking-[0.18em] text-gray-500">
                    Ready when you are
                  </p>
                </div>
              </div>
              <template v-else>
                <div class="flex items-center justify-between gap-3 pb-4">
                  <div class="flex items-center space-x-2">
                    <svg
                      class="w-4 h-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span class="text-xs font-bold text-gray-500 uppercase tracking-widest">
                      Transcript
                    </span>
                  </div>

                  <div
                    class="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]"
                    :style="{
                      backgroundColor: `${THEME.beigeLight}`,
                      color: THEME.textBlack,
                    }"
                  >
                    {{ transcriptText ? "Live output" : "Waiting for speech" }}
                  </div>
                </div>

                <div class="history-scroll flex-1 overflow-y-auto">
                  <p v-if="transcriptText"
                    class="max-w-none text-lg font-mono leading-relaxed break-words whitespace-pre-wrap md:text-[1.4rem]"
                    :style="{ color: THEME.textBlack }"
                  >
                    <span class="mr-1">{{ transcriptText }}</span>
                    <span v-if="isRecording"
                      class="inline-block w-2.5 h-5 align-middle cursor-blink ml-1"
                      :style="{ backgroundColor: THEME.mistralOrange }"
                    />
                  </p>
                  <div v-else class="flex h-full flex-col items-center justify-center space-y-4 py-12 text-center opacity-70">
                    <VoiceMeter :color="THEME.mistralOrange" active />
                    <div class="space-y-1">
                      <p class="text-sm font-mono italic text-gray-500">
                        Listening for speech...
                      </p>
                      <p class="text-xs font-mono uppercase tracking-[0.18em] text-gray-400">
                        Local processing · realtime stream
                      </p>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <div v-if="isRecording || hasTranscript" class="flex justify-center gap-3 px-5 pb-5 pt-2">
            <button v-if="!isRecording && hasTranscript"
              @click="resetSession"
              class="rounded-full border px-4 py-2 text-sm font-semibold text-gray-600 transition-all duration-300 hover:-translate-y-0.5 hover:text-black active:scale-95"
              :style="{
                borderColor: THEME.beigeDark,
                backgroundColor: `${THEME.beigeLight}`,
              }"
            >
              Reset
            </button>

            <button v-if="isRecording"
              @click="stopRecording"
              class="group inline-flex items-center gap-3 rounded-full px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
              :style="{
                background: `linear-gradient(135deg, ${THEME.mistralOrangeDark}, ${THEME.mistralOrange})`,
                boxShadow: `0 12px 28px ${THEME.mistralOrange}30`,
              }"
            >
              <span class="flex h-8 w-8 items-center justify-center rounded-full bg-white/18">
                <svg
                  class="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </span>
              Stop
            </button>
          </div>
        </div>

        <div
          class="flex items-center justify-between border-t bg-white/70 px-5 py-3 text-[10px] font-mono text-gray-400"
          :style="{ borderColor: THEME.beigeDark }"
        >
          <span>{{ isRecording ? "stream: live" : "stream: ready" }}</span>
          <span>{{ isRecording ? "mic: active" : "mic: idle" }}</span>
        </div>
      </section>
    </div>
  </AppGridBackground>
</template>
