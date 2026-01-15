-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Admins can view all articles" ON ultrasound_articles;
DROP POLICY IF EXISTS "Authenticated users can view active articles" ON ultrasound_articles;

-- Create a PERMISSIVE policy for all authenticated users to view active articles
CREATE POLICY "Authenticated users can view active articles"
ON ultrasound_articles
FOR SELECT
TO authenticated
USING (is_active = true);

-- Create a PERMISSIVE policy for admins to view ALL articles (including inactive)
CREATE POLICY "Admins can view all articles"
ON ultrasound_articles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));