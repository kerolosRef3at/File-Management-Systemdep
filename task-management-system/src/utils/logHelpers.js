// Helpers for mapping the free-text Action / EntityName strings the backend
// writes into Logs (e.g. "CreateUserRate", "Login", "UpdateProfile") to
// display badges/labels. The backend does not use a fixed enum for these
// fields (see LogsController / LogActivityAsync call sites), so matching is
// done by keyword rather than exact value.

export function getActionBadgeVariant(action) {
  const a = (action || '').toLowerCase();
  if (a.includes('login') || a.includes('logout')) return 'purple';
  if (a.includes('delete') || a.includes('reject')) return 'red';
  if (a.includes('create') || a.includes('add')) return 'green';
  if (a.includes('approve')) return 'green';
  if (a.includes('status')) return 'blue';
  if (a.includes('update') || a.includes('change') || a.includes('edit')) return 'amber';
  return 'gray';
}

export function getActionLabel(action, t) {
  const a = (action || '').toLowerCase();
  if (a.includes('login')) return t.actionLogin;
  if (a.includes('delete') || a.includes('reject')) return t.actionDelete;
  if (a.includes('approve')) return t.actionApprove;
  if (a.includes('status')) return t.actionStatusChange;
  if (a.includes('create') || a.includes('add')) return t.actionCreate;
  if (a.includes('update') || a.includes('change') || a.includes('edit')) return t.actionUpdate;
  return action || '—';
}

export function getEntityLabel(entityName, t) {
  const e = (entityName || '').toLowerCase();
  if (e === 'user') return t.entityUser;
  if (e === 'team') return t.entityTeam;
  if (e === 'teammember') return t.entityTeamMember;
  if (e === 'ticket') return t.entityTicket;
  if (e === 'tickettask') return t.entityTicketTask;
  if (e === 'userrate') return t.entityUserRate;
  return entityName || '—';
}

// TeamMember log entries store EntityId as "{teamId}-{memberId}" (e.g. the
// backend logs "1-5" to mean Team #1 / Member #5) — NOT a range of IDs.
// This resolves that pair (and other entity IDs) into a human-readable
// name using already-loaded lookup maps, falling back to the raw ID when
// the record can't be resolved (e.g. it was later deleted, or the entity
// type isn't one we fetch names for).
//
// `lookups` shape: { users: Map<id, name>, teams: Map<id, name>, tickets: Map<id, title> }
export function resolveEntityDisplay(entityName, entityId, lookups, t) {
  const e = (entityName || '').toLowerCase();
  const { users, teams, tickets } = lookups || {};

  if (!entityId) return '';

  if (e === 'teammember' && /^\d+-\d+$/.test(entityId)) {
    const [teamId, memberId] = entityId.split('-');
    const teamName = teams?.get(String(teamId));
    const memberName = users?.get(String(memberId));
    if (teamName || memberName) {
      return `${teamName || `#${teamId}`} — ${memberName || `#${memberId}`}`;
    }
    return t.teamMemberIdFormat.replace('{team}', teamId).replace('{member}', memberId);
  }

  if (e === 'user') {
    const name = users?.get(String(entityId));
    return name || `#${entityId}`;
  }

  if (e === 'team') {
    const name = teams?.get(String(entityId));
    return name || `#${entityId}`;
  }

  if (e === 'ticket') {
    const title = tickets?.get(String(entityId));
    return title || `#${entityId}`;
  }

  // TicketTask / UserRate / unknown types: no cheap lookup available, show ID
  return `#${entityId}`;
}

// Kept for any caller that only wants the raw "#id" / "Team #x, Member #y"
// format without name resolution.
export function formatEntityId(entityName, entityId, t) {
  if (!entityId) return '';
  const e = (entityName || '').toLowerCase();
  if (e === 'teammember' && /^\d+-\d+$/.test(entityId)) {
    const [teamId, memberId] = entityId.split('-');
    return t.teamMemberIdFormat
      .replace('{team}', teamId)
      .replace('{member}', memberId);
  }
  return `#${entityId}`;
}
