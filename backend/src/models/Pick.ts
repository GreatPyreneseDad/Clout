import mongoose, { Document, Schema } from 'mongoose';

export interface IFightEvent {
  eventName: string;
  date: Date;
  fighters: string[];
  organization: string; // UFC, Bellator, Boxing, etc.
}

export interface IPrediction {
  winner: string;
  method?: 'KO/TKO' | 'Submission' | 'Decision' | 'Draw' | 'No Contest';
  round?: number;
  odds?: number;
  confidence: number; // 1-10 scale
}

export interface IVerifiedOutcome {
  winner: string;
  method: string;
  round?: number;
  verifiedAt: Date;
  isCorrect: boolean;
}

export interface IPick extends Document {
  capperId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  fightIndex: number; // Index of the fight in the event's fights array
  fightEvent: IFightEvent; // Keep for backward compatibility
  prediction: IPrediction;
  analysis?: string;
  timestamp: Date;
  verifiedOutcome?: IVerifiedOutcome;
  likes: mongoose.Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const pickSchema = new Schema<IPick>(
  {
    capperId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      index: true
    },
    fightIndex: {
      type: Number,
      min: 0
    },
    fightEvent: {
      eventName: {
        type: String,
        required: [true, 'Event name is required']
      },
      date: {
        type: Date,
        required: [true, 'Event date is required']
      },
      fighters: [{
        type: String,
        required: true
      }],
      organization: {
        type: String,
        required: true,
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
        ]
      }
    },
    prediction: {
      winner: {
        type: String,
        required: [true, 'Winner prediction is required']
      },
      method: {
        type: String,
        enum: ['KO/TKO', 'Submission', 'Decision', 'Draw', 'No Contest']
      },
      round: {
        type: Number,
        min: 1,
        max: 12
      },
      odds: {
        type: Number
      },
      confidence: {
        type: Number,
        required: true,
        min: 1,
        max: 10
      }
    },
    analysis: {
      type: String,
      maxlength: [2000, 'Analysis cannot exceed 2000 characters']
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    verifiedOutcome: {
      winner: String,
      method: String,
      round: Number,
      verifiedAt: Date,
      isCorrect: Boolean
    },
    likes: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for common queries
pickSchema.index({ 'fightEvent.date': -1 });
pickSchema.index({ capperId: 1, timestamp: -1 });
pickSchema.index({ 'verifiedOutcome.isCorrect': 1 });

// Virtual for like count
pickSchema.virtual('likeCount').get(function() {
  return this.likes?.length || 0;
});

// Virtual to check if pick is pending (fight hasn't happened yet)
pickSchema.virtual('isPending').get(function() {
  return !this.verifiedOutcome && this.fightEvent.date > new Date();
});

// Ensure virtuals are included in JSON
pickSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc: any, ret: any) {
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model<IPick>('Pick', pickSchema);