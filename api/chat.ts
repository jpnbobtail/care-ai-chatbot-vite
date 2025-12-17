import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: Request) {
  const { message } = await req.json();

  const completion = await groq.chat.completions.create({
    model: "llama3-8b-8192",
    messages: [
      { role: "system", content: "あなたは介護業界向けのITサポートAIです。" },
      { role: "user", content: message },
    ],
  });

  const answer =
    completion.choices?.[0]?.message?.content ??
    "（回答を生成できませんでした）";

  return new Response(JSON.stringify({ answer }));
}
