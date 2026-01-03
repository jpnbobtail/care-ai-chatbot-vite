import React, { useEffect, useMemo, useRef, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  ts: number;
};

type FaqItem = {
  ts: string; // ISO string
  q: string;
  a: string;
  source?: string;
};


function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString();
}

export default function App() {
  // ---------------------------
  // Simple Auth (Shared Password)
  // ---------------------------
  const [isAuthed, setIsAuthed] = useState<boolean>(() => {
    return localStorage.getItem("careit_auth") === "1";
  });
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string>("");

  // ---------------------------
  // Chat
  // ---------------------------
  const [input, setInput] = useState("");
  const [isSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const raw = localStorage.getItem("careit_chat_history");
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  });

  // ---------------------------
  // FAQ (shared)
  // ---------------------------
  const [faq, setFaq] = useState<FaqItem[]>([]);
  const [faqLoading, setFaqLoading] = useState(false);
  const [faqError, setFaqError] = useState<string>("");

  // ---------------------------
  // Speech Input (Web Speech API)
  // ---------------------------
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // ---------------------------
  // Speech Output (Speech Synthesis)
  // ---------------------------
  const [autoSpeak, setAutoSpeak] = useState(false);

  const lastAssistantMessage = useMemo(() => {
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    return last?.content ?? "";
  }, [messages]);

  // ---------------------------
  // Persist chat history
  // ---------------------------
  useEffect(() => {
    try {
      localStorage.setItem("careit_chat_history", JSON.stringify(messages.slice(-50)));
    } catch {
      // ignore
    }
  }, [messages]);

  // ---------------------------
  // Load FAQ after auth
  // ---------------------------
  useEffect(() => {
    if (!isAuthed) return;
    void refreshFaq();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed]);

  // ---------------------------
  // Auto speak when new assistant message arrives
  // ---------------------------
  useEffect(() => {
    if (!autoSpeak) return;
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (!last?.content) return;
    speak(last.content);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, autoSpeak]);

  async function refreshFaq() {
    setFaqLoading(true);
    setFaqError("");
    try {
      const r = await fetch("/api/faq/list?limit=50");
      const j = await r.json();
      if (!j?.ok) {
        setFaqError(j?.error ?? "FAQの取得に失敗しました");
        return;
      }
      setFaq(j.items ?? []);
    } catch (e) {
      setFaqError("FAQの取得に失敗しました");
    } finally {
      setFaqLoading(false);
    }
  }

    // ---------------------------
  // Auth flow
  // ---------------------------
  async function handleLogin() {
    setAuthError("");
    const pw = password.trim();
    if (!pw) {
      setAuthError("パスワードを入力してください。");
      return;
    }

    /**
     * 重要：
     * ここでは「クライアント側のみの簡易ログイン」です。
     * APP_PASSWORDはクライアントに渡せないため、サーバ側で照合します。
     * そのため /api/auth を叩いて検証する方式が本来安全です。
     *
     * ただし「最小」で進めるため、今回は「手元の一致確認」をせず、
     * “社内共有パスワードを知っている人だけが使う”運用＋localStorageでゲートします。
     *
     * より安全にする場合は、次段階で /api/auth を追加します（推奨）。
     */
    // 最小ゲート（運用で守る）
    localStorage.setItem("careit_auth", "1");
    setIsAuthed(true);
    setPassword("");
  }

  function handleLogout() {
    localStorage.removeItem("careit_auth");
    setIsAuthed(false);
    setMessages([]);
    try {
      localStorage.removeItem("careit_chat_history");
    } catch {
      // ignore
    }
  }

  // ---------------------------
  // Speech input helpers
  // ---------------------------
  function startListening() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("このブラウザは音声入力に対応していません（Chrome推奨）");
      return;
    }

    // stop existing
    try {
      recognitionRef.current?.stop?.();
    } catch {
      // ignore
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };

    recognition.onerror = (e: any) => {
      console.error(e);
      setIsListening(false);
      alert("音声入力でエラーが発生しました。もう一度お試しください。");
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopListening() {
    try {
      recognitionRef.current?.stop?.();
    } catch {
      // ignore
    }
  }

  // ---------------------------
  // Speech output helpers
  // ---------------------------
  function speak(text: string) {
    if (!("speechSynthesis" in window)) {
      alert("このブラウザは音声読み上げに対応していません");
      return;
    }
    const t = text.trim();
    if (!t) return;

    // cancel previous
    window.speechSynthesis.cancel();

    const uttr = new SpeechSynthesisUtterance(t);
    uttr.lang = "ja-JP";
    uttr.rate = 1.0;
    uttr.pitch = 1.0;

    window.speechSynthesis.speak(uttr);
  }

  function stopSpeak() {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }

  async function saveFaq(question: string, answer: string) {
  try {
    await fetch("/api/faq/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, answer }),
    });
  } catch (e) {
    // FAQ保存に失敗してもチャット本体は止めない
    console.warn("FAQ save failed", e);
  }
}


  // ---------------------------
  // Chat send
  // ---------------------------
  async function sendMessage() {
  const text = input.trim();
  if (!text) return;

  // ★ userMessage を sendMessage 内で定義
  const userMessage = text;

  setInput("");

  // ユーザー発言を追加
  setMessages((prev) => [...prev, { role: "user", content: userMessage,ts: Date.now() }]);

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage }),
    });

    // res.ok で失敗時も内容を確認できるようにする
    const data = await res.json().catch(() => null);

    // ★ answer を sendMessage 内で定義
    const answer =
      data && typeof data.answer === "string"
        ? data.answer
        : "回答を取得できませんでした";

    // AI発言を追加
    setMessages((prev) => [...prev, { role: "assistant", content: answer,ts: Date.now() }]);

    // ★ ここなら userMessage / answer が必ず存在する
    await saveFaq(userMessage, answer);

    // （あなたの speak があるなら）
    if (typeof speak === "function") speak(answer);
  } catch (e) {
    console.error(e);
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "エラーが発生しました。",ts: Date.now() },
    ]);
  }
}

   function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      void sendMessage();
    }
  }

  // ---------------------------
  // UI
  // ---------------------------
  if (!isAuthed) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>介護ITサポートAIチャット</h1>
          <p style={styles.muted}>
            社内利用のため、共通パスワードを入力してください。
          </p>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="共通パスワード"
              style={styles.input}
            />
            <button onClick={handleLogin} style={styles.primaryBtn}>
              ログイン
            </button>
          </div>

          {authError ? <p style={styles.error}>{authError}</p> : null}

          <p style={styles.note}>
            ※ Chrome推奨。音声入力・読み上げ機能が利用できます。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div>
          <div style={styles.titleSmall}>介護ITサポートAIチャット</div>
          <div style={styles.mutedSmall}>TXTマニュアルRAG / Groq / Vercel</div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={styles.toggle}>
            <input
              type="checkbox"
              checked={autoSpeak}
              onChange={(e) => setAutoSpeak(e.target.checked)}
            />
            <span style={{ marginLeft: 6 }}>自動読み上げ</span>
          </label>

          <button onClick={handleLogout} style={styles.secondaryBtn}>
            ログアウト
          </button>
        </div>
      </div>

      <div style={styles.grid}>
        {/* Chat */}
        <div style={styles.card}>
          <h2 style={styles.h2}>チャット</h2>

          <div style={styles.chatBox}>
            {messages.length === 0 ? (
              <div style={styles.muted}>まずは質問してみてください。</div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.ts}
                  style={{
                    ...styles.bubble,
                    ...(m.role === "user" ? styles.userBubble : styles.botBubble),
                  }}
                >
                  <div style={styles.bubbleHeader}>
                    <span style={styles.bubbleRole}>
                      {m.role === "user" ? "👤 あなた" : "🤖 AI"}
                    </span>
                    <span style={styles.bubbleTime}>{formatTime(m.ts)}</span>
                  </div>
                  <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
                </div>
              ))
            )}
          </div>

          <div style={styles.controls}>
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              style={styles.secondaryBtn}
            >
              {isListening ? "🎙 停止" : "🎙 音声入力"}
            </button>

            <button
              type="button"
              onClick={() => speak(lastAssistantMessage)}
              style={styles.secondaryBtn}
              disabled={!lastAssistantMessage}
              title="直近のAI回答を読み上げます"
            >
              🔊 読み上げ
            </button>

            <button type="button" onClick={stopSpeak} style={styles.secondaryBtn}>
              ⏹ 停止
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="例：勤怠の打刻方法を教えてください"
              style={styles.input}
              disabled={isSending}
            />
            <button
              onClick={() => void sendMessage()}
              style={styles.primaryBtn}
              disabled={isSending}
            >
              {isSending ? "送信中..." : "送信"}
            </button>
          </div>

          <div style={styles.note}>
            ※ 個人情報（利用者情報・氏名・住所など）は入力しないでください。
          </div>
        </div>

        {/* FAQ */}
        <div style={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <h2 style={styles.h2}>FAQ（社内共有）</h2>
            <button onClick={() => void refreshFaq()} style={styles.secondaryBtn}>
              🔄 更新
            </button>
          </div>

          {faqLoading ? <div style={styles.muted}>読み込み中...</div> : null}
          {faqError ? <div style={styles.error}>{faqError}</div> : null}

          <div style={styles.faqBox}>
            {faq.length === 0 ? (
              <div style={styles.muted}>
                まだFAQがありません。チャットで質問すると自動で蓄積されます。
              </div>
            ) : (
              faq.map((item, idx) => (
                <details key={`${item.ts}-${idx}`} style={styles.faqItem}>
                  <summary style={styles.faqQ}>
                    {item.q}
                    <span style={styles.faqMeta}>
                      {item.ts ? `（${item.ts}）` : ""}
                    </span>
                  </summary>
                  <div style={styles.faqA}>{item.a}</div>
                </details>
              ))
            )}
          </div>

          <div style={styles.note}>
            ※ FAQは社内共有ストレージ（Googleスプレッドシート）に保存されます。
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------
// Minimal inline styles
// ---------------------------
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: 16,
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans JP", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif',
    background: "#f6f7fb",
    boxSizing: "border-box",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr",
    gap: 16,
    alignItems: "start",
    marginTop: 12,
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  card: {
    background: "#fff",
    borderRadius: 12,
    padding: 14,
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
  },
  title: { fontSize: 20, margin: 0 },
  titleSmall: { fontSize: 16, fontWeight: 700 },
  h2: { fontSize: 14, margin: "0 0 10px 0" },
  muted: { color: "#667085", fontSize: 13 },
  mutedSmall: { color: "#667085", fontSize: 12 },
  note: { color: "#667085", fontSize: 12, marginTop: 10 },
  error: { color: "#b42318", fontSize: 12, marginTop: 10 },

  input: {
    flex: 1,
    padding: "10px 10px",
    borderRadius: 10,
    border: "1px solid #d0d5dd",
    outline: "none",
    fontSize: 14,
    background: "#fff",
  },
  primaryBtn: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #2563eb",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  secondaryBtn: {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #d0d5dd",
    background: "#fff",
    color: "#111827",
    cursor: "pointer",
    fontWeight: 600,
  },
  toggle: {
    display: "flex",
    alignItems: "center",
    fontSize: 12,
    color: "#111827",
    userSelect: "none",
    gap: 6,
  },

  chatBox: {
    maxHeight: 420,
    overflow: "auto",
    padding: 8,
    borderRadius: 10,
    border: "1px solid #eaecf0",
    background: "#fafafa",
  },
  bubble: {
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
    border: "1px solid #eaecf0",
  },
  userBubble: {
    background: "#eef2ff",
  },
  botBubble: {
    background: "#ecfdf3",
  },
  bubbleHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 6,
    color: "#475467",
    fontSize: 12,
  },
  bubbleRole: { fontWeight: 700 },
  bubbleTime: { fontSize: 11 },

  controls: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 10,
  },

  faqBox: {
    maxHeight: 520,
    overflow: "auto",
    padding: 8,
    borderRadius: 10,
    border: "1px solid #eaecf0",
    background: "#fafafa",
  },
  faqItem: {
    border: "1px solid #eaecf0",
    borderRadius: 10,
    padding: 8,
    background: "#fff",
    marginBottom: 8,
  },
  faqQ: {
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13,
    color: "#111827",
  },
  faqMeta: {
    marginLeft: 8,
    fontSize: 11,
    color: "#667085",
    fontWeight: 400,
  },
  faqA: {
    marginTop: 8,
    whiteSpace: "pre-wrap",
    fontSize: 13,
    color: "#111827",
  },
};
