import type { TalkTree } from "../../types/talk";
import { SHINOZUKA } from "../characters";

/**
 * 事務担当。資料と数字を持っている（設計書9章・11章）。沢渡が「誰が」を
 * 答えるところで、この人は「いくつ」を答える。
 */
export const SHINOZUKA_TREE: TalkTree = {
  id: "shinozuka",
  label: `${SHINOZUKA.shortName}に電話する`,
  short: SHINOZUKA.shortName,
  emoji: "👩‍💼",
  hint: "事務担当。資料はいつも先に揃っている",
  rootId: "root",
  nodes: [
    {
      id: "root",
      prompt: "「篠塚です。おはようございます。起きておられましたか」",
      choices: [
        { kind: "goto", id: "to-orders", label: "指示を出す", to: "orders" },
        { kind: "goto", id: "to-consult", label: "相談する", to: "consult" },
        { kind: "end", id: "hang-up", label: "電話を切る" },
      ],
    },
    {
      id: "orders",
      prompt: "「はい。書き留めます」",
      choices: [
        {
          kind: "topic",
          id: "order-materials",
          label: "資料を追加で用意してもらう",
          once: true,
          flags: ["wants-the-numbers"],
          reply: {
            minutes: 10,
            speaker: SHINOZUKA.shortName,
            text: "「どの範囲まで、と伺ってよろしいですか」\n\nこちらが答えると、短い沈黙があった。キーボードの音がしている。\n\n「わかりました。今日の移動の車内で読める分量にします。それ以上は、お読みになる時間がありませんので」",
            highlight: "篠塚に、追加の資料をまとめるよう頼んだ。",
          },
        },
        {
          kind: "topic",
          id: "order-watch",
          label: "情報を集めてもらう",
          once: true,
          reply: {
            minutes: 10,
            speaker: SHINOZUKA.shortName,
            text: "「各紙の朝刊と、主要な番組は録ってあります。ネットの反応も、量の推移だけ見ています」\n\n「中身を一つずつお読みになる必要はないと思います。増えているか減っているか、それだけ申し上げます」",
          },
        },
        {
          kind: "topic",
          id: "order-check-ministers",
          label: "財源の三案を整理してもらう",
          once: true,
          requiresFlag: "knows-the-objection",
          flags: ["chased-the-objection"],
          reply: {
            minutes: 10,
            speaker: SHINOZUKA.shortName,
            text: "「四ページ目の試算のことですね。あれは三案を並べたうちの一つを抜き出したものです」\n\n事務的な声のまま、そこだけ少し硬くなった。\n\n「抜き出して読まれる形で出したのは、こちらの落ち度です。三案を一枚に並べ直して、今日中にお持ちします」",
            highlight: "篠塚に、財源三案の整理を頼んだ。",
          },
        },
      ],
    },
    {
      id: "consult",
      prompt: "「どうぞ。お答えできる範囲で」",
      choices: [
        {
          kind: "topic",
          id: "consult-agenda",
          label: "当面の案件について",
          once: true,
          reply: {
            minutes: 10,
            speaker: SHINOZUKA.shortName,
            text: "「各省から上がってきている案件、優先度をつけて三つに絞ってあります」\n\n手元の端末を操作する音がする。\n\n「一つ目は補正の枠組み、二つ目は来週の国会日程、三つ目は――これは急ぎませんが、閣僚の身辺の確認です」",
            highlight: "篠塚から当面の案件の整理を受けた。",
          },
        },
        {
          kind: "topic",
          id: "consult-opinion",
          label: "世論について",
          once: true,
          reply: {
            minutes: 10,
            speaker: SHINOZUKA.shortName,
            text: "「発足直後の数字は、内容ではなく期待で動きます。いま高くても、それは総理への評価ではありません」\n\n「意味が出てくるのは、最初の判断をなさったあとの動き方です。上がるか下がるかより、どちらに何ポイント動いたかを見ます」",
          },
        },
        {
          kind: "topic",
          id: "consult-doubt",
          label: "迷っている、と伝える",
          once: true,
          flags: ["admitted-doubt"],
          reply: {
            minutes: 10,
            speaker: SHINOZUKA.shortName,
            text: "「私が申し上げるのは越権かもしれませんが」\n\n一瞬、言葉が途切れた。\n\n「数字は揃えられます。判断はできません。そこは総理にお願いするしかないので、迷われたときは、迷っているとだけ言ってください。材料を出し直します」",
            highlight: "篠塚に、迷っていると伝えた。",
          },
        },
      ],
    },
  ],
};
