import type { SoftInterrupt } from "../types/game";
import { SHINOZUKA } from "./characters";

/**
 * 一日に一件だけ、軽い突発を確定で鳴らす（設計書16章）。重大事件ばかりを
 * 突発にはしない — 予定の隙間に予定外のものが割り込んでくる手触りを確かめる
 * のが目的で、事件そのものは目的ではない。
 *
 * 予定と違ってセグメントを切らない。切れ目で鳴り、出るか、後回しにするか、
 * 無視するかをプレイヤーが選ぶ（設計書26章）。
 */
export const INDICATOR_CALL: SoftInterrupt = {
  id: "indicator",
  at: 197, // 09:17
  title: `${SHINOZUKA.shortName}から着信`,
  from: SHINOZUKA.shortName,
  minutes: 10,
  teaser: [
    "携帯が短く鳴った。篠塚だ。",
    "急ぎというほどの鳴り方ではない。ただ、この人が日中に掛けてくるのは珍しい。",
  ],
  body: [
    "「お仕事中に失礼します。先ほど発表された景気動向指数の件です」",
    "「先月から小幅に下振れました。数字そのものは想定の範囲ですが、発表のタイミングが経済対策の直前なので、記者からの問い合わせが来ています」",
    "「それと、党幹事長のご都合が変わりました。午後の日程が前に詰まったそうで、十一時からの会談を十時四十五分にしていただきたいと」",
    "「沢渡には伝えてあります。こちらで動かしておきます」",
  ],
  message: {
    from: SHINOZUKA.shortName,
    minutes: 5,
    flags: ["knows-the-indicator"],
    body: [
      "お手が離せなかったようですので、要点だけお送りします。",
      "先ほど発表の景気動向指数、先月から小幅に下振れました。数字は想定の範囲ですが、経済対策の直前という時期のため記者から問い合わせが来ています。",
      "党幹事長のご都合で、十一時からの会談を十時四十五分に繰り上げました。沢渡にも伝えてあります。",
    ],
  },
  movesAppointment: {
    appointmentId: "party-leaders",
    to: 285, // 10:45
    note: "党幹部との会談が10:45に繰り上がった。",
  },
  flags: {
    answer: ["answered-the-call", "knows-the-indicator"],
    defer: ["deferred-the-call"],
    ignore: ["ignored-the-call"],
  },
  highlight: "篠塚から着信。党幹部との会談が10:45に繰り上がった。",
  fired: false,
  answeredWith: null,
};

export const DAY_INTERRUPTS: SoftInterrupt[] = [INDICATOR_CALL];
