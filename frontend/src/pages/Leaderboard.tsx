import { useState, useEffect } from 'react';
import type { LeaderboardEntry } from '@clout/shared';
import { leaderboardService } from '../services/api';
import { Link } from 'react-router-dom';

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'all' | 'month' | 'week'>('all');

  useEffect(() => {
    loadLeaderboard();
  }, [period]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await leaderboardService.getLeaderboard(period);
      if (response.data.success && response.data.data) {
        setEntries(response.data.data);
      }
    } catch (err) {
      setError('Failed to load leaderboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading leaderboard...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <div className="flex space-x-2">
          {(['all', 'month', 'week'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                period === p
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-300 hover:bg-dark-400'
              }`}
            >
              {p === 'all' ? 'All Time' : p === 'month' ? 'This Month' : 'This Week'}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-dark-300">
        <table className="w-full">
          <thead className="bg-dark-300">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Capper
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                Win Rate
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                Record
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider" title="Mean Brier score on stated confidence. Lower is better; 0.25 is a coin flip.">
                Calibration
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider" title="Net units from a flat 1-unit bet at the odds quoted on each pick.">
                Units
              </th>
            </tr>
          </thead>
          <tbody className="bg-dark-200 divide-y divide-dark-300">
            {entries.map((entry) => (
              <tr key={entry.capperId} className="hover:bg-dark-300 transition">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className={`text-2xl font-bold ${
                      entry.rank === 1 ? 'text-yellow-500' :
                      entry.rank === 2 ? 'text-gray-400' :
                      entry.rank === 3 ? 'text-orange-600' :
                      'text-gray-500'
                    }`}>
                      {entry.rank === 1 ? '🥇' :
                       entry.rank === 2 ? '🥈' :
                       entry.rank === 3 ? '🥉' :
                       `#${entry.rank}`}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    to={`/profile/${entry.capperId}`}
                    className="text-primary-500 hover:text-primary-400 font-medium"
                  >
                    {entry.username}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`font-semibold ${
                    entry.winRate >= 0.6 ? 'text-green-500' :
                    entry.winRate >= 0.5 ? 'text-yellow-500' :
                    'text-red-500'
                  }`}>
                    {(entry.winRate * 100).toFixed(1)}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-gray-300">
                  {entry.correctPicks}-{entry.totalPicks - entry.correctPicks}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {entry.brier === null || entry.brier === undefined ? (
                    <span className="text-gray-500">—</span>
                  ) : (
                    <span className={`font-semibold ${
                      entry.brier < 0.20 ? 'text-green-500' :
                      entry.brier < 0.25 ? 'text-yellow-500' :
                      'text-red-500'
                    }`} title={`skill ${entry.brierSkill?.toFixed(2)} vs coin flip`}>
                      {entry.brier.toFixed(3)}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`text-lg font-bold ${entry.unitsWon >= 0 ? 'text-green-500' : 'text-red-500'}`}
                        title={`${entry.unitsGraded} picks with odds · ROI ${(entry.roi * 100).toFixed(1)}%`}>
                    {entry.unitsWon >= 0 ? '+' : ''}{entry.unitsWon.toFixed(2)}u
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {entries.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No cappers in the leaderboard yet. Start making picks to climb the ranks!
        </div>
      )}
    </div>
  );
}