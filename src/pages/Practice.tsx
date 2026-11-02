import { Award, BookOpen, Bot, GraduationCap, Headphones, Keyboard, Play, RotateCcw, Type } from "lucide-react";import { useEffect, useMemo, useRef, useState } from "react";
import { prefetch, useAtlas } from "../atlas/context";
import { resolveLevel } from "../atlas/levels";
import type { Entry } from "../atlas/types";
import { generateExam, generateListening, generatePlacement, type ExamKind, type ExamQuestion } from "../exam/generate";
import { MIN_PAIRS, type MinPair } from "../exam/minPairs";
import { play, stopAudio } from "../lib/audio";
import { cue } from "../lib/sound";
import { hashSeed, shuffle } from "../lib/text";
import { clean, correctCharacterCount, same, typingDelta, typingMetrics } from "../lib/typing";
import { store, useStore } from "../store/store";
import { weakWords } from "../lib/weak";
import { openWord } from "../lib/router";
import { AmbiencePicker } from "../ui/Ambience";
import { ExamRound } from "../ui/ExamRound";
import { Illustration } from "../ui/Illustration";
import { ListeningRound } from "../ui/ListeningRound";
import { MockRound } from "../ui/MockRound";
import { MinimalPairRound } from "../ui/MinimalPairRound";
import { ConfusableRound } from "../ui/ConfusableRound";
import { DialogueRound } from "../ui/DialogueRound";
import { DictationRound } from "../ui/DictationRound";
import { FlashcardRound } from "../ui/FlashcardRound";
import { PictureTalk } from "../ui/PictureTalk";
import { PictureWrite } from "../ui/PictureWrite";
import { PlacementRound } from "../ui/PlacementRound";
import { RadioPlayer } from "../ui/RadioPlayer";
import { ReadingMatch } from "../ui/ReadingMatch";
import { RepeatRound } from "../ui/RepeatRound";
import { SoundClinic } from "../ui/SoundClinic";
import { SpeakingRound } from "../ui/SpeakingRound";
import { SpeedListen } from "../ui/SpeedListen";
import { SpellRound } from "../ui/SpellRound";
import { SynAntRound } from "../ui/SynAntRound";
import { TopicQuest } from "../ui/TopicQuest";
import { TranslateRound } from "../ui/TranslateRound";
import { WordBuilding } from "../ui/WordBuilding";
import { WordForms } from "../ui/WordForms";
import { WritingRound } from "../ui/WritingRound";
import { WritingTemplates } from "../ui/WritingTemplates";
import { AISpeak } from "../ui/AISpeak";
import { PKRound } from "../ui/PKRound";
import { GrammarClinic } from "../ui/GrammarClinic";
import { OpenClozeRound } from "../ui/OpenClozeRound";
import { GapFillRound } from "../ui/GapFillRound";
import { SpeakingExam } from "../ui/SpeakingExam";
import { SignRound } from "../ui/SignRound";
import { AiQuiz } from "../ui/AiQuiz";
import { lookalikes, whyWrong, type WhyWrong } from "../lib/whyWrong";

type Mode = "word" | "sentence" | "dictation";
type Source = "recent" | "mistakes" | "saved" | "path" | "weak";

const MODES: [Mode, string, string, typeof Type, string][] = [
  ["word", "单词", "看图写出单词", Type, "camera"],
  ["sentence", "例句", "照着抄写，练出手感", Keyboard, "book"],
  ["dictation", "听写", "只听声音，写下整句", Headphones, "listen"],
];
const SOURCES: [Source, string][] = [
  ["recent", "最近学过"],
  ["mistakes", "错词本"],
  ["saved", "收藏"],
  ["path", "学习路线"],
  ["weak", "薄弱词"],
];
const EXAMS: [Exclude<ExamKind, "listen">, string, string, string][] = [
  ["cloze", "完形填空", "读句子选词 · Reading", "book"],
  ["definition", "释义选词", "看英文释义选词 · Reading", "dictionary"],
  ["picture", "看图选词", "看图说出单词 · Speaking", "picture"],
];
const ART = (id: string) => `${import.meta.env.BASE_URL}atlas/img/${id}.webp`;

