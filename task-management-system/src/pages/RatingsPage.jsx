import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { translations, formatDateTime } from '../utils/constants';
import { PageHeader, Button, Badge, Spinner, Input, Table } from '../components/shared';
import RatingCard from '../components/pages/ratings/RatingCard';
import SubmitRatingModal from '../components/pages/ratings/SubmitRatingModal';
import rateService from '../services/rateService';
import userService from '../services/userService';

// ═══════════════════════════════════════════════════════════════════════════
// Design tokens (mirrors LogsPage)
// ═══════════════════════════════════════════════════════════════════════════
const T = {
  ink: '#0F172A',
  inkSoft: '#334155',
  muted: '#64748B',
  mutedSoft: '#94A3B8',
  border: '#E8EDF5',
  borderSoft: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',
  brand: '#0E2E63',
  brandLight: '#1565C0',
  brandSoft: '#EFF6FF',
  gold: '#F5B301',
  goldSoft: '#FFFBEB',
  green: '#16A34A',
  greenSoft: '#F0FDF4',
  red: '#DC2626',
  redSoft: '#FEF2F2',
  shadowSm: '0 1px 3px rgba(15,35,80,0.05), 0 1px 2px rgba(15,35,80,0.03)',
  shadowMd: '0 8px 24px rgba(15,35,80,0.08), 0 2px 6px rgba(15,35,80,0.04)',
  shadowLg: '0 20px 50px rgba(15,35,80,0.10), 0 4px 12px rgba(15,35,80,0.05)',
  radius: '14px',
  radiusSm: '10px',
};

