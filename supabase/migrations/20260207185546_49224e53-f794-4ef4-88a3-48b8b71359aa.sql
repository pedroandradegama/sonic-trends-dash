
-- Create doctor_preferences table for scheduling preferences, overbooking, and amenities
CREATE TABLE public.doctor_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  -- Scheduling preferences
  scheduling_profile TEXT NOT NULL DEFAULT 'combo' CHECK (scheduling_profile IN ('combo', 'rotatividade')),
  -- Overbooking policy
  overbooking_enabled BOOLEAN NOT NULL DEFAULT false,
  overbooking_percentage INTEGER CHECK (overbooking_percentage IN (10, 20, 30)),
  overbooking_time_slot TEXT CHECK (overbooking_time_slot IN ('inicio', 'meio', 'fim')),
  -- Amenities
  ambient_music BOOLEAN NOT NULL DEFAULT false,
  music_genre TEXT,
  coffee BOOLEAN NOT NULL DEFAULT false,
  tea BOOLEAN NOT NULL DEFAULT false,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.doctor_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own preferences
CREATE POLICY "Users can view their own preferences"
ON public.doctor_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
ON public.doctor_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
ON public.doctor_preferences FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences"
ON public.doctor_preferences FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for auto-updating updated_at
CREATE TRIGGER update_doctor_preferences_updated_at
BEFORE UPDATE ON public.doctor_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
