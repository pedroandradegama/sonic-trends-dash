interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  icon: string;
  trend?: number;
  onClick?: () => void;
  isSelected?: boolean;
}

export function MetricCard({ title, value, description, icon, trend, onClick, isSelected }: MetricCardProps) {
  return (
    <div 
      className={`bg-card rounded-lg border shadow-sm p-6 transition-all cursor-pointer ${
        isSelected ? 'ring-2 ring-medical-blue shadow-lg' : 'hover:shadow-md'
      } ${onClick ? 'hover:bg-accent' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl">{icon}</span>
        {trend !== undefined && (
          <span className={`text-sm font-medium ${
            trend >= 0 ? 'text-medical-success' : 'text-destructive'
          }`}>
            {trend >= 0 ? '↗' : '↘'} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-2xl font-bold text-medical-blue mb-2">{value}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
      {isSelected && (
        <div className="mt-2 text-xs text-medical-blue font-medium">
          Exibindo no gráfico
        </div>
      )}
    </div>
  );
}