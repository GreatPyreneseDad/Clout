/**
 * Clout scoring — units and calibration, not popularity.
 *
 * The previous formula was `winRate × 70 + min(followers/10, 30)`. It rewarded
 * picking heavy favourites (high hit rate, negative expected value) and gave
 * 30% of a capper's credibility to their follower count. Both are measures of
 * conformity, not skill.
 *
 * Two numbers replace it, both computed per pick from fields the Pick model
 * already stores (`prediction.odds`, `prediction.confidence`):
 *
 *   units   — profit/loss of a flat 1-unit bet at the odds the capper quoted.
 *             Picking a −400 favourite and winning earns 0.25u; losing costs 1u.
 *             This is the number a bettor following the capper would have made.
 *
 *   brier   — (statedProbability − outcome)². Lower is better. A capper who
 *             says "confidence 9" and loses pays more than one who says "4".
 *             brierSkill = 1 − brier / 0.25 compares against a coin flip:
 *             positive means the confidence numbers carry information.
 *
 * cloutScore is now simply net units. Followers are not in it.
 */

export interface GradedPick {
  odds?: number | null;     // American odds, e.g. -150, +230. Undefined → no units graded.
  confidence: number;       // 1..10
  isCorrect: boolean;
}

export interface CloutStats {
  totalPicks: number;       // verified picks
  wins: number;
  losses: number;
  winRate: number;
  unitsWon: number;         // net units, flat 1u stakes, picks with odds only
  unitsGraded: number;      // how many picks carried odds
  roi: number;              // unitsWon / unitsGraded (0 if none)
  brierSum: number;
  brier: number;            // mean Brier score over all verified picks
  brierSkill: number;       // 1 − brier/0.25
  cloutScore: number;       // == unitsWon
}

export const EMPTY_STATS: CloutStats = {
  totalPicks: 0, wins: 0, losses: 0, winRate: 0,
  unitsWon: 0, unitsGraded: 0, roi: 0,
  brierSum: 0, brier: 0, brierSkill: 0,
  cloutScore: 0,
};

/** American odds → decimal odds. −150 → 1.667, +230 → 3.3 */
export function americanToDecimal(odds: number): number {
  if (!Number.isFinite(odds) || odds === 0) throw new RangeError(`invalid American odds: ${odds}`);
  return odds > 0 ? 1 + odds / 100 : 1 + 100 / Math.abs(odds);
}

/** Bookmaker-implied win probability (includes vig). −150 → 0.6, +230 → 0.303 */
export function impliedProbability(odds: number): number {
  return 1 / americanToDecimal(odds);
}

/**
 * Net units from a flat 1u stake. Win → decimal − 1 (profit only); loss → −1.
 * Returns null when there are no odds to grade against.
 */
export function unitsForPick(odds: number | null | undefined, isCorrect: boolean): number | null {
  if (odds === null || odds === undefined || !Number.isFinite(odds) || odds === 0) return null;
  return isCorrect ? americanToDecimal(odds) - 1 : -1;
}

/**
 * Map the 1–10 confidence slider to a stated win probability.
 * 1 → 0.545, 5 → 0.725, 10 → 0.95. Capped at 0.95 so a maximal miss costs
 * 0.9025, not 1.0: nobody gets to claim certainty.
 */
export function confidenceToProbability(confidence: number): number {
  const c = Math.min(10, Math.max(1, confidence));
  return 0.5 + 0.045 * c;
}

/** Brier score for a single binary outcome. */
export function brierForPick(confidence: number, isCorrect: boolean): number {
  const p = confidenceToProbability(confidence);
  const o = isCorrect ? 1 : 0;
  return (p - o) ** 2;
}

/** Fold one graded pick into a running CloutStats. Pure; returns a new object. */
export function addPick(stats: CloutStats, pick: GradedPick): CloutStats {
  const units = unitsForPick(pick.odds, pick.isCorrect);
  const brier = brierForPick(pick.confidence, pick.isCorrect);

  const totalPicks = stats.totalPicks + 1;
  const wins = stats.wins + (pick.isCorrect ? 1 : 0);
  const losses = stats.losses + (pick.isCorrect ? 0 : 1);
  const unitsGraded = stats.unitsGraded + (units === null ? 0 : 1);
  const unitsWon = stats.unitsWon + (units ?? 0);
  const brierSum = stats.brierSum + brier;
  const brierMean = brierSum / totalPicks;

  return {
    totalPicks,
    wins,
    losses,
    winRate: wins / totalPicks,
    unitsWon: round(unitsWon),
    unitsGraded,
    roi: unitsGraded ? round(unitsWon / unitsGraded) : 0,
    brierSum: round(brierSum, 6),
    brier: round(brierMean, 4),
    brierSkill: round(1 - brierMean / 0.25, 4),
    cloutScore: round(unitsWon),
  };
}

/** Recompute from scratch over a capper's verified picks. */
export function computeStats(picks: Iterable<GradedPick>): CloutStats {
  let s = EMPTY_STATS;
  for (const p of picks) s = addPick(s, p);
  return s;
}

function round(x: number, places = 3): number {
  const f = 10 ** places;
  return Math.round(x * f) / f;
}
