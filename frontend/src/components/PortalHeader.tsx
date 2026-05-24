import { ReactNode } from 'react';
import { ArrowLeft, GraduationCap } from 'lucide-react';

type PortalHeaderProps = {
  title: string;
  subtitle?: string;
  backLabel?: string;
  onBack?: () => void;
  actions?: ReactNode;
};

const PortalHeader = ({ title, subtitle, backLabel, onBack, actions }: PortalHeaderProps) => (
  <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 shadow-lg shadow-blue-900/10">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5">
      <div className="min-w-0">
        {backLabel && onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-100 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </button>
        )}
        <div className="flex items-center gap-4 text-white">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
            <GraduationCap className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold leading-tight">{title}</h1>
            {subtitle && <p className="text-sm text-blue-100">{subtitle}</p>}
          </div>
        </div>
      </div>
      {actions && <div className="flex flex-shrink-0 flex-wrap justify-end gap-3">{actions}</div>}
    </div>
  </header>
);

export default PortalHeader;
