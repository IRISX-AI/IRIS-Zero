import { Request, Response } from "express";
import { StartMic, stopMic } from "../lib/mic-capture.js";
import whisper from "@kutalia/whisper-node-addon";
import path from "path";
import fs from "fs";
import https from "https";

const sessions = new Map<string, ReturnType<typeof StartMic>>();

// Helper function to download the model file following redirects
const downloadModel = (url: string, dest: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (!redirectUrl) {
            reject(
              new Error(
                `Redirect received from ${url} but no Location header found.`,
              ),
            );
            return;
          }
          downloadModel(redirectUrl, dest).then(resolve).catch(reject);
          return;
        }

        if (response.statusCode !== 200) {
          reject(
            new Error(
              `Request to ${url} failed with status code ${response.statusCode}`,
            ),
          );
          return;
        }

        const file = fs.createWriteStream(dest);
        response.pipe(file);

        file.on("finish", () => {
          file.close();
          resolve();
        });

        file.on("error", (err) => {
          file.close();
          fs.unlink(dest, () => {});
          reject(err);
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
};

export const VoiceStart = async (req: Request, res: Response) => {
  try {
    const sessionId = Date.now().toString();
    const handle = StartMic();
    sessions.set(sessionId, handle);
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
        .json({ success: false, error: "sessionId is required" });

    const handle = sessions.get(sessionId);
    if (!handle)
      return res
        .status(404)
        .json({ success: false, error: "Session not found" });

    sessions.delete(sessionId);
    const { filePath } = stopMic(handle);

    // Resolve the absolute model path and download if it doesn't exist
    const modelPath = path.resolve(process.cwd(), "ggml-tiny.en.bin");
    if (!fs.existsSync(modelPath)) {
      console.log(
        `🎙️ Model file not found at ${modelPath}. Downloading ggml-tiny.en.bin from Hugging Face...`,
      );
      const downloadUrl =
        "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin";
      await downloadModel(downloadUrl, modelPath);
      console.log("🎙️ Model downloaded successfully!");
    }

    const result = await whisper.transcribe({
      fname_inp: filePath,
      model: modelPath,
      language: "auto",
      use_gpu: true,
    });

    const text = Array.isArray(result)
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
