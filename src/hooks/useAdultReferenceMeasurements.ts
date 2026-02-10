import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AdultReferenceMeasurement {
  id: string;
  category: string;
  modality: string;
  structure: string;
  parameter: string;
  normal_text: string;
  cutoff_text: string | null;
  unit: string | null;
  notes: string | null;
  source_title: string;
  source_url: string;
}

export function useAdultReferenceMeasurements() {
  const [data, setData] = useState<AdultReferenceMeasurement[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [measRes, favRes] = await Promise.all([
        supabase.from('adult_reference_measurements').select('*').order('category'),
        supabase.from('adult_reference_favorites').select('measurement_id'),
      ]);
      if (measRes.error) throw measRes.error;
      setData(measRes.data || []);
      if (!favRes.error && favRes.data) {
        setFavorites(new Set(favRes.data.map(f => f.measurement_id)));
      }
    } catch (err: any) {
      console.error('Error fetching adult references:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleFavorite = async (measurementId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (favorites.has(measurementId)) {
      await supabase
        .from('adult_reference_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('measurement_id', measurementId);
      setFavorites(prev => { const n = new Set(prev); n.delete(measurementId); return n; });
    } else {
      await supabase.from('adult_reference_favorites').insert([{
        user_id: user.id,
        measurement_id: measurementId,
      }]);
      setFavorites(prev => new Set(prev).add(measurementId));
    }
  };

  const categories = [...new Set(data.map(d => d.category))].sort();
  const modalities = [...new Set(data.map(d => d.modality))].sort();

  return { data, favorites, loading, toggleFavorite, categories, modalities };
}