export default function RatingsPage({ lang = 'ar', user }) {
  const t = translations[lang] || translations.ar;
  const isRtl = lang === 'ar';
  const currentUserId = user?.id;
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

  const [activeTab, setActiveTab] = useState('mine');
  const [allRatings, setAllRatings] = useState([]);
  const [pendingRatings, setPendingRatings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [editingRating, setEditingRating] = useState(null);
  const [submitInfo, setSubmitInfo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ratingsData, pendingData, usersData] = await Promise.all([
        rateService.getAllRates(),
        rateService.getPendingRates().catch(() => []),
        userService.getAllUsers().catch(() => []),
      ]);
      setAllRatings(Array.isArray(ratingsData) ? ratingsData : []);
      setPendingRatings(Array.isArray(pendingData) ? pendingData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      setError(err.message || t.errorOccurred);
    } finally {
      setLoading(false);
    }
  }, [t.errorOccurred]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showPendingTab = isAdminOrManager || pendingRatings.length > 0;

  const myAverage = useMemo(() => {
    const received = allRatings.filter((r) => String(r.toUserId) === String(currentUserId) && r.isApproved);
    if (received.length === 0) return null;
    const sum = received.reduce((acc, r) => acc + (r.averageScore || 0), 0);
    return (sum / received.length).toFixed(1);
  }, [allRatings, currentUserId]);

  const receivedCount = useMemo(
    () => allRatings.filter((r) => String(r.toUserId) === String(currentUserId)).length,
    [allRatings, currentUserId]
  );

  const givenCount = useMemo(
    () => allRatings.filter((r) => String(r.fromUserId) === String(currentUserId)).length,
    [allRatings, currentUserId]
  );

  const handleCreateRating = async (payload) => {
    if (payload.isEdit) {
      await rateService.updateRate(payload.id, { comment: payload.comment, rateItems: payload.rateItems });
      setIsSubmitModalOpen(false);
      setEditingRating(null);
      setSubmitInfo(t.ratingUpdatedSuccess);
      setTimeout(() => setSubmitInfo(''), 5000);
      await loadData();
      return;
    }
    const created = await rateService.createRate(payload);
    setIsSubmitModalOpen(false);
    setSubmitInfo(created?.isApproved ? t.ratingSubmittedAutoApproved : t.ratingSubmittedPending);
    setTimeout(() => setSubmitInfo(''), 5000);
    await loadData();
  };

  const handleEditClick = (rating) => {
    setEditingRating(rating);
    setIsSubmitModalOpen(true);
  };

  const handleOpenNewRating = () => {
    setEditingRating(null);
    setIsSubmitModalOpen(true);
  };

  const handleDeleteRating = async (id) => {
    try {
      await rateService.deleteRate(id);
      setSubmitInfo(t.ratingDeletedSuccess);
      setTimeout(() => setSubmitInfo(''), 5000);
      await loadData();
    } catch (err) {
      alert(err.message || t.errorOccurred);
    }
  };

  const handleApprove = async (id, approvalComment) => {
    try {
      await rateService.approveRate(id, { approve: true, approvalComment });
      await loadData();
    } catch (err) {
      alert(err.message || t.errorOccurred);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm(t.rejectConfirmMessage)) return;
    try {
      await rateService.approveRate(id, { approve: false });
      await loadData();
    } catch (err) {
      alert(err.message || t.errorOccurred);
    }
  };

  const filteredAllRatings = allRatings.filter((r) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      (r.fromUserName || '').toLowerCase().includes(term) ||
      (r.toUserName || '').toLowerCase().includes(term) ||
      (r.comment || '').toLowerCase().includes(term)
    );
  });

  const tabs = [
    { id: 'mine', icon: '👤', label: t.tabMyRatings },
    ...(showPendingTab
      ? [
          {
            id: 'pending',
            icon: '⏳',
            label: t.tabPendingApprovals,
            badge: pendingRatings.length > 0 ? pendingRatings.length : null,
          },
        ]
      : []),
    { id: 'all', icon: '📋', label: t.tabAllRatings },
  ];

  return (
    <div style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      {/* ═══ Header ═══ */}
      <PageHeader
        title={t.ratingsTitle}
        subtitle={t.ratingsSubtitle}
        actions={
          <button
            onClick={handleOpenNewRating}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '11px 22px',
              border: 'none',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${T.brand} 0%, ${T.brandLight} 100%)`,
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: '800',
              fontFamily: 'Cairo, sans-serif',
              cursor: 'pointer',
              boxShadow: `0 8px 20px rgba(21,101,192,0.25)`,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = `0 12px 26px rgba(21,101,192,0.35)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 8px 20px rgba(21,101,192,0.25)`;
            }}
          >
            <span style={{ fontSize: '16px' }}>✍️</span>
            <span>{t.submitNewRating}</span>
          </button>
        }
      />

      {/* ═══ Success banner ═══ */}
      {submitInfo && (
        <div
          style={{
            position: 'relative',
            marginBottom: '16px',
            padding: '14px 18px',
            background: T.greenSoft,
            border: `1px solid #BBF7D0`,
            borderRadius: '12px',
            color: '#166534',
            fontSize: '13.5px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            overflow: 'hidden',
            animation: 'rpSlideIn 0.3s ease-out',
            boxShadow: T.shadowSm,
          }}
        >
          <span
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: '#16A34A',
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: '900',
              flexShrink: 0,
            }}
          >
            ✓
          </span>
          <span style={{ flex: 1 }}>{submitInfo}</span>
          {/* Auto-dismiss progress bar */}
          <span
            style={{
              position: 'absolute',
              bottom: 0,
              insetInlineStart: 0,
              height: '2px',
              background: '#16A34A',
              animation: 'rpProgress 5s linear forwards',
            }}
          />
        </div>
      )}

      {/* ═══ Stats strip ═══ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '18px',
        }}
      >
        <StatCard
          icon="⭐"
          label={t.myAverageScore}
          value={myAverage != null ? `${myAverage}/10` : '—'}
          tint="amber"
        />
        <StatCard
          icon="📥"
          label={lang === 'ar' ? 'تقييمات مستلمة' : 'Received'}
          value={receivedCount}
          tint="blue"
        />
        <StatCard
          icon="📤"
          label={lang === 'ar' ? 'تقييمات مقدّمة' : 'Given'}
          value={givenCount}
          tint="green"
        />
        <StatCard
          icon="⏳"
          label={lang === 'ar' ? 'بانتظار الموافقة' : 'Pending'}
          value={pendingRatings.length}
          tint={pendingRatings.length > 0 ? 'red' : 'gray'}
        />
      </div>

      {/* ═══ Tabs ═══ */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          padding: '5px',
          background: T.surfaceAlt,
          borderRadius: '14px',
          border: `1px solid ${T.border}`,
          marginBottom: '22px',
          flexWrap: 'wrap',
          boxShadow: T.shadowSm,
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                position: 'relative',
                padding: '9px 16px',
                background: isActive ? T.surface : 'transparent',
                border: 'none',
                borderRadius: '10px',
                color: isActive ? T.brandLight : T.muted,
                fontWeight: isActive ? '800' : '600',
                fontSize: '13px',
                fontFamily: 'Cairo, sans-serif',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: isActive ? '0 2px 6px rgba(15,35,80,0.08)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: '14px' }}>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge != null && (
                <span
                  style={{
                    background: '#DC2626',
                    color: '#FFFFFF',
                    fontSize: '10.5px',
                    fontWeight: '800',
                    padding: '1px 7px',
                    borderRadius: '999px',
                    minWidth: '18px',
                    textAlign: 'center',
                    lineHeight: 1.5,
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ═══ Content ═══ */}
      {loading ? (
        <RatingsSkeleton />
      ) : error ? (
        <ErrorState error={error} onRetry={loadData} retryLabel={t.retry} />
      ) : activeTab === 'mine' ? (
        <MyRatingsTab
          allRatings={allRatings}
          currentUserId={currentUserId}
          userRole={user?.role}
          myAverage={myAverage}
          receivedCount={receivedCount}
          lang={lang}
          t={t}
          onEdit={handleEditClick}
          onDelete={handleDeleteRating}
        />
      ) : activeTab === 'pending' ? (
        <PendingTab
          pendingRatings={pendingRatings}
          lang={lang}
          t={t}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      ) : (
        <AllRatingsTab
          filteredAllRatings={filteredAllRatings}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          user={user}
          lang={lang}
          t={t}
          onDelete={handleDeleteRating}
        />
      )}

      <SubmitRatingModal
        open={isSubmitModalOpen}
        onClose={() => {
          setIsSubmitModalOpen(false);
          setEditingRating(null);
        }}
        onSubmit={handleCreateRating}
        users={users}
        currentUserId={currentUserId}
        lang={lang}
        editingRating={editingRating}
      />

      <style>{`
        @keyframes rpSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes rpProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
        @keyframes rpShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .rp-skel {
          background: linear-gradient(90deg, #F1F5F9 0%, #E2E8F0 50%, #F1F5F9 100%);
          background-size: 200% 100%;
          animation: rpShimmer 1.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tabs content
// ═══════════════════════════════════════════════════════════════════════════
function MyRatingsTab({ allRatings, currentUserId, userRole, myAverage, receivedCount, lang, t, onEdit, onDelete }) {
  const isRtl = lang === 'ar';
  const mine = allRatings.filter(
    (r) =>
      String(r.toUserId) === String(currentUserId) ||
      String(r.fromUserId) === String(currentUserId)
  );

  if (mine.length === 0) {
    return (
      <EmptyState
        icon="⭐"
        title={t.noRatingsFound}
        subtitle={
          lang === 'ar'
            ? 'لم تقم بإرسال أو استلام أي تقييمات بعد. ابدأ بتقييم أحد زملائك.'
            : "You haven't sent or received any ratings yet. Start by rating a colleague."
        }
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Hero score card */}
      {myAverage != null && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            padding: '26px 30px',
            background: `linear-gradient(135deg, ${T.brand} 0%, ${T.brandLight} 100%)`,
            borderRadius: '18px',
            color: '#FFFFFF',
            boxShadow: '0 20px 40px rgba(21,101,192,0.25)',
            position: 'relative',
            overflow: 'hidden',
            flexWrap: 'wrap',
          }}
        >
          {/* Decorative circle */}
          <div
            style={{
              position: 'absolute',
              insetInlineEnd: '-30px',
              top: '-30px',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              insetInlineEnd: '40px',
              bottom: '-60px',
              width: '160px',
              height: '160px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)',
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '88px',
              height: '88px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              border: '2px solid rgba(255,255,255,0.25)',
              flexShrink: 0,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '26px', fontWeight: '900', lineHeight: 1 }}>{myAverage}</div>
              <div style={{ fontSize: '11px', opacity: 0.85, fontWeight: '700' }}>/10</div>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '13px', opacity: 0.85, fontWeight: '600', letterSpacing: '0.3px' }}>
              {t.myAverageScore}
            </div>
            <div style={{ fontSize: '22px', fontWeight: '900', marginTop: '4px', letterSpacing: '-0.3px' }}>
              {t.myAverageScoreTitle || (lang === 'ar' ? 'أداؤك ممتاز' : 'Excellent performance')}
            </div>
            <div style={{ fontSize: '12.5px', opacity: 0.85, marginTop: '6px' }}>
              {receivedCount} {t.ratingsReceivedCount}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '4px', position: 'relative', zIndex: 1 }}>
            {Array.from({ length: 5 }).map((_, i) => {
              const filled = i < Math.round(Number(myAverage) / 2);
              return (
                <span key={i} style={{ fontSize: '22px', opacity: filled ? 1 : 0.35 }}>
                  ⭐
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Section label */}
      <SectionLabel
        icon="🗂️"
        label={lang === 'ar' ? 'سجل التقييمات' : 'Ratings History'}
        count={mine.length}
        lang={lang}
      />

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {mine.map((r) => (
          <RatingCard
            key={r.id}
            rating={r}
            lang={lang}
            currentUserId={currentUserId}
            currentUserRole={userRole}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

function PendingTab({ pendingRatings, lang, t, onApprove, onReject }) {
  if (pendingRatings.length === 0) {
    return (
      <EmptyState
        icon="✅"
        title={t.noPendingRatings}
        subtitle={
          lang === 'ar'
            ? 'لا توجد تقييمات بانتظار الموافقة. عمل رائع!'
            : 'No ratings awaiting approval. Great job!'
        }
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Alert ribbon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          background: T.goldSoft,
          border: '1px solid #FDE68A',
          borderRadius: '12px',
          color: '#92400E',
          fontSize: '13px',
          fontWeight: '700',
        }}
      >
        <span
          style={{
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            background: '#F59E0B',
            color: '#FFFFFF',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: '900',
            flexShrink: 0,
          }}
        >
          !
        </span>
        <span>
          {lang === 'ar'
            ? `${pendingRatings.length} تقييم بانتظار مراجعتك`
            : `${pendingRatings.length} rating${pendingRatings.length === 1 ? '' : 's'} awaiting your review`}
        </span>
      </div>

      {pendingRatings.map((r) => (
        <div key={r.id} style={{ position: 'relative' }}>
          {/* Ribbon accent */}
          <div
            style={{
              position: 'absolute',
              insetInlineStart: 0,
              top: '12px',
              bottom: '12px',
              width: '4px',
              background: 'linear-gradient(180deg, #F59E0B, #F97316)',
              borderRadius: '0 4px 4px 0',
              zIndex: 1,
            }}
          />
          <RatingCard
            rating={r}
            lang={lang}
            showApprovalActions
            onApprove={onApprove}
            onReject={onReject}
          />
        </div>
      ))}
    </div>
  );
}

function AllRatingsTab({ filteredAllRatings, searchTerm, setSearchTerm, user, lang, t, onDelete }) {
  const isRtl = lang === 'ar';

  return (
    <div>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            position: 'relative',
            flex: '1 1 280px',
            maxWidth: '380px',
          }}
        >
          <span
            style={{
              position: 'absolute',
              insetInlineStart: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '14px',
              color: T.mutedSoft,
              pointerEvents: 'none',
            }}
          >
            🔍
          </span>
          <input
            type="text"
            placeholder={t.searchRatingsPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 42px',
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: '12px',
              fontSize: '13.5px',
              fontFamily: 'Cairo, sans-serif',
              color: T.ink,
              outline: 'none',
              boxShadow: T.shadowSm,
              transition: 'all 0.15s',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = T.brandLight;
              e.currentTarget.style.boxShadow = `0 0 0 4px rgba(21,101,192,0.10)`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = T.border;
              e.currentTarget.style.boxShadow = T.shadowSm;
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
              style={{
                position: 'absolute',
                insetInlineEnd: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: 'none',
                background: T.borderSoft,
                color: T.muted,
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '900',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Result count pill */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            background: T.brandSoft,
            border: '1px solid #DBEAFE',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: '800',
            color: T.brand,
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: T.brandLight }} />
          {filteredAllRatings.length} {lang === 'ar' ? 'نتيجة' : 'result' + (filteredAllRatings.length === 1 ? '' : 's')}
        </span>
      </div>

      {/* Table wrapper card */}
      <div
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: T.radius,
          padding: '6px',
          boxShadow: T.shadowSm,
          overflow: 'hidden',
        }}
      >
        <Table
          emptyMessage={t.noRatingsFound}
          data={filteredAllRatings}
          columns={[
            {
              key: 'fromUserName',
              title: t.from,
              render: (val) => (
                <span style={{ fontWeight: '700', color: T.ink }}>{val}</span>
              ),
            },
            {
              key: 'toUserName',
              title: t.to,
              render: (val) => (
                <span style={{ fontWeight: '700', color: T.ink }}>{val}</span>
              ),
            },
            {
              key: 'type',
              title: t.ratingType,
              render: (val) => (
                <Badge variant={val === 'Standard' ? 'green' : 'amber'} size="sm">
                  {val === 'Standard' ? t.standardType : t.reportType}
                </Badge>
              ),
            },
            {
              key: 'averageScore',
              title: t.score,
              render: (val) => (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '3px 10px',
                    background: T.brandSoft,
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: '900',
                    color: T.brand,
                    border: '1px solid #DBEAFE',
                  }}
                >
                  <span>⭐</span>
                  <span>{val ?? 0}</span>
                  <span style={{ opacity: 0.6, fontWeight: '700' }}>/10</span>
                </span>
              ),
            },
            {
              key: 'isApproved',
              title: t.statusLabelText,
              render: (val) =>
                val ? (
                  <Badge variant="blue" size="sm">
                    {t.approvedStatus}
                  </Badge>
                ) : (
                  <Badge variant="gray" size="sm">
                    {t.pendingApprovalStatus}
                  </Badge>
                ),
            },
            {
              key: 'createdAt',
              title: t.evaluatedOn,
              render: (val) => (
                <span style={{ color: T.mutedSoft, fontWeight: '600', fontSize: '12.5px' }}>
                  {formatDateTime(val, lang)}
                </span>
              ),
            },
            ...(user?.role === 'admin'
              ? [
                  {
                    key: 'actions',
                    title: t.actions || (lang === 'ar' ? 'إجراءات' : 'Actions'),
                    render: (_, row) => (
                      <button
                        onClick={() => onDelete(row.id)}
                        title={t.delete}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          border: `1px solid #FECACA`,
                          background: '#FEF2F2',
                          color: '#DC2626',
                          cursor: 'pointer',
                          fontSize: '13px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#FEE2E2';
                          e.currentTarget.style.transform = 'scale(1.06)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#FEF2F2';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        🗑️
                      </button>
                    ),
                  },
                ]
              : []),
          ]}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Small shared components
