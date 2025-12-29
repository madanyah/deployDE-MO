<template>
  <section
  class="relative isolate w-full min-h-screen flex items-center justify-center
         px-6 lg:px-8 bg-pink-200">

    <div class="relative w-full max-w-md mx-auto text-center
                bg-gray/10 border border-black/10 rounded-2xl p-10
                backdrop-blur-xl shadow-[0_0_35px_rgba(255,255,255,0.2)]">

      <h1 class="text-3xl sm:text-4xl font-bold text-black mb-2">
        Welcome to <span class="text-[#ff2d95]">DE-MO</span>
      </h1>
      <p class="text-black-300 mb-10 text-sm">
        where ur emotion can be known by ur voice
      </p>

      <!-- ERROR MESSAGE -->
      <div v-if="error" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
        {{ error }}
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">

        <div class="text-left">
          <label class="text-black-300 text-sm">Username</label>
          <input
            v-model="username"
            type="text"
            class="w-full mt-2 px-4 py-3 rounded-lg bg-white/10 text-black
                   border border-white/20 focus:outline-none focus:ring-2
                   focus:ring-[#ff2d95] focus:border-transparent
                   placeholder-gray-400"
            placeholder="Enter your username"
          />
        </div>

        <div class="text-left">
          <label class="text-black-300 text-sm">Email</label>
          <input
            v-model="email"
            type="email"
            class="w-full mt-2 px-4 py-3 rounded-lg bg-white/10 text-black
                   border border-white/20 focus:outline-none focus:ring-2
                   focus:ring-[#ff2d95] focus:border-transparent
                   placeholder-gray-400"
            placeholder="Enter your email"
          />
        </div>
        
        <div class="text-left">
          <label class="text-black-300 text-sm">Password</label>
          <input
            v-model="password"
            type="password"
            class="w-full mt-2 px-4 py-3 rounded-lg bg-white/10 text-black
                   border border-white/20 focus:outline-none focus:ring-2
                   focus:ring-[#ff2d95] focus:border-transparent
                   placeholder-gray-400"
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-md px-6 py-3 text-sm font-bold
                 text-white bg-[#ff2d95]/40 hover:bg-[#ff2d95]/60
                 shadow-[0_0_20px_rgba(255,45,149,0.4)]
                 backdrop-blur-md transition disabled:opacity-50">
          {{ loading ? 'Loading...' : 'Login' }}
        </button>

      </form>

    </div>

  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const username = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  // VALIDASI INPUT
  if (!username.value || !email.value || !password.value) {
    error.value = "Semua field wajib diisi!"
    return
  }

  loading.value = true
  error.value = ''

  try {
    // KIRIM KE BACKEND
    const res = await fetch("http://localhost:3000/api/user/enter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama: username.value,
        email: email.value,
        password: password.value
      })
    })

    const data = await res.json()

    if (!res.ok) {
      error.value = data.message || "Login gagal"
      return
    }

    // SIMPAN ID USER KE LOCALSTORAGE
    localStorage.setItem('id_user', data.id_user)
    localStorage.setItem('username', username.value)
    localStorage.setItem('email', email.value)

    // REDIRECT KE EMOTION PAGE
    router.push('/Emotion')

  } catch (err) {
    console.error("LOGIN ERROR:", err)
    error.value = "Gagal terhubung ke server"
  } finally {
    loading.value = false
  }
}

const goToRegister = () => {
  router.push('/')
}
</script>
