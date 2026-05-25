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
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          {backLabel && onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-100 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </button>
          )}
          <div className="flex items-center gap-3 text-white">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 sm:h-12 sm:w-12">
              <GraduationCap className="h-5 w-5 sm:h-7 sm:w-7" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold leading-tight sm:text-2xl">{title}</h1>
              {subtitle && <p className="hidden text-sm text-blue-100 sm:block">{subtitle}</p>}
            </div>
          </div>
        </div>
        {actions && <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">{actions}</div>}
      </div>
    </div>
  </header>
);

export default PortalHeader;
