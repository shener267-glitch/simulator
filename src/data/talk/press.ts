import type { TalkTree } from "../../types/talk";
import { SAWATARI } from "../characters";

/**
 * 官邸3階エントランスには、ぶら下がりの時間でなくても記者がいる。
 *
 * ここで喋ったことは、会見でなくても記事になる。総理の言葉に「オフ」は
 * ないという一点を、選択肢の形で置いてある。
 */
export const PRESS_TREE: TalkTree = {
  id: "press",
  label: "記者に応じる",
  short: "記者",
  emoji: "📸",
  hint: "何人かがこちらに気づいて、手帳を開いた",
  rootId: "root",
  nodes: [
    {
      id: "root",
      prompt: "「総理、少しよろしいですか」",
      choices: [
        { kind: "goto", id: "go-answer", label: "答える", to: "answer" },
        { kind: "goto", id: "go-ask", label: "こちらから聞く", to: "ask" },
        { kind: "end", id: "pass", label: "会釈だけして通る" },
      ],
    },
    {
      id: "answer",
      prompt: "「一言だけでも」",
      choices: [
        {
          kind: "topic",
          id: "press-economy",
          label: "経済対策について一言",
          once: true,
          flags: ["talked-to-press"],
          reply: {
            minutes: 5,
            text: "「来週中に骨子をまとめます。それ以上は、まとまってから」\n\n手が一斉に動いた。四社が同じ一行を書いている。\n\n言った内容より、廊下で立ち止まって答えたという事実の方が記事になる、と後で沢渡に言われることになる。",
            highlight: "エントランスで記者に立ち止まって答えた。",
          },
        },
        {
          kind: "topic",
          id: "press-mood",
          label: "就任二日目の心境を聞かれる",
          once: true,
          flags: ["talked-to-press", "spoke-plainly"],
          reply: {
            minutes: 5,
            text: "「実感ですか。……昨日より、少しだけ」\n\n笑いが起きた。書いている記者は一人だけだった。書かなかった三人の方が、たぶんこちらをよく見ている。",
          },
        },
        {
          kind: "topic",
          id: "press-refuse",
          label: "答えられない、と言う",
          once: true,
          reply: {
            minutes: 2,
            text: "「その件は、この場ではお答えしません」\n\n食い下がられはしなかった。ただ、手帳は閉じられなかった。「答えなかった」も一行になる。",
          },
        },
      ],
    },
    {
      id: "ask",
      prompt: "こちらから聞くこともできる。",
      choices: [
        {
          kind: "topic",
          id: "press-what",
          label: "いま何を追っているのかを聞く",
          once: true,
          flags: ["asked-the-press"],
          reply: {
            minutes: 5,
            text: "「総理から聞かれるとは思いませんでした」\n\n一人が少し考えてから言った。「財源です。党内で割れているという話が出ていて、そこを当たっています」\n\n知っていることと、知られていることは別だった。それが分かっただけでも五分の価値はあった。",
            highlight: "記者に、いま何を追っているのかを聞いた。",
          },
        },
        {
          kind: "topic",
          id: "press-who",
          label: "誰がそれを言っているのかを聞く",
          once: true,
          requiresFlag: "asked-the-press",
          reply: {
            minutes: 5,
            text: "「それは申し上げられません」\n\n即答だった。当然だ。\n\n「ただ」と、その記者は続けた。「総理がそれをお聞きになった、ということは書きません」",
          },
        },
      ],
    },
  ],
};

/** 記者に何か言えば、必ず沢渡の耳に入る。 */
export const PRESS_AFTERMATH = `${SAWATARI.shortName}には、こちらが言う前に伝わっている。`;
