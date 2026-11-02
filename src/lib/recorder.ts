/**
 * 录音：给口语练习留一份自己的声音。
 *
 * 浏览器自带的 SpeechRecognition 只给文字，拿不到音轨；这里是另一路
 * MediaRecorder，两路可以同时开（都会各自申请一次麦克风，Chrome 会复用同一条）。
 */

export interface Recorder {
  /** 停下并拿到录音。没录到东西（权限被拒 / 太短）时返回 null。 */
  stop: () => Promise<Blob | null>;
  /** 丢弃录音，同时释放麦克风。 */
  cancel: () => void;
  /** 已经录了多久（毫秒）。 */
  elapsed: () => number;
}

export const recorderSupported = () =>
  typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";

function pickMime(): string {
  const opts = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  for (const m of opts) if (MediaRecorder.isTypeSupported(m)) return m;
  return "";
}

export async function startRecording(): Promise<Recorder> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  const mime = pickMime();
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  const chunks: BlobPart[] = [];
  const startedAt = Date.now();
  rec.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };
  rec.start(120);

  const release = () => stream.getTracks().forEach((t) => t.stop());

  return {
    elapsed: () => Date.now() - startedAt,
    async stop() {
      const blob = await new Promise<Blob | null>((resolve) => {
        const done = () => {
          release();
          if (!chunks.length) return resolve(null);
          resolve(new Blob(chunks, { type: mime || "audio/webm" }));
        };
        if (rec.state === "inactive") return done();
        rec.onstop = done;
        rec.stop();
      });
      return blob;
    },
    cancel() {
      try {
        if (rec.state !== "inactive") rec.stop();
      } catch {
        /* already stopped */
      }
      release();
    },
  };
}

/**
 * 解出波形峰值（0..1 的数组）和真实时长。
 *
 * 时长不能信 `<audio>.duration`——MediaRecorder 产出的 webm 没有写完整的 duration 头，
 * Chrome 上经常给 Infinity 或一个错得离谱的数。这里从解码后的 AudioBuffer 里取，才准。
 */
export async function analyseClip(blob: Blob, bars = 44): Promise<{ peaks: number[]; duration: number }> {
  try {
    const buf = await blob.arrayBuffer();
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctor();
    const audio = await ctx.decodeAudioData(buf.slice(0));
    const data = audio.getChannelData(0);
    const step = Math.max(1, Math.floor(data.length / bars));
    const out: number[] = [];
    for (let i = 0; i < bars; i++) {
      let sum = 0;
      const from = i * step;
      const to = Math.min(data.length, from + step);
      for (let j = from; j < to; j++) sum += data[j] * data[j];
      const rms = Math.sqrt(sum / Math.max(1, to - from));
      out.push(rms);
    }
    await ctx.close();
    const max = Math.max(...out, 0.0001);
    return {
      peaks: out.map((v) => Math.min(1, Math.max(0.08, v / max))),
      duration: audio.duration,
    };
  } catch {
    return {
      peaks: Array.from({ length: bars }, (_, i) => 0.25 + 0.35 * Math.abs(Math.sin(i / 2.6))),
      duration: 0,
    };
  }
}
