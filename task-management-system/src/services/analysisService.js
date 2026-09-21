import api from './api';

export const analysisService = {
  // 1. Get dashboard analytics (KPI stats, team completion summaries, and
  //    leaderboards/performance rankings), optionally scoped by team and/or manager.
  //    Powers Dashboard.jsx's scopedStats / Team Performance / Leaderboard sections.
  getAnalysis: async ({ teamId, managerId } = {}) => {
    const params = new URLSearchParams();
    if (teamId && teamId !== 'all') params.append('teamId', teamId);
    if (managerId && managerId !== 'all') params.append('managerId', managerId);

    const query = params.toString();
    return await api.get(`/analysis${query ? `?${query}` : ''}`);
  },
};

export default analysisService;
