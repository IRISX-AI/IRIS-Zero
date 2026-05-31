const { Microphone } = require("decibri");

export const StartMic = () => {
  const mic = new Microphone({
    sampleRate: 16000,
    framesPerBuffer: 1600,
    channels: 1,
    format: "int16",
  });
  const chunks: any[] = [];

  mic.on("data", (chunk: any) => {
    chunks.push(chunk);
  });

  mic.on("error", (err: any) => {
    console.error("Mic error:", err.message);
  });
};

export const stopMic = (handle: any) => {
  handle.mic.stop();
  return Buffer.concat(handle.chunks);
};
