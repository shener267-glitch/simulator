import type { Action } from "../../types/action";
import { ANYWHERE } from "../places";
import { ELDER_SON, WIFE } from "../characters";

/**
 * 電話（本セッションでの決定）。総理の一日は、部屋にいる人だけで回らない。
 *
 * 「話す」は目の前の相手との会話、こちらは掛ける行為そのものを行動として
 * 扱う。五分で済む一本が、午後の会議一つを不要にすることがある。
 */

const AT_THE_KANTEI = 840;

export const CALL_CHIEF: Action = {
  id: "call-chief",
  label: "官房長官に電話する",
  category: "work",
  emoji: "📞",
  places: ["office", "study"],
  hint: "午後の会見で何を聞かれそうか",
  from: 140, // 官邸に入ってから
  until: AT_THE_KANTEI,
  perSegment: { fatigue: 1 },
  segments: [
    {
      minutes: 5,
      text: "二回で出た。この人はいつも二回で出る。",
      speaker: "官房長官",
      flags: ["talked-to-chief"],
      lines: [
        "「はい。……ええ、午後の会見ですね。財源の件は必ず来ます」",
        "「『総理からは、特定の手段を前提にしていないと聞いている』で受けます。それ以上は総理の口から、ということで」",
      ],
    },
    {
      minutes: 5,
      text: "こちらから一つ聞く。「私が言った方がいい場面はありますか」",
      speaker: "官房長官",
      flags: ["asked-for-help"],
      lines: [
        "少し間があった。「……ないうちが、いい状態です」",
        "「私が受けきれなくなったら、そのときはお願いに上がります」",
      ],
      highlight: "官房長官と、会見で受ける線を合わせた。",
    },
  ],
};

export const CALL_MINISTER: Action = {
  id: "call-minister",
  label: "大臣に電話する",
  category: "work",
  emoji: "☎️",
  places: ["office"],
  hint: "昨日決めたばかりの顔ぶれ",
  from: 140,
  until: AT_THE_KANTEI,
  repeatable: true,
  perSegment: { fatigue: 2 },
  segments: [
    {
      minutes: 5,
      text: "財務大臣に掛ける。秘書官経由で三十秒待たされた。",
      speaker: "財務大臣",
      flags: ["called-a-minister"],
      lines: [
        "「総理。……いえ、こちらこそ。何なりと」",
        "「規模のことでしたら、積み上げは一度こちらで削ります。総理に削っていただく形にはしません」",
        "こちらから言う前に、言われた。この人は今朝の臨時閣議でも返事が早かった。",
      ],
    },
    {
      minutes: 5,
      text: "厚労大臣に掛ける。こちらは出るまでに二分かかった。",
      speaker: "厚生労働大臣",
      lines: [
        "「申し訳ありません、現場に出ておりまして」",
        "背後で人の声がする。「医療の逼迫の件、明日には数字でお出しします」",
        "こちらが聞く前に、向こうが用件を持っていた。",
      ],
      highlight: "大臣に直接電話を入れた。",
    },
  ],
};

export const CALL_PARTY: Action = {
  id: "call-party",
  label: "党幹部に電話する",
  category: "work",
  emoji: "📱",
  places: ["office", "study"],
  hint: "総裁選で競った側にも",
  from: 140,
  perSegment: { fatigue: 2 },
  segments: [
    {
      minutes: 10,
      text: "総裁選で競った側の一人に掛ける。番号は沢渡が用意していた。",
      flags: ["called-the-party"],
      lines: [
        "「……総理からとは思いませんでした」",
        "本当に思っていなかったらしい声だった。それだけで、掛けた意味はあった。",
        "「経済対策の件、党内で不安がある方が何人かおられると聞きました。名前は結構です。中身を教えてください」",
      ],
    },
    {
      minutes: 10,
      text: "十分ほど、こちらは聞くだけになった。",
      flags: ["heard-the-party"],
      lines: [
        "話の八割は財源の話ではなかった。段取りの話と、去年の人事の話だった。",
        "最後に一言だけ。「総理が直接お聞きになった、ということは、こちらから申し上げておきます」",
        "それが答えだった。中身ではなく、掛けたことが答えだった。",
      ],
      highlight: "総裁選で競った側に、自分から電話を入れた。",
    },
  ],
};

export const CALL_FAMILY: Action = {
  id: "call-family",
  label: "家族に連絡する",
  category: "life",
  emoji: "💬",
  places: ANYWHERE,
  hint: "短くていい",
  repeatable: true,
  perSegment: { fatigue: -2 },
  segments: [
    {
      minutes: 5,
      text: `${ELDER_SON.name}に短く送る。「元気か」とだけ。`,
      flags: ["contacted-family"],
      lines: [
        "既読はつかない。就職して家を出てから、返事は早くて翌日になった。",
        `${WIFE.name}には「今日は遅くなる」と送った。こちらはすぐ既読がついた。`,
        "「知ってる」とだけ返ってきた。",
      ],
    },
  ],
};

export const PERSONAL_CALL: Action = {
  id: "personal-call",
  label: "個人的な電話をする",
  category: "life",
  emoji: "🤙",
  places: ["office", "study", "bedroom"],
  hint: "仕事ではない相手に",
  perSegment: { fatigue: -3 },
  segments: [
    {
      minutes: 10,
      text: "十二年前から後援会をやってくれている人に掛ける。",
      flags: ["called-a-friend"],
      lines: [
        "「おお、総理。忙しいやろ」\n\n地元の言葉だった。それだけで、肩の位置が少し下がった。",
        "十分のうち八分は、去年の祭りの話だった。総理という言葉は最初の一回しか出てこなかった。",
        "切ってから、しばらく画面を見ていた。",
      ],
      highlight: "地元の後援会長と、仕事ではない話をした。",
    },
  ],
};

export const CALL_ACTIONS: Action[] = [
  CALL_CHIEF,
  CALL_MINISTER,
  CALL_PARTY,
  CALL_FAMILY,
  PERSONAL_CALL,
];
