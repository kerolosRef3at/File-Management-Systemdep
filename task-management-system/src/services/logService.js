import api from './api';

export const logService = {
  // 1. Get paginated + filtered audit logs (Admin only on the backend).
  //    Returns { totalCount, logs: [...] }
  getLogs: async ({
    userId,
    action,
    entityName,
    entityId,
    startDate,
    endDate,
    skip = 0,
    limit = 50,
  } = {}) => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (action) params.append('action', action);
    if (entityName) params.append('entityName', entityName);
    if (entityId) params.append('entityId', entityId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('skip', skip);
    params.append('limit', limit);

    return await api.get(`/logs?${params.toString()}`);
  },

  // 2. Get full details for a single log entry (includes the raw Details text).
  getLogById: async (id) => {
    return await api.get(`/logs/${id}`);
  },
};

export default logService;
