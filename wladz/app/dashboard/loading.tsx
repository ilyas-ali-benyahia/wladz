// Écran d'attente des pages du tableau de bord. Ce fichier crée la limite <Suspense> de chaque page,
// sous la mise en page partagée (barre latérale) : en naviguant d'une page à l'autre, la barre
// reste affichée et ce squelette remplace le contenu le temps que la session et les données arrivent.
export default function DashboardLoading() {
  return (
    <div role="status" aria-label="جارٍ التحميل…" className="flex flex-col gap-6">
      <div className="wz-glass-green h-36 animate-pulse rounded-[2rem]" />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="wz-glass h-64 animate-pulse rounded-[2rem]" />
        <div className="wz-glass h-64 animate-pulse rounded-[2rem]" />
      </div>
      <span className="sr-only">جارٍ التحميل…</span>
    </div>
  );
}
