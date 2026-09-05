import type { SoftInterrupt } from "../types/game";
import { SAWATARI, SHINOZUKA, WIFE, YOUNGER_SON } from "./characters";

/**
 * 一日に散らばる突発（設計書16章・26章、本セッションでの決定）。
 *
 * 予定表を見ただけでは、その日の出来事は分からない。予定と予定のあいだに、
 * 電話が入り、人が来て、確認を求められる。総理の自由時間が自由でないのは、
 * 主にこれのせいになる。
 *
 * 予定と違ってセグメントを切らない。切れ目で鳴り、どう答えるかを選ぶ。
 * **断る手が必ず並ぶ。** 全部聞いていたら一日は回らないし、断ることも
 * 忙しい総理の判断として成立する。
 */

/** 何も指定しない割り込みの、電話に残る中身のひな形。 */
const NO_MESSAGE = { from: "", body: [], minutes: 0 };

/** 06:40 妻から。まだ家にいる。 */
export const WIFE_ASKS: SoftInterrupt = {
  id: "wife-asks",
  at: 40,
  title: `${WIFE.name}に呼ばれた`,
  from: WIFE.name,
  minutes: 5,
  teaser: ["台所から声がした。", "「ちょっと、いい？」"],
  body: [],
  message: { ...NO_MESSAGE, from: WIFE.name },
  options: [
    {
      id: "answer",
      label: "行く",
      note: "手を止めて台所へ",
      minutes: 5,
      flags: ["talked-to-wife", "answered-the-house"],
      body: [
        "「これ、どっちに置いといたらいい」\n\n昨日届いた祝いの品だった。名前は知っている人と、知らない人が半々。",
        "「全部、事務所に回してくれ」と言うと、そうする、とだけ返ってきた。",
        "「あと」と、背中で言われた。「今日、何時に帰ってくるの」\n\n答えられなかった。",
      ],
    },
    {
      id: "brief",
      label: "そこから答える",
      note: "行かずに声だけ返す",
      minutes: 2,
      body: [
        "「あとで見る」と声を返した。\n\n返事はなかった。聞こえていないのか、聞こえていて返さないのかは分からなかった。",
      ],
    },
    { id: "ignore", label: "聞こえなかったことにする", note: "手を止めない", minutes: 0 },
  ],
  highlight: "",
  fired: false,
  answeredWith: null,
};

/** 07:20 篠塚から。出発前の確認。 */
export const MORNING_CHECK: SoftInterrupt = {
  id: "morning-check",
  at: 80,
  title: `${SHINOZUKA.shortName}から着信`,
  from: SHINOZUKA.shortName,
  minutes: 5,
  teaser: ["携帯が鳴った。篠塚だ。", "出発の三十五分前。この時間に掛けてくるということは、確認事項だろう。"],
  body: [],
  message: {
    from: SHINOZUKA.shortName,
    minutes: 3,
    flags: ["knows-the-gaggle"],
    body: [
      "お出になれなかったので、要点だけお送りします。",
      "本日8時のぶら下がりですが、玄関にカメラが六社入ります。所要は十分を予定しています。",
      "経済対策について聞かれた場合の受け方は、8時20分の打ち合わせでご相談させてください。",
    ],
  },
  options: [
    {
      id: "answer",
      label: "出る",
      note: "確認を聞く",
      minutes: 5,
      flags: ["knows-the-gaggle", "answered-the-call"],
      body: [
        "「おはようございます。二点だけ確認させてください」",
        "「一点、本日のぶら下がりは玄関で十分です。二点、経済対策について聞かれた場合、時期に触れられるかどうかだけ、先にうかがっておきたく」",
        "触れる、と答えた。「承知しました。では、そのように準備します」\n\n通話は四分で終わった。この人はいつも、掛ける前に何分で終わるかを決めている。",
      ],
    },
    { id: "defer", label: "後で読む", note: "メッセージで受ける", minutes: 0, leavesMessage: true },
    { id: "ignore", label: "出ない", note: "支度を続ける", minutes: 0, flags: ["ignored-the-call"] },
  ],
  highlight: "",
  fired: false,
  answeredWith: null,
};

/**
 * 09:17 篠塚から。景気動向指数の下振れと、党幹部の都合。
 * どう答えても会談は10:45に繰り上がる — 世界の側の動きなので。
 */
