/**
 * 設計書28章。人格は最初から数値で決まっているのではなく、実際に何をしたかが
 * 積み上がっていく。v0.2では貯めて振り返りに一行出すところまでで、NPCの
 * 反応には反映しない。
 */
export interface Tendency {
  /** これらのフラグが全て立っているときに出る。 */
  flags: string[];
  text: string;
}

/** 上から順に見て、最初に当てはまったものを一つだけ出す。 */
export const TENDENCIES: Tendency[] = [
  {
    flags: ["ignored-the-call"],
    text: "篠塚からの電話には出なかった。理由を知らないまま、繰り上がった席についた。",
  },
  {
    flags: ["chased-the-objection"],
    text: "囲みの五行を、そのままにしなかった。二人の秘書官に確かめさせている。",
  },
  {
    flags: ["asked-about-family", "talked-to-wife"],
    text: "この朝、家族と話す時間をとった。政治の話は一つも出なかった。",
  },
  {
    flags: ["asked-for-help"],
    text: "抱え込む癖を指摘され、否定しなかった。",
  },
  {
    flags: ["admitted-doubt"],
    text: "迷っている、と口に出した。言える相手がいることを確かめた朝でもある。",
  },
  {
    flags: ["talked-to-wife"],
    text: "台所で少し話した。それだけの朝だったが、それだけの朝でもなかった。",
  },
  {
    flags: ["knows-the-objection"],
    text: "党内に異論があることには気づいた。そこから先に何をするかは、まだ決めていない。",
  },
];

/** この朝の傾向。当てはまるものがなければ null。 */
export function describeTendency(flags: string[]): string | null {
  const found = TENDENCIES.find((tendency) =>
    tendency.flags.every((flag) => flags.includes(flag)),
  );
  return found?.text ?? null;
}
