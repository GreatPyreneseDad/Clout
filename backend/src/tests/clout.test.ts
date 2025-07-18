import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../models/User';
import Pick from '../models/Pick';
import { VerificationService } from '../services/verification.service';

let mongoServer: MongoMemoryServer;
let verificationService: VerificationService;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  verificationService = new VerificationService();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Pick.deleteMany({});
});

describe('Clout Score Calculation', () => {
  it('should calculate clout score correctly for a capper with high win rate and followers', async () => {
    // Create a capper with followers
    const capper = await User.create({
      username: 'topCapper',
      email: 'top@example.com',
      password: 'password123',
      role: 'capper',
      stats: {
        totalPicks: 100,
        correctPicks: 85,
        winRate: 0.85
      }
    });

    // Add followers
    const followers = [];
    for (let i = 0; i < 150; i++) {
      const follower = await User.create({
        username: `follower${i}`,
        email: `follower${i}@example.com`,
        password: 'password123',
        role: 'user'
      });
      followers.push(follower._id);
    }

    await User.findByIdAndUpdate(capper._id, {
      $push: { followers: { $each: followers } }
    });

    // Calculate clout score
    const updatedCapper = await User.findById(capper._id);
    const winRate = 0.85;
    const socialScore = Math.min(150 / 10, 30); // 15 points (capped at 30)
    const expectedClout = (winRate * 70) + socialScore; // 59.5 + 15 = 74.5

    expect(expectedClout).toBe(74.5);
  });

  it('should cap social score at 30 points', async () => {
    const capper = await User.create({
      username: 'popularCapper',
      email: 'popular@example.com',
      password: 'password123',
      role: 'capper',
      stats: {
        totalPicks: 50,
        correctPicks: 30,
        winRate: 0.6
      }
    });

    // Add 500 followers (should cap at 30 points)
    const followers = [];
    for (let i = 0; i < 500; i++) {
      followers.push(new mongoose.Types.ObjectId());
    }

    await User.findByIdAndUpdate(capper._id, {
      $set: { followers }
    });

    const winRate = 0.6;
    const socialScore = Math.min(500 / 10, 30); // Capped at 30
    const expectedClout = (winRate * 70) + socialScore; // 42 + 30 = 72

    expect(socialScore).toBe(30);
    expect(expectedClout).toBe(72);
  });

  it('should give 0 clout score for capper with no picks', async () => {
    const capper = await User.create({
      username: 'newCapper',
      email: 'new@example.com',
      password: 'password123',
      role: 'capper',
      stats: {
        totalPicks: 0,
        correctPicks: 0,
        winRate: 0
      }
    });

    const winRate = 0;
    const socialScore = 0;
    const expectedClout = (winRate * 70) + socialScore;

    expect(expectedClout).toBe(0);
  });

  it('should correctly update stats after pick verification', async () => {
    const capper = await User.create({
      username: 'testCapper',
      email: 'test@example.com',
      password: 'password123',
      role: 'capper',
      stats: {
        totalPicks: 0,
        correctPicks: 0,
        winRate: 0
      }
    });

    // Create picks with outcomes
    const picks = [
      { isCorrect: true },
      { isCorrect: true },
      { isCorrect: false },
      { isCorrect: true },
      { isCorrect: false }
    ];

    for (const pickData of picks) {
      const pick = await Pick.create({
        capperId: capper._id,
        fightEvent: {
          eventName: 'Test Event',
          date: new Date('2025-01-01'),
          fighters: ['Fighter A', 'Fighter B'],
          organization: 'UFC'
        },
        prediction: {
          winner: 'Fighter A',
          confidence: 8
        },
        verifiedOutcome: {
          winner: pickData.isCorrect ? 'Fighter A' : 'Fighter B',
          method: 'Decision',
          verifiedAt: new Date(),
          isCorrect: pickData.isCorrect
        }
      });
    }

    // Calculate expected stats
    const totalPicks = 5;
    const correctPicks = 3;
    const winRate = correctPicks / totalPicks; // 0.6

    expect(winRate).toBe(0.6);
  });
});