<template>
  <section
    class="relative isolate w-full min-h-screen flex items-center justify-center
           px-6 lg:px-8 bg-pink-200">

    <div
      class="relative w-full max-w-4xl mx-auto text-center
             bg-white/10 border border-white/10 rounded-3xl
             p-16 lg:p-20
             backdrop-blur-xl shadow-[0_0_60px_rgba(255,255,255,0.25)]">

      <!-- USER INFO & LOGOUT -->
      <div class="absolute top-6 right-6 flex items-center gap-4">
        <div class="text-right text-black">
          <div class="text-sm font-semibold">{{ userInfo.username }}</div>
          <div class="text-xs text-black/70">{{ userInfo.email }}</div>
        </div>
        <button
          @click="logout"
          class="px-3 py-2 rounded-lg text-white bg-[#ff2d95]/40 hover:bg-[#ff2d95]/60 transition text-sm">
          Logout
        </button>
      </div>

      <h2 class="text-5xl sm:text-6xl font-extrabold text-black mb-6">
        Voice Emotion Detector
      </h2>

      <p class="text-black/70 text-base sm:text-lg mb-14">
        Rekam suara kamu dan sistem akan mendeteksi emosi kamu.
      </p>

      <div class="flex justify-center scale-[1.15] sm:scale-[1.25]">
        <VoiceRecorder @detect="handleDetect" :id_user="userInfo.id_user" />
      </div>

      <!-- HASIL -->
      <div v-if="emotion.result" class="mt-16 flex justify-center">
        <div
          :class="[
            'inline-block rounded-2xl p-8 shadow-2xl border',
            resultBg
          ]"
          style="min-width:420px;"
        >
          <!-- IMAGE -->
          <div v-if="emotionImage" class="flex justify-center mb-6">
            <img
              :src="emotionImage"
              :alt="displayEmotion"
              class="w-36 h-36 object-contain drop-shadow-xl"
            />
          </div>

          <div class="flex items-center gap-6 justify-center">
            <div class="text-6xl">{{ emotionEmoji }}</div>

            <div class="text-left">
              <div class="text-black text-2xl font-bold">
                {{ displayEmotion }}
              </div>
              <div class="text-black/70 text-base mt-1">
                Confidence: {{ formattedConfidence }}
              </div>
            </div>
          </div>

          <!-- BAR -->
          <div class="mt-6">
            <div class="h-3 bg-black/10 rounded overflow-hidden">
              <div
                class="h-3 transition-all duration-700"
                :style="{
                  width: Math.round(emotion.result.confidence * 100) + '%',
                  background: resultColor
                }"
              ></div>
            </div>
          </div>

        </div>
      </div>

    </div>
  </section>
</template>

<script setup>
import { reactive, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import VoiceRecorder from "../components/VoiceRecorder.vue";

import angerPng from "@/assets/angerPng.png";
import joyPNG from "@/assets/joyPNG.png";
import sadPNG from "@/assets/sadPNG.png";
import rileyPNG from "@/assets/rileyPNG.png";

const router = useRouter();

const emotion = reactive({
  result: null,
});

const userInfo = reactive({
  id_user: null,
  username: "",
  email: ""
});

// CHECK IF USER LOGGED IN
onMounted(() => {
  const storedId = localStorage.getItem('id_user');
  const storedUsername = localStorage.getItem('username');
  const storedEmail = localStorage.getItem('email');

  if (!storedId) {
    router.push('/');
    return;
  }

  userInfo.id_user = parseInt(storedId);
  userInfo.username = storedUsername;
  userInfo.email = storedEmail;
});

/* BACKEND → HUMAN */
const emotionMap = {
  neu: "neutral",
  hap: "happy",
  sad: "sad",
  ang: "angry",
};

const normalizeEmotion = (emotion) => {
  const map = {
    happy: "hap",
    sad: "sad",
    neutral: "neu",
    angry: "ang"
  };
  return map[emotion] || emotion;
};


/* HANDLE API */
const handleDetect = async (apiData) => {
  console.log("📥 handleDetect received from VoiceRecorder:", apiData);
  
  // Normalize emotion - ensure it's in correct format (neu, hap, sad, ang)
  const rawEmotion = String(apiData.emotion || "").toLowerCase().trim();
  const emotionLabel = normalizeEmotion(rawEmotion);
  const confidenceScore = Number(apiData.confidence) || 0;
  
  console.log("🔍 Parsed emotion:", emotionLabel);
  console.log("🔍 Parsed confidence:", confidenceScore);
  
  // Validate emotion is one of the expected values
  if (!["neu", "hap", "sad", "ang"].includes(emotionLabel)) {
    console.warn("⚠️ Unexpected emotion format:", emotionLabel);
  }
  
  // Update reactive state - this will trigger v-if and computed properties
  emotion.result = {
    emotion: emotionLabel,
    confidence: confidenceScore,
  };
  
  console.log("✅ emotion.result set to:", emotion.result);
  console.log("✅ Display should now show emotion card with:", {
    displayText: emotionMap[emotionLabel] || "Unknown",
    emoji: {neu: "😐", hap: "😄", sad: "😢", ang: "😠"}[emotionLabel] || "🫡"
  });
};

/* DISPLAY TEXT */
const displayEmotion = computed(() => {
  return emotionMap[emotion.result?.emotion] || "Unknown";
});

/* EMOJI */
const emotionEmoji = computed(() => {
  const map = {
    neu: "😐",
    hap: "😄",
    sad: "😢",
    ang: "😠",
  };
  return map[emotion.result?.emotion] || "🫡";
});

/* IMAGE */
const emotionImage = computed(() => {
  switch (emotion.result?.emotion) {
    case "hap": return joyPNG;
    case "sad": return sadPNG;
    case "ang": return angerPng;
    case "neu": return rileyPNG;
    default: return null;
  }
});

/* BAR COLOR */
const resultColor = computed(() => {
  switch (emotion.result?.emotion) {
    case "hap": return "linear-gradient(90deg,#ffde59,#ff9abb)";
    case "sad": return "linear-gradient(90deg,#6b8cff,#5ad0ff)";
    case "ang": return "linear-gradient(90deg,#ff6b6b,#ff2d95)";
    default: return "linear-gradient(90deg,#9b9b9b,#6d6875)";
  }
});

/* CARD BG */
const resultBg = computed(() => {
  switch (emotion.result?.emotion) {
    case "hap": return "bg-[#fff6e6] border-[#ffd59e]";
    case "sad": return "bg-[#eef6ff] border-[#9ec7ff]";
    case "ang": return "bg-[#ffe6f0] border-[#ff9ac1]";
    default: return "bg-white border-black/10";
  }
});

/* CONFIDENCE */
const formattedConfidence = computed(() => {
  const c = emotion.result?.confidence;
  return isNaN(c) ? "—" : Math.round(c * 100) + "%";
});

const logout = () => {
  localStorage.removeItem('id_user');
  localStorage.removeItem('username');
  localStorage.removeItem('email');
  router.push('/');
};
</script>

