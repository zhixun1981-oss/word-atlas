import { Cpu, Mic, RotateCcw, Send, Square, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { play, stopAudio } from "../lib/audio";
import { chatStream, pickModel, type ChatMessage } from "../lib/llm";
import { listenOnce, speechSupported } from "../lib/speech";
import { useStore } from "../store/store";

/** Prompt tuned for a young Cambridge learner: short, warm, always keeps the ball rolling. */
function systemPrompt(level: string): string {
  return `You are "小拾" (Xiao Shi), a warm and patient English conversation partner talking with a Chinese child who is preparing for the Cambridge ${level} exam.

Rules:
- Reply in simple, natural English. Keep it to ONE or TWO short sentences, at ${level} level vocabulary.
- Almost always end with a question so the conversation keeps going.
- If the child makes a mistake, first reply naturally to what they meant, then gently show a better version on a new line starting with "Better:". Never lecture, never correct more than one thing.
- Stay cheerful and encouraging. Never say the child is wrong in a blunt way.
- If they write in Chinese asking for help, you may give a short Chinese hint, then continue in English.
- No markdown, no lists, no long explanations. Emoji at most one, rarely.`;
}

const GREET: ChatMessage = {
  role: "user",
  content: "Let's start. Say hi and ask me the first question so we can chat.",
};

interface Turn extends ChatMessage {
  at: number;
}

export function AISpeak({ onExit }: { onExit: () => void }) {
  const settings = useStore((s) => s.settings);
  const [model, setModel] = useState<string | null>(null);
  const [status, setStatus] = useState<"boot" | "ready" | "down">("boot");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);
  const history = useRef<ChatMessage[]>([]);
  const level = settings.examLevel || "A2";

  const speak = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      void play(null, text, settings.accent === "us" ? "us" : "uk");
    },
    [settings.accent],
  );

  // Meet the local model on mount.
  useEffect(() => {
    let alive = true;
    void (async () => {
      const m = await pickModel();
      if (!alive) return;
      if (!m) {
        setStatus("down");
        return;
      }
      setModel(m);
      setStatus("ready");
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Open with a greeting from the model so the room does not feel empty.
  useEffect(() => {
    if (status !== "ready" || turns.length || busy) return;
    void send(GREET.content, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [turns, thinking, busy]);

  useEffect(() => () => stopAudio(), []);

  async function send(text: string, opener = false) {
    const body = text.trim();
    if (!body || busy) return;
    const sys: ChatMessage = { role: "system", content: systemPrompt(level) };
    if (!opener) {
      const mine: Turn = { role: "user", content: body, at: Date.now() };
      setTurns((t) => [...t, mine]);
      history.current = [...history.current, { role: "user", content: body }];
    }
    setDraft("");
    setBusy(true);
    setThinking("");
    setError(null);
    const ctrl = new AbortController();
    abort.current = ctrl;
    // Keep the context window small: system + last 12 turns.
    const messages: ChatMessage[] = [sys, ...history.current.slice(-12), ...(opener ? [GREET] : [])];
    let full = "";
    try {
      full = await chatStream(messages, {
        model: model ?? undefined,
        signal: ctrl.signal,
        temperature: 0.85,
        onToken: (chunk) => {
          setTurns((t) => {
            const last = t[t.length - 1];
            if (last && last.role === "assistant") {
              const next = [...t];
              next[next.length - 1] = { ...last, content: last.content + chunk };
              return next;
            }
            return [...t, { role: "assistant", content: chunk, at: Date.now() }];
          });
        },
        onThinking: (chunk) => setThinking((v) => (v + chunk).slice(-240)),
      });
      setThinking("");
      if (full.trim()) {
        history.current = [...history.current, { role: "assistant", content: full.trim() }];
        if (voiceOn) speak(full.trim());
      }
    } catch (e) {
      const msg = e instanceof Error && e.name === "AbortError" ? null : e instanceof Error && e.message === "no-model" ? "本地模型不可用，先在电脑上启动 Ollama。" : "本地模型没回话，检查 Ollama 是否在跑。";
      if (msg) setError(msg);
    } finally {
      setBusy(false);
      abort.current = null;
    }
  }

  async function talk() {
    if (!speechSupported()) {
      setError("当前浏览器不支持语音识别，用 Chrome 或 Edge 再试试，或者直接打字。");
      return;
    }
    setListening(true);
    setError(null);
    try {
      const said = await listenOnce("en-US", 9000);
      if (said) setDraft(said);
      if (said.trim()) void send(said);
    } catch (e) {
      const why = e instanceof Error && e.message === "not-allowed" ? "麦克风权限被拒绝了，点地址栏的麦克风图标允许后再试。" : "没听清，再试一次，或者直接打字。";
      setError(why);
    } finally {
      setListening(false);
    }
  }

  function reset() {
    abort.current?.abort();
    stopAudio();
    setTurns([]);
    history.current = [];
    setDraft("");
    setError(null);
    setThinking("");
    setBusy(false);
    void send(GREET.content, true);
  }

  if (status === "down")
    return (
      <div className="page practice">
        <section className="panel ai-down">
          <p className="eyebrow">本地模型未连接</p>
          <h1 className="display">先让电脑醒一醒</h1>
          <p className="lede">
            AI 陪练跑在你自己的电脑上，需要先启动 Ollama。在终端里执行：
          </p>
          <pre className="ai-cmd">OLLAMA_ORIGINS="*" ollama serve</pre>
          <p className="muted">
            然后 <code>ollama pull qwen2.5:3b</code> 拉一个模型（约 2GB，只下一次）。全程离线，不上传任何对话。
          </p>
          <div className="summary-actions">
            <button className="btn btn-ghost" onClick={onExit}>
              返回
            </button>
            <button className="btn btn-primary btn-xl" onClick={() => location.reload()}>
              刷新重试
            </button>
          </div>
        </section>
      </div>
    );

  const booting = status === "boot";

  return (
    <div className="page practice ai-chat">
      <header className="typing-top ai-top">
        <button className="btn btn-ghost" onClick={onExit}>
          结束
        </button>
        <div className="ai-model" title="对话跑在你本机的 Ollama 上">
          <Cpu size={14} /> 本地模型 · {booting ? "连接中…" : model}
        </div>
        <button className="icon-btn" onClick={() => setVoiceOn((v) => !v)} aria-label={voiceOn ? "关闭朗读" : "开启朗读"} title={voiceOn ? "关闭朗读" : "开启朗读"}>
          {voiceOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        <button className="icon-btn" onClick={reset} aria-label="重新开一轮对话" title="重新开一轮对话">
          <RotateCcw size={18} />
        </button>
      </header>

      <div className="ai-scroll" ref={scroller}>
        <div className="ai-intro">
          <p className="muted">和「小拾」用英语聊天。说错也没关系，它会悄悄帮你改好，再接着聊下去。</p>
        </div>
        {turns.map((t, i) => (
          <div key={`${t.at}-${i}`} className={`ai-bubble ${t.role === "user" ? "is-me" : "is-ai"}`}>
            <span className="ai-who">{t.role === "user" ? "你" : "小拾"}</span>
            <p lang={t.role === "user" ? undefined : "en"}>{t.content}</p>
            {t.role === "assistant" && (
              <button className="ai-replay" onClick={() => speak(t.content)} aria-label="再听一遍">
                <Volume2 size={13} /> 再听一遍
              </button>
            )}
          </div>
        ))}
        {busy && !turns.some((t) => t.role === "assistant" && t.at === turns[turns.length - 1]?.at && t.content) && (
          <div className="ai-bubble is-ai is-typing">
            <span className="ai-who">小拾</span>
            <p>{thinking ? <em className="ai-think">{thinking.slice(-120)}…</em> : <span className="dots"><i /><i /><i /></span>}</p>
          </div>
        )}
      </div>

      {error && <p className="ai-error">{error}</p>}

      <form
        className="ai-compose"
        onSubmit={(e) => {
          e.preventDefault();
          void send(draft);
        }}
      >
        <button type="button" className={`btn btn-primary ai-mic ${listening ? "is-on" : ""}`} onClick={() => void talk()} disabled={busy || booting} aria-label="按住说话">
          {listening ? <Square size={17} /> : <Mic size={17} />}
          {listening ? "听着呢…" : "说"}
        </button>
        <input
          className="ai-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={booting ? "正在连接本地模型…" : "说或直接打字，回车发送"}
          disabled={busy || booting}
          autoFocus
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          aria-label="对 AI 说"
        />
        <button type="submit" className="btn btn-primary ai-send" disabled={busy || booting || !draft.trim()} aria-label="发送">
          <Send size={17} />
        </button>
      </form>
      <p className="muted ai-foot">
        {listening ? "对着麦克风说，说完会自动发出去。" : "语音识别走浏览器/系统自带的识别，打字也一样练。"}
      </p>
    </div>
  );
}
