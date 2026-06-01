import { Microphone } from "decibri";

export const StartMic = () => {
  const mic = new Microphone({
    sampleRate: 16000,
    framesPerBuffer: 1600,
    channels: 1,
    dtype: "int16",
  });
  const chunks: Buffer[] = [];

  mic.on("data", (chunk: Buffer) => chunks.push(chunk));
  mic.on("error", (err: Error) => console.error("Mic error:", err.message));

  return { mic, chunks };
};

export const stopMic = (handle: { mic: Microphone; chunks: Buffer[] }) => {
  if (!handle?.mic) throw new Error("Invalid mic handle");

  handle.mic.stop();
  const rawBuffer = Buffer.concat(handle.chunks);

  // PCM int16 → float32 (what whisper expects)
  const int16 = new Int16Array(
    rawBuffer.buffer,
    rawBuffer.byteOffset,
    rawBuffer.length / 2,
  );
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768;
  }

  return { float32 };
};
