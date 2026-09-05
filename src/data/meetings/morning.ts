import type { Meeting } from "../../types/meeting";
import { SAWATARI, SHINOZUKA } from "../characters";

/** 08:00、官邸のエントランス。十分だけ記者の前に立つ。 */
export const GAGGLE: Meeting = {
  appointmentId: "gaggle",
  opening: [
    {
      speaker: SAWATARI.shortName,
      text: "「玄関にカメラが六社。長くて十分です。答えたぶんだけ質問が伸びますので、そのつもりで」",
    },
    {
      text: "ガラス扉の向こうに、三脚とマイクの束が見えた。\n\n昨日までは、この列を横目に通り過ぎる側だった。",
    },
  ],
  prompt: "「総理、おはようございます。一言お願いします」",
  choices: [
    {
      id: "gaggle-economy",
      label: "経済対策について述べる",
      note: "来週まとめる方向だと明かす",
      minutes: 5,
      flags: ["spoke-on-economy"],
      highlight: "ぶら下がりで、経済対策に触れた。",
      reply: [
        {
          text: "「経済対策については、来週中に骨子をまとめます。柱は物価と実質賃金です」\n\n言い終えてから、一つ余計なことを言ったと思った。「来週」と時期を切ったぶん、そこが見出しになる。",
        },
        {
          speaker: SAWATARI.shortName,
          text: "「……時期を仰いましたね。夕方までに党側から問い合わせが来ます」",
        },
      ],
    },
    {
      id: "gaggle-cabinet",
      label: "昨日の組閣について述べる",
      note: "無難に収める",
      minutes: 5,
      reply: [
        {
          text: "「適材適所で、バランスの取れた布陣になったと思っています。それぞれの大臣に、それぞれの持ち場で力を発揮してもらいたい」",
        },
        {
          text: "誰も傷つけず、何も言っていない。記者の手元のペンが、途中で止まったのが見えた。",
        },
      ],
    },
    {
      id: "gaggle-family",
      label: "率直に言う",
      note: "気負いのないところを見せる",
      minutes: 5,
      flags: ["spoke-plainly"],
      reply: [
        {
          text: "「正直に申し上げると、まだ実感がありません。昨日の今日ですから」\n\n「ただ、実感がないからといって、判断を先延ばしにはしません。今日から始めます」",
        },
        {
          text: "小さな笑いが起きた。ペンは、さっきより速く動いていた。",
        },
      ],
    },
    {
      id: "gaggle-short",
      label: "短く切り上げる",
      note: "今日はここまでにする",
      minutes: 2,
      reply: [
        {
          text: "「本日はこれから臨時閣議です。またあらためて」\n\n頭を下げて、扉の内側へ戻った。背中に質問が二つ、三つ飛んだが、振り返らなかった。",
        },
      ],
    },
  ],
  closing: [
    {
      text: "扉が閉まると、外の音が急に遠くなった。",
    },
    {
      speaker: SAWATARI.shortName,
      text: "「結構です。八時二十分から、幹部との打ち合わせに入ります」",
    },
  ],
};

/** 08:20、官邸。一日の段取りを決める四十分（設計書15章の例）。 */
export const MORNING_MEETING: Meeting = {
  appointmentId: "morning-meeting",
  opening: [
    {
      speaker: SAWATARI.shortName,
      text: "「おはようございます。本日の予定を確認します。……その前に一つ」",
    },
    {
      speaker: SAWATARI.shortName,
      text: "「昨日の経済対策について、党内から少し異論が出ています。まだ表には出ていませんが、十一時の会談でお耳に入ると思います」",
    },
  ],
  prompt: "何から手をつけるか。",
  choices: [
    {
      id: "morning-detail",
      label: "詳しく聞く",
      note: "異論の中身を確かめる",
      minutes: 10,
      flags: ["knows-the-objection"],
      highlight: "党内の異論の中身を、朝のうちに把握した。",
      reply: [
        {
          speaker: SAWATARI.shortName,
          text: "「争点は財源です。特例国債を前提にした組み立てになっている、というのが向こうの言い分で」",
        },
        {
          speaker: SAWATARI.shortName,
          text: "「正確には、前提にはしていません。選択肢の一つとして残っているだけです。ただ、資料の四ページ目の試算だけを抜き出して読むと、そう読めます」",
        },
        {
          text: "四ページ目。読んでいれば、どの数字のことか分かるはずだった。",
        },
      ],
    },
    {
      id: "morning-papers",
      label: "資料を見せてもらう",
      note: "その場で確かめる",
      minutes: 10,
      unlessFlag: "read-economic-papers",
      flags: ["skimmed-economic-papers"],
      reply: [
        {
          speaker: SHINOZUKA.shortName,
          text: "「こちらです。……ご朝食の前にお目通しいただけていれば、と思っていた分です」",
        },
        {
          text: "篠塚は表情を変えずにそう言った。責める調子ではない。事実を言っただけだ。\n\nその場で目を通す。数字の並びは頭に入るが、背景まではこの十分では追いつかない。",
        },
      ],
    },
    {
      id: "morning-sawatari",
      label: `${SAWATARI.shortName}の意見を聞く`,
      note: "どう捌くべきか",
      minutes: 10,
      flags: ["asked-for-help"],
      reply: [
        {
          speaker: SAWATARI.shortName,
          text: "「私の見方でよろしければ。異論そのものより、誰が言っているかを見た方がいい案件です」",
        },
        {
          speaker: SAWATARI.shortName,
          text: "「言っているのは総裁選で競った側の周辺です。中身に反対というより、通し方に一言入れておきたいのだと思います」",
        },
        {
          speaker: SAWATARI.shortName,
          text: "「十一時にご本人がおられます。そこで一言、意見を聞かせてほしいと仰れば、たぶん収まります」",
        },
      ],
    },
    {
      id: "morning-schedule",
      label: "今日の日程を確認する",
      note: "先に段取りを固める",
      minutes: 10,
      flags: ["minds-the-schedule"],
      reply: [
        {
          speaker: SAWATARI.shortName,
          text: "「十時に臨時閣議、十一時に党幹部、正午に昼食。午後は安保・情報、外務、内閣府と続きます」",
        },
        {
          speaker: SAWATARI.shortName,
          text: "「二十時に官邸を出ていただきます。夜の会食は、今週はすべてお断りしてあります。初週から夜まで埋めると、来週が保ちませんので」",
        },
      ],
    },
    {
      id: "morning-press",
      label: "昨日の会見の反応を聞く",
      note: "世の中がどう受け取ったか",
      minutes: 10,
      reply: [
        {
          speaker: SHINOZUKA.shortName,
          text: "「各紙、論調は割れています。好意的が二、様子見が三、冷ややかが一といったところです」",
        },
        {
          speaker: SHINOZUKA.shortName,
          text: "「ネットの反応は量だけ見ています。昨夜がピークで、今朝は三分の一に落ちました。これは通常の減り方です」",
        },
      ],
    },
  ],
  closing: [
    {
      speaker: SAWATARI.shortName,
      text: "「以上です。臨時閣議まで一時間ありますので、執務室でお過ごしください」",
    },
    {
      speaker: SHINOZUKA.shortName,
      text: "「資料の追加が要りましたら、いつでも仰ってください」",
    },
  ],
};
