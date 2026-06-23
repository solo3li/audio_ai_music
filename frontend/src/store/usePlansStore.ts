import { create } from 'zustand';
import axios from 'axios';

export interface Plan {
  id: number;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  priceUsd: number;
  priceEgp: number;
  durationDays: number;
  monthlyCredits: number;
  ttsEnabled: boolean;
  ttsMaxCharsPerRequest: number;
  ttsCostPerChar: number;
  sttEnabled: boolean;
  sttMaxFileSizeMb: number;
  sttCostPerMinute: number;
  isFreeTrial: boolean;
}

interface PlansState {
  plans: Plan[];
  isLoading: boolean;
  error: string | null;
  fetchPlans: () => Promise<void>;
}

export const usePlansStore = create<PlansState>((set) => ({
  plans: [],
  isLoading: false,
  error: null,
  fetchPlans: async () => {
    set({ isLoading: true, error: null });
    try {
      // Assuming Next.js proxies or backend is at API_URL
      // The backend is typically exposed on port 8080 locally or via proxy
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await axios.get(`${apiUrl}/api/plans`);
      set({ plans: response.data, isLoading: false });
    } catch (error: any) {
      console.error('Error fetching plans:', error);
      set({ 
        error: error.response?.data?.message || error.message || 'Failed to fetch plans', 
        isLoading: false 
      });
    }
  },
}));
