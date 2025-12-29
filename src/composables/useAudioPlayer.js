import { ref, watch } from "vue";

export function useAudioPlayer(audioBlob) {
  const audioUrl = ref(null);

  watch(audioBlob, (blob) => {
    if (blob) {
      audioUrl.value = URL.createObjectURL(blob);
    }
  });

  return { audioUrl };
}
