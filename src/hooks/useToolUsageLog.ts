import { supabase } from '@/integrations/supabase/client';

export async function logToolUsage(toolKey: string, payload: Record<string, unknown>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('tool_usage_log').insert([{
    user_id: user.id,
    tool_key: toolKey,
    payload: payload as any,
  }]);
}
