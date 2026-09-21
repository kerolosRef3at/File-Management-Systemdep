import React, { useState, useEffect, useCallback } from 'react';
import { translations, normalizeTeamStatus } from '../utils/constants';
import { PageHeader, FilterBar, Input, Select, Button, Badge, Spinner, ConfirmDeleteModal } from '../components/shared';
import TeamCard from '../components/pages/teams/TeamCard';
import TeamMembersModal from '../components/pages/teams/TeamMembersModal';
import NewTeamModal from '../components/pages/teams/NewTeamModal';
import teamService from '../services/teamService';

export default function TeamsPage({ lang = 'ar', user }) {
  const t = translations[lang] || translations.ar;
  const isRtl = lang === 'ar';

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [isNewTeamModalOpen, setIsNewTeamModalOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState(null);
  const [teamForMembers, setTeamForMembers] = useState(null);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [deletingTeam, setDeletingTeam] = useState(false);

  const loadTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await teamService.getAllTeams();
      setTeams(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || t.errorOccurred);
    } finally {
      setLoading(false);
    }
  }, [t.errorOccurred]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  // Create or Update Team with members and leader
  const handleTeamFormSubmit = async (formData) => {
    try {
      if (teamToEdit) {
        await teamService.updateTeam(teamToEdit.id, formData);
        const targetTeamId = teamToEdit.id;

        // Sync members
        const currentMemberIds = (teamToEdit.members || []).map((m) => m.memberId);
        const newMemberIds = formData.memberIds || [];

        const toAdd = newMemberIds.filter((id) => !currentMemberIds.includes(id));
        for (const mId of toAdd) {
          await teamService.addMemberToTeam(targetTeamId, mId).catch(() => null);
        }

        if (formData.leaderId) {
          await teamService.setTeamLeader(targetTeamId, formData.leaderId).catch(() => null);
        }
      } else {
        // Create new team
        const newTeam = await teamService.createTeam({
          name: formData.name,
          description: formData.description,
          status: formData.status,
        });

        if (newTeam && newTeam.id) {
          // Add all selected members
          if (formData.memberIds && formData.memberIds.length > 0) {
            for (const mId of formData.memberIds) {
              await teamService.addMemberToTeam(newTeam.id, mId).catch(() => null);
            }
          }

          // Assign designated team leader
          if (formData.leaderId) {
            await teamService.setTeamLeader(newTeam.id, formData.leaderId).catch(() => null);
          }
        }
      }
    } catch (err) {
      alert(err.message || t.errorOccurred);
    }

    setTeamToEdit(null);
    await loadTeams();
  };

  // Delete Team Trigger
  const handleDeleteTeam = (team) => {
    setTeamToDelete(team);
  };

  const confirmDeleteTeam = async () => {
    if (!teamToDelete) return;
    setDeletingTeam(true);
    try {
      await teamService.deleteTeam(teamToDelete.id);
      setTeamToDelete(null);
      await loadTeams();
    } catch (err) {
      alert(err.message || t.errorOccurred);
    } finally {
      setDeletingTeam(false);
    }
  };

  // Filtered teams
  const filteredTeams = teams.filter((team) => {
    const term = searchTerm.toLowerCase().trim();
    const leader = (team.members || []).find((m) => m.isTeamLeader);
    const leaderName = leader ? leader.fullName.toLowerCase() : '';

    const matchesSearch =
      !term ||
      (team.name && team.name.toLowerCase().includes(term)) ||
      (team.description && team.description.toLowerCase().includes(term)) ||
      leaderName.includes(term);

    const normStatus = normalizeTeamStatus(team.status);
    const matchesStatus = statusFilter === 'all' || normStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      {/* Page Header */}
      <PageHeader
        title={t.teamsTitle}
        subtitle={t.teamsSubtitle}
        badge={
          <Badge variant="blue" size="md">
            {filteredTeams.length} {t.teamsCount}
          </Badge>
        }
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setTeamToEdit(null);
              setIsNewTeamModalOpen(true);
            }}
          >
            + {t.newTeam}
          </Button>
        }
      />

      {/* Filter Bar */}
      <FilterBar>
        <div style={{ flex: '1 1 240px', minWidth: '200px' }}>
          <Input
            placeholder={t.searchTeamsPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ width: '180px' }}>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: t.allStatuses },
              { value: 'Active', label: t.teamStatusActive },
              { value: 'Pending', label: t.teamStatusPending },
              { value: 'Finished', label: t.teamStatusFinished },
            ]}
          />
        </div>

        {(searchTerm || statusFilter !== 'all') && (
          <Button
            variant="ghost"
            size="md"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
            }}
          >
            {t.reset}
          </Button>
        )}
      </FilterBar>

      {/* Main Grid View */}
      {loading ? (
        <div style={{ padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <Spinner size="lg" />
          <span style={{ fontSize: '13.5px', color: '#64748B', fontWeight: '600' }}>{t.loading}</span>
        </div>
      ) : error ? (
        <div
          style={{
            padding: '36px',
            textAlign: 'center',
            background: '#FEF2F2',
            borderRadius: '12px',
            border: '1px solid #FCA5A5',
            margin: '20px 0',
          }}
        >
          <div style={{ fontSize: '14px', color: '#DC2626', fontWeight: '700', marginBottom: '12px' }}>
            ⚠️ {error}
          </div>
          <Button variant="secondary" size="sm" onClick={loadTeams}>
            {t.retry}
          </Button>
        </div>
      ) : filteredTeams.length === 0 ? (
        <div
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            background: '#FFFFFF',
            borderRadius: '14px',
            border: '1px dashed #CBD5E1',
            color: '#64748B',
            fontSize: '14px',
            fontWeight: '600',
            margin: '20px 0',
          }}
        >
          {t.noTeamsFound}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '18px',
            marginTop: '8px',
          }}
        >
          {filteredTeams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onManageMembers={(targetTeam) => setTeamForMembers(targetTeam)}
              onEditTeam={(targetTeam) => {
                setTeamToEdit(targetTeam);
                setIsNewTeamModalOpen(true);
              }}
              onDeleteTeam={handleDeleteTeam}
              lang={lang}
              user={user}
            />
          ))}
        </div>
      )}

      {/* Team Members Management Modal */}
      {teamForMembers && (
        <TeamMembersModal
          team={teamForMembers}
          open={!!teamForMembers}
          onClose={() => setTeamForMembers(null)}
          onTeamUpdated={async () => {
            await loadTeams();
            // Refresh currently viewed team in modal
            const updated = await teamService.getTeamById(teamForMembers.id).catch(() => null);
            if (updated) setTeamForMembers(updated);
          }}
          lang={lang}
        />
      )}

      {/* New / Edit Team Modal */}
      {isNewTeamModalOpen && (
        <NewTeamModal
          open={isNewTeamModalOpen}
          onClose={() => {
            setIsNewTeamModalOpen(false);
            setTeamToEdit(null);
          }}
          onSubmit={handleTeamFormSubmit}
          teamToEdit={teamToEdit}
          lang={lang}
        />
      )}

      {/* Delete Team Confirmation Modal */}
      <ConfirmDeleteModal
        open={!!teamToDelete}
        onClose={() => setTeamToDelete(null)}
        onConfirm={confirmDeleteTeam}
        title={t.deleteTeam}
        message={t.deleteTeamConfirm}
        itemName={teamToDelete?.name}
        loading={deletingTeam}
        lang={lang}
      />
    </div>
  );
}