export function Practice() {
  const atlas = useAtlas();
  const progress = useStore((s) => s.progress);
  const startLevel = useStore((s) => s.settings.startLevel);
  const examLevel = useStore((s) => s.settings.examLevel);
  const speakLevel: "A2" | "B1" = examLevel === "PET" ? "B1" : "A2";
  const [mode, setMode] = useState<Mode>("word");
  const [source, setSource] = useState<Source>(() => (Object.keys(progress.cards).length ? "recent" : "path"));
  // 每轮题量。之前各处写死 10 题、出题池还被 slice(0, 400/150) 掐死，
  // 3295 词里只有前几百个能被抽到——「整个题太少」的根子就在这。
  const [roundSize, setRoundSize] = useState(20);
  const [round, setRound] = useState<{ entries: Entry[]; key: number } | null>(null);
  const [exam, setExam] = useState<{ kind: Exclude<ExamKind, "listen">; questions: ExamQuestion[]; key: number } | null>(null);
  const [mock, setMock] = useState<{ level: "A2" | "B1"; key: number } | null>(null);
  const [speaking, setSpeaking] = useState<{ level: "A2" | "B1"; key: number } | null>(null);
  const [placement, setPlacement] = useState<{ questions: ExamQuestion[]; key: number } | null>(null);
  const [writing, setWriting] = useState<{ key: number } | null>(null);
  const [listen, setListen] = useState<{ questions: ExamQuestion[]; key: number } | null>(null);
  const [confusables, setConfusables] = useState(false);
  const [radio, setRadio] = useState<{ entries: Entry[]; key: number } | null>(null);
  const [radioSource, setRadioSource] = useState<"recent" | "saved" | "weak" | "all">("recent");
  const [flash, setFlash] = useState<{ entries: Entry[]; key: number } | null>(null);
  const [spell, setSpell] = useState<{ entries: Entry[]; key: number } | null>(null);
  const [translate, setTranslate] = useState<{ entries: Entry[]; key: number } | null>(null);
  const [dialogue, setDialogue] = useState<{ key: number } | null>(null);
  const [synant, setSynant] = useState<{ entries: Entry[]; key: number } | null>(null);
  const [wordbuild, setWordbuild] = useState<{ key: number } | null>(null);
  const [topicquest, setTopicquest] = useState<{ key: number } | null>(null);
  const [sound, setSound] = useState<{ key: number } | null>(null);
  const [dictation, setDictation] = useState<{ key: number } | null>(null);
  const [templates, setTemplates] = useState<{ key: number } | null>(null);
  const [picwrite, setPicwrite] = useState<{ key: number } | null>(null);
  const [pictalk, setPictalk] = useState<{ key: number } | null>(null);
  const [repeat, setRepeat] = useState<{ key: number } | null>(null);
  const [reading, setReading] = useState<{ key: number } | null>(null);
  const [forms, setForms] = useState<{ key: number } | null>(null);
  const [speed, setSpeed] = useState<{ key: number } | null>(null);
  const [aiTalk, setAiTalk] = useState<{ key: number } | null>(null);
  const [pk, setPk] = useState<{ entries: Entry[]; key: number } | null>(null);
  const [grammar, setGrammar] = useState<{ level?: "A2" | "B1"; key: number } | null>(null);
  const [openCloze, setOpenCloze] = useState<{ level?: "A2" | "B1"; key: number } | null>(null);
  const [gapFill, setGapFill] = useState<{ entries: Entry[]; key: number } | null>(null);
  const [spex, setSpex] = useState<{ key: number } | null>(null);
  const [sign, setSign] = useState<{ level?: "A2" | "B1"; key: number } | null>(null);
  const [aiQuiz, setAiQuiz] = useState<{ key: number } | null>(null);
  const [minpair, setMinpair] = useState<{ pairs: MinPair[]; key: number } | null>(null);

  /** 对立对：从 37 对里随机抽一轮，默认 8 对。 */
  const startMinPair = (n = 8) => {
    const pairs = shuffle(MIN_PAIRS, hashSeed(String(Date.now()))).slice(0, n);
    if (pairs.length) setMinpair({ pairs, key: Date.now() });
  };

  const startGapFill = async () => {
    const entries = await quick(20);
    if (entries.length) setGapFill({ entries, key: Date.now() });
  };

  const startPK = async () => {
    const ids = shuffle(pool, hashSeed(String(Date.now()))).slice(0, 40);
    const list = (await prefetch(atlas, ids)).filter((e): e is Entry => !!e && !!e.senses[0]?.zh);
    if (list.length >= 4) setPk({ entries: list, key: Date.now() });
  };

  const quick = async (n = 10) => {
    // 从整个池子随机抽，而不是只在前 150 个里打转。
    const ids = shuffle(pool, hashSeed(String(Date.now()))).slice(0, n);
    return (await prefetch(atlas, ids)).filter((e): e is Entry => !!e && e.ex.length > 0);
  };

  const startRadio = async () => {
    const ids =
      radioSource === "recent"
        ? pool.slice(0, 500)
        : radioSource === "saved"
          ? progress.bookmarks.filter((id) => atlas.byId.has(id)).slice(0, 500)
          : radioSource === "weak"
            ? weakWords(progress, 500).map((w) => w.id)
            : atlas.words.map((w) => w.id);
    const entries = (await prefetch(atlas, ids)).filter((e): e is Entry => !!e);
    if (entries.length) setRadio({ entries, key: Date.now() });
  };

  const pool = useMemo(() => {
    const learned = Object.entries(progress.cards)
      .sort((a, b) => (b[1].last ?? 0) - (a[1].last ?? 0))
      .map(([id]) => id);
    const ids =
      source === "recent"
        ? learned
        : source === "mistakes"
          ? progress.mistakes
          : source === "saved"
            ? progress.bookmarks
            : source === "weak"
              ? weakWords(progress, 300).map((w) => w.id)
              : atlas.words.filter((w) => w.cefr >= resolveLevel(atlas, startLevel)).map((w) => w.id);
    return ids.filter((id) => atlas.byId.has(id));
  }, [atlas, progress, source, startLevel]);

  const start = async () => {
    const ids = shuffle(pool, hashSeed(String(Date.now()))).slice(0, roundSize);
    const entries = (await prefetch(atlas, ids)).filter((e): e is Entry => !!e && (mode === "word" || e.ex.length > 0));
    if (entries.length) setRound({ entries, key: Date.now() });
  };

  const startExam = async (kind: Exclude<ExamKind, "listen">) => {
    // 多抽几倍的候选词条，好让 generateExam 能凑满 roundSize 道题
    // （不是每个词条都能出题：缺例句/缺图/缺干扰项的会被跳过）。
    const ids = shuffle(pool, hashSeed(String(Date.now()))).slice(0, roundSize * 4);
    const entries = (await prefetch(atlas, ids)).filter((e): e is Entry => !!e);
    const questions = generateExam(atlas, entries, kind, roundSize);
    if (questions.length) setExam({ kind, questions, key: Date.now() });
  };

  const startMock = (level: "A2" | "B1") => {
    setMock({ level, key: Date.now() });
  };

  const startFlash = async () => {
    const entries = await quick(roundSize);
    if (entries.length) setFlash({ entries, key: Date.now() });
  };
  const startSpell = async () => {
    const entries = await quick(roundSize);
    if (entries.length) setSpell({ entries, key: Date.now() });
  };
  const startTranslate = async () => {
    const entries = await quick(roundSize);
    if (entries.length) setTranslate({ entries, key: Date.now() });
  };
  const startSynAnt = async () => {
    // 近反义词表覆盖稀，多抽几倍再筛，免得一轮凑不满。
    const entries = (await quick(roundSize * 3)).filter((e) => e.syn.length || e.ant.length);
    if (entries.length) setSynant({ entries: entries.slice(0, roundSize), key: Date.now() });
  };

  const startPlacement = async () => {
    const tiers = ["A1", "A2", "B1"].map((l) => {
      const idx = atlas.cefr.indexOf(l);
      return shuffle(
        atlas.words.filter((w) => w.cefr === idx && atlas.byId.has(w.id)).map((w) => w.id),
        hashSeed(l),
      ).slice(0, 9);
    });
    const entries = (await prefetch(atlas, tiers.flat())).filter((e): e is Entry => !!e);
    const questions = generatePlacement(atlas, entries, 8);
    if (questions.length) setPlacement({ questions, key: Date.now() });
  };

  const startListening = async () => {
    const ids = shuffle(pool, hashSeed(String(Date.now()))).slice(0, roundSize * 4);
    const entries = (await prefetch(atlas, ids)).filter((e): e is Entry => !!e);
    const questions = generateListening(atlas, entries, roundSize);
    if (questions.length) setListen({ questions, key: Date.now() });
  };

  // Mistake-book: retrain a definition-style round over the recent mistakes.
  const mistakeWords = useMemo(
    () => progress.mistakes.filter((id) => atlas.byId.has(id)).slice(0, 12),
    [atlas, progress.mistakes],
  );

  // 错因分析需要完整词条（含 senses / fam / tip），异步取一次。
  const [mistakeEntries, setMistakeEntries] = useState<Entry[]>([]);
  useEffect(() => {
    let alive = true;
    void prefetch(atlas, mistakeWords).then((list) => {
      if (alive) setMistakeEntries(list.filter((x): x is Entry => !!x));
    });
    return () => {
      alive = false;
    };
  }, [atlas, mistakeWords]);

  const mistakesWhy = useMemo(() => {
    const pool = atlas.words.map((w) => w.word);
    const out: Record<string, WhyWrong> = {};
    for (const e of mistakeEntries) out[e.id] = whyWrong(e, lookalikes(e.w, pool));
    return out;
  }, [atlas, mistakeEntries]);
  const startMistakes = async () => {
    const ids = shuffle(progress.mistakes.filter((id) => atlas.byId.has(id)), hashSeed(String(Date.now()))).slice(0, roundSize * 2);
    if (!ids.length) return;
    const entries = (await prefetch(atlas, ids)).filter((e): e is Entry => !!e);
    const questions = generateExam(atlas, entries, "definition", roundSize);
    if (questions.length) setExam({ kind: "definition", questions, key: Date.now() });
  };

  if (round) return <TypingRound key={round.key} mode={mode} entries={round.entries} onExit={() => setRound(null)} onAgain={start} />;
  if (exam) return <ExamRound key={exam.key} kind={exam.kind} questions={exam.questions} onExit={() => setExam(null)} onAgain={() => void startExam(exam.kind)} />;
  if (mock) return <MockRound key={mock.key} level={mock.level} onExit={() => setMock(null)} onAgain={() => startMock(mock.level)} />;
  if (minpair)
    return (
      <MinimalPairRound
        key={minpair.key}
        pairs={minpair.pairs}
        onExit={(r) => {
          if (r) store.progress((p) => ({ ...p, exam: [...p.exam, { at: Date.now(), kind: "speaking", items: r.items, correct: r.correct, score: r.score }] }));
          setMinpair(null);
        }}
        onAgain={() => startMinPair(minpair.pairs.length)}
      />
    );
  if (speaking) return <SpeakingRound key={speaking.key} level={speaking.level} onExit={(r) => { if (r) store.progress((p) => ({ ...p, exam: [...p.exam, { at: Date.now(), kind: "speaking", items: r.items, correct: 0, score: r.score }] })); setSpeaking(null); }} onAgain={() => setSpeaking({ level: speaking.level, key: Date.now() })} />;
  if (placement) return <PlacementRound key={placement.key} questions={placement.questions} onExit={() => setPlacement(null)} onAgain={() => void startPlacement()} />;
  if (writing) return <WritingRound key={writing.key} onExit={(r) => { if (r) store.progress((p) => ({ ...p, exam: [...p.exam, { at: Date.now(), kind: "writing", items: 1, correct: 0, score: r.score }] })); setWriting(null); }} />;
  if (listen) return <ListeningRound key={listen.key} questions={listen.questions} onExit={(r) => { if (r) store.progress((p) => ({ ...p, exam: [...p.exam, { at: Date.now(), kind: "listening", items: r.items, correct: r.correct }] })); setListen(null); }} onAgain={() => void startListening()} />;
  if (confusables)
    return <ConfusableRound onExit={() => setConfusables(false)} onAgain={() => { setConfusables(false); window.setTimeout(() => setConfusables(true), 30); }} />;
  if (flash) return <FlashcardRound key={flash.key} entries={flash.entries} onExit={() => setFlash(null)} onAgain={() => void startFlash()} />;
  if (spell) return <SpellRound key={spell.key} entries={spell.entries} onExit={() => setSpell(null)} onAgain={() => void startSpell()} />;
  if (translate) return <TranslateRound key={translate.key} entries={translate.entries} onExit={() => setTranslate(null)} onAgain={() => void startTranslate()} />;
  if (dialogue) return <DialogueRound key={dialogue.key} onExit={() => setDialogue(null)} onAgain={() => setDialogue({ key: Date.now() })} />;
  if (synant) return <SynAntRound key={synant.key} entries={synant.entries} onExit={() => setSynant(null)} onAgain={() => void startSynAnt()} />;
  if (wordbuild) return <WordBuilding key={wordbuild.key} onExit={() => setWordbuild(null)} onAgain={() => setWordbuild({ key: Date.now() })} />;
  if (topicquest) return <TopicQuest key={topicquest.key} onExit={() => setTopicquest(null)} />;
  if (sound) return <SoundClinic key={sound.key} onExit={() => setSound(null)} onAgain={() => setSound({ key: Date.now() })} />;
  if (dictation) return <DictationRound key={dictation.key} onExit={() => setDictation(null)} onAgain={() => setDictation({ key: Date.now() })} />;
  if (templates) return <WritingTemplates key={templates.key} onExit={() => setTemplates(null)} onAgain={() => setTemplates({ key: Date.now() })} />;
  if (picwrite) return <PictureWrite key={picwrite.key} onExit={() => setPicwrite(null)} onAgain={() => setPicwrite({ key: Date.now() })} />;
  if (pictalk) return <PictureTalk key={pictalk.key} onExit={() => setPictalk(null)} onAgain={() => setPictalk({ key: Date.now() })} />;
  if (repeat) return <RepeatRound key={repeat.key} onExit={() => setRepeat(null)} onAgain={() => setRepeat({ key: Date.now() })} />;
  if (reading) return <ReadingMatch key={reading.key} onExit={() => setReading(null)} onAgain={() => setReading({ key: Date.now() })} />;
  if (forms) return <WordForms key={forms.key} onExit={() => setForms(null)} onAgain={() => setForms({ key: Date.now() })} />;
  if (speed) return <SpeedListen key={speed.key} onExit={() => setSpeed(null)} onAgain={() => setSpeed({ key: Date.now() })} />;
  if (aiTalk) return <AISpeak key={aiTalk.key} onExit={() => setAiTalk(null)} />;
  if (pk) return <PKRound key={pk.key} entries={pk.entries} onExit={() => setPk(null)} onAgain={() => void startPK()} />;
  if (grammar) return <GrammarClinic key={grammar.key} level={grammar.level} onExit={() => setGrammar(null)} />;
  if (openCloze) return <OpenClozeRound key={openCloze.key} level={openCloze.level} onExit={() => setOpenCloze(null)} />;
  if (gapFill) return <GapFillRound key={gapFill.key} entries={gapFill.entries} onExit={() => setGapFill(null)} onAgain={() => void startGapFill()} />;
  if (spex) return <SpeakingExam key={spex.key} level={speakLevel} onExit={() => setSpex(null)} onAgain={() => setSpex({ key: Date.now() })} />;
  if (sign) return <SignRound key={sign.key} level={sign.level} onExit={() => setSign(null)} onAgain={() => setSign({ key: Date.now() })} />;
  if (aiQuiz) return <AiQuiz key={aiQuiz.key} onExit={() => setAiQuiz(null)} />;
  if (radio)
    return (
      <div className="page practice">
        <header className="page-head">
          <p className="eyebrow">单词电台 · Radio</p>
          <h1 className="display">让耳朵，先记住它们。</h1>
          <p className="lede">英音 → 美音 → 例句自动连播，不占手，随时磨耳朵。</p>
        </header>
        <section className="panel">
          <RadioPlayer key={radio.key} title={radioSource === "recent" ? "最近学过" : radioSource === "saved" ? "收藏" : radioSource === "weak" ? "薄弱词" : "全部词汇"} entries={radio.entries} />
          <div className="radio-exit">
            <button className="btn btn-ghost" onClick={() => setRadio(null)}>
              返回
            </button>
          </div>
        </section>
      </div>
    );

  const best = progress.typing.filter((t) => t.mode === mode).reduce((m, t) => Math.max(m, t.wpm), 0);
  return (
    <div className="page practice">
      <header className="page-head">
        <p className="eyebrow">练习 · Typing Studio</p>
        <h1 className="display">让手，也记住它们。</h1>
        <p className="lede">打字只练拼写和手感，不会改动记忆进度。</p>
      </header>
      <div className="practice-grid">
        <section className="panel exam-entry">
          <h3 className="eyebrow">
            <GraduationCap size={15} /> 剑桥真题题型
          </h3>
          <p className="muted">仿照 KET/PET 的 Reading 与 Speaking 出题，只测词义理解，不改记忆进度。</p>
          <div className="mode-cards">
            {EXAMS.map(([k, name, desc, art]) => (
              <button key={k} className="mode-card" onClick={() => void startExam(k)} disabled={!pool.length}>
                <img className="mode-art" src={ART(art)} alt="" />
                <b>{name}</b>
                <small>{desc}</small>
              </button>
            ))}
            <button className="mode-card" onClick={() => setConfusables(true)}>
              <img className="mode-art" src={ART("borrow")} alt="" />
              <b>易混词辨析</b>
              <small>borrow/lend 这类 · 常考易错</small>
            </button>
            <button className="mode-card" onClick={() => setAiQuiz({ key: Date.now() })}>
              <img className="mode-art" src={ART("exam")} alt="" />
              <b>AI 随堂测</b>
              <small>本地出题 · 完形/释义无限刷</small>
            </button>
            <button className="mode-card" onClick={() => setSign({ key: Date.now() })}>
              <img className="mode-art" src={ART("sign")} alt="" />
              <b>标识识别</b>
              <small>看告示选含义 · Reading Part 1</small>
            </button>
          </div>
        </section>
        <section className="panel exam-entry">
          <h3 className="eyebrow">
            <BookOpen size={15} /> 考点专项
          </h3>
          <p className="muted">考纲里的语法点全部拆开：先看规则，再做题，错的自动记进掌握度。填空类题型单独练。</p>
          <div className="mode-cards">
            <button className="mode-card" onClick={() => setGrammar({ key: Date.now() })}>
              <img className="mode-art" src={ART("write")} alt="" />
              <b>语法考点闯关</b>
              <small>30 个考点 · 180+ 题 · 带讲解</small>
            </button>
            <button className="mode-card" onClick={() => setGrammar({ level: "B1", key: Date.now() })}>
              <img className="mode-art" src={ART("question")} alt="" />
              <b>PET 语法专项</b>
              <small>只看 B1 加考的 12 个难点</small>
            </button>
            <button className="mode-card" onClick={() => setOpenCloze({ key: Date.now() })}>
              <img className="mode-art" src={ART("book")} alt="" />
              <b>开放式填空</b>
              <small>不给选项自己写词 · Part 5/6</small>
            </button>
            <button className="mode-card" onClick={() => void startGapFill()} disabled={!pool.length}>
              <img className="mode-art" src={ART("listen")} alt="" />
              <b>听力填空</b>
              <small>听句子填关键词 · Part 2/3</small>
            </button>
          </div>
        </section>
        <section className="panel exam-entry">
          <h3 className="eyebrow">
            <Award size={15} /> 考场
          </h3>
          <p className="muted">按真实考试的方式练：限时模考出混合卷，口语问答模拟考官 Part 1。</p>
          <div className="mode-cards">
            <button className="mode-card" onClick={() => void startMock("A2")} disabled={!pool.length}>
              <img className="mode-art" src={ART("exam")} alt="" />
              <b>KET 限时模考</b>
              <small>整卷 31 题 · 30 分钟 · A2 词</small>
            </button>
            <button className="mode-card" onClick={() => void startMock("B1")} disabled={!pool.length}>
              <img className="mode-art" src={ART("test")} alt="" />
              <b>PET 限时模考</b>
              <small>整卷 31 题 · 30 分钟 · B1 词</small>
            </button>
            <button className="mode-card" onClick={() => setSpeaking({ level: "A2", key: Date.now() })}>
              <img className="mode-art" src={ART("talk")} alt="" />
              <b>KET 口语问答</b>
              <small>5 问 · Speaking Part 1</small>
            </button>
            <button className="mode-card" onClick={() => setSpeaking({ level: "B1", key: Date.now() })}>
              <img className="mode-art" src={ART("talk")} alt="" />
              <b>PET 口语问答</b>
              <small>5 问 · Speaking Part 1</small>
            </button>
            <button className="mode-card" onClick={() => void startListening()} disabled={!pool.length}>
              <img className="mode-art" src={ART("listen")} alt="" />
              <b>听力练习</b>
              <small>听例句选词义 · Listening</small>
            </button>
            <button className="mode-card" onClick={() => setSpex({ key: Date.now() })}>
              <img className="mode-art" src={ART("dialogue")} alt="" />
              <b>PET 口语 Part 3+4</b>
              <small>本地模型当搭档和考官 · 出评分</small>
            </button>
            <button className="mode-card" onClick={() => void startPlacement()} disabled={!pool.length}>
              <img className="mode-art" src={ART("question")} alt="" />
              <b>摸底测试</b>
              <small>24 题 · 测词汇量 · 推荐级别</small>
            </button>
            <button className="mode-card" onClick={() => setWriting({ key: Date.now() })}>
              <img className="mode-art" src={ART("pen")} alt="" />
              <b>写作练习</b>
              <small>PET 邮件 / 短故事 · 范文对照</small>
            </button>
          </div>
        </section>
        <section className="panel ai-entry">
          <h3 className="eyebrow">
            <Bot size={15} /> 本地 AI 玩法
          </h3>
          <p className="muted">跑在你自己电脑上的本地模型（Ollama）。全程离线，对话不联网、不上传。</p>
          <div className="mode-cards">
            <button className="mode-card" onClick={() => setAiTalk({ key: Date.now() })}>
              <img className="mode-art" src={ART("robot")} alt="" />
              <b>AI 口语陪练</b>
              <small>和小拾自由聊天 · 说错会悄悄帮你改</small>
            </button>
            <button className="mode-card" onClick={() => void startPK()} disabled={!pool.length}>
              <img className="mode-art" src={ART("trophy")} alt="" />
              <b>单词 PK 对战</b>
              <small>7 题抢答 · 本地模型当对手</small>
            </button>
          </div>
          <p className="muted ai-note">
            需要先在终端执行 <code>OLLAMA_ORIGINS="*" ollama serve</code>，并 <code>ollama pull qwen2.5:3b</code>。没连上时会给提示。
          </p>
        </section>
        <section className="panel">
          <h3 className="eyebrow">模式</h3>
          <div className="mode-cards">
            {MODES.map(([k, name, desc, , art]) => (
              <button key={k} className={`mode-card ${mode === k ? "is-on" : ""}`} onClick={() => setMode(k)} aria-pressed={mode === k}>
                <img className="mode-art" src={ART(art)} alt="" />
                <b>{name}</b>
                <small>{desc}</small>
              </button>
            ))}
          </div>
          <h3 className="eyebrow">词来自</h3>
          <div className="segmented segmented-wide">
            {SOURCES.map(([k, label]) => (
              <button key={k} className={source === k ? "is-on" : ""} onClick={() => setSource(k)} aria-pressed={source === k}>
                {label}
              </button>
            ))}
          </div>
          <h3 className="eyebrow">每轮题量</h3>
          <div className="segmented segmented-wide">
            {[10, 20, 30, 50].map((n) => (
              <button key={n} className={roundSize === n ? "is-on" : ""} onClick={() => setRoundSize(n)} aria-pressed={roundSize === n}>
                {n}
              </button>
            ))}
          </div>
          <p className="muted">
            {pool.length
              ? source === "path"
                ? `从学习路线的 ${pool.length} 个词里随机抽 ${roundSize} 个。`
                : `可练 ${pool.length.toLocaleString()} 个词，每轮随机 ${roundSize} 个。`
              : "这里还没有词，先去学几个，或换个来源。"}
          </p>
          <button className="btn btn-primary btn-xl" onClick={start} disabled={!pool.length}>
            开始一轮
          </button>
        </section>
        <section className="panel">
          <h3 className="eyebrow">更多玩法</h3>
          <div className="mode-cards">
            <button className="mode-card" onClick={() => void startFlash()} disabled={!pool.length}>
              <img className="mode-art" src={ART("card")} alt="" />
              <b>词卡速刷</b>
              <small>翻卡过词 · 30 秒一轮</small>
            </button>
            <button className="mode-card" onClick={() => void startSpell()} disabled={!pool.length}>
              <img className="mode-art" src={ART("spell")} alt="" />
              <b>听音拼写</b>
              <small>听词拼出来 · Spelling</small>
            </button>
            <button className="mode-card" onClick={() => void startTranslate()} disabled={!pool.length}>
              <img className="mode-art" src={ART("translate")} alt="" />
              <b>中译英造句</b>
              <small>看着中文写英文 · 有参考</small>
            </button>
            <button className="mode-card" onClick={() => setDialogue({ key: Date.now() })}>
              <img className="mode-art" src={ART("dialogue")} alt="" />
              <b>对话听力</b>
              <small>听对话选答案 · 仿真题</small>
            </button>
          </div>
        </section>
        <section className="panel">
          <h3 className="eyebrow">词汇深挖</h3>
          <div className="mode-cards">
            <button className="mode-card" onClick={() => void startSynAnt()} disabled={!pool.length}>
              <img className="mode-art" src={ART("dictionary")} alt="" />
              <b>同义反义配对</b>
              <small>找词义最近的词 · 词库 1400+ 词</small>
            </button>
            <button className="mode-card" onClick={() => setWordbuild({ key: Date.now() })}>
              <img className="mode-art" src={ART("write")} alt="" />
              <b>构词法小课</b>
              <small>前后缀派生 · un-/re-/-tion/-ly</small>
            </button>
            <button className="mode-card" onClick={() => setTopicquest({ key: Date.now() })}>
              <img className="mode-art" src={ART("book")} alt="" />
              <b>话题闯关</b>
              <small>10 词一关 · 全对解锁下一话题</small>
            </button>
            <button className="mode-card" onClick={() => setSound({ key: Date.now() })}>
              <img className="mode-art" src={ART("listen")} alt="" />
              <b>易错发音诊室</b>
              <small>th/长短元音/卷舌 · 听辨挑战</small>
            </button>
          </div>
        </section>
        <section className="panel">
          <h3 className="eyebrow">考试冲刺</h3>
          <div className="mode-cards">
            <button className="mode-card" onClick={() => setTemplates({ key: Date.now() })}>
              <img className="mode-art" src={ART("pen")} alt="" />
              <b>写作范文仿写</b>
              <small>PET 邮件+短故事模板 · 填词练套路</small>
            </button>
            <button className="mode-card" onClick={() => setDictation({ key: Date.now() })}>
              <img className="mode-art" src={ART("listen")} alt="" />
              <b>整句听写</b>
              <small>听例句默写整句 · 练连读意群</small>
            </button>
          </div>
        </section>
        <section className="panel">
          <h3 className="eyebrow">口语写作</h3>
          <div className="mode-cards">
            <button className="mode-card" onClick={() => setPicwrite({ key: Date.now() })}>
              <img className="mode-art" src={ART("picture")} alt="" />
              <b>看图写话</b>
              <small>KET Writing Part 7 · 看图写两句</small>
            </button>
            <button className="mode-card" onClick={() => setPictalk({ key: Date.now() })}>
              <img className="mode-art" src={ART("camera")} alt="" />
              <b>看图说话</b>
              <small>PET Speaking Part 2 · 60s 描述</small>
            </button>
            <button className="mode-card" onClick={() => setRepeat({ key: Date.now() })}>
              <img className="mode-art" src={ART("talk")} alt="" />
              <b>例句跟读</b>
              <small>听→模仿→对照 · 练语流</small>
            </button>
            <button className="mode-card" onClick={() => startMinPair()}>
              <img className="mode-art" src={ART("sound")} alt="" />
              <b>发音对立对</b>
              <small>ship / sheep · 定位混淆的音</small>
            </button>
          </div>
        </section>
        <section className="panel">
          <h3 className="eyebrow">阅读语法</h3>
          <div className="mode-cards">
            <button className="mode-card" onClick={() => setReading({ key: Date.now() })}>
              <img className="mode-art" src={ART("book")} alt="" />
              <b>阅读信息匹配</b>
              <small>PET Reading Part 4 · 需求配广告</small>
            </button>
            <button className="mode-card" onClick={() => setForms({ key: Date.now() })}>
              <img className="mode-art" src={ART("write")} alt="" />
              <b>单词变形擂台</b>
              <small>过去式/复数/比较级 · 10 题</small>
            </button>
            <button className="mode-card" onClick={() => setSpeed({ key: Date.now() })}>
              <img className="mode-art" src={ART("listen")} alt="" />
              <b>听力变速</b>
              <small>0.75x–1.25x 三档练耳朵</small>
            </button>
          </div>
        </section>
        <section className="panel">
          <h3 className="eyebrow">错题本 · 为什么会错</h3>
          <p className="muted">最近答错的词都在这里，每个都标了「为什么会错」——从词的拼写、形近词、义项数量推出来的，不是瞎猜。</p>
          {mistakeWords.length ? (
            <>
              <div className="mw-list">
                {mistakeWords.map((id) => {
                  const ref = atlas.byId.get(id);
                  const why = mistakesWhy[id];
                  return (
                    <div className="mw-card" key={id}>
                      <button className="mw-word" onClick={() => openWord(id)} title="点击查看词条">
                        <b lang="en">{ref?.word ?? id}</b>
                        <small>{ref?.zh ?? ""}</small>
                      </button>
                      {why ? (
                        <div className="mw-why">
                          <span className="mw-tag">{why.tag}</span>
                          <p>{why.why}</p>
                          <p className="mw-tip">{why.tip}</p>
                        </div>
                      ) : (
                        <p className="muted">正在分析…</p>
                      )}
                    </div>
                  );
                })}
              </div>
              <button className="btn btn-primary" onClick={() => void startMistakes()}>
                <RotateCcw size={17} /> 重练错题
              </button>
            </>
          ) : (
            <p className="muted">还没有错词记录。练几轮，答错的词会自动进到这里。</p>
          )}
        </section>
        <section className="panel">
          <h3 className="eyebrow">
            <Headphones size={15} /> 单词电台
          </h3>
          <p className="muted">把词表变成自动连播的音频流：英音 → 美音 → 例句，通勤、洗碗的时候听。</p>
          <img className="radio-banner" src={ART("radio")} alt="" loading="lazy" />
          <div className="segmented segmented-wide radio-source">
            {(
              [
                ["recent", "最近学过"],
                ["saved", "收藏"],
                ["weak", "薄弱词"],
                ["all", "全部词汇"],
              ] as const
            ).map(([k, label]) => (
              <button key={k} className={radioSource === k ? "is-on" : ""} onClick={() => setRadioSource(k)} aria-pressed={radioSource === k}>
                {label}
              </button>
            ))}
          </div>
          <button className="btn btn-primary btn-xl" onClick={() => void startRadio()}>
            <Play size={18} /> 开始播放
          </button>
        </section>
        <section className="panel practice-side">
          <img src={`${import.meta.env.BASE_URL}brand/${mode === "dictation" ? "listen" : "typing"}.webp`} alt="" />
          <dl className="mini-stats">
            <div>
              <dt>最佳速度</dt>
              <dd>
                {best}
                <small>WPM</small>
              </dd>
            </div>
            <div>
              <dt>完成轮次</dt>
              <dd>{progress.typing.length}</dd>
            </div>
          </dl>
          <p className="muted">WPM 按标准每 5 个字符计 1 词，只统计正确输入。</p>
        </section>
      </div>
    </div>
  );
}

