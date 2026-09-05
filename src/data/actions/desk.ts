import type { Action } from "../../types/action";
import { KANTEI } from "../places";
import { SAWATARI } from "../characters";

/**
 * 官邸で、細切れの時間に処理する仕事（本セッションでの決定）。
 *
 * 総理の自由時間は完全な自由ではない。大量の仕事を十分二十分の隙間で
 * 捌いていく時間で、「いま10分ある。何を片付ける？」が毎回の問いになる。
 * だから短いものを厚く用意してある — 5分で終わるものが無いと、隙間が
 * ただの余りになる。
 */


export const SKIM_PAPERS: Action = {
  id: "skim",
  label: "資料に目を通す",
  category: "work",
  emoji: "📑",
  places: ["bedroom", "study", "office", "secretariat"],
  hint: "束の上から順に、要点だけ",
  repeatable: true,
  perSegment: { fatigue: 1 },
  segments: [
    {
      minutes: 5,
      text: "一枚目の要約だけを追う。全部は読まない。読まないと決めて読む。",
      lines: [
        "各省から上がってきた案件の頭出しが十二件。うち二件に、こちらの判断が要ると書いてある。",
        "残る十件は、読まなくても回る。そう書いてあるわけではないが、そう書いてある。",
      ],
    },
    {
      minutes: 5,
      text: "判断が要ると書かれた二件を開く。片方は一行で済んだ。",
      flags: ["skimmed-the-stack"],
      lines: [
        "もう片方は、読み終えても何を聞かれているのか分からなかった。",
        "分からない、と余白に書いて篠塚の箱へ回した。分からないと書けるのは、たぶん今のうちだけだ。",
      ],
    },
  ],
};

export const NOTE_ON_PAPERS: Action = {
  id: "annotate",
  label: "資料にメモを入れる",
  category: "work",
  emoji: "✏️",
  places: ["study", "office"],
  hint: "気づいたことを、その場で余白に",
  repeatable: true,
  perSegment: { fatigue: 1 },
  segments: [
    {
      minutes: 5,
      text: "余白に短く書き込んでいく。「誰が」「いつまでに」「なぜ今か」。",
      flags: ["annotated-papers"],
      lines: [
        "三つ書くと、たいていの紙は薄くなる。薄くならない紙が、本当に考えるべき紙だった。",
        "今日の束では、二枚が薄くならなかった。",
      ],
    },
  ],
};

export const CHECK_SCHEDULE: Action = {
  id: "schedule",
  label: "日程を確認する",
  category: "work",
  emoji: "📅",
  places: [...KANTEI, "study"],
  hint: "今日と、この先の一週間",
  perSegment: { fatigue: 1 },
  segments: [
    {
      minutes: 5,
      text: "手元の日程表を開く。今日のぶんと、来週の頭までが一枚に収まっている。",
      flags: ["checked-the-schedule"],
      lines: [
        "空いている時間は、空いているのではなく、まだ埋まっていないだけだと沢渡が言っていた。",
        "来週の火曜だけが白い。そこが埋まる前に、何かを決めておかなければならない。",
      ],
    },
    {
      minutes: 5,
      text: "来週以降をめくる。所信表明の日取りの候補が三つ、鉛筆で書かれている。",
      flags: ["knows-the-deadline"],
      lines: [
        "鉛筆なのは、こちらが決めるまで確定しないからだ。",
        "決めなければ、いつまでも鉛筆のままになる。",
      ],
    },
  ],
};

export const READ_BILLS: Action = {
  id: "bills",
  label: "法案・政令を確認する",
  category: "work",
  emoji: "📜",
  places: ["office", "study"],
  hint: "明日以降の閣議に上がるもの",
  perSegment: { fatigue: 3 },
  segments: [
    {
      minutes: 10,
      text: "来週の閣議請議の束。条文と、その横に平易な言い換えが付いている。",
      lines: [
        "言い換えの方だけを読めば十分だ、と誰かが言っていた。実際そのとおりだった。",
        "ただ、条文の方に一行だけ、言い換えに出てこない但し書きがあった。",
      ],
    },
    {
      minutes: 10,
      text: "その但し書きを追う。省令に委ねる、と書いてある。",
      flags: ["read-the-bills"],
      lines: [
        "つまり中身は後で役所が決める。国会に出るのは枠だけになる。",
        "この形が悪いわけではない。ただ、これを通したのは自分だ、と後で言われるのはこちらだった。",
      ],
    },
    {
      minutes: 10,
      text: "残りに目を通す。ほとんどが技術的な改正で、読む速度が上がっていく。",
      highlight: "来週の閣議案件に、事前に目を通した。",
    },
  ],
};

export const CHECK_ECONOMY: Action = {
  id: "economy",
  label: "経済情勢を確認する",
  category: "work",
  emoji: "📈",
  places: ["office", "study"],
  hint: "内閣府と日銀の資料",
  perSegment: { fatigue: 2 },
  segments: [
    {
      minutes: 10,
      text: "主要な指標が一枚にまとまっている。前月比、前年比、市場予想との差。",
      flags: ["knows-the-indicator"],
      lines: [
        "景気動向指数が小幅に下振れている。数字としては誤差の範囲だと注記がある。",
        "誤差の範囲だと書かなければならない程度には、聞かれる数字だということだった。",
      ],
    },
    {
      minutes: 10,
      text: "実質賃金の推移を追う。二年ぶんのグラフが、ほとんど平らに見える。",
      flags: ["knows-the-wages"],
      lines: [
        "目盛りを見ると平らではなかった。少しずつ下がっている。",
        "選挙で「上げます」と言った線が、この線だった。",
      ],
    },
  ],
};

