import type { Action } from "../../types/action";

export const READ_DOCUMENTS: Action = {
  id: "documents",
  label: "資料を読む",
  category: "work",
  emoji: "📄",
  /** 紙の束を広げられる場所でしか読めない。風呂には持ち込まない。 */
  places: ["bedroom", "study", "office"],
  hint: "昨夜、枕元に置いたまま眠ってしまった束",
  perSegment: { fatigue: 2 },
  segments: [
    {
      minutes: 15,
      text: "内閣の顔ぶれと担当分野の一覧。昨日決めたばかりなのに、もう覚束ない名前がある。",
      lines: [
        "十九名。派閥の均衡、当選回数、専門分野。決めたときの理屈はすべて思い出せる。",
        "思い出せないのは、その一人ひとりが何を抱えているかの方だった。",
      ],
    },
    {
      minutes: 10,
      text: "来週の国会日程。予算委員会の日取りに赤い印がついている。",
      lines: [
        "初日から二日間、集中審議。答弁に立つのはほぼ自分になる。",
        "想定問答の束は、この倍の厚さで別に用意されているという。",
      ],
    },
    {
      minutes: 15,
      text: "経済指標の概況。数字だけが並んだ紙を、目で追う。",
      lines: [
        "実質成長率、消費者物価、実質賃金。どれも急に良くも悪くもなっていない。",
        "「据え置き」という言葉が、これほど重く読めたことはなかった。",
      ],
      highlight: "資料に一通り目を通した。",
    },
  ],
};

export const WRITE_NOTES: Action = {
  id: "notes",
  label: "書き物をする",
  category: "work",
  emoji: "🖊️",
  places: ["study", "office"],
  hint: "所信で何を言うか、まだ決まっていない",
  perSegment: { fatigue: 2 },
  segments: [
    {
      minutes: 10,
      text: "机に向かい、白い紙を一枚置く。\n\n所信表明で何を言うか。日程はまだ決まっていないが、決まってから考えるのでは遅い。\n\n書き出しを三つ書いて、三つとも線を引いて消した。",
    },
    {
      minutes: 10,
      text: "言いたいことは、たぶん一つしかない。それを言うために、どれだけの前置きが要るかを考えている。\n\n四行だけ残した。まだ人に見せられる形ではない。\n\n紙を二つに折って、上着の内ポケットに入れた。",
      highlight: "所信の書き出しを四行だけ書いた。",
    },
  ],
};
