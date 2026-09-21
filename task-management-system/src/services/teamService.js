import api from './api';

export const teamService = {
  // 1. Get all teams
  getAllTeams: async () => {
    return await api.get('/teams');
  },

  // 2. Get team by ID
  getTeamById: async (id) => {
    return await api.get(`/teams/${id}`);
  },

  // 3. Create a team
  createTeam: async ({ name, description, status = 0 }) => {
    return await api.post('/teams', {
      name,
      description: description || null,
      status: Number(status),
    });
  },

  // 4. Update team details
  updateTeam: async (id, { name, description, status = 0 }) => {
    return await api.put(`/teams/${id}`, {
      name,
      description: description || null,
      status: Number(status),
    });
  },

  // 5. Delete team (soft delete)
  deleteTeam: async (id) => {
    return await api.delete(`/teams/${id}`);
  },

  // 6. Add member to team
  addMemberToTeam: async (teamId, memberId) => {
    return await api.post(`/teams/${teamId}/members`, {
      memberId: Number(memberId),
    });
  },

  // 7. Remove member from team
  removeMemberFromTeam: async (teamId, memberId) => {
    return await api.delete(`/teams/${teamId}/members/${memberId}`);
  },

  // 8. Designate team leader
  setTeamLeader: async (teamId, leaderId) => {
    return await api.post(`/teams/${teamId}/leader`, {
      leaderId: Number(leaderId),
    });
  },
};

export default teamService;
