import { Decibri } from "decibri";

export const StartMic = () => {
  const mic = new Decibri({ sampleRate: 16000, channels: 1, format: "int16" });
  const chunks: any[] = [];

  mic.on("data", (chunk: any) => {
    chunks.push(chunk);
  });

  mic.on("error", (err: any) => {
    console.error("Mic error:", err.message);
  });

  return { mic, chunks };
};

export const stopMic = (handle: any) => {
  handle.mic.stop();
  return Buffer.concat(handle.chunks);
};
