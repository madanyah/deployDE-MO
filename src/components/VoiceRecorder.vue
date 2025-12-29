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

            <div class="ml-auto text-sm text-black-200">{{ formattedElapsed }}</div>
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
console.log("🔥🔥🔥 VOICE RECORDER FILE INI YANG KELOAD 🔥🔥🔥");
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRecorder } from "../composables/useRecorder";
import { useAudioPlayer } from "../composables/useAudioPlayer";

const props = defineProps({
  id_user: {
    type: Number,
    required: false,
    default: null
  }
});

const emit = defineEmits(["detect"]);
const { recording, audioBlob, startRecording, stopRecording, clearRecording, elapsed, level } = useRecorder();
const { audioUrl } = useAudioPlayer(audioBlob);

const wave = ref(null);
const loading = ref(false);
const error = ref("");
let raf = null;

const formattedElapsed = computed(() => {
  const s = Math.floor(elapsed.value);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
});

// START RECORDING + RESET LOADING STATE
async function handleStartRecording() {
  loading.value = false;   // 🔥 PENTING: Reset loading saat mulai rekam baru
  error.value = "";        // Clear error messages
  await startRecording();
}

// STOP + return blob
async function handleStop() {
  await stopRecording();
  error.value = ""; // Reset error saat berhenti recording
}

// RESET RECORDING + CLEAR LOADING STATE
function handleClearRecording() {
  clearRecording();
  loading.value = false;  // 🔥 PENTING: Reset loading state agar button berubah ke "🔍 Detect"
  error.value = "";        // Reset error message
}
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    if (!blob) {
      reject("Blob kosong");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      console.log("✅ Base64 generated");
      resolve(reader.result.split(",")[1]);
    };

    reader.onerror = (e) => {
      console.error("❌ FileReader error", e);
      reject(e);
    };

    reader.readAsDataURL(blob);
  });
}

// SEND TO EXPRESS BACKEND
async function sendToAPI() {
  console.log("🔥 sendToAPI CALLED");
  if (!audioBlob.value) return;

  loading.value = true;
  error.value = "";

  /* =========================
     🔒 VALIDASI DURASI MINIMAL
  ========================= */
  // // if (elapsed.value < 1.5) {
  // //   error.value = "Silakan bicara minimal 1.5 detik";
  // //   loading.value = false;
  // //   return;
  // // }

  // /* =========================
  //    🔊 VALIDASI VOLUME SUARA
  // ========================= */
  // if (level.value < 0.05) {
  //   error.value = "Speak louder, suaramu terlalu pelan";
  //   loading.value = false;
  //   return;
  // }

  try {
    // STEP 1: Convert audio blob to base64
    console.log("📤 Converting audio to base64...");
    const audioBase64 = await blobToBase64(audioBlob.value);
    
    // STEP 2: Send to Express backend
    console.log("📤 Sending audio to Express backend...");

  
    const res = await fetch("http://localhost:3000/api/predict/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id_user: props.id_user,
        audio_base64: audioBase64
      })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      error.value = errorData.error || "Gagal mendeteksi emosi";
      console.error("Prediction error:", errorData);
      return;
    }

    const data = await res.json();
    console.log("✅ Prediction received:", data);

    // Validate emotion data
    if (!data.emotion || data.confidence === undefined) {
      error.value = "Data prediksi tidak lengkap";
      return;
    }

    console.log("📤 Emitting to parent with:", {
      emotion: data.emotion,
      confidence: data.confidence,
      audio_base64_length: audioBase64.length
    });

    emit("detect", {
      emotion: data.emotion,
      confidence: data.confidence,
      audio_base64: audioBase64
    });

  } catch (err) {
    console.error("❌ API ERROR:", err);

    if (err.message === "Failed to fetch") {
      error.value = "❌ Tidak bisa terhubung ke server. Pastikan server berjalan di port 3000";
    } else {
      error.value = "Gagal terhubung ke server: " + err.message;
    }
  } finally {
    loading.value = false;
  }
}

// Draw waveform animation
function draw() {
  const c = wave.value;
  if (!c) return;

  const ctx = c.getContext("2d");
  const w = (c.width = c.clientWidth);
  const h = (c.height = c.clientHeight);

  ctx.clearRect(0, 0, w, h);

  const amp = Math.max(0.05, level.value) * h * 0.4;
  const now = performance.now() / 400;

  ctx.beginPath();
  ctx.strokeStyle = "#ff2d95";
  ctx.lineWidth = 2;

  for (let x = 0; x < w; x += 5) {
    const y = h / 2 + Math.sin(x * 0.02 + now) * amp;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.stroke();
  raf = requestAnimationFrame(draw);
}

onMounted(() => {
  raf = requestAnimationFrame(draw);
});
onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
});
</script>

