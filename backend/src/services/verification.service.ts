import Pick from '../models/Pick';
import Event from '../models/Event';
import User from '../models/User';
import { SportsDataService } from './sportsData.service';
import { addPick, CloutStats, EMPTY_STATS } from './scoring';

export class VerificationService {
  private sportsDataService: SportsDataService;

  constructor() {
    this.sportsDataService = new SportsDataService();
  }

  async verifyPicksForEvent(eventId: string): Promise<void> {
    try {
      // Get event with results
      const event = await Event.findById(eventId);
      if (!event || event.status !== 'completed') {
        return;
      }

      // Get all picks for this event
      const picks = await Pick.find({ 
        eventId,
        verifiedOutcome: { $exists: false }
      });

      for (const pick of picks) {
        // Get the specific fight from the event
        const fight = event.fights[pick.fightIndex];
        if (!fight || !fight.result) continue;

        // Verify the pick
        const isCorrect = this.checkPickCorrectness(pick, fight);
        
        pick.verifiedOutcome = {
          winner: fight.result.winner,
          method: fight.result.method,
          round: fight.result.round,
          verifiedAt: new Date(),
          isCorrect
        };

        await pick.save();

        // Update capper's stats
        await this.updateCapperStats(pick.capperId.toString(), pick, isCorrect);
      }
    } catch (error) {
      console.error('Error verifying picks:', error);
    }
  }

  private checkPickCorrectness(pick: any, fight: any): boolean {
    const result = fight.result;
    
    // Check winner
    if (pick.prediction.winner !== result.winner) {
      return false;
    }

    // If method was predicted, check it
    if (pick.prediction.method && pick.prediction.method !== result.method) {
      return false;
    }

    // If round was predicted, check it
    if (pick.prediction.round && pick.prediction.round !== result.round) {
      return false;
    }

    return true;
  }

  private async updateCapperStats(capperId: string, pick: any, isCorrect: boolean): Promise<void> {
    try {
      const capper = await User.findById(capperId);
      if (!capper || capper.role !== 'capper') return;

      const prev: CloutStats = { ...EMPTY_STATS, ...(capper.stats as any) };
      // Older documents carry correctPicks but not wins; reconcile once.
      if (!prev.wins && (capper.stats as any)?.correctPicks) prev.wins = (capper.stats as any).correctPicks;
      if (!prev.losses && prev.totalPicks) prev.losses = prev.totalPicks - prev.wins;

      const next = addPick(prev, {
        odds: pick.prediction?.odds,
        confidence: pick.prediction?.confidence ?? 5,
        isCorrect,
      });

      capper.stats = { ...next, correctPicks: next.wins };
      // Clout is net units. Followers are not part of it.
      capper.cloutScore = next.cloutScore;
      await capper.save();
    } catch (error) {
      console.error('Error updating capper stats:', error);
    }
  }

  async verifyAllPendingPicks(): Promise<void> {
    try {
      // Find all completed events
      const completedEvents = await Event.find({ 
        status: 'completed',
        'fights.result': { $exists: true }
      });

      for (const event of completedEvents) {
        await this.verifyPicksForEvent((event._id as any).toString());
      }
    } catch (error) {
      console.error('Error verifying all pending picks:', error);
    }
  }
}