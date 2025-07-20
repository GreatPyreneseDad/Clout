import axios from 'axios';
import Event, { IEvent, IFight } from '../models/Event';

interface OddsAPIEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: Array<{
    key: string;
    title: string;
    markets: Array<{
      key: string;
      outcomes: Array<{
        name: string;
        price: number;
      }>;
    }>;
  }>;
}

export class SportsDataService {
  private oddsApiKey: string;
  private oddsApiBaseUrl: string;

  constructor() {
    this.oddsApiKey = process.env.ODDS_API_KEY || '';
    this.oddsApiBaseUrl = process.env.ODDS_API_BASE_URL || 'https://api.the-odds-api.com/v4';
  }

  async fetchUpcomingEvents(): Promise<IEvent[]> {
    try {
      // Fetch MMA/UFC events from The Odds API
      const response = await axios.get(`${this.oddsApiBaseUrl}/sports/mma_mixed_martial_arts/events`, {
        params: {
          apiKey: this.oddsApiKey,
          regions: 'us,uk',
          markets: 'h2h',
          oddsFormat: 'american',
          dateFormat: 'iso'
        }
      });

      const oddsEvents: OddsAPIEvent[] = response.data;
      const events: IEvent[] = [];

      for (const oddsEvent of oddsEvents) {
        // Parse fighter names from the event
        const fighters = [oddsEvent.home_team, oddsEvent.away_team];
        
        // Fetch odds for this specific event
        const oddsResponse = await axios.get(
          `${this.oddsApiBaseUrl}/sports/mma_mixed_martial_arts/events/${oddsEvent.id}/odds`,
          {
            params: {
              apiKey: this.oddsApiKey,
              regions: 'us',
              markets: 'h2h',
              oddsFormat: 'american'
            }
          }
        );

        const eventWithOdds = oddsResponse.data;
        
        // Extract odds from the first bookmaker (usually most reliable)
        let fighter1Odds = -150; // default
        let fighter2Odds = +130; // default
        
        if (eventWithOdds.bookmakers && eventWithOdds.bookmakers.length > 0) {
          const bookmaker = eventWithOdds.bookmakers[0];
          const h2hMarket = bookmaker.markets.find((m: any) => m.key === 'h2h');
          
          if (h2hMarket && h2hMarket.outcomes.length >= 2) {
            const outcome1 = h2hMarket.outcomes.find((o: any) => o.name === fighters[0]);
            const outcome2 = h2hMarket.outcomes.find((o: any) => o.name === fighters[1]);
            
            if (outcome1) fighter1Odds = outcome1.price;
            if (outcome2) fighter2Odds = outcome2.price;
          }
        }

        // Determine organization from sport title
        const organization = oddsEvent.sport_title.includes('UFC') ? 'UFC' : 
                           oddsEvent.sport_title.includes('Bellator') ? 'Bellator' : 
                           'PFL';

        // Create or update event in database
        let event = await Event.findOne({ externalId: oddsEvent.id });
        
        const eventData = {
          externalId: oddsEvent.id,
          eventName: `${fighters[0]} vs ${fighters[1]}`,
          organization: organization as 'UFC' | 'Bellator' | 'ONE Championship' | 'PFL',
          eventDate: new Date(oddsEvent.commence_time),
          venue: 'TBA', // The Odds API doesn't provide venue info
          location: 'TBA',
          fights: [{
            fighter1: { 
              name: fighters[0], 
              record: 'TBA', // Would need another API for records
              odds: fighter1Odds 
            },
            fighter2: { 
              name: fighters[1], 
              record: 'TBA',
              odds: fighter2Odds 
            },
            weightClass: 'TBA',
            scheduledRounds: 3 // Default, would need event details
          }],
          status: new Date(oddsEvent.commence_time) > new Date() ? 'upcoming' : 'completed'
        };

        if (!event) {
          event = await Event.create(eventData);
        } else {
          // Update odds if event exists
          event.fights[0].fighter1.odds = fighter1Odds;
          event.fights[0].fighter2.odds = fighter2Odds;
          await event.save();
        }
        
        events.push(event);
      }

      console.log(`Fetched ${events.length} MMA events from The Odds API`);
      
      // Log remaining API quota
      const remainingRequests = response.headers['x-requests-remaining'];
      const usedRequests = response.headers['x-requests-used'];
      console.log(`Odds API Quota: ${usedRequests} used, ${remainingRequests} remaining`);

      return events;
    } catch (error) {
      console.error('Error fetching from The Odds API:', error);
      
      // Fallback to mock data if API fails
      return this.getMockEvents();
    }
  }

  async fetchEventResults(eventId: string): Promise<IEvent | null> {
    try {
      const event = await Event.findOne({ externalId: eventId });
      if (!event) return null;

      // The Odds API doesn't provide fight results
      // You would need to integrate another API for results
      // For now, we'll keep the mock result generation
      
      if (event.status === 'completed' && event.fights.some(f => !f.result)) {
        // In production, you'd fetch real results from a different API
        console.log('Note: The Odds API does not provide fight results. Consider integrating a results API.');
      }

      return event;
    } catch (error) {
      console.error('Error fetching event results:', error);
      return null;
    }
  }

  async updateEventResults(): Promise<void> {
    try {
      const completedEvents = await Event.find({
        status: 'completed',
        'fights.result': { $exists: false }
      });

      for (const event of completedEvents) {
        await this.fetchEventResults(event.externalId);
      }
    } catch (error) {
      console.error('Error updating event results:', error);
    }
  }

  // Fallback mock data
  private async getMockEvents(): Promise<IEvent[]> {
    const mockEvents = [
      {
        externalId: 'mock-ufc-300',
        eventName: 'UFC 300: Pereira vs Hill',
        organization: 'UFC' as const,
        eventDate: new Date('2025-01-25'),
        venue: 'T-Mobile Arena',
        location: 'Las Vegas, Nevada',
        fights: [
          {
            fighter1: { name: 'Alex Pereira', record: '9-2-0', odds: -150 },
            fighter2: { name: 'Jamahal Hill', record: '12-2-0', odds: +130 },
            weightClass: 'Light Heavyweight',
            scheduledRounds: 5
          }
        ]
      }
    ];

    const events: IEvent[] = [];
    for (const mockEvent of mockEvents) {
      let event = await Event.findOne({ externalId: mockEvent.externalId });
      if (!event) {
        event = await Event.create(mockEvent);
      }
      events.push(event);
    }
    
    return events;
  }
}