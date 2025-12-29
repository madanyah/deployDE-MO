import { ref } from "vue";

export function useEmotionDetect() {
  const loading = ref(false);
  const result = ref(null);
  const error = ref(null);

  // menerima data hasil prediksi dari backend ML
  async function detect(apiResponse) {
    result.value = apiResponse;  
  }

  return { loading, result, error, detect };
}
