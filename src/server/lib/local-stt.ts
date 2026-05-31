const Decibri = require("decibri");
const { transcribe } = require("@kutalia/whisper-node-addon");

const MODEL_PATH = "./ggml-tiny.en.bin";
const SAMPLE_RATE = 16000;
const BUFFER_SECONDS = 5; // shorter = faster feedback, longer = better accuracy

const mic = new Decibri({ sampleRate: SAMPLE_RATE, channels: 1 });

const chunks: any = [];
let bufferedSamples = 0;
const targetSamples = SAMPLE_RATE * BUFFER_SECONDS;
let processing = false;

async function processBuffer() {
  if (processing) return;
  processing = true;

  const pcm16 = Buffer.concat(chunks);
  chunks.length = 0;
  bufferedSamples = 0;

  const int16 = new Int16Array(
    pcm16.buffer,
    pcm16.byteOffset,
    pcm16.length / 2,
  );
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768;
  }

  const result = await transcribe({
    pcmf32: float32,
    model: MODEL_PATH,
    language: "en", // use 'auto' with multilingual models (e.g. ggml-base.bin)
    no_timestamps: true,
  });

  // transcription may be nested arrays, so flatten to a single string
  const text = result.transcription.flat().join(" ").trim();
  if (text) console.log(text);

  processing = false;
}

mic.on("data", (chunk: any) => {
  chunks.push(chunk);
  bufferedSamples += chunk.length / 2;

  if (bufferedSamples >= targetSamples) {
    processBuffer();
  }
});

process.on("SIGINT", async () => {
  mic.stop();
  if (chunks.length > 0) await processBuffer();
  process.exit(0);
});

console.log("Listening... (Ctrl+C to stop)");
