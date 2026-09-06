import type { TalkTree } from "../../types/talk";
import { SAWATARI } from "../characters";

/**
 * 政務担当。政局と人間関係と日程を持っている（設計書9章・11章）。
 * 篠塚と同じ話題を振っても、返ってくるものは違う。
 */
export const SAWATARI_TREE: TalkTree = {
  id: "sawatari",
  label: `${SAWATARI.shortName}と話す`,
  short: SAWATARI.shortName,
  emoji: "👨‍💼",
  hint: "政務担当。八年、そばにいる",
  rootId: "root",
  nodes: [
    {
      id: "root",
      prompt: "「はい、沢渡です。おはようございます」",
      choices: [
        { kind: "goto", id: "to-orders", label: "指示を出す", to: "orders" },
        { kind: "goto", id: "to-consult", label: "相談する", to: "consult" },
        { kind: "end", id: "hang-up", label: "電話を切る" },
      ],
    },
    {
      id: "orders",
      prompt: "「承ります。何なりと」",
      choices: [
        {
          kind: "topic",
          id: "order-schedule",
          label: "今日の予定について",
          once: true,
          flags: ["minds-the-schedule"],
          reply: {
            minutes: 10,
            speaker: SAWATARI.shortName,
            text: "「昼食と夕方でしたら、まだ動かせます。それ以外は先方のあることばかりですので」\n\n少し考える間があった。\n\n「差し出がましいですが、動かすなら夕方をお勧めします。初日から夜を空けておくと、来週以降が楽になります」",
          },
        },
        {
          kind: "topic",
          id: "order-contact",
          label: "誰かへの連絡を頼む",
          once: true,
          reply: {
            minutes: 10,
            speaker: SAWATARI.shortName,
            text: "「総裁選で競われた側ですね。承知しました」\n\nこちらが名前を言う前に、そう返ってきた。\n\n「今日中に、私の名前で一度ずつ。総理から直接というのは、もう少し形が整ってからのほうがよろしいかと」",
            highlight: "沢渡に、党内への地ならしを頼んだ。",
          },
        },
        {
          kind: "topic",
          id: "order-dig",
          label: "党内の声の出どころを調べてもらう",
          once: true,
          requiresFlag: "knows-the-objection",
          flags: ["chased-the-objection"],
          reply: {
            minutes: 10,
            speaker: SAWATARI.shortName,
            text: "「もう当たっています。書いた記者に、篠塚から直接」\n\n言葉を選ぶ間があった。\n\n「一人が言っているだけなら、記事にはなりません。なったということは、複数から同じ話が取れているということです」",
            highlight: "沢渡と篠塚に、党内の異論の出どころを当たらせた。",
          },
        },
        {
          kind: "topic",
          id: "order-summit",
          label: "首脳会合の出欠を外務省に伝える",
          once: true,
          requiresFlag: "knows-the-summit",
          flags: ["decided-the-summit"],
          reply: {
            minutes: 10,
            speaker: SAWATARI.shortName,
            text: "「出席で、外務省にお伝えしておきます」\n\n即答した。迷った様子はなかった。\n\n「就任直後に外へ出る総理は、次も外へ出やすくなります。逆もまた然りです。今回は出ておかれた方がいいと、私は思います」\n\n伝えます、とだけ答えた。四日間の予定が、これで一つ動き出した。",
            highlight: "首脳会合に出席する、と外務省に返事をした。",
          },
        },
      ],
    },
    {
      id: "consult",
      prompt: "「どうぞ」",
      choices: [
        {
          kind: "topic",
          id: "consult-party",
          label: "党内の状況について",
          once: true,
          reply: {
            minutes: 10,
            speaker: SAWATARI.shortName,
            text: "「総裁選で競った側は、いまのところ静かです」\n\n少し言葉を選ぶ間があった。\n\n「静かなうちに、こちらから声をかけておいた方がいい方が何人かおられます。名前はブリーフィングのときに」",
            highlight: "沢渡と党内の状況を話した。",
          },
        },
        {
          kind: "topic",
          id: "consult-report",
          label: "党内の異論について",
          once: true,
          requiresFlag: "knows-the-objection",
          reply: {
            minutes: 10,
            speaker: SAWATARI.shortName,
            text: "「中身の話ではありません。順番の話です」\n\n「発足翌日に党を通さず固めた、という形になるのを嫌がっておられるだけです。中身を説明しても、そこは動きません」\n\n「今日は短くお答えください。長く答えたぶんだけ、見出しが長くなります」",
          },
        },
        {
          kind: "topic",
          id: "consult-me",
          label: "自分のやり方について",
          once: true,
          flags: ["asked-for-help"],
          reply: {
            minutes: 10,
            speaker: SAWATARI.shortName,
            text: "「差し出がましいことを申し上げますが」\n\n珍しく、言いにくそうにしている。\n\n「総理は、抱え込む癖がおありです。これから四年、そのやり方だと保ちません。使えるものは私も含めて使ってください」",
            highlight: "沢渡に、抱え込む癖を指摘された。",
          },
        },
      ],
    },
  ],
};
