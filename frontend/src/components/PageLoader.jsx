import { Loader2 } from 'lucide-react';

export default function PageLoader({ text }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-slate-400">
      <Loader2 size={28} className="animate-spin text-indigo-400" />
      {text && <p className="text-sm font-medium">{text}</p>}
    </div>
  );
}
