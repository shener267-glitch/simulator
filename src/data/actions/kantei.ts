import type { Action } from "../../types/action";


/**
 * 官邸で午後を埋めるための行動（設計書14章）。予定と予定のあいだが
 * 三時間空くことがあるので、書き物と資料だけでは足りない。
 */
export const SIGN_PAPERS: Action = {
  id: "sign",
  label: "決裁する",
  category: "work",
  emoji: "🖋️",
  places: ["office"],
  hint: "決裁箱が、また埋まっている",
  perSegment: { fatigue: 2 },
  segments: [
    {
      minutes: 10,
      text: "決裁箱から一束取る。人事の内示、閣僚の出張、法案の閣議請議。",
      lines: [
        "一枚ずつ、説明の紙がついている。読めば十分かかり、読まなければ十秒で終わる。",
        "読んだ。三枚目で、名前に見覚えのない外郭団体があった。付箋を貼って、篠塚の箱へ回した。",
      ],
    },
    {
      minutes: 10,
      text: "続きを取る。手が慣れてくると、判を押す速さだけが上がっていく。",
      lines: [
        "速くなっていることに気づいて、一度手を止めた。",
        "止めたところで、決裁箱の高さは変わらなかった。",
      ],
    },
    {
      minutes: 10,
      text: "箱の底が見えてきた。最後の数枚は、どれも来週の日程に関わるものだった。",
      flags: ["cleared-the-box"],
      lines: [
        "所信表明の日取りの案が三つ。どれかに丸をつければ、それで決まってしまう。",
        "丸はつけず、三つとも残して戻した。決めないことと、遅く決めることは違う — 今朝、自分でそう言ったばかりだった。",
      ],
      highlight: "決裁箱を空にした。",
    },
  ],
};

export const KANTEI_TEA: Action = {
  id: "tea",
  label: "一息つく",
  category: "rest",
  emoji: "🍵",
  places: ["office"],
  hint: "茶が出てくる。頼んでいないのに",
  repeatable: true,
  perSegment: { fatigue: -3 },
  segments: [
    {
      minutes: 10,
      text: "椅子の背に体を預ける。ノックの音がして、茶が置かれた。",
      lines: [
        "頼んでいない。ただ、この時間になると出てくるらしい。",
        "湯呑みを持つと、指先が冷えていたことに気づいた。",
      ],
    },
  ],
};

export const CHECK_PRESS: Action = {
  id: "press",
  label: "報道の反応を見る",
  category: "info",
  emoji: "📋",
  places: ["secretariat"],
  hint: "秘書官室の机に、切り抜きが積んである",
  perSegment: { fatigue: 1 },
  segments: [
    {
      minutes: 10,
      text: "秘書官室の壁際に、今日のぶんの切り抜きが時刻順に並べてある。",
      lines: [
        "朝のぶら下がりの記事が四本。うち三本の見出しに「来週」が入っている。",
        "残る一本だけが、物価と実質賃金の方を拾っていた。書いたのは、いちばん短い記事の記者だった。",
      ],
    },
  ],
};

export const WALK_GROUNDS: Action = {
  id: "grounds",
  label: "外の空気を吸う",
  category: "life",
  emoji: "🌿",
  places: ["entrance"],
  hint: "玄関の脇から、庭に出られる",
  perSegment: { fatigue: -4 },
  segments: [
    {
      minutes: 10,
      text: "玄関脇の扉から外に出る。警護が一人、少し離れてついてきた。",
      lines: [
        "六月の庭は、思っていたより緑が濃い。手入れをする人がいるのだと、当たり前のことを思った。",
        "十分。誰にも話しかけられない十分は、今日はこれが初めてだった。",
      ],
    },
  ],
};
