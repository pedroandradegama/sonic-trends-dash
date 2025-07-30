import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  description?: string;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon: Icon,
  description 
}: MetricCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive': return 'text-medical-success';
      case 'negative': return 'text-destructive';
      default: return 'text-medical-gray';
    }
  };

  return (
    <Card className="border-border bg-gradient-to-br from-card to-muted/20 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-5 w-5 text-medical-blue" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
        {change && (
          <p className={`text-xs ${getChangeColor()}`}>
            {change}
            {description && <span className="text-muted-foreground ml-1">{description}</span>}
          </p>
        )}
      </CardContent>
    </Card>
  );
}