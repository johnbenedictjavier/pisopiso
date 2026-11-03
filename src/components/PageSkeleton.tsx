export default function PageSkeleton() {
  return (
    <div className="page-skeleton" role="status" aria-live="polite" aria-label="Loading page">
      <aside className="page-skeleton-sidebar" aria-hidden="true"><span className="skeleton-block skeleton-logo" /><span className="skeleton-block skeleton-nav skeleton-nav-wide" /><span className="skeleton-block skeleton-nav" /><span className="skeleton-block skeleton-nav" /><span className="skeleton-block skeleton-nav" /><span className="skeleton-block skeleton-nav" /></aside>
      <div className="page-skeleton-main">
        <header className="page-skeleton-topbar"><span className="skeleton-block skeleton-heading" /><span className="skeleton-block skeleton-avatar" /></header>
        <main className="page-skeleton-content">
          <span className="skeleton-block skeleton-title" />
          <section className="page-skeleton-overview"><span className="skeleton-block skeleton-balance" /><span className="skeleton-block skeleton-chart" /></section>
          <section className="page-skeleton-metrics"><span className="skeleton-block" /><span className="skeleton-block" /><span className="skeleton-block" /></section>
          <span className="skeleton-block skeleton-section-title" />
          <section className="page-skeleton-wallets"><span className="skeleton-block" /><span className="skeleton-block" /><span className="skeleton-block" /></section>
          <section className="page-skeleton-lower"><span className="skeleton-block" /><span className="skeleton-block" /></section>
        </main>
      </div>
    </div>
  )
}
