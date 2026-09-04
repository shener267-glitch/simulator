import type { Concern } from "../types/concern";
import { DAY_LENGTH } from "../types/clock";

/**
 * 上から順に見て、当てはまったものを先頭から最大2件出す（`data/tendencies.ts`
 * と同じ書き味）。上にあるものほど、その日の本人にとって大きい。
 *
 * 一日の軸は経済対策に一本化してある（本セッションでの決定）。朝に資料を
 * 読まないまま11:00を迎えると、党幹部との会談で選べる手が減る。それが
 * 「無視できるが、無視した結果は出る」という形の全部で、点数はつかない。
 */
export const CONCERNS: Concern[] = [
  {
    id: "papers-unread",
    text: "昨夜届いた経済対策の資料に、まだ目を通していない。",
    until: 300, // 党幹部との会談。過ぎたら、もう間に合わない
    unlessFlags: ["skimmed-economic-papers", "read-economic-papers"],
  },
  {
    id: "papers-half",
    text: "資料は途中までしか読んでいない。四ページ目の試算を見ていない。",
    until: 300,
    requiresFlags: ["skimmed-economic-papers"],
    unlessFlags: ["read-economic-papers"],
  },
  {
    id: "objection",
    text: "経済対策の財源に、党内から声が出ているらしい。誰が言っているのかは分からない。",
    until: 300,
    requiresFlags: ["knows-the-objection"],
    unlessFlags: ["chased-the-objection", "asked-who-objects"],
  },
  {
    id: "not-dressed",
    text: "まだ着替えていない。八時前には車が来る。",
    from: 30, // 06:30
    until: 115,
    unlessFlags: ["dressed"],
  },
  {
    id: "no-breakfast",
    text: "昨日の昼から、ろくに食べていない。",
    from: 45, // 06:45
    until: 115,
    unlessFlags: ["ate-breakfast"],
  },
  {
    id: "wife",
    text: "咲希と、昨日からまだ一言も話していない。",
    from: 20,
    until: 115,
    unlessFlags: ["talked-to-wife"],
  },
  {
    id: "party-ahead",
    text: "十一時に党幹部と会う。経済対策の話になる。",
    from: 180, // 09:00
    until: 300,
    requiresFlags: ["read-economic-papers"],
  },
  {
    id: "papers-still-there",
    text: "読み切れなかった資料が、机の上に残っている。",
    from: 840, // 帰宅してから
    requiresFlags: ["skimmed-economic-papers"],
    unlessFlags: ["read-economic-papers"],
  },
  {
    id: "family-tonight",
    text: "今日は家族と、ほとんど顔を合わせていない。",
    from: 840,
    unlessFlags: ["sat-with-family", "talked-to-wife"],
  },
  {
    id: "tomorrow",
    text: "明日も八時に迎えが来る。もう寝てもいい時間だ。",
    from: 1020, // 23:00
    // 出口は就寝そのもの。寝れば一日が終わり、寝なければ24:00でここも閉じる。
    until: DAY_LENGTH,
  },
  {
    id: "speech",
    text: "所信表明で何を言うか、まだ一行も決まっていない。",
    from: 240, // 10:00
    unlessFlags: ["drafted-the-speech"],
  },
];
