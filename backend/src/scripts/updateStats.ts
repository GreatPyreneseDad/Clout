/**
 * Recompute every capper's stats from their verified picks.
 *
 * Run after deploying the units/Brier scoring, or any time stats drift:
 *   npx tsx src/scripts/updateStats.ts
 *
 * Idempotent. Reads picks, writes stats. Never touches picks.
 */
import { config } from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User';
import Pick from '../models/Pick';
import { computeStats } from '../services/scoring';

config();

async function updateStats(): Promise<void> {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('connected');

  const cappers = await User.find({ role: 'capper' });
  for (const capper of cappers) {
    const verified = await Pick.find({
      capperId: capper._id,
      'verifiedOutcome.isCorrect': { $exists: true },
    }).select('prediction.odds prediction.confidence verifiedOutcome.isCorrect');

    const stats = computeStats(verified.map(p => ({
      odds: p.prediction?.odds,
      confidence: p.prediction?.confidence ?? 5,
      isCorrect: Boolean(p.verifiedOutcome?.isCorrect),
    })));

    capper.stats = { ...stats, correctPicks: stats.wins };
    capper.cloutScore = stats.cloutScore;
    await capper.save();

    const sign = stats.unitsWon >= 0 ? '+' : '';
    console.log(
      `${capper.username.padEnd(20)} ${stats.wins}W-${stats.losses}L  ` +
      `${sign}${stats.unitsWon.toFixed(2)}u over ${stats.unitsGraded} graded  ` +
      `brier ${stats.brier.toFixed(3)} (skill ${stats.brierSkill.toFixed(2)})`
    );
  }
  await mongoose.disconnect();
}

updateStats().catch(err => { console.error(err); process.exit(1); });
