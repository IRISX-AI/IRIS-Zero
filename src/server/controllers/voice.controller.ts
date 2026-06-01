import { Request, Response } from "express";
import { StartMic, stopMic } from "../lib/mic-capture.js";
import { transcribeInWorker } from "../logic/suppresslogs.js";
import { ensureModel, MODEL_PATH } from "../lib/model.js";

const sessions = new Map<string, ReturnType<typeof StartMic>>();

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

    const text = await transcribeInWorker(float32, MODEL_PATH);

    console.log(text);

    res.json({ success: true, transcript: text });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
};