function TypingRound({ mode, entries, onExit, onAgain }: { mode: Mode; entries: Entry[]; onExit: () => void; onAgain: () => void }) {
  const atlas = useAtlas();
  const settings = useStore((s) => s.settings);
  const [i, setI] = useState(0);
  const [value, setValue] = useState("");
  // Running totals live in a ref so every keystroke is counted exactly once.
  const totalsRef = useRef({ typed: 0, correct: 0, accepted: 0, ms: 0 });
  const [totals, setTotals] = useState(totalsRef.current);
  const [done, setDone] = useState(false);
  const started = useRef<number | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const e = entries[i];
  const target = mode === "word" ? e.w : e.ex[0].en;

  useEffect(() => {
    setValue("");
    started.current = null;
    input.current?.focus();
    if (mode === "dictation") void play(atlas.audio(e, "ex"), e.ex[0].en, settings.accent);
    if (mode === "word" && settings.autoplay) void play(atlas.audio(e, settings.accent), e.w, settings.accent);
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => stopAudio(), []);

  const onChange = (next: string) => {
    if (done) return;
    if (started.current === null && next) started.current = performance.now();
    const d = typingDelta(value, next, target);
    if (settings.sfx && d.total > 0) void cue("key");
    const t = totalsRef.current;
    totalsRef.current = { ...t, typed: t.typed + d.total, correct: t.correct + d.correct };
    setTotals(totalsRef.current);
    setValue(next);
    if (clean(next).length >= clean(target).length && same(next.trimEnd(), target)) finishItem(next);
  };

  const finishItem = (final: string) => {
    const ms = started.current ? performance.now() - started.current : 0;
    const accepted = correctCharacterCount(final, target);
    if (settings.sfx) void cue("correct");
    const t = totalsRef.current;
    const nt = { ...t, accepted: t.accepted + accepted, ms: t.ms + ms };
    totalsRef.current = nt;
    setTotals(nt);
    if (i + 1 >= entries.length) {
      setDone(true);
      const m = typingMetrics(nt.correct, nt.typed, nt.accepted, nt.ms);
      store.progress((p) => ({ ...p, typing: [...p.typing, { at: Date.now(), mode, items: entries.length, wpm: m.wpm, accuracy: m.accuracy }].slice(-500) }));
    } else window.setTimeout(() => setI(i + 1), 260);
  };

  const m = typingMetrics(totals.correct, totals.typed, totals.accepted, totals.ms);
  const chars = Array.from(target);
  const typed = Array.from(value);

  if (done)
    return (
      <div className="page practice">
        <section className="panel typing-done">
          <p className="eyebrow">本轮完成</p>
          <h1 className="display">
            {m.wpm} <small>WPM</small>
          </h1>
          <p className="lede">准确率 {m.accuracy}% · {entries.length} 项</p>
          <div className="summary-actions">
            <button className="btn btn-ghost" onClick={onExit}>
              返回
            </button>
            <button className="btn btn-primary btn-xl" onClick={onAgain} autoFocus>
              <RotateCcw size={18} /> 再来一轮
            </button>
          </div>
        </section>
      </div>
    );

  return (
    <div className="page practice typing">
      <header className="typing-top">
        <button className="btn btn-ghost" onClick={onExit}>
          结束
        </button>
        <AmbiencePicker />
        <div className="learn-progress">
          <span style={{ width: `${(i / entries.length) * 100}%` }} />
        </div>
        <span className="typing-meter">
          <b>{m.wpm}</b> WPM · <b>{m.accuracy}%</b>
        </span>
      </header>
      <section className="typing-stage" onClick={() => input.current?.focus()}>
        {mode === "word" && (
          <div className="typing-cue">
            <Illustration src={atlas.img(e)} word={e.w} topic={0} eager />
            <p>
              <span className="pos">{e.senses[0].pos}</span> {e.senses[0].zh}
            </p>
          </div>
        )}
        {mode !== "word" && (
          <p className="typing-zh">
            {mode === "dictation" && (
              <button className="link" onClick={() => play(atlas.audio(e, "ex"), e.ex[0].en, settings.accent)}>
                再听一遍
              </button>
            )}
            {e.ex[0].zh}
          </p>
        )}
        <p className={`typing-text ${mode === "word" ? "is-word" : ""} ${mode === "dictation" ? "is-hidden" : ""}`} lang="en" aria-hidden="true">
          {chars.map((ch, k) => {
            const t = typed[k];
            const cls = t === undefined ? (k === typed.length ? "is-caret" : "") : same(t, ch) ? "is-ok" : "is-bad";
            const show = mode === "dictation" && t === undefined ? (ch === " " ? " " : /[A-Za-z]/.test(ch) ? "·" : ch) : ch;
            return (
              <span key={k} className={cls}>
                {show}
              </span>
            );
          })}
        </p>
        <input
          ref={input}
          className="typing-input"
          value={value}
          onChange={(ev) => onChange(ev.target.value)}
          autoFocus
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          aria-label="在这里输入"
        />
        <p className="muted typing-help">
          {mode === "dictation" ? "听不清可以点「再听一遍」。" : "直接开始输入，全部正确后自动进入下一项。"} 第 {i + 1}/{entries.length} 项
        </p>
      </section>
    </div>
  );
}
