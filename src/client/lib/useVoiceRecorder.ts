import { useRef, useCallback } from "react";

export const useVoiceRecorder = () => {
  const sessionIdRef = useRef<string | null>(null);

  const startRecording = useCallback(async () => {
    const res = await fetch("http://localhost:3001/voice/start", {
      method: "POST",
    });
    const data = await res.json();
    sessionIdRef.current = data.sessionId;
  }, []);

  const stopRecording = useCallback(async (): Promise<string> => {
    const res = await fetch("http://localhost:3001/voice/stop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sessionIdRef.current }),
    });
    const data = await res.json();
    return data.transcript as string;
  }, []);

  return { startRecording, stopRecording };
};