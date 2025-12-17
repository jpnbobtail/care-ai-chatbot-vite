import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: "No question provided" });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "system",
          content:
            "あなたは介護業向けITサポートAIです。専門用語は避け、やさしく分かりやすく答えてください。",
        },
        { role: "user", content: question },
      ],
    });

    res.status(200).json({
      answer: completion.choices[0].message.content,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
