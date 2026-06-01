import { Request, Response } from "express";
import { StartMic, stopMic } from "../lib/mic-capture.js";
import whisper from "@kutalia/whisper-node-addon";

const sessions = new Map<string, ReturnType<typeof StartMic>>();

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

    const result = await whisper.transcribe({
      fname_inp: filePath,
      model: "ggml-tiny.en.bin",
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
