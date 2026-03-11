import { useCommunityTopics } from '@/hooks/useCommunityTopics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ExternalLink, Loader2 } from 'lucide-react';

export function CommunityTopicsPanel() {
  const { topics, isLoading } = useCommunityTopics();

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (topics.length === 0) return null;

  return (
    <div className="border-t pt-4 space-y-3">
      <h4 className="text-sm font-semibold flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[hsl(var(--warning))]" />
        Temas da Comunidade
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {topics.map(topic => (
          <div key={topic.id} className="border rounded-lg p-3 space-y-1.5 hover:bg-accent/30 transition-colors">
            <p className="text-sm font-medium">{topic.title}</p>
            {topic.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{topic.description}</p>
            )}
            {topic.url && (
              <a
                href={topic.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Acessar <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
