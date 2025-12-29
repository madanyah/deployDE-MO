<template>
  <section
    class="relative isolate w-full h-screen flex items-center justify-center
           px-6 lg:px-8 bg-[#0c0120]">

    <!-- Background -->
    <div aria-hidden="true" class="absolute inset-0 -z-10">
      <div class="absolute inset-0 bg-gradient-to-br
                   from-[#18022e] via-[#230544] to-[#0d0220] opacity-90"></div>

      <div class="absolute top-0 left-[-10%] w-[60%] h-[60%]
                  bg-[#ff2d95]/40 blur-[120px] rotate-12"></div>

      <div class="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%]
                  bg-[#2dd4ff]/40 blur-[150px] -rotate-12"></div>

      <div class="absolute inset-0 opacity-[0.07] mix-blend-overlay"
        style="background-image: url('https://upload.wikimedia.org/wikipedia/commons/5/5f/White_noise_example.png');">
      </div>
    </div>

    <!-- FORM -->
    <div class="relative w-full max-w-md mx-auto text-center
                bg-white/10 border border-white/10 rounded-2xl p-10
                backdrop-blur-xl shadow-[0_0_35px_rgba(255,255,255,0.2)]">

      <h1 class="text-3xl sm:text-4xl font-bold text-white mb-2">
        Register <span class="text-[#ff2d95]">DE-MO</span>
      </h1>

      <p class="text-gray-300 mb-10 text-sm">
        Create your account to continue
      </p>

      <!-- ERROR MESSAGE -->
      <div v-if="error" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
        {{ error }}
      </div>

      <form @submit.prevent="handleRegister" class="space-y-6">

        <!-- USERNAME -->
        <div class="text-left">
          <label class="text-gray-300 text-sm">Username</label>
          <input
            v-model="username"
            type="text"
            class="w-full mt-2 px-4 py-3 rounded-lg bg-white/10 text-white
                   border border-white/20 focus:outline-none focus:ring-2
                   focus:ring-[#ff2d95] placeholder-gray-400"
            placeholder="Enter your username"
          />
        </div>

        <!-- EMAIL -->
        <div class="text-left">
          <label class="text-gray-300 text-sm">Email</label>
          <input
            v-model="email"
            type="email"
            class="w-full mt-2 px-4 py-3 rounded-lg bg-white/10 text-white
                   border border-white/20 focus:outline-none focus:ring-2
                   focus:ring-[#ff2d95] placeholder-gray-400"
            placeholder="Enter your email"
          />
        </div>
        
        <!-- PASSWORD -->
        <div class="text-left">
          <label class="text-gray-300 text-sm">Password</label>
          <input
            v-model="password"
            type="password"
            class="w-full mt-2 px-4 py-3 rounded-lg bg-white/10 text-white
                   border border-white/20 focus:outline-none focus:ring-2
                   focus:ring-[#ff2d95] placeholder-gray-400"
            placeholder="Enter your password"
          />
        </div>

        <!-- BUTTON REGISTER -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-md px-6 py-3 text-sm font-bold
                 text-white bg-[#ff2d95]/40 hover:bg-[#ff2d95]/60
                 shadow-[0_0_20px_rgba(255,45,149,0.4)]
                 backdrop-blur-md transition disabled:opacity-50">
          {{ loading ? 'Loading...' : 'Register' }}
        </button>

      </form>

      <p class="mt-6 text-white text-sm">
        Already have an account? 
        <router-link to="/" class="text-[#ff2d95] font-bold hover:underline">
          Login here
        </router-link>
      </p>

    </div>

  </section>
</template>


<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const username = ref("");
const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

const handleRegister = async () => {
  // VALIDASI INPUT
  if (!username.value || !email.value || !password.value) {
    error.value = "Semua field wajib diisi!";
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    // KIRIM KE BACKEND
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${API_BASE_URL}/api/user/enter`, {
    // const res = await fetch("http://localhost:3000/api/user/enter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama: username.value,
        email: email.value,
        password: password.value
      })
    });

    const data = await res.json();

    if (!res.ok) {
      error.value = data.message || "Registrasi gagal";
      return;
    }

    // SIMPAN ID USER KE LOCALSTORAGE & REDIRECT KE EMOTION
    localStorage.setItem('id_user', data.id_user);
    localStorage.setItem('username', username.value);
    localStorage.setItem('email', email.value);

    router.push("/Emotion");

  } catch (error) {
    console.error("REGISTER ERROR:", error);
    error.value = "Gagal terhubung ke server";
  } finally {
    loading.value = false;
  }
};
</script>
