import api from './api';

export const rateService = {
  // 1. Get all ratings visible to the current user (Admin: all, Manager: managed
  //    teams + own, Member/Leader: own + led-team ratings) — per backend scoping.
  getAllRates: async () => {
    return await api.get('/userrates');
  },

  // 2. Get ratings pending approval and visible to the current user
  //    (Admin: all pending, Manager: managed teams, Team Leader: their team).
  getPendingRates: async () => {
    return await api.get('/userrates/pending');
  },

  // 3. Get a single rating by ID (includes rate items + average score)
  getRateById: async (id) => {
    return await api.get(`/userrates/${id}`);
  },

  // 4. Submit a new rating for another user.
  //    rateItems: [{ title, value, maxValue }]
  //    file: optional File object — supporting evidence for a "Report"
  //    Backend determines Type (Standard/Report) and auto-approval based on
  //    the submitter's role/relationship to the target user.
  createRate: async ({ toUserId, comment, rateItems, file }) => {
    const formData = new FormData();
    formData.append('ToUserId', String(Number(toUserId)));
    if (comment) formData.append('Comment', comment);
    formData.append(
      'RateItemsJson',
      JSON.stringify(
        (rateItems || []).map((ri) => ({
          title: ri.title,
          value: Number(ri.value),
          maxValue: Number(ri.maxValue),
        }))
      )
    );
    if (file instanceof File) {
      formData.append('File', file);
    }

    return await api.post('/userrates', formData);
  },

  // 5. Approve or reject (delete) a pending rating.
  approveRate: async (id, { approve, approvalComment } = {}) => {
    return await api.put(`/userrates/${id}/approve`, {
      approve: !!approve,
      approvalComment: approvalComment || null,
    });
  },

  // 6. Edit a rating you submitted (only while still pending approval).
  updateRate: async (id, { comment, rateItems }) => {
    return await api.put(`/userrates/${id}`, {
      comment: comment || null,
      rateItems: (rateItems || []).map((ri) => ({
        title: ri.title,
        value: Number(ri.value),
        maxValue: Number(ri.maxValue),
      })),
    });
  },

  // 7. Delete a rating you submitted (only while still pending), or any
  //    rating at all if you're an Admin.
  deleteRate: async (id) => {
    return await api.delete(`/userrates/${id}`);
  },
};

export default rateService;
