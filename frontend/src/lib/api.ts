const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface MSME {
  id: number;
  name: string;
  segment: string;
  onboarded_at: string;
  health_score: number | null;
  pd_12m: number | null;
}

export interface Decomposition {
  date: string;
  revenue: number;
  revenue_trend: number;
  revenue_seasonal: number;
  revenue_residual: number;
  upi_in: number;
  upi_in_trend: number;
  upi_in_seasonal: number;
  upi_in_residual: number;
}

export interface Changepoint {
  date: string;
  confidence: number;
  description: string;
}

export interface StressScore {
  date: string;
  stress_value: number;
  is_stressed: boolean;
}

export interface Explanation {
  feature_name: string;
  shap_value: number;
}

export interface HealthScore {
  health_score: number;
  pd_12m: number;
  computed_at: string;
  explanations: Explanation[];
}

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 1) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === retries) throw err;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

export const msmeApi = {
  list: async (): Promise<MSME[]> => {
    return fetchWithRetry(`${API_BASE_URL}/msme/`, { cache: 'no-store' });
  },
  
  getDecomposition: async (id: number): Promise<Decomposition[]> => {
    return fetchWithRetry(`${API_BASE_URL}/msme/${id}/decomposition`, { cache: 'no-store' });
  },
  
  getChangepoints: async (id: number): Promise<Changepoint[]> => {
    return fetchWithRetry(`${API_BASE_URL}/msme/${id}/changepoints`, { cache: 'no-store' });
  },
  
  getStress: async (id: number): Promise<StressScore[]> => {
    return fetchWithRetry(`${API_BASE_URL}/msme/${id}/stress`, { cache: 'no-store' });
  },
  
  getScore: async (id: number): Promise<HealthScore> => {
    return fetchWithRetry(`${API_BASE_URL}/msme/${id}/score`, { cache: 'no-store' });
  },
  
  simulateGSTMissed: async (id: number) => {
    return fetchWithRetry(`${API_BASE_URL}/webhooks/gst-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ msme_id: id, status: 'delayed' })
    });
  },
  
  simulateAAShock: async (id: number) => {
    return fetchWithRetry(`${API_BASE_URL}/webhooks/aa-transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ msme_id: id, shock_type: 'revenue_drop' })
    });
  },

  generateBulkSynthetic: async (count: number = 200) => {
    return fetchWithRetry(`${API_BASE_URL}/msme/generate-bulk?count_per_segment=${count}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  },

  trainAndValidateML: async () => {
    return fetchWithRetry(`${API_BASE_URL}/ml/train-and-validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
