import { useRef, useCallback } from "react";

export const useVoiceRecorder = (
  onTranscript: (text: string) => void,
  onToken: (token: string) => void,
  onStage: (stage: string) => void,
  onDone: () => void,
) => {
  const sessionIdRef = useRef<string | null>(null);

  const startRecording = useCallback(async () => {
    const res = await fetch("http://localhost:4894/voice/start", {
      method: "POST",
    });
    const data = await res.json();
    sessionIdRef.current = data.sessionId;
  }, []);

  const stopRecording = useCallback(async () => {
    const response = await fetch("http://localhost:4894/voice/stop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sessionIdRef.current }),
    });

    // Parse SSE stream
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      let event = "";
      for (const line of lines) {
        if (line.startsWith("event: ")) {
          event = line.slice(7).trim();
        } else if (line.startsWith("data: ")) {
          const data = JSON.parse(line.slice(6));
          if (event === "transcript") onTranscript(data.text);
          if (event === "token") onToken(data.token);
          if (event === "status") onStage(data.stage);
          if (event === "done") onDone();
          if (event === "error") console.error("IRIS error:", data.message);
        }
      }
    }
  }, [onTranscript, onToken, onStage, onDone]);

  return { startRecording, stopRecording };
};
