import { useState } from "react";

function App() {
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    // 空入力防止
    if (!input.trim()) {
      alert("質問を入力してください");
      return;
    }

    setLoading(true);
    setAnswer("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
        }),
      });

      if (!res.ok) {
        throw new Error("APIエラーが発生しました");
      }

      const data = await res.json();
      setAnswer(data.answer ?? "回答を取得できませんでした");
    } catch (error) {
      console.error(error);
      setAnswer("エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h2>介護向け IT サポートチャット</h2>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="質問を入力してください"
        rows={4}
        style={{ width: "100%", padding: "8px" }}
      />

      <button
        onClick={handleSend}
        disabled={loading}
        style={{ marginTop: 10, padding: "8px 16px" }}
      >
        {loading ? "回答中..." : "送信"}
      </button>

      {answer && (
        <div style={{ marginTop: 20, padding: 10, border: "1px solid #ccc" }}>
          <strong>🤖 回答</strong>
          <p style={{ whiteSpace: "pre-wrap" }}>{answer}</p>
        </div>
      )}
    </div>
  );
}

export default App;
