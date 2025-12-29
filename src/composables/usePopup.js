import { ref } from "vue";

export function usePopup() {
  const isOpen = ref(false);

  const open = () => {
    console.log("[usePopup] open()");
    isOpen.value = true;
  };

  const close = () => {
    console.log("[usePopup] close()");
    isOpen.value = false;
  };

  return { isOpen, open, close };
}
