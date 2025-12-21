-- Enable Row Level Security for Exames table
ALTER TABLE public."Exames" ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to view exams
-- The doctor sees all exams (not just their own) because they need to find 
-- patients who had USG with them and later had RM/TC with any doctor
CREATE POLICY "Authenticated users can view all exams" 
ON public."Exames" 
FOR SELECT 
USING (auth.role() = 'authenticated');