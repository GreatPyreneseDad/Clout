import { create } from 'zustand';
import type { User, Pick } from '@clout/shared';
import { userService, pickService } from '../services/api';

export interface CapperData {
  capper: User;
  followers: User[];
  picks: Pick[];
}

interface CapperStoreState {
  cappers: Map<string, CapperData>;
  loadCapperData: (capperId: string) => Promise<void>;
}

export const useCapperStore = create<CapperStoreState>((set) => ({
  cappers: new Map(),
  async loadCapperData(capperId: string) {
    const [capperRes, followersRes, picksRes] = await Promise.all([
      userService.getProfile(capperId),
      userService.getFollowers(capperId),
      pickService.getCapperPicks(capperId)
    ]);

    const data: CapperData = {
      capper: capperRes.data.data!,
      followers: followersRes.data.data || [],
      picks: picksRes.data.data || []
    };

    set(state => {
      const map = new Map(state.cappers);
      map.set(capperId, data);
      return { cappers: map };
    });
  }
}));
