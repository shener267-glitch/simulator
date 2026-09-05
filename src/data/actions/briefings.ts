import type { Action } from "../../types/action";
import { SHINOZUKA } from "../characters";

/**
 * 官僚から説明を受ける（本セッションでの決定）。
 *
 * 予定に入っている会談とは別に、隙間に「三分だけ」「十分だけ」と入ってくる
 * 説明がある。呼べば来るし、呼ばなければ来ない — 呼ばなかった分は、後で
 * 知らないまま判断することになる。
 */
const LEAVES = 840;

export const BRIEFING_SHORT: Action = {
  id: "brief-short",
  label: "官僚から説明を受ける",
  category: "work",
  emoji: "👔",
  places: ["office"],
  hint: "秘書官室に、待っている人がいる",
  from: 140,
  until: LEAVES,
  repeatable: true,
  perSegment: { fatigue: 2 },
  segments: [
    {
      minutes: 10,
      text: "内閣府の参事官が入ってくる。紙は一枚だけ持っている。",
      flags: ["took-a-briefing"],
      lines: [
        "「十分いただきます。三点です」",
        "一点目と二点目は聞けば分かる話だった。三点目で、初めて紙をこちらに向けた。",
        "「ここだけ、総理にご判断いただかないと動きません」",
      ],
    },
    {
      minutes: 10,
      text: "その一点について聞く。聞けば聞くほど、決め手がないことが分かってくる。",
      flags: ["heard-the-hard-part"],
      lines: [
        "どちらを選んでも、選ばなかった方の理由が正しく見える種類の話だった。",
        "「役所としては、どちらでも回ります」と参事官は言った。回るからこそ、こちらが決めるのだった。",
      ],
    },
    {
      minutes: 10,
      text: "残りの時間で、背景を聞く。なぜ今この形になっているのか。",
      flags: ["knows-the-background"],
      lines: [
        "十年前の法改正まで遡った。そのときの担当は、いまの事務次官だという。",
        "「あのときは、これが最善でした」と参事官は言った。責めている口調ではなかった。",
      ],
      highlight: "官僚の説明を、背景まで聞いた。",
    },
  ],
};

export const ASK_SECRETARY_WORK: Action = {
  id: "delegate",
  label: "秘書官に指示を出す",
  category: "work",
  emoji: "📋",
  places: ["office", "secretariat"],
  hint: "自分でやらずに済ませる",
  from: 140,
  until: LEAVES,
  repeatable: true,
  perSegment: { fatigue: -1 },
  segments: [
    {
      minutes: 5,
      text: `${SHINOZUKA.shortName}に、要るものを三つだけ挙げる。`,
      speaker: SHINOZUKA.shortName,
      flags: ["gave-instructions"],
      lines: [
        "「三案を一枚に並べ直したもの、各省の積み上げの内訳、それと去年の同種の対策の実績ですね」",
        "こちらが二つ目を言い終える前に、三つ目まで先回りされた。",
        "「夕方までにお出しします」",
      ],
    },
    {
      minutes: 5,
      text: "もう一つ頼む。「私が知らない方がいいことは、知らせなくていい」",
      flags: ["trusted-the-staff"],
      lines: [
        "篠塚は珍しく、少し考えてから答えた。",
        "「……その線は、私が引くことになります。よろしいですか」",
        "よろしい、と答えた。答えてから、それがどれだけのことかを考えた。",
      ],
      highlight: "秘書官に、知らせる線を任せた。",
    },
  ],
};

export const BRIEFING_ACTIONS: Action[] = [BRIEFING_SHORT, ASK_SECRETARY_WORK];
