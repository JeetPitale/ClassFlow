
import { cn } from '@/lib/utils';













export function StatCard({ title, value, description, icon: Icon, trend, className }) {
  return (
    <div className={cn('stat-card animate-fade-in', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold text-foreground">{value}</p>
          {description &&
          <p className="text-xs text-muted-foreground">{description}</p>
          }
          {trend &&
          <div className="flex items-center gap-1 mt-2">
              <span
              className={cn(
                'text-xs font-medium',
                trend.isPositive ? 'text-success' : 'text-destructive'
              )}>

                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          }
        </div>
        <div className="p-2.5 rounded-lg bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
    </div>);

}