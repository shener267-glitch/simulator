import type { TalkTree } from "../../types/talk";
import { ELDER_SON, WIFE, YOUNGER_SON } from "../characters";

/**
 * 設計書4章。妻との会話は普通の夫婦の会話にする。政治の話には寄せない。
 * リビングでしか掴まらない — 寝室まで呼びには来ない人なので。
 */
export const WIFE_TREE: TalkTree = {
  id: "wife",
  label: `${WIFE.name}と話す`,
  short: WIFE.name,
  emoji: "👩",
  hint: "台所に灯りがついている",
  channel: "in-person",
  places: ["living"],
  rootId: "root",
  nodes: [
    {
      id: "root",
      prompt: "「起きたの。もう少し寝てるかと思った」",
      choices: [
        {
          kind: "topic",
          id: "last-night",
          label: "昨日のことを話す",
          once: true,
          flags: ["talked-to-wife"],
          reply: {
            minutes: 10,
            speaker: WIFE.name,
            text: "コーヒーの匂いがしていた。カップを二つ出しながら、こちらを見もせずに言う。\n\n「昨日、何時だった。私、途中で寝ちゃった」\n\n答えると、そう、とだけ返ってきた。テレビはつけていない。この家で昨日のニュースを見ていないのは、たぶんこの人だけだ。",
          },
        },
        {
          kind: "topic",
          id: "younger-son",
          label: `${YOUNGER_SON.name}のことを聞く`,
          once: true,
          flags: ["talked-to-wife", "asked-about-family"],
          reply: {
            minutes: 10,
            speaker: WIFE.name,
            text: "「まだ寝てるわよ。昨日も帰り遅くて」\n\n次男の話になった。大学に入って二年目、最近はほとんど顔を合わせていない。\n\n「バイト増やしたみたい。何に使うのか聞いても言わないの」",
            highlight: `${WIFE.name}と${YOUNGER_SON.name}の近況を話した。`,
          },
        },
        {
          kind: "topic",
          id: "elder-son",
          label: `${ELDER_SON.name}のことを聞く`,
          once: true,
          flags: ["talked-to-wife", "asked-about-family"],
          reply: {
            minutes: 10,
            speaker: WIFE.name,
            text: `「おととい連絡あった」\n\n長男は就職して家を出ている。\n\n「お父さんに『おめでとう』って伝えといて、って。それだけ。あの子らしいけど」`,
            highlight: `${ELDER_SON.name}から祝いの言付けを聞いた。`,
          },
        },
        {
          kind: "topic",
          id: "tonight",
          label: "今日のことを話す",
          once: true,
          flags: ["talked-to-wife"],
          reply: {
            minutes: 10,
            speaker: WIFE.name,
            text: "「今日、何時に帰るの」\n\n答えられなかった。分からない、と言うと、そう、とだけ返ってきた。\n\n「夕飯は作っておくけど、冷蔵庫に入れとくから。温めて食べて」\n\n少し間があって、付け足すように言った。\n\n「無理しないでね」",
            highlight: `${WIFE.name}に、帰る時間を答えられなかった。`,
          },
        },
        { kind: "end", id: "leave", label: "話をやめる" },
      ],
    },
  ],
};

/** 07:00過ぎにようやく起きてくる。話せることは多くない。 */
export const YOUNGER_SON_TREE: TalkTree = {
  id: "son",
  label: `${YOUNGER_SON.name}と話す`,
  short: YOUNGER_SON.name,
  emoji: "🧑",
  hint: "起きてきたところらしい",
  channel: "in-person",
  places: ["living"],
  from: 60, // 07:00
  rootId: "root",
  nodes: [
    {
      id: "root",
      prompt: "「……おはよ」",
      choices: [
        {
          kind: "topic",
          id: "how-are-you",
          label: "最近どうだ、と聞く",
          once: true,
          flags: ["asked-about-family"],
          reply: {
            minutes: 10,
            speaker: YOUNGER_SON.name,
            text: "「普通」\n\n冷蔵庫を開けて、牛乳を直接飲もうとして、母親に見られて止めた。\n\n「テレビ、父さんばっかりでうざい。友達からめっちゃ連絡くる」\n\n嫌そうな顔をしているが、少し笑っていた。",
            highlight: `${YOUNGER_SON.name}と少し話した。`,
          },
        },
        {
          kind: "topic",
          id: "the-job",
          label: "バイトのことを聞く",
          once: true,
          requiresFlag: "asked-about-family",
          reply: {
            minutes: 10,
            speaker: YOUNGER_SON.name,
            text: "「別に。普通のとこ」\n\n目を合わせないまま、しばらく黙っていた。\n\n「……バイク。免許取ったら買うつもり」\n\n初めて聞いた。母親も知らなかったらしく、後ろで小さく声が上がった。",
            highlight: `${YOUNGER_SON.name}が何のために働いているかを知った。`,
          },
        },
        { kind: "end", id: "leave", label: "話をやめる" },
      ],
    },
  ],
};
