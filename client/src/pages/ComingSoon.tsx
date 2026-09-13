export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <h1 className="text-lg font-bold text-slate-800">{title}</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        This module is scaffolded on the backend (see /api routes) and will be built out next, following the same
        repository → service → controller → routes pattern used for Leads.
      </p>
    </div>
  );
}
