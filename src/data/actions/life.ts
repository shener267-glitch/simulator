import type { Action } from "../../types/action";
import { ANYWHERE } from "../places";
import { WIFE, YOUNGER_SON } from "../characters";

/** 20:00前後。宿舎に戻ってからのもの。 */
const EVENING = 840;

export const CHANGE_CLOTHES: Action = {
  id: "change",
  label: "着替える",
  category: "life",
  emoji: "👔",
  places: ["bedroom"],
  hint: "スーツを脱ぐ",
  from: EVENING,
  perSegment: { fatigue: -3 },
  segments: [
    {
      minutes: 5,
      text: "上着を椅子の背に掛ける。ネクタイを解くと、首の後ろが急に軽くなった。",
      flags: ["changed-clothes"],
      lines: [
        "内ポケットから、四つに折った紙が出てきた。朝に書いた所信の書き出しだった。",
        "机の上に置いた。明日もこの紙は、たぶんまだここにある。",
      ],
    },
  ],
};

export const SNACK: Action = {
  id: "snack",
  label: "おやつをつまむ",
  category: "rest",
  emoji: "🍘",
  places: ["office", "secretariat", "living"],
  hint: "誰かが置いていったもの",
  repeatable: true,
  perSegment: { hunger: -12, fatigue: -2 },
  segments: [
    {
      minutes: 5,
      text: "机の隅に、個包装の菓子が積んである。地元から届いたものらしい。",
      lines: [
        "一つ取って食べる。甘い。甘いものを口に入れたのは昨日の朝以来だった。",
        "包み紙を丸めて、屑籠に落とした。それだけの五分だった。",
      ],
    },
  ],
};

export const SHORT_BREAK: Action = {
  id: "breathe",
  label: "少し休憩する",
  category: "rest",
  emoji: "☕",
  places: ANYWHERE,
  hint: "五分だけ、何も考えない",
  repeatable: true,
  perSegment: { fatigue: -3 },
  segments: [
    {
      minutes: 5,
      text: "椅子に深く座り直して、目を閉じる。五分。",
      lines: [
        "何も考えないでいようとすると、かえって朝からのことが順に浮かんでくる。",
        "浮かぶに任せた。五分経つと、勝手に止まった。",
      ],
    },
  ],
};

export const TALK_TO_WIFE_EVENING: Action = {
  id: "wife-evening",
  label: `${WIFE.name}と話す`,
  category: "life",
  emoji: "🫖",
  places: ["living"],
  hint: "今日のことを、少しだけ",
  from: EVENING,
  perSegment: { fatigue: -6 },
  segments: [
    {
      minutes: 10,
      text: "茶を淹れてくれた。向かいに座って、テレビの方を見ている。",
      speaker: WIFE.name,
      flags: ["talked-to-wife-tonight"],
      lines: [
        "「今日、テレビに出てた。朝の、玄関のとこ」",
        "「短かったよ」と言うと、「短い方がいいよ」と返ってきた。",
        "「長いと、あんた、余計なこと言うから」",
      ],
    },
    {
      minutes: 10,
      text: "こちらから聞く。「大変じゃないか。取材とか、来るだろう」",
      speaker: WIFE.name,
      flags: ["asked-about-family"],
      lines: [
        "「来た。三件。全部断った」",
        "「断っていいのか」と聞くと、少しこちらを見た。",
        "「私は選ばれてないもん」",
        "その言い方に、責める色はなかった。事実を言っただけだった。それが少しこたえた。",
      ],
      highlight: "夜、咲希と向かい合って話した。",
    },
  ],
};

export const TALK_TO_SON_EVENING: Action = {
  id: "son-evening",
  label: `${YOUNGER_SON.name}と話す`,
  category: "life",
  emoji: "🧑",
  places: ["living"],
  hint: "バイトから帰ってきたらしい",
  from: 990, // 22:30
  perSegment: { fatigue: -4 },
  segments: [
    {
      minutes: 5,
      text: "冷蔵庫を開けたまま、こちらを見ずに「おかえり」と言われた。",
      speaker: YOUNGER_SON.name,
      flags: ["talked-to-son", "sat-with-family"],
      lines: [
        "こっちのセリフだ、と言うと、笑った。",
        "「バイト先で言われた。お前の親父、総理なんだろって」",
        "「なんて答えた」と聞いたら、少し黙ってから言った。「そうだよって」",
        "それだけだった。冷蔵庫が閉まる音がした。",
      ],
      highlight: "夜中に帰ってきた悠人と、少しだけ話した。",
    },
  ],
};

export const LIFE_ACTIONS: Action[] = [
  CHANGE_CLOTHES,
  SNACK,
  SHORT_BREAK,
  TALK_TO_WIFE_EVENING,
  TALK_TO_SON_EVENING,
];
