import { useState } from "react";

function App() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const sendQuestion = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setAnswer("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: question }),
      });

      const data = await res.json();
      setAnswer(data.answer ?? "回答を取得できませんでした。");
    } catch (error) {
      console.error(error);
      setAnswer("エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>介護向け IT サポートチャット</h1>

      <textarea
        rows={4}
        style={{ width: "100%", padding: 10 }}
        placeholder="質問を入力してください"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />

      <button
        onClick={sendQuestion}
        disabled={loading}
        style={{ marginTop: 10, padding: "8px 16px" }}
      >
        送信
      </button>

      <div style={{ marginTop: 20 }}>
        <h3>🤖 回答</h3>
        <p>{loading ? "回答中..." : answer}</p>
      </div>
    </div>
  );
}

export default App;
