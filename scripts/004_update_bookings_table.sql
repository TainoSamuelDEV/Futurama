-- Add customer fields to bookings table and make user_id optional
ALTER TABLE bookings 
ADD COLUMN customer_name TEXT,
ADD COLUMN customer_phone TEXT;

-- Make user_id optional for guest bookings
ALTER TABLE bookings ALTER COLUMN user_id DROP NOT NULL;

-- Update RLS policy to allow guest bookings
DROP POLICY IF EXISTS "Users can create their own bookings" ON bookings;

CREATE POLICY "Anyone can create bookings" ON bookings
  FOR INSERT 
  WITH CHECK (true);

-- Keep existing policies for viewing/updating bookings
CREATE POLICY "Users can view their own bookings" ON bookings
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" ON bookings
  FOR UPDATE 
  USING (auth.uid() = user_id);
