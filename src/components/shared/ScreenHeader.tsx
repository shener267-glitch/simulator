interface ScreenHeaderProps {
  title: string;
  onBack: () => void;
}

export function ScreenHeader({ title, onBack }: ScreenHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h1 className="min-w-0 truncate text-xl font-bold text-slate-100">{title}</h1>
      <button
        type="button"
        onClick={onBack}
        className="-mr-2 flex h-11 shrink-0 items-center rounded px-3 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-100"
      >
        戻る
      </button>
    </div>
  );
}
