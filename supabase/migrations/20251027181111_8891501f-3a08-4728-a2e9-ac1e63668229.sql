-- Enable authenticated users to read Casuistica data
CREATE POLICY "Authenticated users can view casuistica data"
ON public."Casuistica"
FOR SELECT
USING (auth.role() = 'authenticated');