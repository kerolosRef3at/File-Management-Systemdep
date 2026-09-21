import api from './api';

export const ticketService = {
  // 1. Get all tickets
  getAllTickets: async () => {
    return await api.get('/tickets');
  },

  // 2. Get ticket by ID (includes subtasks and status histories)
  getTicketById: async (id) => {
    return await api.get(`/tickets/${id}`);
  },

  // 3. Create ticket
  createTicket: async ({ teamId, memberId, title, description, deadline, priority }) => {
    return await api.post('/tickets', {
      teamId: Number(teamId),
      memberId: memberId ? Number(memberId) : null,
      title,
      description: description || null,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      priority: Number(priority),
    });
  },

  // 4. Update ticket details
  updateTicket: async (id, { memberId, title, description, deadline, status, priority }) => {
    return await api.put(`/tickets/${id}`, {
      memberId: memberId ? Number(memberId) : null,
      title,
      description: description || null,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      status: Number(status),
      priority: Number(priority),
    });
  },

  // 5. Delete ticket (soft delete)
  deleteTicket: async (id) => {
    return await api.delete(`/tickets/${id}`);
  },

  // 6. Change ticket status with optional file attachment & follow-up task
  changeTicketStatus: async (id, {
    status,
    comment,
    linkUrl,
    file,
    addAnotherTask,
    newTaskTitle,
    newTaskDescription,
    newTaskDeadline,
    newTaskMemberId,
    newTaskPriority,
  }) => {
    const formData = new FormData();
    formData.append('Status', status);

    if (comment) formData.append('Comment', comment);
    if (linkUrl) formData.append('LinkUrl', linkUrl);
    if (file) formData.append('File', file);

    if (addAnotherTask) {
      formData.append('AddAnotherTask', 'true');
      if (newTaskTitle) formData.append('NewTaskTitle', newTaskTitle);
      if (newTaskDescription) formData.append('NewTaskDescription', newTaskDescription);
      if (newTaskDeadline) formData.append('NewTaskDeadline', new Date(newTaskDeadline).toISOString());
      if (newTaskMemberId) formData.append('NewTaskMemberId', newTaskMemberId);
      if (newTaskPriority !== undefined) formData.append('NewTaskPriority', newTaskPriority);
    }

    return await api.put(`/tickets/${id}/status`, formData);
  },

  // 7. Get subtasks for a ticket
  getTicketTasks: async (ticketId) => {
    return await api.get(`/tickets/${ticketId}/tasks`);
  },

  // 8. Create a subtask
  createTicketTask: async (ticketId, { title, description, deadline, memberId, priority }) => {
    return await api.post(`/tickets/${ticketId}/tasks`, {
      title,
      description: description || null,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      memberId: memberId ? Number(memberId) : null,
      priority: Number(priority),
    });
  },

  // 9. Update a subtask
  updateTicketTask: async (ticketId, taskId, { title, description, deadline, memberId, status, priority }) => {
    return await api.put(`/tickets/${ticketId}/tasks/${taskId}`, {
      title,
      description: description || null,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      memberId: memberId ? Number(memberId) : null,
      status: Number(status),
      priority: Number(priority),
    });
  },

  // 10. Change subtask status
  changeTicketTaskStatus: async (ticketId, taskId, {
    status,
    comment,
    linkUrl,
    file,
  }) => {
    const formData = new FormData();
    formData.append('Status', status);

    if (comment) formData.append('Comment', comment);
    if (linkUrl) formData.append('LinkUrl', linkUrl);
    if (file) formData.append('File', file);

    return await api.put(`/tickets/${ticketId}/tasks/${taskId}/status`, formData);
  },

  // 11. Delete a subtask
  deleteTicketTask: async (ticketId, taskId) => {
    return await api.delete(`/tickets/${ticketId}/tasks/${taskId}`);
  },
};

export default ticketService;
