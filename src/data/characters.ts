/** 設計書3〜4章・9章。名前は本セッションでユーザーが決定したもの。 */

export const PLAYER_DEFAULT_NAME = {
  familyName: "永田",
  givenName: "進",
} as const;

export const WIFE = { name: "咲希", age: 54 } as const;
export const ELDER_SON = { name: "直人", age: 22 } as const;
export const YOUNGER_SON = { name: "悠人", age: 19 } as const;

/** 政治・人間関係・スケジュールを預かる政務担当。主人公とは八年目。 */
export const SAWATARI = {
  name: "沢渡 健吾",
  shortName: "沢渡",
  age: 43,
  role: "政務担当秘書官",
} as const;

/** 政策・資料・情報・実務を預かる。主人公とは五年目。 */
export const SHINOZUKA = {
  name: "篠塚 遥",
  shortName: "篠塚",
  age: 31,
  role: "事務担当秘書官",
} as const;
