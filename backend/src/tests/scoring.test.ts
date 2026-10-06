import {
  americanToDecimal, impliedProbability, unitsForPick,
  confidenceToProbability, brierForPick, addPick, computeStats, EMPTY_STATS,
} from '../services/scoring';

describe('odds conversion', () => {
  it('converts American to decimal', () => {
    expect(americanToDecimal(+100)).toBeCloseTo(2.0);
    expect(americanToDecimal(-400)).toBeCloseTo(1.25);
    expect(americanToDecimal(+250)).toBeCloseTo(3.5);
    expect(americanToDecimal(-110)).toBeCloseTo(1.909, 3);
  });
  it('implied probability', () => {
    expect(impliedProbability(-400)).toBeCloseTo(0.8);
    expect(impliedProbability(+250)).toBeCloseTo(0.2857, 3);
  });
  it('rejects zero / non-finite', () => {
    expect(() => americanToDecimal(0)).toThrow(RangeError);
    expect(() => americanToDecimal(NaN)).toThrow(RangeError);
  });
});

describe('units', () => {
  it('a −400 winner earns a quarter unit; a loser always costs one', () => {
    expect(unitsForPick(-400, true)).toBeCloseTo(0.25);
    expect(unitsForPick(-400, false)).toBe(-1);
    expect(unitsForPick(+250, true)).toBeCloseTo(2.5);
  });
  it('no odds → not graded', () => {
    expect(unitsForPick(undefined, true)).toBeNull();
    expect(unitsForPick(null, false)).toBeNull();
  });
});

describe('calibration', () => {
  it('confidence maps 1..10 → 0.545..0.95 and is clamped', () => {
    expect(confidenceToProbability(1)).toBeCloseTo(0.545);
    expect(confidenceToProbability(10)).toBeCloseTo(0.95);
    expect(confidenceToProbability(99)).toBeCloseTo(0.95);
  });
  it('a confident miss costs more than a hedged miss', () => {
    expect(brierForPick(9, false)).toBeGreaterThan(brierForPick(4, false));
    expect(brierForPick(9, true)).toBeLessThan(brierForPick(4, true));
  });
});

describe('the thing the old formula got wrong', () => {
  // Chalk: ten −400 favourites, 8 win. 80% hit rate.
  const chalk = computeStats(Array.from({ length: 10 }, (_, i) => ({
    odds: -400, confidence: 9, isCorrect: i < 8,
  })));
  // Dog hunter: ten +250 underdogs, 4 win. 40% hit rate.
  const dogs = computeStats(Array.from({ length: 10 }, (_, i) => ({
    odds: +250, confidence: 5, isCorrect: i < 4,
  })));

  it('chalk has the higher win rate', () => {
    expect(chalk.winRate).toBe(0.8);
    expect(dogs.winRate).toBe(0.4);
  });
  it('but loses money while the dog hunter profits', () => {
    expect(chalk.unitsWon).toBe(0);          // 8 × 0.25 − 2 × 1 = 0
    expect(dogs.unitsWon).toBe(4);           // 4 × 2.5 − 6 × 1 = 4
    expect(dogs.cloutScore).toBeGreaterThan(chalk.cloutScore);
  });
  it('and the chalk capper who said "9" and lost twice is punished for it', () => {
    // two misses at p=0.905 → 0.819 each; eight hits → 0.009 each
    expect(chalk.brier).toBeCloseTo((2 * 0.819025 + 8 * 0.009025) / 10, 3);
  });
  it('followers are nowhere in the computation', () => {
    const s = addPick(EMPTY_STATS, { odds: +100, confidence: 5, isCorrect: true });
    expect(Object.keys(s)).not.toContain('followers');
    expect(s.cloutScore).toBe(s.unitsWon);
  });
});

describe('addPick is incremental and matches computeStats', () => {
  it('folding one at a time equals recomputing', () => {
    const picks = [
      { odds: -150, confidence: 7, isCorrect: true },
      { odds: +180, confidence: 3, isCorrect: false },
      { odds: undefined, confidence: 6, isCorrect: true },   // no odds: counts for brier, not units
      { odds: -110, confidence: 8, isCorrect: true },
    ];
    const folded = picks.reduce(addPick, EMPTY_STATS);
    expect(folded).toEqual(computeStats(picks));
    expect(folded.totalPicks).toBe(4);
    expect(folded.unitsGraded).toBe(3);
    expect(folded.wins).toBe(3);
  });
});
