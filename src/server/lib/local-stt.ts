import whisper from "@kutalia/whisper-node-addon";

const result = await whisper.transcribe({
  fname_inp: "./voice/recording_1780318395018.wav",
  model: "ggml-tiny.en.bin",
  language: "auto",
  use_gpu: true,
});

console.log(result);
