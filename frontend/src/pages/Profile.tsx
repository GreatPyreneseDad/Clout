import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { User, Pick } from '@clout/shared';
import { userService, pickService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

export function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    if (userId) {
      loadProfile();
      loadPicks();
    }
  }, [userId]);

  const loadProfile = async () => {
    try {
      const response = await userService.getProfile(userId!);
      if (response.data.success && response.data.data) {
        setProfile(response.data.data);
        // Check if current user follows this profile
        if (currentUser && (currentUser as any).following) {
          setIsFollowing((currentUser as any).following.includes(userId!));
        }
      }
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    }
  };

  const loadPicks = async () => {
    try {
      const response = await pickService.getCapperPicks(userId!);
      if (response.data.success && response.data.data) {
        setPicks(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load picks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      if (isFollowing) {
        await userService.unfollowUser(userId!);
        setIsFollowing(false);
        setProfile((prev: any) => prev ? {
          ...prev,
          followerCount: (prev.followerCount || 0) - 1
        } : null);
      } else {
        await userService.followUser(userId!);
        setIsFollowing(true);
        setProfile((prev: any) => prev ? {
          ...prev,
          followerCount: (prev.followerCount || 0) + 1
        } : null);
      }
    } catch (err) {
      console.error('Failed to follow/unfollow:', err);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading profile...</div>;
  }

  if (error || !profile) {
    return <div className="text-center py-8 text-red-500">{error || 'Profile not found'}</div>;
  }

  const stats = picks.reduce((acc, pick) => {
    if (pick.verifiedOutcome) {
      acc.total++;
      if (pick.verifiedOutcome.isCorrect) acc.wins++;
    }
    return acc;
  }, { total: 0, wins: 0 });

  const winRate = stats.total > 0 ? (stats.wins / stats.total) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="card">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{profile.username}</h1>
            <p className="text-gray-400 capitalize">{profile.role}</p>
          </div>
          {!isOwnProfile && (
            <button
              onClick={handleFollow}
              className={isFollowing ? 'btn-secondary' : 'btn-primary'}
            >
              {isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <p className="text-2xl font-bold">{profile.followerCount || 0}</p>
            <p className="text-sm text-gray-400">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{profile.followingCount || 0}</p>
            <p className="text-sm text-gray-400">Following</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-gray-400">Total Picks</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${
              winRate >= 60 ? 'text-green-500' :
              winRate >= 50 ? 'text-yellow-500' :
              'text-red-500'
            }`}>
              {winRate.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-400">Win Rate</p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-dark-300">
          <div className="flex items-center justify-between">
            <p className="text-gray-400">Clout Score</p>
            <p className="text-3xl font-bold text-primary-500">{profile.cloutScore.toFixed(1)}</p>
          </div>
        </div>
      </div>

      {/* Recent Picks */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Recent Picks</h2>
        {picks.length === 0 ? (
          <div className="text-center py-12 text-gray-400 card">
            {isOwnProfile 
              ? "You haven't made any picks yet. Start predicting fights to build your reputation!"
              : "This capper hasn't made any picks yet."}
          </div>
        ) : (
          <div className="space-y-4">
            {picks.map((pick) => (
              <ProfilePickCard key={pick.id} pick={pick} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfilePickCard({ pick }: { pick: Pick }) {
  const statusColor = pick.verifiedOutcome
    ? pick.verifiedOutcome.isCorrect
      ? 'text-green-500'
      : 'text-red-500'
    : pick.isPending
    ? 'text-yellow-500'
    : 'text-gray-400';

  return (
    <div className="card hover:border-dark-400 transition">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold">{pick.fightEvent.eventName}</h3>
          <p className="text-sm text-gray-400">
            {pick.fightEvent.organization} • {new Date(pick.fightEvent.date).toLocaleDateString()}
          </p>
        </div>
        <span className={`text-sm font-medium ${statusColor}`}>
          {pick.verifiedOutcome
            ? pick.verifiedOutcome.isCorrect
              ? '✓ Win'
              : '✗ Loss'
            : pick.isPending
            ? '⏳ Pending'
            : '🔮 Active'}
        </span>
      </div>
      
      <div className="mb-4">
        <p className="font-medium">
          {pick.prediction.winner} 
          {pick.prediction.method && ` by ${pick.prediction.method}`}
          {pick.prediction.round && ` in round ${pick.prediction.round}`}
        </p>
        <p className="text-sm text-gray-400">
          Confidence: {pick.prediction.confidence}%
          {pick.prediction.odds && ` • Odds: ${pick.prediction.odds > 0 ? '+' : ''}${pick.prediction.odds}`}
        </p>
      </div>
      
      {pick.analysis && (
        <p className="text-sm text-gray-300 mb-4">{pick.analysis}</p>
      )}
      
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>{formatDistanceToNow(new Date(pick.timestamp), { addSuffix: true })}</span>
        <span>👍 {pick.likeCount}</span>
      </div>
    </div>
  );
}