import { ref } from "vue";

export function useRecorder() {
  const recording = ref(false);
  const audioBlob = ref(null);
  const elapsed = ref(0);
  const level = ref(0);

  let mediaRecorder = null;
  let chunks = [];
  let intervalTimer = null;
  let audioContext = null;
  let analyser = null;
  let sourceNode = null;

  // START RECORDING
  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Setup waveform visualizer
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    sourceNode = audioContext.createMediaStreamSource(stream);
    sourceNode.connect(analyser);

    // 🔥 PENTING: Specify audio codec untuk WAV format
    // Coba gunakan audio/wav codec jika browser support, fallback ke default
    let mimeType = 'audio/wav';
    const supportedTypes = [
      'audio/wav',
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4'
    ];
    
    // Cari MIME type yang di-support browser
    for (const type of supportedTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        mimeType = type;
        console.log(`✅ Using audio codec: ${mimeType}`);
        break;
      }
    }
    
    mediaRecorder = new MediaRecorder(stream, { mimeType });
    chunks = [];
    elapsed.value = 0;
    audioBlob.value = null;  // 🔥 PENTING: Clear audio lama saat rekam baru dimulai

    recording.value = true;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      audioBlob.value = new Blob(chunks, { type: "audio/wav" });

      recording.value = false;  // 🔥 FIX PENTING
      clearInterval(intervalTimer);

      // cleanup
      try {
        sourceNode.disconnect();
        analyser.disconnect();
        audioContext.close();
      } catch (_) {}
    };

    mediaRecorder.start();

    // elapsed timer
    intervalTimer = setInterval(() => {
      elapsed.value += 1;
      updateLevel();
    }, 200);
  }

  // UPDATE LEVEL FOR WAVEFORM
  function updateLevel() {
    if (!analyser) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const val = (dataArray[i] - 128) / 128;
      sum += val * val;
    }
    const rms = Math.sqrt(sum / dataArray.length);

    level.value = rms; // 0–1 scale
  }

  // STOP RECORDING
  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
    }
  }

  // CLEAR RECORDING
  function clearRecording() {
    audioBlob.value = null;
    elapsed.value = 0;
    recording.value = false;
    level.value = 0;
  }

  return {
    recording,
    audioBlob,
    startRecording,
    stopRecording,
    clearRecording,
    elapsed,
    level,
  };
}