// ═══════════════════════════════════════════════════════════════════════════
function StatCard({ icon, label, value, tint = 'blue' }) {
  const tints = {
    blue: { bg: '#EFF6FF', color: '#1565C0', border: '#DBEAFE' },
    green: { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
    amber: { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
    red: { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' },
    gray: { bg: '#F8FAFC', color: '#475569', border: '#E2E8F0' },
  };
  const c = tints[tint] || tints.blue;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 16px',
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: T.radius,
        boxShadow: T.shadowSm,
      }}
    >
      <div
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: c.bg,
          border: `1px solid ${c.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '11.5px', color: T.muted, fontWeight: '700', lineHeight: 1.3 }}>
          {label}
        </div>
        <div
          style={{
            fontSize: '22px',
            fontWeight: '800',
            color: c.color,
            lineHeight: 1.15,
            marginTop: '2px',
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ icon, label, count, lang }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginTop: '4px',
      }}
    >
      <span
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '10px',
          background: T.brandSoft,
          border: '1px solid #DBEAFE',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
        }}
      >
        {icon}
      </span>
      <span style={{ fontSize: '13.5px', fontWeight: '800', color: T.ink }}>{label}</span>
      {count != null && (
        <span
          style={{
            fontSize: '11.5px',
            color: T.brand,
            fontWeight: '800',
            padding: '2px 10px',
            background: T.brandSoft,
            borderRadius: '999px',
            border: '1px solid #DBEAFE',
          }}
        >
          {count}
        </span>
      )}
      <div style={{ flex: 1, height: '1px', background: T.borderSoft }} />
    </div>
  );
}

function RatingsSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div
        style={{
          height: '120px',
          borderRadius: '18px',
          background: 'linear-gradient(90deg, #F1F5F9 0%, #E2E8F0 50%, #F1F5F9 100%)',
          backgroundSize: '200% 100%',
          animation: 'rpShimmer 1.4s ease-in-out infinite',
        }}
      />
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: T.radius,
            padding: '20px',
            boxShadow: T.shadowSm,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div className="rp-skel" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="rp-skel" style={{ height: '12px', width: '35%', borderRadius: '6px' }} />
              <div className="rp-skel" style={{ height: '10px', width: '55%', borderRadius: '6px' }} />
            </div>
          </div>
          <div className="rp-skel" style={{ height: '10px', width: '80%', borderRadius: '6px', marginBottom: '8px' }} />
          <div className="rp-skel" style={{ height: '10px', width: '60%', borderRadius: '6px' }} />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <div
      style={{
        padding: '60px 20px',
        textAlign: 'center',
        background: T.surface,
        borderRadius: T.radius,
        border: `1px dashed ${T.border}`,
        boxShadow: T.shadowSm,
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          margin: '0 auto 16px',
          borderRadius: '50%',
          background: T.brandSoft,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: '16px', fontWeight: '800', color: T.ink, marginBottom: '6px' }}>{title}</div>
      {subtitle && (
        <div style={{ fontSize: '13px', color: T.muted, maxWidth: '380px', margin: '0 auto', lineHeight: 1.6 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

function ErrorState({ error, onRetry, retryLabel }) {
  return (
    <div
      style={{
        padding: '40px 24px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, #FEF2F2 0%, #FFFFFF 100%)',
        borderRadius: T.radius,
        border: '1px solid #FCA5A5',
        boxShadow: T.shadowSm,
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          margin: '0 auto 12px',
          borderRadius: '50%',
          background: '#FEE2E2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
        }}
      >
        ⚠️
      </div>
      <div style={{ fontSize: '15px', color: '#B91C1C', fontWeight: '800', marginBottom: '16px' }}>{error}</div>
      <Button variant="secondary" size="md" onClick={onRetry}>
        {retryLabel}
      </Button>
    </div>
  );
}