export const INDICATOR_CALL: SoftInterrupt = {
  id: "indicator",
  at: 197,
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

/** 11:40 官僚が扉の外に立っている。 */
export const OFFICIAL_AT_THE_DOOR: SoftInterrupt = {
  id: "official-door",
  at: 340,
  title: "ノックの音",
  from: "内閣府参事官",
  minutes: 15,
  teaser: [
    "二回、控えめなノック。扉が細く開いて、紙を抱えた人が半分だけ顔を出した。",
    "「総理、三分だけご説明したいのですが」",
  ],
  body: [],
  message: {
    from: SHINOZUKA.shortName,
    minutes: 5,
    flags: ["knows-the-package"],
    body: [
      "内閣府がお持ちした件、こちらで預かりました。",
      "経済対策の積み上げが前回を二割上回っており、規模の目安について総理のご意向をうかがいたい、という趣旨です。",
      "急ぎではありません。十六時の会談で改めて上がってきます。",
    ],
  },
  options: [
    {
      id: "brief",
      label: "三分だけ聞く",
      note: "言葉どおりに",
      minutes: 5,
      flags: ["heard-the-official", "keeps-it-short"],
      body: [
        "「では三分で」と言うと、参事官は紙を一枚だけ抜いて差し出した。",
        "「積み上げが前回を二割上回っています。総理から規模の目安を一言いただければ、こちらで削ります」",
        "「二割は落とす」と答えた。参事官は頭を下げて、本当に三分で出ていった。",
      ],
    },
    {
      id: "answer",
      label: "腰を据えて聞く",
      note: "三分では終わらない",
      minutes: 15,
      flags: ["heard-the-official", "knows-the-package", "knows-the-background"],
      body: [
        "座ってください、と言うと、参事官は少し驚いた顔をした。",
        "十五分かかった。積み上げの中身、削れる項目、削れない項目、削ると誰が困るか。",
        "三分の説明では出てこなかったのは最後の一つだった。削ると困るのは、この参事官が去年まで担当していた部署だった。",
        "それを言うために、この人は扉の外に立っていたのかもしれなかった。",
      ],
    },
    {
      id: "delegate",
      label: `${SHINOZUKA.shortName}に聞いてもらう`,
      note: "こちらは手を止めない",
      minutes: 2,
      flags: ["delegated-the-official"],
      leavesMessage: true,
      body: [
        "「篠塚に。要るところだけ上げてくれ」\n\n参事官は頷いて、秘書官室の方へ歩いていった。",
        "扉が閉まる。手元の紙に戻る。三十秒で、さっきまで何を読んでいたか思い出せた。",
      ],
    },
    { id: "ignore", label: "いまは手が離せないと伝える", note: "また来てもらう", minutes: 0 },
  ],
  highlight: "",
  fired: false,
  answeredWith: null,
};

/** 13:05 官房長官から。午後の会見の前に。 */
export const CHIEF_CALLS: SoftInterrupt = {
  id: "chief-calls",
  at: 425,
  title: "官房長官から着信",
  from: "官房長官",
  minutes: 10,
  teaser: ["「総理、いまよろしいですか」", "午後の会見の五十分前。この人がこの時間に掛けてくるのは、受けきれない質問があるときだ。"],
  body: [],
  message: {
    from: "官房長官",
    minutes: 5,
    flags: ["talked-to-chief"],
    body: [
      "午後の会見、財源について必ず問われます。",
      "「総理からは、特定の手段を前提にしていないと聞いている」で受けます。それ以上は総理の口から、ということで。",
      "ご異存あれば、会見前にご一報ください。無ければこのまま参ります。",
    ],
  },
  options: [
    {
      id: "answer",
      label: "出る",
      note: "受ける線を合わせる",
      minutes: 10,
      flags: ["talked-to-chief", "answered-the-call"],
      body: [
        "「財源です。今日の会見で必ず来ます」",
        "「『特定の手段を前提にしていない』で受けますが、そこから先を突かれた場合、私が答えるべきか、総理にお回しすべきか」",
        "答えると言った。少し間があって、「……承知しました」と返ってきた。",
        "「その場合、私は先に一度だけ止めます。止めきれなくなったら、お回しします」\n\nこの人は、こちらを守る手順を先に決めてから電話してくる。",
      ],
    },
    {
      id: "brief",
      label: "短く答える",
      note: "任せる、とだけ",
      minutes: 3,
      flags: ["talked-to-chief", "keeps-it-short"],
      body: [
        "「お任せします」とだけ言った。",
        "「承知しました」\n\nそれで切れた。三分もかからなかった。",
        "任せると言うのは簡単だった。任された側が何を背負うかは、こちらからは見えない。",
      ],
    },
    { id: "defer", label: "後で読む", note: "メッセージで受ける", minutes: 0, leavesMessage: true },
  ],
  highlight: "",
  fired: false,
  answeredWith: null,
};

/** 14:20 沢渡が執務室に来る。日程が一件増える。 */
export const SCHEDULE_CHANGES: SoftInterrupt = {
  id: "schedule-change",
  at: 500,
  title: `${SAWATARI.shortName}が入ってきた`,
  from: SAWATARI.shortName,
  minutes: 5,
  teaser: [
    "ノックと同時に扉が開いた。この人がノックを待たないのは、急ぎのときだけだ。",
    "「総理。日程を一件、入れさせていただきたいのですが」",
  ],
  body: [],
  message: {
    from: SAWATARI.shortName,
    minutes: 3,
    body: [
      "先ほどの件、17時に経済財政諮問会議の民間議員との面会を入れました。",
      "十五分です。先方からのご希望で、経済対策について一言いただきたいとのことです。",
    ],
  },
  movesAppointment: {
    appointmentId: "cao",
    to: 600,
    note: "内閣府幹部との会談は16:00のまま。夕方に一件増えた。",
  },
  options: [
    {
      id: "answer",
      label: "聞く",
      note: "何の件か",
      minutes: 5,
      flags: ["knows-the-new-slot", "answered-the-call"],
      body: [
        "「経済財政諮問会議の民間議員が、十五分だけお時間をいただきたいと」",
        "「断ることもできます。ただ、来週の骨子を出す前に一度会っておかれた方が、後が楽になります」",
        "入れてくれ、と答えた。沢渡は手帳に何も書かずに頷いた。すでに決めて持ってきていたのだった。",
      ],
    },
    {
      id: "brief",
      label: "任せる",
      note: "中身は聞かない",
      minutes: 2,
      flags: ["trusted-the-staff"],
      body: [
        "「入れておいてくれ」\n\n沢渡は一瞬だけこちらを見た。",
        "「……承知しました」\n\n何の件かを聞かなかったことに、たぶん気づいている。",
      ],
    },
    {
      id: "ignore",
      label: "今日はもう入れないでくれ、と言う",
      note: "断る",
      minutes: 2,
      flags: ["refused-a-slot"],
      body: [
        "「今日はもう入れないでくれ」",
        "沢渡は表情を変えずに頷いた。「承知しました。先方には、来週で調整します」",
        "断ることはできる。断ったことは、来週の自分に回るだけだった。",
      ],
    },
  ],
  highlight: "",
  fired: false,
  answeredWith: null,
};

/** 16:50 息子から。仕事とは関係のない一件。 */
export const SON_MESSAGES: SoftInterrupt = {
  id: "son-message",
  at: 650,
  title: `${YOUNGER_SON.name}からメッセージ`,
  from: YOUNGER_SON.name,
  minutes: 5,
  teaser: ["ポケットの中で短く震えた。仕事用ではない方だった。", "次男からだ。用事で連絡してくることは、めったにない。"],
  body: [],
  message: {
    from: YOUNGER_SON.name,
    minutes: 2,
    flags: ["read-the-son"],
    body: ["バイト先で総理の息子だってバレた", "べつに何もない　報告だけ"],
  },
  options: [
    {
      id: "answer",
      label: "その場で返す",
      note: "手を止めて",
      minutes: 5,
      flags: ["answered-the-son", "contacted-family"],
      body: [
        "「バイト先で総理の息子だってバレた」\n\n「べつに何もない　報告だけ」",
        "何と返すか、三十秒考えた。「大丈夫か」でも「すまない」でもない気がした。",
        "「そうか」と送った。すぐ既読がついて、それきりだった。",
        "それきりでいいのだと、たぶん向こうも思っている。",
      ],
    },
    { id: "defer", label: "後で見る", note: "いまは手が離せない", minutes: 0, leavesMessage: true },
    { id: "ignore", label: "見ない", note: "仕事に戻る", minutes: 0, flags: ["ignored-the-son"] },
  ],
  highlight: "",
  fired: false,
  answeredWith: null,
};

/** 21:10 帰ってから。篠塚が明日の分を届けに来る。 */
export const NIGHT_DELIVERY: SoftInterrupt = {
  id: "night-delivery",
  at: 910,
  title: "インターホンが鳴った",
  from: SHINOZUKA.shortName,
  minutes: 10,
  teaser: ["こんな時間に。画面を見ると篠塚だった。", "「夜分に失礼します。明日の分をお持ちしました」"],
  body: [],
  message: {
    from: SHINOZUKA.shortName,
    minutes: 3,
    body: [
      "玄関前に置かせていただきました。急ぎは黄色の付箋のみです。",
      "明日は八時にお迎えに上がります。",
    ],
  },
  options: [
    {
      id: "answer",
      label: "玄関で受け取る",
      note: "少し話す",
      minutes: 10,
      flags: ["took-the-delivery", "answered-the-call"],
      body: [
        "玄関を開けると、篠塚が紙袋を持って立っていた。スーツのままだった。",
        "「明日の分です。急ぎは黄色の付箋のみにしてあります」",
        "「こんな時間まで官邸にいたのか」と聞くと、少し間があった。",
        "「……いえ。一度帰って、また戻りました」\n\n三十一歳。この人にも、たぶん帰る家がある。",
        "「明日は八時にお迎えに上がります」と言って、頭を下げて帰っていった。",
      ],
    },
    {
      id: "brief",
      label: "受け取るだけにする",
      note: "引き止めない",
      minutes: 3,
      flags: ["took-the-delivery"],
      body: [
        "紙袋を受け取って、礼を言った。",
        "「では、失礼します」\n\n三十秒もかからなかった。エレベーターの音が遠くなっていく。",
      ],
    },
    { id: "ignore", label: "出ない", note: "居留守を使う", minutes: 0, leavesMessage: true, flags: ["ignored-the-door"] },
  ],
  highlight: "",
  fired: false,
  answeredWith: null,
};

export const DAY_INTERRUPTS: SoftInterrupt[] = [
  WIFE_ASKS,
  MORNING_CHECK,
  INDICATOR_CALL,
  OFFICIAL_AT_THE_DOOR,
  CHIEF_CALLS,
  SCHEDULE_CHANGES,
  SON_MESSAGES,
  NIGHT_DELIVERY,
];
