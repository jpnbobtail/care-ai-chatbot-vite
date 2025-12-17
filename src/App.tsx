import { useState } from "react";

function App() {
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    // 🔴 対策②：空入力チェック（超重要）
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
          message: input, // ← 必ず文字列が入る
        }),
      });

      if (!res.ok) {
        throw new Error("API エラーが発生しました");
      }

      const data = await res.json();
      setAnswer(data.answer ?? "回答を取得できませんでした");
    } catch (err) {
      console.error(err);
      setAnswer("エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
