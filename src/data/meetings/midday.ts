import type { Meeting } from "../../types/meeting";
import { SAWATARI, SHINOZUKA } from "../characters";

/** 10:00、閣議室。主宰するのは初めてになる。 */
export const CABINET: Meeting = {
  appointmentId: "cabinet",
  opening: [
    {
      text: "閣議室に入ると、十九人が一斉に立ち上がった。\n\n一番奥の席が空いている。昨日まで座っていた場所とは、部屋の反対側だった。",
    },
    {
      speaker: "官房長官",
      text: "「それでは、定例閣議を始めます。総理、よろしくお願いいたします」",
    },
  ],
  prompt: "四十分。何に使うか。",
  choices: [
    {
      id: "cabinet-reports",
      label: "各大臣の報告を聞く",
      note: "一通り、最後まで",
      minutes: 15,
      flags: ["heard-the-ministers"],
      highlight: "閣僚全員の報告に、最後まで付き合った。",
      reply: [
        {
          text: "順に報告が上がる。法案の進捗、来週の国会対応、各省の懸案。\n\n半分は事前に紙で読んでいる内容だった。だが、読むのと、その人が言うのを聞くのとでは違った。",
        },
        {
          text: "誰が自信を持って話し、誰が原稿から目を上げないか。それは紙には書いていない。",
        },
      ],
    },
    {
      id: "cabinet-package",
      label: "経済対策の段取りを確認する",
      note: "閣議決定までの道筋",
      minutes: 10,
      flags: ["set-the-package-schedule"],
      reply: [
        {
          speaker: "官房長官",
          text: "「骨子を来週中に。閣議決定は再来週の火曜を想定しています」",
        },
        {
          text: "「間に合いますか」と聞くと、各省の顔がいくつか動いた。\n\n「間に合わせます」と答えたのは、財務大臣だった。返事が早すぎる、と思った。",
        },
      ],
    },
    {
      id: "cabinet-address",
      label: "一言、述べる",
      note: "自分の言葉で",
      minutes: 10,
      flags: ["addressed-the-cabinet"],
      highlight: "初閣議で、閣僚に自分の言葉で話した。",
      reply: [
        {
          text: "「短く申し上げます。私は、決めるのが遅い人間だと言われてきました」\n\n「認めます。ただ、決めないことと、遅く決めることは違います。私は決めます。そのかわり、材料は早く上げてください」",
        },
        {
          text: "誰も何も言わなかった。書き取っている者が何人かいた。",
        },
      ],
    },
    {
      id: "cabinet-short",
      label: "形式どおりに進める",
      note: "余計なことは言わない",
      minutes: 5,
      reply: [
        {
          text: "署名の順が回ってくる。名前を書く。それだけで、閣議は動いていく。\n\n自分がいなくても回る仕組みなのだと、そのとき初めて具体的に分かった。",
        },
      ],
    },
  ],
  closing: [
    {
      speaker: "官房長官",
      text: "「以上をもちまして、閣議を終了いたします」",
    },
    {
      text: "十九人が同時に立つ音がした。",
    },
  ],
};

/**
 * 11:00（着信で10:45に繰り上がる）、応接室。
 * 朝に資料を読んだかどうかが、ここで初めて形になって出る（設計書8章）。
 */
