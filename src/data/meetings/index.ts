import type { Meeting } from "../../types/meeting";

/**
 * 2024年10月1日の各予定を「場面」にしたもの（設計書15章・28章）。
 *
 * 【事実】首班指名選挙・親任式・組閣・認証式・第一回閣議・就任記者会見は
 * いずれも実際にこの日に行われた。官房長官・林芳正が読み上げる進行や、
 * 記者会見の質疑の「型」は現実の慣行に沿わせてある。
 *
 * 【ゲーム上の設定】分刻みの台詞そのもの、秘書官の発言、総理（プレイヤー）が
 * 選べる選択肢の中身は創作。実在の人物に、確認できない具体的な政治的発言を
 * 語らせないよう、官房長官の台詞は進行を読み上げる程度にとどめてある。
 */
export const MEETINGS: Meeting[] = [
  {
    appointmentId: "diet-designation-vote",
    opening: [
      {
        text: "国会議事堂、本会議場。与党の議席は静かにざわめいている。まもなく首班指名選挙が始まる。",
      },
      { speaker: "秘書官", text: "時間です。本会議場へ。" },
    ],
    prompt: "開会まで、まだ少し時間がある。",
    choices: [
      {
        id: "check-numbers",
        label: "与党内の票の固まり具合を確認する",
        note: "秘書官に聞く",
        minutes: 15,
        reply: [
          {
            speaker: "秘書官",
            text: "連立を組む会派を含めて、数の上で崩れる要素はありません。粛々と進めば問題ないかと。",
          },
        ],
      },
      {
        id: "review-remarks",
        label: "指名を受けたあとの一言を練る",
        note: "短い所感を用意する",
        minutes: 20,
        reply: [
          { text: "指名されたら、短く一言だけ求められる。長く話す場ではない、と自分に言い聞かせる。" },
        ],
        flags: ["prepared-designation-remarks"],
      },
      {
        id: "watch-opposition",
        label: "野党側の様子をうかがう",
        minutes: 15,
        reply: [
          { text: "野党の議席からは、これといった動きは見えない。予定通りに進むだろう。" },
        ],
      },
    ],
    closing: [
      { text: "議長が結果を告げる。——衆議院において、石破茂が内閣総理大臣に指名された。" },
      { text: "拍手はまばらで、儀礼的なものだった。まだ何も始まっていない、という感覚の方が強い。" },
    ],
  },

  {
    appointmentId: "imperial-attestation-pm",
    opening: [
      { text: "皇居。総理大臣としての親任式に臨む。" },
      { speaker: "秘書官", text: "所要は短いです。流れはすでにご説明した通りで。" },
    ],
    prompt: "式まで、少しだけ間がある。",
    choices: [
      {
        id: "confirm-protocol",
        label: "式の流れをもう一度確認する",
        minutes: 10,
        reply: [{ speaker: "秘書官", text: "所定の位置にお進みいただき、あとは合図に従っていただくだけです。" }],
      },
      {
        id: "quiet-moment",
        label: "少し黙って気持ちを整える",
        minutes: 15,
        reply: [{ text: "指名された実感は、まだあまりない。式が終わる頃には変わるだろうか。" }],
      },
    ],
    closing: [
      { text: "親任式が終わった。これで正式に、内閣総理大臣に任命されたことになる。" },
      { text: "この先は、組閣を固めて、今夜には内閣として発足させる段取りになる。" },
    ],
  },

  {
    appointmentId: "cabinet-lineup-finalization",
    opening: [
      { text: "官邸。閣僚人事の最終調整。官房長官・林芳正が、これまでの調整状況を報告する。" },
      { speaker: "林官房長官", text: "各ポストの調整は大詰めです。最終的な名簿の確認をお願いします。" },
    ],
    prompt: "名簿の確認と、いくつかの調整が残っている。",
    choices: [
      {
        id: "confirm-lineup",
        label: "名簿全体にひと通り目を通す",
        minutes: 20,
        reply: [{ text: "留任と入れ替わりの顔ぶれを、名簿の上でひと通り確認する。" }],
        flags: ["reviewed-cabinet-lineup"],
      },
      {
        id: "ask-balance",
        label: "党内の派閥バランスについて聞く",
        minutes: 15,
        reply: [
          { speaker: "林官房長官", text: "その点も含めて調整済みです。詳細は名簿の通りで。" },
        ],
      },
      {
        id: "leave-to-staff",
        label: "細部は事務方に任せる",
        minutes: 10,
        reply: [{ text: "細部の調整は事務方に委ね、大枠の確認だけにとどめる。" }],
      },
    ],
    closing: [
      { text: "閣僚名簿が固まった。あとは夜の認証式と組閣を待つだけになる。" },
    ],
  },

  {
    appointmentId: "imperial-attestation-ministers",
    opening: [
      { text: "皇居。夜、閣僚の認証式。ひとりずつ、任命が正式なものになっていく。" },
    ],
    prompt: "認証式が進む間、しばらく待つ時間がある。",
    choices: [
      {
        id: "watch-ministers",
        label: "閣僚それぞれの表情を見ている",
        minutes: 15,
        reply: [{ text: "初入閣の顔、留任の顔、それぞれの表情が違う。今夜からこの顔ぶれで内閣を担う。" }],
      },
      {
        id: "think-ahead",
        label: "この先の政権運営に考えを巡らせる",
        minutes: 15,
        reply: [{ text: "支持率も、経済対策も、これから全部が動き出す。今はまだ、その手前にいる。" }],
      },
    ],
    closing: [
      { text: "認証式が終わった。石破内閣が、正式に発足した。" },
    ],
  },

  {
    appointmentId: "first-cabinet-meeting",
    opening: [
      { text: "官邸4階、閣議室。第一回閣議。全閣僚が着席している。" },
      {
        speaker: "林官房長官",
        text: "ただいまより第一回閣議を開きます。まずは基本方針の確認から進めます。",
      },
    ],
    prompt: "閣議は形式的な進行で進む。案件を読み上げ、署名して終わる——長い議論の場ではない。",
    choices: [
      {
        id: "state-priority",
        label: "経済対策を最優先する方針を短く述べる",
        minutes: 15,
        reply: [
          { text: "物価高への対応を、内閣の最初の仕事として最優先する、とだけ短く伝える。" },
        ],
        flags: ["stated-economy-priority"],
      },
      {
        id: "ask-minister",
        label: "特定の閣僚を閣議のあとに残して話す",
        note: "誰を残したかは、会見に来ている記者にも見えている",
        minutes: 20,
        reply: [
          { text: "閣議のあと少し残ってもらえるよう、担当閣僚に声をかける。誰を残したかは、記者にも見えているはずだ。" },
        ],
        flags: ["kept-a-minister-after-cabinet"],
      },
      {
        id: "sign-and-move",
        label: "案件に署名し、手早く進める",
        minutes: 10,
        reply: [{ text: "案件を確認し、署名する。閣議はこういうものだ、とあらためて実感する。" }],
      },
    ],
    closing: [
      { text: "第一回閣議が終わった。次は、就任後はじめての記者会見が控えている。" },
    ],
  },

  {
    appointmentId: "first-press-conference",
    opening: [
      { text: "官邸1階、記者会見室。就任後はじめての記者会見。フラッシュが一斉に焚かれる。" },
      { text: "冒頭発言のあと、質疑応答に移る。" },
    ],
    prompt: "記者からの質問に、どう応じるかを決めていく。",
    choices: [
      {
        id: "answer-economy",
        label: "経済対策について具体的に踏み込んで答える",
        note: "「総合経済対策の骨子」を読んでいれば、より具体的に話せる",
        minutes: 15,
        requiresFlag: "read-keizai-taisaku-shian",
        reply: [
          {
            text: "報告書で見た規模感を踏まえ、対策の方向性について具体的な言葉で答える。記者席がわずかにざわつく。",
          },
        ],
        flags: ["answered-economy-in-detail"],
      },
      {
        id: "answer-economy-generic",
        label: "経済対策については一般論で答える",
        minutes: 10,
        unlessFlag: "read-keizai-taisaku-shian",
        reply: [{ text: "「早急に取りまとめる」という一般的な言い方にとどめる。詳細はまだ話せる段階にない。" }],
      },
      {
        id: "answer-diplomacy",
        label: "外交・安全保障の質問に答える",
        minutes: 15,
        reply: [{ text: "同盟関係と地域情勢について、これまでの路線を維持する考えを述べる。" }],
      },
      {
        id: "deflect-personnel",
        label: "人事についての質問は明言を避ける",
        minutes: 10,
        reply: [{ text: "人事の詳細な理由については、明言を避けて先に進める。" }],
      },
    ],
    closing: [
      { text: "会見が終わる。就任初日は、これでひとまず区切りがつく。" },
      { text: "この先、内閣がどう評価されていくかは、まだ何も決まっていない。" },
    ],
  },
];
