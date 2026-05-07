-- Add face_image column to honeydrew_users if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'honeydrew_users' AND column_name = 'face_image') THEN
        ALTER TABLE honeydrew_users ADD COLUMN face_image TEXT;
    END IF;
END $$;

-- Update the table to ensure all necessary columns exist
ALTER TABLE honeydrew_users 
ADD COLUMN IF NOT EXISTS face_registered BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fingerprint_registered BOOLEAN DEFAULT false;