export const PARTY_LEADERS: Meeting = {
  appointmentId: "party-leaders",
  opening: [
    {
      speaker: "幹事長",
      text: "「総理、就任おめでとうございます。……早速で恐縮ですが、経済対策の件で」",
    },
    {
      speaker: "幹事長",
      text: "「党内に、財源の組み立てを不安がる声があります。特例国債ありきではないか、と」",
    },
    {
      text: "来た、と思った。朝に聞いていたとおりの筋だった。",
      requiresFlag: "knows-the-objection",
    },
  ],
  prompt: "どう答えるか。",
  choices: [
    {
      id: "party-figures",
      label: "四ページ目の試算について確認したい、と切り出す",
      note: "読んだ人間にしか言えないこと",
      minutes: 10,
      requiresFlag: "read-economic-papers",
      flags: ["answered-with-substance"],
      highlight: "資料を読んでいたので、党幹部に数字で応じられた。",
      reply: [
        {
          text: "「四ページ目の試算のことをおっしゃっているなら、あれは三案並べたうちの一つです。特例国債はそのうちの一案で、前提ではありません」",
        },
        {
          text: "「残る二案の詰めが甘いのはそのとおりです。そこは今週中に埋めます。埋めたうえで、党にお諮りします」",
        },
        {
          speaker: "幹事長",
          text: "「……お読みになっているんですね」\n\n少し間があった。「失礼しました。そこまで見ておられるとは思わず」",
        },
      ],
    },
    {
      id: "party-general",
      label: "一般論で応じる",
      note: "大筋は分かっている",
      minutes: 10,
      requiresFlag: "skimmed-economic-papers",
      unlessFlag: "read-economic-papers",
      flags: ["answered-in-general"],
      reply: [
        {
          text: "「財源については、特定の手段を前提にしてはいません。複数の案を並べて詰めている段階です」",
        },
        {
          speaker: "幹事長",
          text: "「その複数というのは、具体的には」",
        },
        {
          text: "詰まった。目は通した。だが、どの案が何ページにあったかまでは出てこない。\n\n「今週中に整理してお示しします」と答えた。嘘ではない。ただ、答えになってもいなかった。",
        },
      ],
    },
    {
      id: "party-delegate",
      label: "秘書官に説明させる",
      note: "自分では答えない",
      minutes: 10,
      unlessFlag: "read-economic-papers",
      flags: ["delegated-the-answer"],
      reply: [
        {
          speaker: SHINOZUKA.shortName,
          text: "「私からご説明します。財源は三案を並行して検討しており、特例国債はそのうちの一つです」",
        },
        {
          text: "篠塚の説明は正確で、過不足がなかった。幹事長も頷いている。\n\nただ、頷きながら、幹事長の目は一度だけこちらを見た。総理は何と答えるのか、を見た目だった。",
        },
      ],
    },
    {
      id: "party-later",
      label: "後で確認すると答える",
      note: "いまは答えない",
      minutes: 5,
      unlessFlag: "read-economic-papers",
      flags: ["deferred-the-answer"],
      reply: [
        {
          text: "「確認して、あらためてお答えします」",
        },
        {
          speaker: "幹事長",
          text: "「承知しました」",
        },
        {
          text: "それ以上は追及されなかった。追及されないことの方が、少しこたえた。",
        },
      ],
    },
    {
      id: "party-who",
      label: "誰が言っているのかを聞く",
      note: "中身より、出どころを",
      minutes: 10,
      flags: ["asked-who-objects"],
      reply: [
        {
          speaker: "幹事長",
          text: "「名前を挙げるほどのことでもありません。……まあ、総裁選のときに別の側におられた方々です」",
        },
        {
          speaker: "幹事長",
          text: "「一度、直接お話しになったらいかがですか。総理からお声がけいただければ、それだけで収まる話だと思います」",
        },
      ],
    },
    {
      id: "party-opinion",
      label: "幹事長自身の考えを聞く",
      note: "党の代弁ではなく",
      minutes: 10,
      flags: ["asked-for-help"],
      reply: [
        {
          speaker: "幹事長",
          text: "「私ですか。……私は、中身は悪くないと思っています」",
        },
        {
          speaker: "幹事長",
          text: "「ただ、党に相談する前に固まってしまうと、後から必ず言われます。順番の問題です。中身の問題ではありません」",
        },
        {
          text: "順番。二度目に聞いた言葉だった。",
        },
      ],
    },
  ],
  closing: [
    {
      speaker: "幹事長",
      text: "「お時間をいただきました。党の方は、私の方で当面抑えます」",
    },
    {
      text: "握手をして、応接室を出た。廊下に出たところで、沢渡が短く頷いた。",
    },
  ],
};

/** 12:00、執務室で沢渡と。会食ではなく、机で食べる。 */
export const LUNCH: Meeting = {
  appointmentId: "lunch",
  opening: [
    {
      speaker: SAWATARI.shortName,
      text: "「昼は下から取ってあります。今日は会食を入れていませんので、三十分お使いいただけます」",
    },
    {
      text: "机の隅に弁当が置かれた。蓋を開けると、思っていたより湯気が立っていた。",
    },
  ],
  prompt: "三十分。",
  choices: [
    {
      id: "lunch-eat",
      label: "黙って食べる",
      note: "先に腹に入れる",
      minutes: 15,
      condition: { hunger: -32, fatigue: -4 },
      flags: ["ate-lunch"],
      highlight: "昼食をとった。",
      reply: [
        {
          text: "何も考えずに食べた。半分ほど進んだところで、朝から水しか飲んでいなかったことに気づいた。\n\n食べ終えて茶を飲むと、視界が少し明るくなった気がした。",
        },
      ],
    },
    {
      id: "lunch-work",
      label: "食べながら午後の段取りを詰める",
      note: "時間を二重に使う",
      minutes: 15,
      condition: { hunger: -22, fatigue: 2 },
      flags: ["ate-lunch", "worked-through-lunch"],
      reply: [
        {
          speaker: SAWATARI.shortName,
          text: "「十三時半に安保・情報、十五時に外務、十六時に内閣府です。いずれも先方から上げてくる話が中心になります」",
        },
        {
          text: "箸を持ったまま聞いた。半分は頭に入った。もう半分は、後で紙で読み直すことになるのだろう。",
        },
      ],
    },
    {
      id: "lunch-talk",
      label: `${SAWATARI.shortName}と雑談する`,
      note: "仕事の話をしない",
      minutes: 15,
      condition: { hunger: -26, fatigue: -6 },
      flags: ["ate-lunch", "talked-off-duty"],
      reply: [
        {
          text: "何の話をしたのか、あとから思い出そうとしても出てこなかった。天気と、昔の選挙の話と、沢渡の子どもの進学の話だった気がする。",
        },
        {
          speaker: SAWATARI.shortName,
          text: "「……こういう時間、これから減ります。取れるうちに取ってください」",
        },
      ],
    },
  ],
  closing: [
    {
      text: "蓋を閉じる。弁当の器が下げられていった。",
    },
  ],
};
