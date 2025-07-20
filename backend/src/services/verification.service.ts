import Pick from '../models/Pick';
import Event from '../models/Event';
import User from '../models/User';
import { SportsDataService } from './sportsData.service';

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
        await this.updateCapperStats(pick.capperId.toString(), isCorrect);
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

  private async updateCapperStats(capperId: string, isCorrect: boolean): Promise<void> {
    try {
      const capper = await User.findById(capperId);
      if (!capper || capper.role !== 'capper') return;

      // Update win/loss record
      if (!capper.stats) {
        capper.stats = { totalPicks: 0, correctPicks: 0, winRate: 0 };
      }

      capper.stats.totalPicks += 1;
      if (isCorrect) {
        capper.stats.correctPicks += 1;
      }
      capper.stats.winRate = capper.stats.correctPicks / capper.stats.totalPicks;

      // Update clout score
      await this.updateCloutScore(capper);
      
      await capper.save();
    } catch (error) {
      console.error('Error updating capper stats:', error);
    }
  }

  private async updateCloutScore(capper: any): Promise<void> {
    // Clout formula: 70% accuracy + 30% social
    const accuracy = capper.stats.winRate * 100;
    const social = Math.min(capper.followers.length / 10, 30); // Cap social at 30 points
    
    capper.cloutScore = (accuracy * 0.7) + social;
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