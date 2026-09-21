import React from 'react';
import { FilterBar, Select, Button } from '../../shared';

export default function TicketFilterToolbar({
  searchTerm,
  setSearchTerm,
  teamFilter,
  setTeamFilter,
  priorityFilter,
  setPriorityFilter,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  quickFilter,
  setQuickFilter,
  quickCounts = {},
  teams = [],
  onReset,
  lang = 'ar',
  t,
  isRtl,
}) {
  const hasActiveFilters =
    searchTerm ||
    teamFilter !== 'all' ||
    priorityFilter !== 'all' ||
    statusFilter !== 'all' ||
    quickFilter !== 'all' ||
    sortBy !== 'newest';

  const quickFilterTabs = [
    { id: 'all', label: t.quickFilterAll, count: quickCounts.all ?? 0, icon: '🎯' },
    { id: 'mine', label: t.quickFilterMine, count: quickCounts.mine ?? 0, icon: '👤' },
    { id: 'unassigned', label: t.quickFilterUnassigned, count: quickCounts.unassigned ?? 0, icon: '⏳' },
    { id: 'urgent', label: t.quickFilterUrgent, count: quickCounts.urgent ?? 0, icon: '🔥' },
    { id: 'active', label: t.quickFilterActive, count: quickCounts.active ?? 0, icon: '⚙️' },
    { id: 'completed', label: t.quickFilterCompleted, count: quickCounts.completed ?? 0, icon: '✅' },
  ];

  return (
    <div>
      {/* Top Filter Bar */}
      <FilterBar>
        {/* Search Input with Icon and Clear Button */}
        <div style={{ flex: '1 1 240px', minWidth: '220px', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span
            style={{
              position: 'absolute',
              [isRtl ? 'right' : 'left']: '12px',
              color: '#94A3B8',
              pointerEvents: 'none',
              fontSize: '14px',
              zIndex: 1,
            }}
          >
            🔍
          </span>

          <input
            type="text"
            className="input"
            placeholder={t.searchTicketsPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              paddingInlineStart: '34px',
              paddingInlineEnd: searchTerm ? '32px' : '12px',
              height: '38px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '13px',
              fontFamily: 'Cairo, sans-serif',
              outline: 'none',
              background: '#FFFFFF',
            }}
          />

          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                [isRtl ? 'left' : 'right']: '10px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94A3B8',
                fontSize: '14px',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={t.clearSearch}
            >
              ✕
            </button>
          )}
        </div>

        {/* Team Dropdown */}
        <div style={{ flex: '1 1 150px', minWidth: '130px' }}>
          <Select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            options={[
              { value: 'all', label: t.allTeams },
              ...teams.map((tm) => ({ value: String(tm.id), label: tm.name })),
            ]}
          />
        </div>

        {/* Priority Dropdown */}
        <div style={{ flex: '1 1 130px', minWidth: '110px' }}>
          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            options={[
              { value: 'all', label: t.allPriorities },
              { value: 'Urgent', label: t.priorityUrgent },
              { value: 'High', label: t.priorityHigh },
              { value: 'Medium', label: t.priorityMedium },
              { value: 'Low', label: t.priorityLow },
            ]}
          />
        </div>

        {/* Status Dropdown */}
        <div style={{ flex: '1 1 130px', minWidth: '110px' }}>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: t.allStatuses },
              { value: 'NotAssigned', label: t.statusNotAssigned },
              { value: 'Pending', label: t.statusPending },
              { value: 'OnProgress', label: t.statusOnProgress },
              { value: 'Completed', label: t.statusCompleted },
            ]}
          />
        </div>

        {/* Sort By Dropdown */}
        <div style={{ flex: '1 1 150px', minWidth: '130px' }}>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={[
              { value: 'newest', label: t.sortNewest },
              { value: 'oldest', label: t.sortOldest },
              { value: 'priority', label: t.sortPriority },
              { value: 'deadline', label: t.sortDeadline },
              { value: 'title', label: t.sortTitle },
            ]}
          />
        </div>

        {/* Reset Filters Button */}
        {hasActiveFilters && (
          <Button variant="ghost" size="md" onClick={onReset}>
            {t.reset}
          </Button>
        )}
      </FilterBar>

      {/* Quick Filter Chips Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          padding: '8px 2px 14px',
          scrollbarWidth: 'none',
        }}
      >
        {quickFilterTabs.map((tab) => {
          const isSelected = quickFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setQuickFilter(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: isSelected ? '700' : '500',
                background: isSelected ? '#1565C0' : '#FFFFFF',
                color: isSelected ? '#FFFFFF' : '#475569',
                border: isSelected ? '1px solid #1565C0' : '1px solid #E2E8F0',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: isSelected ? '0 1px 3px rgba(21,101,192,0.2)' : '0 1px 2px rgba(0,0,0,0.02)',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span
                style={{
                  background: isSelected ? 'rgba(255, 255, 255, 0.25)' : '#F1F5F9',
                  color: isSelected ? '#FFFFFF' : '#64748B',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '10.5px',
                  fontWeight: '700',
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
