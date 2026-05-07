-- Migration to remove all face-related columns and data
-- This migration is safe to run multiple times

-- Step 1: Remove face_registered and face_image columns from honeydrew_users
DO $$ 
BEGIN
    -- Drop face_registered column if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='honeydrew_users' AND column_name='face_registered'
    ) THEN
        ALTER TABLE honeydrew_users DROP COLUMN face_registered;
    END IF;

    -- Drop face_image column if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='honeydrew_users' AND column_name='face_image'
    ) THEN
        ALTER TABLE honeydrew_users DROP COLUMN face_image;
    END IF;

    -- Drop face_data column if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='honeydrew_users' AND column_name='face_data'
    ) THEN
        ALTER TABLE honeydrew_users DROP COLUMN face_data;
    END IF;
END $$;

-- Step 2: Delete all face-related biometric data from user_biometrics
DELETE FROM user_biometrics WHERE biometric_type = 'face';

-- Step 3: Update the check constraint to only allow fingerprint
DO $$ 
BEGIN
    -- Drop old constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE table_name='user_biometrics' 
        AND constraint_name LIKE '%biometric_type_check%'
    ) THEN
        ALTER TABLE user_biometrics DROP CONSTRAINT IF EXISTS user_biometrics_biometric_type_check;
    END IF;

    -- Add new constraint for fingerprint only
    ALTER TABLE user_biometrics 
    ADD CONSTRAINT user_biometrics_biometric_type_check 
    CHECK (biometric_type IN ('fingerprint'));
END $$;

-- Step 4: Clean up any face-related transactions or logs
UPDATE user_transactions 
SET auth_method = 'fingerprint' 
WHERE auth_method = 'face' OR auth_method LIKE '%face%';

-- Add comment to document the change
COMMENT ON TABLE user_biometrics IS 'Stores fingerprint/passkey biometric data only. Face recognition has been removed from the system.';

-- Log the migration
INSERT INTO admin_logs (user_id, action, details)
VALUES (
    'system',
    'database_migration',
    jsonb_build_object(
        'migration', '002_remove_face_columns',
        'timestamp', NOW(),
        'description', 'Removed all face-related columns and data from the database'
    )
);
