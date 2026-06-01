import { Request, Response } from "express";
import { StartMic, stopMic } from "../lib/mic-capture.js";
import whisper from "@kutalia/whisper-node-addon";
import path from "path";
import fs from "fs";
import https from "https";

const sessions = new Map<string, ReturnType<typeof StartMic>>();

const MODEL_PATH = path.resolve(process.cwd(), "ggml-tiny.en.bin");

const downloadModel = (url: string, dest: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (!redirectUrl)
            return reject(new Error("Redirect with no Location header"));
          return downloadModel(redirectUrl, dest).then(resolve).catch(reject);
        }
        if (response.statusCode !== 200)
          return reject(new Error(`Download failed: ${response.statusCode}`));

        const file = fs.createWriteStream(dest);
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
        file.on("error", (err) => {
          fs.unlink(dest, () => {});
          reject(err);
        });
      })
      .on("error", reject);
  });
};

const ensureModel = async () => {
  if (!fs.existsSync(MODEL_PATH)) {
    console.log("📥 Downloading ggml-tiny.en.bin...");
    await downloadModel(
      "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin",
      MODEL_PATH,
    );
    console.log("✅ Model ready");
  }
};

export const VoiceStart = async (req: Request, res: Response) => {
  try {
    const sessionId = Date.now().toString();
    sessions.set(sessionId, StartMic());
    res.json({ success: true, sessionId });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
};

export const VoiceStop = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId)
      return res
        .status(400)
        .json({ success: false, error: "sessionId required" });

    const handle = sessions.get(sessionId);
    if (!handle)
      return res
        .status(404)
        .json({ success: false, error: "Session not found" });

    sessions.delete(sessionId);

    const { float32 } = stopMic(handle);

    await ensureModel();

    const result = await whisper.transcribe({
      pcmf32: float32, // ✅ in-memory, no disk I/O
      model: MODEL_PATH,
      language: "en",
      no_timestamps: true,
    });

    // whisper returns nested arrays with pcmf32 mode
    const text = result?.transcription
      ? result.transcription.flat().join(" ").trim()
      : Array.isArray(result)
        ? result
            .map((s: { text: string }) => s.text)
            .join(" ")
            .trim()
        : String(result).trim();

    res.json({ success: true, transcript: text });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
};
