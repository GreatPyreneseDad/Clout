import { useState, useEffect } from 'react';
import type { Pick, User } from '@clout/shared';
import { pickService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

export function Home() {
  const [picks, setPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    loadPicks();
  }, [page]);

  const loadPicks = async () => {
    try {
      setLoading(true);
      const response = await pickService.getFeed(page);
      if (response.data.success && response.data.data) {
        setPicks(response.data.data);
      }
    } catch (err) {
      setError('Failed to load picks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (pickId: string) => {
    if (!isAuthenticated) {
      alert('Please login to like picks');
      return;
    }
    
    try {
      await pickService.likePick(pickId);
      // Update local state
      setPicks(picks.map(pick => 
        pick.id === pickId 
          ? { ...pick, likeCount: pick.likeCount + 1 }
          : pick
      ));
    } catch (err) {
      console.error('Failed to like pick:', err);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading picks...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Latest Picks</h1>
      
      {picks.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No picks available yet. Follow some cappers to see their predictions!
        </div>
      ) : (
        <div className="space-y-4">
          {picks.map((pick) => (
            <PickCard key={pick.id} pick={pick} onLike={handleLike} />
          ))}
        </div>
      )}
      
      <div className="flex justify-center space-x-4 pt-6">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="btn-secondary disabled:opacity-50"
        >
          Previous
        </button>
        <span className="flex items-center px-4">Page {page}</span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={picks.length < 20}
          className="btn-secondary disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function PickCard({ pick, onLike }: { pick: Pick; onLike: (id: string) => void }) {
  const capper = pick.capperId as User;
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
          <h3 className="font-semibold text-lg">{pick.fightEvent.eventName}</h3>
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
          Prediction: {pick.prediction.winner} 
          {pick.prediction.method && ` by ${pick.prediction.method}`}
          {pick.prediction.round && ` in round ${pick.prediction.round}`}
        </p>
        <p className="text-sm text-gray-400 mt-1">
          Confidence: {pick.prediction.confidence}%
          {pick.prediction.odds && ` • Odds: ${pick.prediction.odds > 0 ? '+' : ''}${pick.prediction.odds}`}
        </p>
      </div>
      
      {pick.analysis && (
        <p className="text-sm text-gray-300 mb-4">{pick.analysis}</p>
      )}
      
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          <span className="text-gray-400">
            by <span className="text-primary-500 font-medium">{capper.username}</span>
          </span>
          <span className="text-gray-500">
            {formatDistanceToNow(new Date(pick.timestamp), { addSuffix: true })}
          </span>
        </div>
        <button
          onClick={() => onLike(pick.id)}
          className="flex items-center space-x-1 hover:text-primary-500 transition"
        >
          <span>👍</span>
          <span>{pick.likeCount}</span>
        </button>
      </div>
    </div>
  );
}