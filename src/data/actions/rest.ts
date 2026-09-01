import type { Action } from "../../types/action";
import { WIFE } from "../characters";

export const EAT_BREAKFAST: Action = {
  id: "breakfast",
  label: "朝食をとる",
  category: "rest",
  hint: "食卓に用意されている",
  perSegment: { hunger: -30, fatigue: -2 },
  segments: [
    {
      minutes: 10,
      text: `席につく。${WIFE.name}が焼いた鮭と、味噌汁と、白い飯。\n\n昨日から、ほとんど何も食べていなかったことに、箸を持って初めて気づいた。`,
    },
    {
      minutes: 10,
      text: "味噌汁を飲み干す。体の内側が温まっていくのが分かる。\n\n新聞をたたんで脇に置き、残りを黙って食べた。食べ終える頃には、少し人心地がついていた。",
      highlight: "朝食をとった。",
    },
  ],
};

export const NAP: Action = {
  id: "nap",
  label: "仮眠をとる",
  category: "rest",
  hint: "目を閉じるだけでも違う",
  repeatable: true,
  perSegment: { fatigue: -8 },
  segments: [
    { minutes: 10, text: "ソファに身を預け、目を閉じる。眠りには落ちない。まぶたの裏が明るい。" },
    { minutes: 10, text: "呼吸が深くなる。首の後ろの強張りが、少しずつほどけていく。" },
    { minutes: 10, text: "浅いところまで沈んで、また浮き上がってきた。頭の芯の重さが、いくらか抜けている。" },
  ],
};

export const IDLE: Action = {
  id: "idle",
  label: "少しぼーっとする",
  category: "rest",
  hint: "何もしない",
  repeatable: true,
  perSegment: { fatigue: -3 },
  segments: [
    {
      minutes: 15,
      text: "何もしないでいる。\n\n窓の外で、まだ人の少ない道路を車が一台通り過ぎた。遠くで鳥が鳴いている。\n\n昨日までは一人の議員だった。今日からは違う。その事実を、うまく実感として掴めないまま、ただ座っていた。",
    },
  ],
};

export const GET_READY: Action = {
  id: "ready",
  label: "身支度をする",
  category: "life",
  hint: "顔を洗い、着替える",
  perSegment: { fatigue: -1 },
  segments: [
    {
      minutes: 10,
      text: "洗面所で顔を洗う。鏡に映った顔は、思っていたより疲れて見えた。\n\n髭を剃る。手元が少し狂って、顎に小さく切り傷をつくった。",
    },
    {
      minutes: 10,
      text: "スーツに着替える。昨日と同じ紺。ネクタイだけ変えた。\n\n袖を通しながら、これが制服になるのだ、と思った。",
      highlight: "身支度を整えた。",
    },
  ],
};
