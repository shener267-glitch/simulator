import type { DutyItem } from "../types/task";
import { SAWATARI, SHINOZUKA } from "./characters";

/**
 * 6月6日に総理の側に積まれている仕事（本セッションでの決定）。
 *
 * **一つも片付けずに一日を終えられる。** 片付けなかったことは、その場では
 * 何も起きない。11:00の会談で切り出せる手が減り、午後の説明が二十分で
 * 四ページしか進まず、夜の記録に一行が足りない — そういう形でだけ返る。
 *
 * 期限（by）は表示にだけ使う。過ぎても叱らない。過ぎたことは、そのとき
 * 手が足りないという形で分かる。
 */
export const DUTIES: DutyItem[] = [
  {
    id: "papers",
    text: "経済対策の資料を読む",
    from: SHINOZUKA.shortName,
    by: 285, // 党幹部との会談
    doneFlags: ["read-economic-papers"],
  },
  {
    id: "objection",
    text: "党内の異論の出どころを確かめる",
    from: SAWATARI.shortName,
    by: 285,
    requiresFlags: ["knows-the-objection"],
    doneFlags: ["chased-the-objection", "asked-who-objects", "asked-the-press"],
  },
  {
    id: "schedule",
    text: "今日の日程を頭に入れる",
    from: SAWATARI.shortName,
    until: 300,
    doneFlags: ["minds-the-schedule", "checked-the-schedule"],
  },
  {
    id: "chief",
    text: "官房長官に、午後の会見で何を聞かれそうかを確認する",
    from: SAWATARI.shortName,
    from_: 140, // 官邸に入ってから
    until: 600,
    by: 420,
    doneFlags: ["talked-to-chief"],
    unlessFlags: ["left-the-kantei"],
  },
  {
    id: "box",
    text: "決裁箱を空にする",
    from: "事務方",
    from_: 140,
    doneFlags: ["cleared-the-box"],
    // 決裁箱は官邸にある。帰ったら、もう今日はできない。
    unlessFlags: ["left-the-kantei"],
  },
  {
    id: "speech",
    text: "所信表明の書き出しを決める",
    from_: 240,
    doneFlags: ["drafted-the-speech"],
  },
  {
    id: "summit",
    text: "来月の首脳会合に出るかどうかを、外務省に返す",
    from: "外務省",
    from_: 560, // 会談のあと
    requiresFlags: ["knows-the-summit"],
    doneFlags: ["decided-the-summit"],
    unlessFlags: ["left-the-kantei"],
  },
  {
    id: "package",
    text: "経済対策の規模と、三案のどれに寄せるかを決める",
    from: "内閣府",
    from_: 600,
    requiresFlags: ["knows-the-deadline"],
    doneFlags: ["worked-the-package", "settled-the-package"],
    unlessFlags: ["left-the-kantei"],
  },
  {
    id: "tomorrow",
    text: "明日の分に目を通す",
    from: SHINOZUKA.shortName,
    from_: 840,
    doneFlags: ["prepared-tomorrow"],
  },
];
