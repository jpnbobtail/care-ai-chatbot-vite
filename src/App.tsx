import { useState } from "react";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input) return;

    setMessages((prev) => [...prev, `👤 ${input}`]);
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: input }),
    });

    const data = await res.json();
    setMessages((prev) => [...prev, `🤖 ${data.answer}`]);
    setInput("");
    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Care AI Chatbot</h2>

      <div style={{ border: "1px solid #ccc", padding: 10, minHeight: 200 }}>
        {messages.map((m, i) => (
          <div key={i}>{m}</div>
        ))}
        {loading && <div>🤖 回答中...</div>}
      </div>

      <input
        style={{ width: "80%" }}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button onClick={sendMessage}>送信</button>
    </div>
  );
}

export default App;
