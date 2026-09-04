import type { Action } from "../../types/action";
import { ELDER_SON, WIFE, YOUNGER_SON } from "../characters";

/** 20:00に宿舎へ戻ってから先。夜にしか出ない行動をここに集める。 */
const EVENING = 840;

export const EAT_DINNER: Action = {
  id: "dinner",
  label: "夕食をとる",
  category: "rest",
  emoji: "🍚",
  places: ["living"],
  hint: "遅くなったが、まだ温かい",
  from: EVENING,
  perSegment: { hunger: -22, fatigue: -3 },
  segments: [
    {
      minutes: 15,
      text: `${WIFE.name}が温め直してくれた。食卓についているのは自分ひとりだった。`,
      lines: [
        "「先に食べちゃった。悠人はバイト、直人は帰ってない」",
        "台所で洗い物をしながら、背中で言われた。責める調子ではない。事実を言っただけだ。",
      ],
    },
    {
      minutes: 15,
      text: "汁物の椀を置く。今日、腰を下ろして食べたのは、これが二度目だった。",
      flags: ["ate-dinner"],
      lines: [
        "昼は執務室の机で、弁当の蓋を開けたまま話を聞いていた。何を食べたのかは覚えていない。",
        "「明日も八時？」と聞かれて、そうだと答えた。それで会話は終わった。",
      ],
      highlight: "夕食をとった。",
    },
  ],
};

export const TAKE_BATH: Action = {
  id: "bath",
  label: "風呂に入る",
  category: "life",
  emoji: "🛁",
  places: ["bath"],
  hint: "湯に浸かる。今日は長くてもいい",
  from: EVENING,
  perSegment: { fatigue: -7 },
  segments: [
    {
      minutes: 15,
      text: "湯に肩まで浸かる。一日ぶんの強張りが、ゆっくりほどけていく。",
      lines: [
        "目を閉じると、今日聞いた声が順に浮かんできた。幹事長、事務次官、情報官。",
        "浮かんでくるのは中身ではなく、声の高さと、間の取り方だった。",
      ],
    },
    {
      minutes: 10,
      text: "指の腹が白くふやけている。もう出た方がいい、と思いながら、あと少し浸かっていた。",
      flags: ["bathed"],
      highlight: "湯に浸かった。",
    },
  ],
};

export const EVENING_NEWS: Action = {
  id: "news-evening",
  label: "夜のニュースを見る",
  category: "info",
  emoji: "📺",
  places: ["living", "study"],
  hint: "今日の自分が、どう映ったか",
  from: EVENING,
  perSegment: { fatigue: 2 },
  segments: [
    {
      minutes: 10,
      text: "ニュースをつける。三番目の項目で、今朝のぶら下がりが流れた。",
      lines: [
        "自分が喋っている。二十秒。今朝は十分近く立っていたはずだった。",
        "使われたのは、いちばん短く言い切った一文だけだった。",
        "「経済対策 来週めど」とテロップが出る。時期を切ったところだけが残っている。",
      ],
    },
    {
      minutes: 10,
      text: "チャンネルを変える。別の局は、経済対策の財源に触れていた。",
      lines: [
        "「党内には慎重論もあり」とだけ言って、それ以上は踏み込まなかった。",
        "画面の隅に、今日の党幹部との会談の映像が二秒だけ入る。握手のところだけだった。",
        "テレビを消す。部屋が急に静かになった。",
      ],
      highlight: "夜のニュースで、今日の自分を見た。",
    },
  ],
};

export const PREPARE_TOMORROW: Action = {
  id: "prepare",
  label: "明日の準備をする",
  category: "work",
  emoji: "🗂️",
  places: ["study"],
  hint: "篠塚が置いていった束が、また増えている",
  from: EVENING,
  perSegment: { fatigue: 3 },
  segments: [
    {
      minutes: 15,
      text: "机の上に、今日と同じ厚さの束が置かれている。付箋の色だけが違う。",
      lines: [
        "明日は日曜だ。それでも、この量が来る。",
        "一枚目に篠塚の字で「日曜のため、急ぎは黄色の付箋のみです」とあった。黄色は三枚あった。",
      ],
    },
    {
      minutes: 10,
      text: "黄色の三枚に目を通す。どれも、明日の朝までに要る返事だった。",
      flags: ["prepared-tomorrow"],
      lines: [
        "二枚には「了」と書いた。残る一枚は、書けずに机に戻した。",
        "決めるのが遅い人間だと言われてきた。今朝、閣僚の前でそう認めたばかりだった。",
      ],
      highlight: "明日の分に、先に手をつけた。",
    },
  ],
};

/** 家族の顔を見る、というだけの行動。話す相手がいるかどうかは時刻による。 */
export const SIT_WITH_FAMILY: Action = {
  id: "family",
  label: "居間で家族といる",
  category: "life",
  emoji: "🛋️",
  places: ["living"],
  hint: "話さなくてもいい",
  from: EVENING,
  perSegment: { fatigue: -3 },
  segments: [
    {
      minutes: 15,
      text: `${WIFE.name}がテレビをつけたまま、洗濯物をたたんでいる。手伝おうとして、断られた。`,
      flags: ["sat-with-family"],
      lines: [
        `「いいから座ってて。${YOUNGER_SON.name}が帰ってきたら、顔だけ見せてあげて」`,
        `${ELDER_SON.name}からは、今日も連絡がない。就職して家を出てから、そういうものになった。`,
        "何も話さないまま、十五分が過ぎた。悪い十五分ではなかった。",
      ],
    },
  ],
};
