import { Router } from "express";

const AIRouter = Router();

AIRouter.post("/ask", async (req, res) => {
  const { prompt } = req.body;
  const response = await irisAI({ prompt });
  res.json({ response });
});

export default AIRouter;
