import whisper from "@kutalia/whisper-node-addon";

process.on("message", async (msg: any) => {
  try {
    const { pcmf32, modelPath } = msg;
    const float32Array = new Float32Array(pcmf32);

    const result = await whisper.transcribe({
      pcmf32: float32Array,
      model: modelPath,
      language: "en",
      no_timestamps: true,
      no_prints: true,
    });

    const text = result?.transcription
      ? result.transcription.flat().join(" ").trim()
      : Array.isArray(result)
        ? result
            .map((s: { text: string }) => s.text)
            .join(" ")
            .trim()
        : String(result).trim();

    process.send!({ success: true, text });
    process.exit(0);
  } catch (error) {
    process.send!({ success: false, error: String(error) });
    process.exit(1);
  }
});
