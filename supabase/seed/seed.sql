-- Insert default fee structure
-- Note: fee_type column has UNIQUE constraint defined in migration 20240119000001_initial_schema.sql
-- ON CONFLICT clause ensures this seed can be run multiple times safely
INSERT INTO public.fees (fee_type, description, amount, state) VALUES
    ('registration_new', 'New vehicle registration', 150.00, 'CA'),
    ('registration_renewal', 'Registration renewal', 75.00, 'CA'),
    ('title_transfer_standard', 'Standard title transfer', 95.00, 'CA'),
    ('title_transfer_out_of_state', 'Out-of-state title transfer', 125.00, 'CA'),
    ('title_transfer_family', 'Family member transfer', 25.00, 'CA'),
    ('duplicate_title', 'Duplicate title', 50.00, 'CA'),
    ('plate_replacement', 'License plate replacement', 30.00, 'CA'),
    ('late_fee', 'Late registration fee', 20.00, 'CA'),
    ('penalty_fee', 'Penalty for expired registration', 50.00, 'CA'),
    ('smog_certificate', 'Smog check certificate', 45.00, 'CA')
ON CONFLICT (fee_type) DO NOTHING;

-- Insert admin user profile (requires auth.users entry first via Supabase Dashboard)
-- After creating admin user in Supabase Auth, run:
-- INSERT INTO public.profiles (id, email, full_name, role)
-- VALUES ('your-admin-uuid', 'admin@dmvreg.com', 'Admin User', 'admin');
