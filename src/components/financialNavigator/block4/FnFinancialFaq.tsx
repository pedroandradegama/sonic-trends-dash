import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, Clock, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useFnFaq, getSuggestedQuestions, FaqMessage } from '@/hooks/useFnFaq';
import { useFnProjection } from '@/hooks/useFnProjection';
import ReactMarkdown from 'react-markdown';

function MessageBubble({ message }: { message: FaqMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3 text-sm',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted text-foreground rounded-bl-md'
        )}
      >
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert [&_p]:my-1 [&_li]:my-0.5 [&_ul]:my-1">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

export function FnFinancialFaq() {
  const { messages, history, isLoading, hasProLabore, hasDistribuicao, hasGoal, ask, clearMessages } = useFnFaq();
  const { metrics } = useFnProjection();
  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = getSuggestedQuestions(
    hasProLabore,
    hasDistribuicao,
    hasGoal,
    metrics.avgMonthlyGross,
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!input.trim()) return;
    ask(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Consultor Financeiro</h3>
            <p className="text-[11px] text-muted-foreground">Baseado no seu perfil</p>
          </div>
        </div>
        {hasMessages && (
          <Button variant="ghost" size="sm" onClick={clearMessages} className="text-xs gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Nova conversa
          </Button>
        )}
      </div>

      {/* Conversation area */}
      <div className="border border-border/50 rounded-xl bg-background/50 overflow-hidden">
        {/* Messages */}
        {hasMessages ? (
          <div className="max-h-[400px] overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 text-sm flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Analisando seu perfil...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        ) : (
          /* Initial state — suggested questions */
          <div className="p-4 space-y-3">
            <p className="text-xs text-muted-foreground font-medium">Perguntas baseadas no seu perfil:</p>
            <div className="space-y-2">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => ask(q)}
                  disabled={isLoading}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-xl border border-border',
                    'text-xs text-foreground hover:bg-muted transition-colors',
                    'flex items-center gap-2',
                    isLoading && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <span className="text-muted-foreground">→</span>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border/50 p-3 flex items-end gap-2">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Faça sua pergunta financeira..."
            className="text-xs min-h-[40px] max-h-[120px] resize-none border-0 bg-transparent focus-visible:ring-0 p-0 pt-1"
            disabled={isLoading}
          />
          <Button
            size="icon"
            className="h-9 w-9 flex-shrink-0 self-end"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
          >
            {isLoading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Send className="h-4 w-4" />
            }
          </Button>
        </div>
      </div>

      {/* Quick suggestions when conversation active */}
      {hasMessages && !isLoading && (
        <div className="flex gap-2 flex-wrap">
          {suggestedQuestions.slice(0, 3).map((q, i) => (
            <button
              key={i}
              onClick={() => ask(q)}
              className="text-[10px] px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {q.length > 40 ? q.slice(0, 40) + '…' : q}
            </button>
          ))}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory(h => !h)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Clock className="h-3.5 w-3.5" />
            Perguntas anteriores ({history.length})
            {showHistory
              ? <ChevronUp className="h-3.5 w-3.5" />
              : <ChevronDown className="h-3.5 w-3.5" />
            }
          </button>

          {showHistory && (
            <div className="mt-2 space-y-2">
              {history.map(item => {
                const d = new Date(item.created_at);
                const label = `${d.getDate()}/${d.getMonth() + 1}`;
                return (
                  <div
                    key={item.id}
                    className="border border-border rounded-xl overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => ask(item.question)}
                  >
                    <div className="px-3 py-2 flex items-center justify-between">
                      <p className="text-xs font-medium text-foreground truncate flex-1">
                        {item.question}
                      </p>
                      <span className="text-[10px] text-muted-foreground ml-2 flex-shrink-0">
                        {label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[10px] text-muted-foreground text-center">
        Respostas baseadas no seu perfil cadastrado + base técnica atualizada.
        Não substitui assessoria contábil.
      </p>
    </div>
  );
}
