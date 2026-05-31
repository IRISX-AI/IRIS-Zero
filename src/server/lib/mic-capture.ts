import { Microphone } from "decibri";
import fs from "fs";
import path from "path";

// Helper to write WAV header for 16-bit mono PCM audio
const writeWavHeader = (
  buffer: Buffer,
  sampleRate: number,
  channels: number,
  bitDepth: number,
): Buffer => {
  const header = Buffer.alloc(44);

  // "RIFF" chunk descriptor
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + buffer.length, 4);
  header.write("WAVE", 8);

  // "fmt " sub-chunk
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // subchunk1Size
  header.writeUInt16LE(1, 20); // audioFormat (1 = PCM)
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * channels * (bitDepth / 8), 28); // byteRate
  header.writeUInt16LE(channels * (bitDepth / 8), 32); // blockAlign
  header.writeUInt16LE(bitDepth, 34); // bitsPerSample

  // "data" sub-chunk
  header.write("data", 36);
  header.writeUInt32LE(buffer.length, 40);

  return Buffer.concat([header, buffer]);
};

export const StartMic = () => {
  const mic = new Microphone({
    sampleRate: 16000,
    framesPerBuffer: 1600,
    channels: 1,
    dtype: "int16",
  });
  const chunks: Buffer[] = [];

  mic.on("data", (chunk: Buffer) => {
    chunks.push(chunk);
  });

  mic.on("error", (err: Error) => {
    console.error("Mic error:", err.message);
  });

  return { mic, chunks };
};

export const stopMic = (handle: { mic: Microphone; chunks: Buffer[] }) => {
  if (!handle || !handle.mic) {
    throw new Error("Invalid mic handle provided to stopMic");
  }

  handle.mic.stop();
  const rawBuffer = Buffer.concat(handle.chunks);

  // Convert raw PCM to a valid WAV file (16000 Hz, 1 channel, 16-bit depth)
  const wavBuffer = writeWavHeader(rawBuffer, 16000, 1, 16);

  // Ensure the 'voice' directory exists in the application root directory
  const voiceDir = path.join(process.cwd(), "voice");
  if (!fs.existsSync(voiceDir)) {
    fs.mkdirSync(voiceDir, { recursive: true });
  }

  const filename = `recording_${Date.now()}.wav`;
  const filePath = path.join(voiceDir, filename);

  fs.writeFileSync(filePath, wavBuffer);
  console.log(`Audio saved successfully to ${filePath}`);

  return {
    buffer: wavBuffer,
    filePath,
    filename,
  };
};

const handle = StartMic();
setTimeout(() => {
  stopMic(handle);
}, 5000);
