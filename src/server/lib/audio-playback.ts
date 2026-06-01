import { Speaker } from "decibri";

let speaker: any | null = null;

function createSpeaker() {
  if (speaker) {
    speaker.end();
  }
  speaker = new Speaker({
    channels: 1,
    sampleRate: 24000,
    dtype: "int16",
  });
  speaker.on("error", (err: Error) => console.error("Speaker error:", err));
}

export const PlayAudio = async (audioBuffer: Buffer) => {
  createSpeaker();
  if (!speaker) {
    throw new Error("Failed to create speaker");
  }
  speaker.write(audioBuffer);
  speaker.end();
};
