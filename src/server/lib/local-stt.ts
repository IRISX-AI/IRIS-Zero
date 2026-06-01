import whisper from "@kutalia/whisper-node-addon";

const result = await whisper.transcribe({
  fname_inp: "audio.wav",
  model: "ggml-base.en.bin",
  language: "en",
  use_gpu: true,
});

console.log(result);
