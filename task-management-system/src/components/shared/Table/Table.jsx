import React from 'react';
import Spinner from '../Spinner/Spinner';

export function TableHeadCell({ children, align = 'center', className = '', style = {}, ...props }) {
  return (
    <th
      className={className}
      style={{
        background: '#F8FAFC',
        padding: '13px 18px',
        textAlign: align,
        fontWeight: '700',
        color: '#475569',
        borderBottom: '1.5px solid #E2E8F0',
        whiteSpace: 'nowrap',
        position: 'sticky',
        top: 0,
        zIndex: 1,
        fontSize: '13px',
        fontFamily: 'Cairo, sans-serif',
        ...style,
      }}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, align = 'center', className = '', style = {}, ...props }) {
  return (
    <td
      className={className}
      style={{
        padding: '13px 18px',
        borderBottom: '1px solid #F1F5F9',
        color: '#334155',
        fontSize: '13.5px',
        textAlign: align,
        fontFamily: 'Cairo, sans-serif',
        ...style,
      }}
      {...props}
    >
      {children}
    </td>
  );
}

export function TableRow({ children, onClick, className = '', style = {}, ...props }) {
  return (
    <tr
      onClick={onClick}
      className={className}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background-color 0.15s ease',
        ...style,
      }}
      {...props}
    >
      {children}
    </tr>
  );
}

export default function Table({
  columns = [], // [{ key: 'id', title: '...', align: 'center', render: (val, row) => ... }]
  data = [],
  loading = false,
  emptyMessage = 'لا توجد بيانات متاحة',
  children,
  className = '',
  style = {},
  onRowClick,
  renderMobileCard,
}) {
  return (
    <div className={`table-container ${className}`} style={style}>
      <style>{`
        .table-mobile-cards-wrap {
          display: none;
          flex-direction: column;
          gap: 12px;
        }
        .table-desktop-wrap {
          display: block;
        }
        @media (max-width: 768px) {
          .table-desktop-wrap {
            display: none !important;
          }
          .table-mobile-cards-wrap {
            display: flex !important;
          }
        }
        .tbl-mobile-card {
          background: #FFFFFF;
          border-radius: 14px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .tbl-mobile-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.07);
        }
      `}</style>

      {/* Desktop Table View */}
      <div
        className="table-card table-desktop-wrap"
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E8EDF5',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div className="tbl-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            {children ? (
              children
            ) : (
              <>
                <thead>
                  <tr>
                    {columns.map((col) => (
                      <TableHeadCell key={col.key} align={col.align || 'center'} style={col.headerStyle}>
                        {col.title}
                      </TableHeadCell>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={columns.length} style={{ padding: '40px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                          <Spinner size="lg" />
                          <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>
                            جارِ تحميل البيانات...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : data.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8', fontSize: '14px', fontWeight: '600' }}
                      >
                        {emptyMessage}
                      </td>
                    </tr>
                  ) : (
                    data.map((row, rowIdx) => (
                      <TableRow key={row.id || rowIdx} onClick={onRowClick ? () => onRowClick(row) : undefined}>
                        {columns.map((col) => (
                          <TableCell key={col.key} align={col.align || 'center'} style={col.cellStyle}>
                            {col.render ? col.render(row[col.key], row, rowIdx) : row[col.key]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </tbody>
              </>
            )}
          </table>
        </div>
      </div>

      {/* Mobile Awesome Cards View */}
      {!children && (
        <div className="table-mobile-cards-wrap">
          {loading ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <Spinner size="lg" />
                <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>
                  جارِ تحميل البيانات...
                </span>
              </div>
            </div>
          ) : data.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#94A3B8',
                fontSize: '14px',
                fontWeight: '600',
                background: '#FFFFFF',
                borderRadius: '14px',
                border: '1px dashed #CBD5E1',
              }}
            >
              {emptyMessage}
            </div>
          ) : (
            data.map((row, rowIdx) => {
              if (renderMobileCard) {
                return renderMobileCard(row, rowIdx);
              }

              // Categorize columns for clean layout
              const idCol = columns.find((c) => c.key === 'id');
              const titleCol = columns.find((c) => c.key === 'title' || c.key === 'subject' || c.key === 'name');
              const statusCol = columns.find((c) => c.key === 'status');
              const priorityCol = columns.find((c) => c.key === 'priority');
              const actionsCol = columns.find((c) => c.key === 'actions');

              const specialKeys = new Set(['id', 'title', 'subject', 'name', 'status', 'priority', 'actions']);
              const detailCols = columns.filter((c) => !specialKeys.has(c.key));

              return (
                <div
                  key={row.id || rowIdx}
                  className="tbl-mobile-card"
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {/* Card Header: ID & Status/Priority Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    {idCol ? (
                      <span style={{ fontSize: '13px', fontWeight: '800', color: '#1565C0', fontFamily: 'monospace' }}>
                        {idCol.render ? idCol.render(row[idCol.key], row, rowIdx) : `#${row[idCol.key]}`}
                      </span>
                    ) : (
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B' }}>
                        #{rowIdx + 1}
                      </span>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      {priorityCol && priorityCol.render && (
                        <span>{priorityCol.render(row[priorityCol.key], row, rowIdx)}</span>
                      )}
                      {statusCol && statusCol.render && (
                        <span>{statusCol.render(row[statusCol.key], row, rowIdx)}</span>
                      )}
                    </div>
                  </div>

                  {/* Card Title */}
                  {titleCol && (
                    <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '14px', lineHeight: 1.4 }}>
                      {titleCol.render ? titleCol.render(row[titleCol.key], row, rowIdx) : row[titleCol.key]}
                    </div>
                  )}

                  {/* Card Key-Value Details */}
                  {detailCols.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px', background: '#F8FAFC', padding: '10px 12px', borderRadius: '10px' }}>
                      {detailCols.map((col) => (
                        <div
                          key={col.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '12.5px',
                            gap: '8px',
                          }}
                        >
                          <span style={{ color: '#64748B', fontWeight: '600', flexShrink: 0 }}>
                            {col.title}:
                          </span>
                          <span style={{ fontWeight: '600', color: '#1E293B', textAlign: 'end' }}>
                            {col.render ? col.render(row[col.key], row, rowIdx) : row[col.key] || '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Card Action Row */}
                  {actionsCol && actionsCol.render && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '8px',
                        paddingTop: '8px',
                        borderTop: '1px solid #F1F5F9',
                        marginTop: '2px',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {actionsCol.render(row[actionsCol.key], row, rowIdx)}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

Table.Head = ({ children }) => <thead>{children}</thead>;
Table.Body = ({ children }) => <tbody>{children}</tbody>;
Table.Row = TableRow;
Table.Cell = TableCell;
Table.HeadCell = TableHeadCell;
