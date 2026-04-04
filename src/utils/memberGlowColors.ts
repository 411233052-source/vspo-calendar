/**
 * 成員主畫面「環境光暈」用代表色（可依官方色自行調整）。
 * 未列出的成員會退回 member.themeColor。
 */
export const MEMBER_GLOW_HEX: Readonly<{ [memberId: string]: string }> = {
  hinano: '#ff69b4',
  sena: '#5eb8e8',
  sumire: '#9b59d6',
  nazuna: '#e89ec4',
  uruha: '#7eb3d8',
  toto: '#dcd4a8',
  noa: '#e2daf2',
  ren: '#ff5c33',
  mimi: '#ff6eb3',
  lisa: '#6fd678',
  qpi: '#d4c832',
  beni: '#7dd9a0',
  ema: '#5ec8f0',
  runa: '#c4b4f5',
  tsuna: '#f07850',
  ramune: '#3dd4e0',
  met: '#f0a038',
  akari: '#f08ab8',
  kuromu: '#9b6edc',
  kokage: '#4a9bd4',
  yuuhi: '#f08830',
  hanabi: '#e86030',
  moka: '#ff7ab8',
  chise: '#7ed9a0',
  saine: '#a8b8c8',
  remia: '#20c0d0',
  arya: '#787890',
  jira: '#40d050',
  narin: '#d080d8',
  riko: '#b868d8',
  eris: '#70c0e8',
}

export function resolveMemberGlowHex(
  memberId: string,
  fallbackThemeHex: string,
): string {
  const key = memberId.trim().toLowerCase()
  const mapped = key ? MEMBER_GLOW_HEX[key] : undefined
  return mapped ?? fallbackThemeHex
}
