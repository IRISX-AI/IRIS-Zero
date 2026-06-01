import whisper from '@kutalia/whisper-node-addon'

// Transcribe audio
const result = await whisper.transcribe({
  fname_inp: 'audio.wav',
  model: 'ggml-base.en.bin',
  language: 'en',
  use_gpu: true // Auto-detects Vulkan/Metal
});

console.log(result); 