export const CHECK_FOREIGN: Action = {
  id: "foreign-brief",
  label: "外交情勢を確認する",
  category: "work",
  emoji: "🌏",
  places: ["office"],
  hint: "外務省からの日報",
  perSegment: { fatigue: 2 },
  segments: [
    {
      minutes: 10,
      text: "各地域の日報。ほとんどは「変化なし」で始まる。",
      flags: ["knows-the-region"],
      lines: [
        "変化ありと書かれているのは二地域。片方は選挙、片方は通商の交渉が止まっている件。",
        "止まっている、というのは日本のせいではない、と一行だけ添えてあった。添える必要がある程度には、そう読まれる余地があるらしい。",
      ],
    },
    {
      minutes: 10,
      text: "首脳会合の準備状況。共同文書の素案が三度差し戻されている。",
      flags: ["knows-the-summit"],
      lines: [
        "差し戻したのは日本ではない。日本が入れたい一段落が、まだ通っていない。",
        "「総理が現地でお話しになれば通ります」と書いてある。つまり行くかどうかの話になる。",
      ],
      highlight: "外交日報に目を通した。",
    },
  ],
};

export const CHECK_SECURITY: Action = {
  id: "security-brief",
  label: "安全保障情報を確認する",
  category: "work",
  emoji: "🛡️",
  places: ["office"],
  hint: "この部屋の外には出せない束",
  perSegment: { fatigue: 3 },
  segments: [
    {
      minutes: 10,
      text: "薄い冊子を開く。持ち出しはできないと表紙の裏に書いてある。",
      flags: ["knows-the-posture"],
      lines: [
        "周辺の動きは先月並み。数字が並んでいるだけで、評価は書かれていない。",
        "評価を書かないのは、書いた瞬間に評価そのものが独り歩きするからだと聞いた。",
      ],
    },
    {
      minutes: 10,
      text: "後半に、報告に上げる水準ではないという断りつきの項目が三つある。",
      flags: ["asked-about-omens"],
      lines: [
        "港湾の出入りが二割増えていること。国内の一社で人の動きが妙なこと。海水温。",
        "どれも、何かが起きる予告ではない。九割は何も起きない。",
        "残りの一割のために、この十分はある。",
      ],
      highlight: "報告に上がる手前の兆候まで、自分で目を通した。",
    },
  ],
};

export const SORT_THE_DAY: Action = {
  id: "sort",
  label: "今日の判断を整理する",
  category: "work",
  emoji: "🧾",
  places: ["office", "study"],
  hint: "決めたことと、決めていないこと",
  repeatable: true,
  perSegment: { fatigue: -1 },
  segments: [
    {
      minutes: 5,
      text: "白い紙に二本の線を引く。決めたこと、決めていないこと、決めなくていいこと。",
      flags: ["sorted-the-day"],
      lines: [
        "三本目が一番長くなった。決めなくていいことを決めなくていいと書けるようになるまで、十二年かかった。",
        "一本目は、今日はまだ短い。",
      ],
    },
  ],
};

export const ORDER_GROUNDWORK: Action = {
  id: "groundwork",
  label: "根回しを頼む",
  category: "work",
  emoji: "🤝",
  places: ["office", "secretariat"],
  hint: "決める前に、話を通しておく",
  perSegment: { fatigue: 1 },
  segments: [
    {
      minutes: 10,
      text: `${SAWATARI.shortName}を呼んで、経済対策の順番を相談する。`,
      speaker: SAWATARI.shortName,
      flags: ["ordered-groundwork"],
      lines: [
        "「順番でしたら、党の政調に先です。財務省は後でも構いません」",
        "「政調に入れてから財務に持っていくと、財務は『党が言うなら』で動きます。逆にすると、党が『聞いていない』と言います」",
        "中身は同じで、順番だけが違う。それで結果が変わるのだと、この人は言っている。",
      ],
    },
    {
      minutes: 10,
      text: "誰に、何を、いつまでに話すかを決めていく。",
      speaker: SAWATARI.shortName,
      flags: ["laid-the-groundwork"],
      lines: [
        "「今日中に私が政調会長に。明日、総理から幹事長に一本お電話をいただければ、それで足ります」",
        "「お電話は五分で結構です。長いと、かえって身構えられます」",
      ],
      highlight: "経済対策の根回しの段取りをつけた。",
    },
  ],
};

export const DESK_ACTIONS: Action[] = [
  SKIM_PAPERS,
  NOTE_ON_PAPERS,
  CHECK_SCHEDULE,
  READ_BILLS,
  CHECK_ECONOMY,
  CHECK_FOREIGN,
  CHECK_SECURITY,
  SORT_THE_DAY,
  ORDER_GROUNDWORK,
];
