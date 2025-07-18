import cron from 'node-cron';
import { VerificationService } from '../services/verification.service';
import { SportsDataService } from '../services/sportsData.service';

const verificationService = new VerificationService();
const sportsDataService = new SportsDataService();

// Run every hour to check for completed events and verify picks
export const startVerificationJob = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Running verification job...');
    
    try {
      // Update event results
      await sportsDataService.updateEventResults();
      
      // Verify all pending picks
      await verificationService.verifyAllPendingPicks();
      
      console.log('✅ Verification job completed');
    } catch (error) {
      console.error('❌ Verification job failed:', error);
    }
  });
  
  console.log('🔄 Verification job scheduled to run every hour');
};

// Run every 6 hours to fetch new events
export const startEventFetchJob = () => {
  cron.schedule('0 */6 * * *', async () => {
    console.log('⏰ Fetching new events...');
    
    try {
      await sportsDataService.fetchUpcomingEvents();
      console.log('✅ Event fetch completed');
    } catch (error) {
      console.error('❌ Event fetch failed:', error);
    }
  });
  
  console.log('🔄 Event fetch job scheduled to run every 6 hours');
};