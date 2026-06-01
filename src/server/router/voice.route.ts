import { Router } from "express";
import { VoiceStart, VoiceStop } from "../controllers/voice.controller.js";

const VoiceRouter = Router();

VoiceRouter.post("/start", VoiceStart);
VoiceRouter.post("/stop", VoiceStop);

export default VoiceRouter;
