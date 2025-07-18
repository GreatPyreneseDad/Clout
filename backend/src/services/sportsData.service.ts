import axios from 'axios';
import Event, { IEvent, IFight } from '../models/Event';

// Mock data as fallback
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
      },
      {
        fighter1: { name: 'Zhang Weili', record: '24-3-0', odds: -200 },
        fighter2: { name: 'Yan Xiaonan', record: '17-3-0', odds: +170 },
        weightClass: "Women's Strawweight",
        scheduledRounds: 3
      }
    ]
  },
  {
    externalId: 'mock-bellator-301',
    eventName: 'Bellator 301: Amosov vs Jackson',
    organization: 'Bellator' as const,
    eventDate: new Date('2025-01-28'),
    venue: 'Wintrust Arena',
    location: 'Chicago, Illinois',
    fights: [
      {
        fighter1: { name: 'Yaroslav Amosov', record: '27-0-0', odds: -300 },
        fighter2: { name: 'Jason Jackson', record: '17-4-0', odds: +250 },
        weightClass: 'Welterweight',
        scheduledRounds: 5
      }
    ]
  }
];

export class SportsDataService {
  private apiKey: string;
  private baseUrl: string = 'https://www.thesportsdb.com/api/v1/json';

  constructor() {
    this.apiKey = process.env.SPORTS_DB_API_KEY || '3';
  }

  async fetchUpcomingEvents(): Promise<IEvent[]> {
    try {
      // TheSportsDB doesn't have great MMA support, so we'll use mock data
      // In production, you'd integrate with a proper MMA API like UFC's official API
      console.log('Using mock event data...');
      return this.saveMockEvents();
    } catch (error) {
      console.error('Error fetching sports data:', error);
      return this.saveMockEvents();
    }
  }

  async fetchEventResults(eventId: string): Promise<IEvent | null> {
    try {
      const event = await Event.findOne({ externalId: eventId });
      if (!event) return null;

      // In production, fetch real results from API
      // For now, simulate some results for completed events
      if (event.status === 'completed' && event.fights.some(f => !f.result)) {
        event.fights = event.fights.map(fight => {
          if (!fight.result) {
            // Simulate random results
            const methods = ['KO/TKO', 'Submission', 'Decision'] as const;
            const winner = Math.random() > 0.5 ? fight.fighter1.name : fight.fighter2.name;
            
            fight.result = {
              winner,
              method: methods[Math.floor(Math.random() * methods.length)],
              round: Math.floor(Math.random() * (fight.scheduledRounds || 3)) + 1,
              time: `${Math.floor(Math.random() * 5)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
              verifiedAt: new Date()
            };
          }
          return fight;
        });
        
        await event.save();
      }

      return event;
    } catch (error) {
      console.error('Error fetching event results:', error);
      return null;
    }
  }

  private async saveMockEvents(): Promise<IEvent[]> {
    const events: IEvent[] = [];
    
    for (const mockEvent of mockEvents) {
      try {
        let event = await Event.findOne({ externalId: mockEvent.externalId });
        
        if (!event) {
          event = await Event.create(mockEvent);
        }
        
        events.push(event);
      } catch (error) {
        console.error('Error saving mock event:', error);
      }
    }
    
    return events;
  }

  async updateEventResults(): Promise<void> {
    try {
      // Find all completed events without results
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
}