import { Request, Response } from "express";
import { StartMic, stopMic } from "../lib/mic-capture.js";
import { transcribeInWorker } from "../logic/suppresslogs.js";
import { ensureModel, MODEL_PATH } from "../lib/model.js";
import IrisAI from "../agent/iris-ai.js";

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
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (event: string, data: object) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      send("error", { message: "sessionId required" });
      return res.end();
    }

    const handle = sessions.get(sessionId);
    if (!handle) {
      send("error", { message: "Session not found" });
      return res.end();
    }

    sessions.delete(sessionId);

    send("status", { stage: "transcribing" });
    const { float32 } = stopMic(handle);
    await ensureModel();
    const userText = await transcribeInWorker(float32, MODEL_PATH);
    send("transcript", { text: userText });

    send("status", { stage: "thinking" });
    await IrisAI({
      prompt: userText,
      onToken: (token: string) => send("token", { token }),
    });

    send("done", { success: true });
    res.end();
  } catch (error) {
    send("error", { message: String(error) });
    res.end();
  }
};
