import mongoose, { Document, Schema } from 'mongoose';

export interface IEvent extends Document {
  externalId: string; // TheSportsDB event ID
  eventName: string;
  organization:
    | 'UFC'
    | 'Bellator'
    | 'ONE'
    | 'PFL'
    | 'Boxing'
    | 'NFL'
    | 'NBA'
    | 'MLB'
    | 'Soccer'
    | 'Other';
  eventDate: Date;
  venue: string;
  location: string;
  fights: IFight[];
  status: 'upcoming' | 'live' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface IFight {
  fighter1: {
    name: string;
    record?: string;
    odds?: number;
  };
  fighter2: {
    name: string;
    record?: string;
    odds?: number;
  };
  weightClass?: string;
  scheduledRounds?: number;
  result?: {
    winner: string;
    method: 'KO/TKO' | 'Submission' | 'Decision' | 'Draw' | 'No Contest';
    round?: number;
    time?: string;
    verifiedAt: Date;
  };
}

const fightSchema = new Schema<IFight>({
  fighter1: {
    name: { type: String, required: true },
    record: String,
    odds: Number
  },
  fighter2: {
    name: { type: String, required: true },
    record: String,
    odds: Number
  },
  weightClass: String,
  scheduledRounds: { type: Number, default: 3 },
  result: {
    winner: String,
    method: {
      type: String,
      enum: ['KO/TKO', 'Submission', 'Decision', 'Draw', 'No Contest']
    },
    round: Number,
    time: String,
    verifiedAt: Date
  }
});

const eventSchema = new Schema<IEvent>({
  externalId: {
    type: String,
    required: true,
    unique: true
  },
  eventName: {
    type: String,
    required: true
  },
  organization: {
    type: String,
    enum: [
      'UFC',
      'Bellator',
      'ONE',
      'PFL',
      'Boxing',
      'NFL',
      'NBA',
      'MLB',
      'Soccer',
      'Other'
    ],
    required: true
  },
  eventDate: {
    type: Date,
    required: true
  },
  venue: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  fights: [fightSchema],
  status: {
    type: String,
    enum: ['upcoming', 'live', 'completed'],
    default: 'upcoming'
  }
}, {
  timestamps: true
});

// Update status based on event date
eventSchema.pre('save', function(next) {
  const now = new Date();
  if (this.eventDate < now) {
    this.status = 'completed';
  }
  next();
});

export default mongoose.model<IEvent>('Event', eventSchema);