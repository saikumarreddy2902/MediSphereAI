"use client";

interface LoadingCardProps {
  rows?: number;
  height?: string;
  className?: string;
}

/**
 * LoadingCard — animated shimmer skeleton card used as a loading placeholder
 * across all dashboard module pages while data is being fetched.
 */
export function LoadingCard({ rows = 4, height = "h-4", className = "" }: LoadingCardProps) {
  return (
    <div className={`loading-card ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`loading-bar ${height}`}
          style={{ width: i === 0 ? "60%" : i % 3 === 0 ? "80%" : "100%" }}
        />
      ))}
    </div>
  );
}

/**
 * LoadingGrid — renders a grid of LoadingCards for dashboards.
 */
export function LoadingGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="loading-grid">
      {Array.from({ length: count }).map((_, i) => (
        <LoadingCard key={i} rows={3} />
      ))}
    </div>
  );
}

/**
 * LoadingTable — skeleton for a data table with header + rows.
 */
export function LoadingTable({ rows = 6 }: { rows?: number }) {
  return (
    <div className="loading-table">
      {/* Header */}
      <div className="loading-table-header">
        {[40, 25, 20, 15].map((w, i) => (
          <div key={i} className="loading-bar h-3" style={{ width: `${w}%` }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="loading-table-row">
          {[35, 20, 25, 10].map((w, j) => (
            <div key={j} className="loading-bar h-3" style={{ width: `${w}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}
