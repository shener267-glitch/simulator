/**
 * 国家データ（指示書11章）。国をハードコードせず、この形のデータとして
 * 管理する——後のPhaseで全世界の国を足しても、この型は変えずに済む。
 */
export interface Country {
  /** 内部id。ISO 3166-1 alpha-3。 */
  id: string;
  /** 世界地図の国境データ（world-atlas）が使うISO 3166-1数字コード。 */
  isoNumeric: string;
  name: string;
  flag: string;
  capital: string;
  population: number;
  government: string;
  politicalSystem: string;
  /** Phase 1では中身を持たない置き場所。後のPhaseで実データに置き換える。 */
  economy: Record<string, never>;
  military: Record<string, never>;
  diplomacy: Record<string, never>;
  provinces: never[];
  /** Phase 1でプレイ可能な国か。それ以外は地図上で見えるだけの存在。 */
  playable: boolean;
}
