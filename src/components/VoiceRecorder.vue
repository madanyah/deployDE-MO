<template>
  <div class="bg-white/60 border border-black/50 shadow-lg rounded-2xl p-6">
    <div class="flex flex-col items-center gap-4">

      <!-- ERROR MESSAGE -->
      <div v-if="error" class="w-full p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
        {{ error }}
      </div>

      <div class="flex items-center gap-4 w-full">
        <div class="flex-1">
          <div class="flex items-center gap-3">
            <button
              v-if="!recording"
              @click="handleStartRecording"
              class="px-4 py-2 rounded-lg text-white bg-[#6b2c5a] hover:bg-[#4b274a] transition">
              🎙 Start
            </button>

            <button
              v-else
              @click="handleStop"
              class="px-4 py-2 rounded-lg text-white bg-[#ff2d95] hover:bg-[#e0237f] transition">
              ⏹ Stop
            </button>

            <button
              v-if="audioBlob"
              @click="handleClearRecording"
              class="px-3 py-1 rounded-lg bg-black/10 text-black border ml-2">
              ✖ Reset
            </button>

            <div class="ml-auto text-sm">{{ formattedElapsed }}</div>
          </div>

          <div class="mt-3">
            <div class="h-2 bg-white/10 rounded overflow-hidden">
              <div class="h-2 bg-[#ff2d95]" :style="{ width: Math.round(level*100) + '%' }"></div>
            </div>
          </div>
        </div>

        <div class="w-36 text-right">
          <button
            :disabled="!audioBlob || recording || loading"
            @click="sendToAPI"
            class="px-3 py-2 rounded-lg text-white bg-[#6d6875] disabled:opacity-50">
            {{ loading ? '⏳ Detecting...' : '🔍 Detect' }}
          </button>
        </div>
      </div>

      <canvas ref="wave" class="w-full h-24 rounded-lg bg-black/10"></canvas>

      <audio v-if="audioUrl" :src="audioUrl" controls class="mt-2 w-full"></audio>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRecorder } from "../composables/useRecorder";
import { useAudioPlayer } from "../composables/useAudioPlayer";

/* =========================
   STATE
========================= */
const props = defineProps({ id_user: Number });
const emit = defineEmits(["detect"]);

const { recording, audioBlob, elapsed, level } = useRecorder();
const { audioUrl } = useAudioPlayer(audioBlob);

const loading = ref(false);
const error = ref("");
const wave = ref(null);
let raf;

/* =========================
   AUDIO ENGINE
========================= */
let audioContext;
let mediaStream;
let processor;
let pcmChunks = [];

/* =========================
   COMPUTED
========================= */
const formattedElapsed = computed(() => {
  const s = Math.floor(elapsed.value);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
});

/* =========================
   RECORD START (WAV)
========================= */
async function handleStartRecording() {
  error.value = "";
  loading.value = false;

  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  audioContext = new AudioContext({ sampleRate: 16000 });

  const source = audioContext.createMediaStreamSource(mediaStream);
  processor = audioContext.createScriptProcessor(4096, 1, 1);
  pcmChunks = [];

  processor.onaudioprocess = e => {
    pcmChunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
  };

  source.connect(processor);
  processor.connect(audioContext.destination);

  recording.value = true;
}

/* =========================
   RECORD STOP
========================= */
async function handleStop() {
  recording.value = false;

  processor.disconnect();
  mediaStream.getTracks().forEach(t => t.stop());

  const pcm = flattenPCM(pcmChunks);
  audioBlob.value = encodeWAV(pcm, 16000);
}

/* =========================
   RESET
========================= */
function handleClearRecording() {
  audioBlob.value = null;
  error.value = "";
  loading.value = false;
}

/* =========================
   WAV ENCODER
========================= */
function flattenPCM(chunks) {
  const len = chunks.reduce((a, b) => a + b.length, 0);
  const result = new Float32Array(len);
  let offset = 0;
  chunks.forEach(c => { result.set(c, offset); offset += c.length; });
  return result;
}

function encodeWAV(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const write = (o, s) => [...s].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)));

  write(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  write(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let o = 44;
  samples.forEach(s => {
    view.setInt16(o, Math.max(-1, Math.min(1, s)) * 0x7fff, true);
    o += 2;
  });

  return new Blob([buffer], { type: "audio/wav" });
}

/* =========================
   SEND TO API
========================= */
async function sendToAPI() {
  if (!audioBlob.value) return;

  loading.value = true;
  error.value = "";

  try {
    const base64 = await blobToBase64(audioBlob.value);
    const API = import.meta.env.VITE_API_BASE_URL;

    const res = await fetch(`${API}/api/predict/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_user: props.id_user, audio_base64: base64 })
    });

    if (!res.ok) throw new Error("Prediction failed");

    const data = await res.json();
    emit("detect", data);

  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

function blobToBase64(blob) {
  return new Promise(res => {
    const r = new FileReader();
    r.onloadend = () => res(r.result.split(",")[1]);
    r.readAsDataURL(blob);
  });
}

/* =========================
   WAVEFORM
========================= */
function draw() {
  const c = wave.value;
  if (!c) return;

  const ctx = c.getContext("2d");
  c.width = c.clientWidth;
  c.height = c.clientHeight;
  ctx.clearRect(0, 0, c.width, c.height);

  const amp = Math.max(0.05, level.value) * c.height * 0.4;
  const t = performance.now() / 300;

  ctx.beginPath();
  ctx.strokeStyle = "#ff2d95";
  ctx.lineWidth = 2;

  for (let x = 0; x < c.width; x += 5) {
    const y = c.height / 2 + Math.sin(x * 0.02 + t) * amp;
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();

  raf = requestAnimationFrame(draw);
}

onMounted(() => raf = requestAnimationFrame(draw));
onBeforeUnmount(() => cancelAnimationFrame(raf));
</script>