import type { Action } from "../../types/action";
import { ANYWHERE } from "../places";
import { SAWATARI, SHINOZUKA, WIFE, ELDER_SON, YOUNGER_SON } from "../characters";

/**
 * 設計書4章。妻との会話は基本的に普通の夫婦の会話にする。
 * 政治の話に寄せない。息子たちは会話の中で名前が出るが、
 * v0.1では独立した会話相手にはしない。
 */
export const TALK_WITH_WIFE: Action = {
  id: "wife",
  label: `${WIFE.name}と話す`,
  category: "people",
  emoji: "👩",
  /** 台所に立っている。寝室まで呼びには来ない。 */
  places: ["living"],
  hint: "台所に灯りがついている",
  perSegment: { fatigue: -1 },
  segments: [
    {
      minutes: 10,
      speaker: WIFE.name,
      text: "「起きたの。もう少し寝てるかと思った」\n\nコーヒーの匂いがしていた。カップを二つ出しながら、こちらを見もせずに言う。\n\n「昨日、何時だった。私、途中で寝ちゃった」",
    },
    {
      minutes: 10,
      speaker: WIFE.name,
      text: "「悠人、まだ寝てるわよ。昨日も帰り遅くて」\n\n次男の話になった。大学に入って二年目、最近はほとんど顔を合わせていない。\n\n「バイト増やしたみたい。何に使うのか聞いても言わないの」",
      highlight: `${WIFE.name}と${YOUNGER_SON.name}の近況を話した。`,
    },
    {
      minutes: 10,
      speaker: WIFE.name,
      text: `「${ELDER_SON.name}からは、おととい連絡あった」\n\n長男は就職して家を出ている。\n\n「お父さんに『おめでとう』って伝えといて、って。それだけ。あの子らしいけど」`,
      highlight: `${ELDER_SON.name}から祝いの言付けを聞いた。`,
    },
    {
      minutes: 10,
      speaker: WIFE.name,
      text: "「今日、何時に帰るの」\n\n答えられなかった。分からない、と言うと、そう、とだけ返ってきた。\n\n「夕飯は作っておくけど、冷蔵庫に入れとくから。温めて食べて」\n\n少し間があって、付け足すように言った。\n\n「無理しないでね」",
    },
  ],
};

/** 政治・人間関係・スケジュールの相談相手（設計書9章）。 */
export const CONSULT_SAWATARI: Action = {
  id: "sawatari",
  label: `${SAWATARI.shortName}に相談する`,
  category: "people",
  emoji: "👨‍💼",
  /** 電話なので、どこからでも掛かる。 */
  places: ANYWHERE,
  hint: "政務担当。八年、そばにいる",
  perSegment: { fatigue: 1 },
  segments: [
    {
      minutes: 10,
      speaker: SAWATARI.shortName,
      text: "「おはようございます。もう起きておられると思っていました」\n\n八年前、初当選から二期目の頃からの付き合いだ。こちらが何も言わなくても、だいたい先回りしている。\n\n「今日は長くなります。無理に飛ばさないでください」",
    },
    {
      minutes: 10,
      speaker: SAWATARI.shortName,
      text: "「党内ですが、総裁選で競った側は、いまのところ静かです」\n\n少し言葉を選ぶ間があった。\n\n「静かなうちに、こちらから声をかけておいた方がいい方が何人かおられます。名前はブリーフィングのときに」",
      highlight: `${SAWATARI.shortName}と党内の状況を話した。`,
    },
    {
      minutes: 10,
      speaker: SAWATARI.shortName,
      text: "「差し出がましいことを申し上げますが」\n\n珍しく、言いにくそうにしている。\n\n「総理は、抱え込む癖がおありです。これから四年、そのやり方だと保ちません。使えるものは私も含めて使ってください」",
    },
  ],
};

/** 政策・資料・情報・実務の相談相手（設計書9章）。 */
export const CONSULT_SHINOZUKA: Action = {
  id: "shinozuka",
  label: `${SHINOZUKA.shortName}に相談する`,
  category: "people",
  emoji: "👩‍💼",
  places: ANYWHERE,
  hint: "事務担当。資料はいつも先に揃っている",
  perSegment: { fatigue: 1 },
  segments: [
    {
      minutes: 10,
      speaker: SHINOZUKA.shortName,
      text: "「おはようございます。お手元に届いている資料、ご覧になりましたか」\n\n五年目になる。最初の頃は敬語が固すぎて話しづらかったが、今はこれくらいがちょうどいい。\n\n「まだでしたら、要点だけ先に申し上げます」",
    },
    {
      minutes: 10,
      speaker: SHINOZUKA.shortName,
      text: "「各省から上がってきている案件、優先度をつけて三つに絞ってあります」\n\n手元の端末を操作する音がする。\n\n「一つ目は補正の枠組み、二つ目は来週の国会日程、三つ目は――これは急ぎませんが、閣僚の身辺の確認です」",
      highlight: `${SHINOZUKA.shortName}から当面の案件の整理を受けた。`,
    },
    {
      minutes: 10,
      speaker: SHINOZUKA.shortName,
      text: "「私が申し上げるのは越権かもしれませんが」\n\n一瞬、言葉が途切れた。\n\n「数字は揃えられます。判断はできません。そこは総理にお願いするしかないので、迷われたときは、迷っているとだけ言ってください。材料を出し直します」",
    },
  ],
};
