-- Create policy to allow read access to Dashboard table
CREATE POLICY "Allow public read access to Dashboard" 
ON public."Dashboard"
FOR SELECT 
USING (true);