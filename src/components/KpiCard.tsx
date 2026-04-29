import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  accent?: 'cyan' | 'blue' | 'emerald' | 'amber' | 'red';
  trend?: { value: string; positive: boolean };
}

const accentMap = {
  cyan: 'from-cyan-400/20 to-cyan-400/5 text-cyan-400 border-cyan-400/20',
  blue: 'from-blue-400/20 to-blue-400/5 text-blue-400 border-blue-400/20',
  emerald: 'from-emerald-400/20 to-emerald-400/5 text-emerald-400 border-emerald-400/20',
  amber: 'from-amber-400/20 to-amber-400/5 text-amber-400 border-amber-400/20',
  red: 'from-red-400/20 to-red-400/5 text-red-400 border-red-400/20',
};

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = 'cyan',
  trend,
}: KpiCardProps) {
  return (
    <div className="card-surface rounded-xl p-5 hover-lift relative overflow-hidden">
      <div
        className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${accentMap[accent]} rounded-full blur-2xl opacity-20 -mr-8 -mt-8`}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${accentMap[accent]}`}>
            <Icon className="w-4 h-4" />
          </div>

          {trend && (
            <span
              className={`text-[11px] font-mono-tech ${
                trend.positive ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {trend.positive ? '+' : ''}
              {trend.value}
            </span>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">
          {title}
        </p>

        <p className="text-2xl font-semibold font-mono-tech tracking-tight">
          {value}
        </p>

        {subtitle && (
          <p className="text-[11px] text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}