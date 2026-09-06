/**
 * 政治まわりのデータ（Phase 2指示書1〜6章）。プレイヤーの国のことだけを
 * 持つ——「石破茂本人」ではなく「日本政府・総理大臣という政治システム」を
 * 操作する、という指示書6章の原則どおり、指導者は固定の登場人物ではなく
 * 差し替え可能な値として持たせてある。
 */
export interface Leader {
  name: string;
  cabinetName: string;
}

/**
 * 政党（指示書5章）。議席・支持率は開始日時点の実データに近い概算
 * 【参考】——シミュレーションの計算にはまだ使わない、表示用の値。
 */
export interface Party {
  id: string;
  name: string;
  ideology: string;
  seats: number;
  /** 国民からの支持率、% */
  popularity: number;
  /** 政権に対するこの党の支持度、% (与党なら高く、野党なら低い) */
  governmentSupport: number;
  /** 他党との関係。Phase 2では空——後で拡張する置き場所。 */
  factionRelations: Record<string, number>;
}

export interface PoliticalStats {
  politicalPower: number;
  /** 1日あたりの政治力の増加量。国家方針の効果で変わる。 */
  politicalPowerPerDay: number;
  /** 政府支持率、% */
  governmentSupport: number;
  /** 安定度、% */
  stability: number;
}

/** 国家方針の`add_national_modifier`効果が積む、恒久的な補正の表示用エントリ。 */
export interface NationalModifier {
  id: string;
  label: string;
}
