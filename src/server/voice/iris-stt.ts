import { Microphone } from "decibri";
import whisper from "@kutalia/whisper-node-addon";
import fs from "fs";
import path from "path";

const writeWavHeader = (
  buffer: Buffer,
  sampleRate: number,
  channels: number,
  bitDepth: number,
): Buffer => {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + buffer.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * channels * (bitDepth / 8), 28);
  header.writeUInt16LE(channels * (bitDepth / 8), 32);
  header.writeUInt16LE(bitDepth, 34);
  header.write("data", 36);
  header.writeUInt32LE(buffer.length, 40);
  return Buffer.concat([header, buffer]);
};

export interface RecordAndTranscribeOptions {
  durationMs?: number;
  model?: string;
  language?: string;
  useGpu?: boolean;
  keepFile?: boolean;
}

export interface TranscribeResult {
  text: string;
  filePath: string;
  durationMs: number;
}

export const recordAndTranscribe = (
  options: RecordAndTranscribeOptions = {},
): Promise<TranscribeResult> => {
  const {
    durationMs = 5000,
    model = "ggml-tiny.en.bin",
    language = "auto",
    useGpu = true,
    keepFile = false,
  } = options;

  return new Promise((resolve, reject) => {
    const mic = new Microphone({
      sampleRate: 16000,
      framesPerBuffer: 1600,
      channels: 1,
      dtype: "int16",
    });

    const chunks: Buffer[] = [];

    mic.on("data", (chunk: Buffer) => chunks.push(chunk));
    mic.on("error", (err: Error) => {
      mic.stop();
      reject(new Error(`Mic error: ${err.message}`));
    });

    console.log(`🎙️  Recording for ${durationMs}ms...`);

    setTimeout(async () => {
      try {
        // Stop & build WAV
        mic.stop();
        const rawBuffer = Buffer.concat(chunks);
        const wavBuffer = writeWavHeader(rawBuffer, 16000, 1, 16);

        // Save to disk (whisper needs a file path)
        const voiceDir = path.join(process.cwd(), "voice");
        if (!fs.existsSync(voiceDir))
          fs.mkdirSync(voiceDir, { recursive: true });

        const filePath = path.join(voiceDir, `recording_${Date.now()}.wav`);
        fs.writeFileSync(filePath, wavBuffer);
        console.log(`💾  Saved: ${filePath}`);

        // 3. Transcribe
        console.log("🔍  Transcribing...");
        const result = await whisper.transcribe({
          fname_inp: filePath,
          model,
          language,
          use_gpu: useGpu,
        });

        // Extract plain text (whisper returns array of segments)
        const text = Array.isArray(result)
          ? result
              .map((s: { text: string }) => s.text)
              .join(" ")
              .trim()
          : String(result).trim();

        // 4. Clean up unless caller wants the file
        if (!keepFile) fs.unlinkSync(filePath);

        resolve({ text, filePath, durationMs });
      } catch (err) {
        reject(err);
      }
    }, durationMs);
  });
};
