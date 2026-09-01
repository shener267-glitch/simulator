import type { Action } from "../../types/action";
import { SAWATARI, SHINOZUKA } from "../characters";

export const READ_DOCUMENTS: Action = {
  id: "documents",
  label: "資料を読む",
  category: "work",
  hint: "昨夜、枕元に置いたまま眠ってしまった束",
  perSegment: { fatigue: 2 },
  segments: [
    {
      minutes: 10,
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
      minutes: 10,
      text: "経済指標の概況。数字だけが並んだ紙を、目で追う。",
      lines: [
        "実質成長率、消費者物価、実質賃金。どれも急に良くも悪くもなっていない。",
        "「据え置き」という言葉が、これほど重く読めたことはなかった。",
      ],
      highlight: "資料に一通り目を通した。",
    },
  ],
};

export const GIVE_INSTRUCTIONS: Action = {
  id: "instructions",
  label: "秘書官に指示を出す",
  category: "work",
  hint: "調整、根回し、情報収集を頼む",
  perSegment: { fatigue: 1 },
  segments: [
    {
      minutes: 10,
      text: `${SAWATARI.shortName}と${SHINOZUKA.shortName}に、いくつか頼んでおく。\n\n${SAWATARI.shortName}には党内で先に声をかけておくべき相手の整理を、${SHINOZUKA.shortName}には閣僚の身辺について確認できる範囲での資料を。\n\n二人とも、余計なことは聞かなかった。`,
      highlight: "秘書官に党内調整と資料の追加確認を指示した。",
    },
  ],
};
