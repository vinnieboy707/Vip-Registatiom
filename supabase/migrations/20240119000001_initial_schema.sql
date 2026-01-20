-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE registration_status AS ENUM ('active', 'inactive', 'expired', 'suspended');
CREATE TYPE registration_type AS ENUM ('new', 'renewal', 'transfer');
CREATE TYPE transfer_type AS ENUM ('standard', 'out_of_state', 'family');
CREATE TYPE transfer_status AS ENUM ('pending', 'approved', 'completed', 'rejected');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE user_role AS ENUM ('admin', 'agent', 'customer');

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role DEFAULT 'agent' NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- Create vehicles table
CREATE TABLE public.vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vin TEXT UNIQUE NOT NULL,
    license_plate TEXT,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    color TEXT,
    body_type TEXT,
    engine_type TEXT,
    current_owner_id UUID REFERENCES public.profiles(id),
    current_owner_name TEXT,
    current_owner_address TEXT,
    registration_status registration_status DEFAULT 'inactive',
    registration_expiry DATE,
    is_stolen BOOLEAN DEFAULT FALSE,
    nhtsa_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_vin CHECK (LENGTH(vin) = 17)
);

-- Create registration_records table
CREATE TABLE public.registration_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.profiles(id),
    registration_type registration_type NOT NULL,
    registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL,
    base_fee DECIMAL(10,2) NOT NULL,
    transfer_fee DECIMAL(10,2) DEFAULT 0,
    taxes DECIMAL(10,2) DEFAULT 0,
    total_fee DECIMAL(10,2) NOT NULL,
    payment_status payment_status DEFAULT 'pending',
    payment_method TEXT,
    transaction_id TEXT,
    location_filed TEXT,
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create title_transfers table
CREATE TABLE public.title_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    transfer_type transfer_type NOT NULL,
    from_owner TEXT NOT NULL,
    to_owner TEXT NOT NULL,
    to_owner_id UUID REFERENCES public.profiles(id),
    from_state TEXT,
    to_state TEXT,
    transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
    transfer_fee DECIMAL(10,2) NOT NULL,
    is_family_transfer BOOLEAN DEFAULT FALSE,
    status transfer_status DEFAULT 'pending',
    agent_id UUID REFERENCES public.profiles(id),
    documents JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ownership_history table
CREATE TABLE public.ownership_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES public.profiles(id),
    owner_name TEXT NOT NULL,
    owner_address TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    transfer_id UUID REFERENCES public.title_transfers(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create fees table
CREATE TABLE public.fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fee_type TEXT UNIQUE NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    state TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    effective_date DATE DEFAULT CURRENT_DATE,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create webhooks table
CREATE TABLE public.webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    url TEXT NOT NULL,
    secret TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    retry_count INTEGER DEFAULT 0,
    last_triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create webhook_logs table
CREATE TABLE public.webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id UUID REFERENCES public.webhooks(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    response_status INTEGER,
    response_body TEXT,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_vehicles_vin ON public.vehicles(vin);
CREATE INDEX idx_vehicles_license_plate ON public.vehicles(license_plate);
CREATE INDEX idx_vehicles_owner ON public.vehicles(current_owner_id);
CREATE INDEX idx_vehicles_status ON public.vehicles(registration_status);
CREATE INDEX idx_registration_vehicle ON public.registration_records(vehicle_id);
CREATE INDEX idx_registration_agent ON public.registration_records(agent_id);
CREATE INDEX idx_registration_date ON public.registration_records(registration_date);
CREATE INDEX idx_transfers_vehicle ON public.title_transfers(vehicle_id);
CREATE INDEX idx_transfers_status ON public.title_transfers(status);
CREATE INDEX idx_ownership_vehicle ON public.ownership_history(vehicle_id);
CREATE INDEX idx_audit_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_resource ON public.audit_logs(resource, resource_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registration_records_updated_at BEFORE UPDATE ON public.registration_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_title_transfers_updated_at BEFORE UPDATE ON public.title_transfers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fees_updated_at BEFORE UPDATE ON public.fees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.title_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ownership_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Agents and admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'agent')
        )
    );

-- RLS Policies for vehicles
CREATE POLICY "Anyone authenticated can view vehicles" ON public.vehicles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Agents and admins can insert vehicles" ON public.vehicles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'agent')
        )
    );

CREATE POLICY "Agents and admins can update vehicles" ON public.vehicles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'agent')
        )
    );

-- RLS Policies for registration_records
CREATE POLICY "Anyone authenticated can view registration records" ON public.registration_records
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Agents and admins can insert registration records" ON public.registration_records
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'agent')
        )
    );

-- RLS Policies for title_transfers
CREATE POLICY "Anyone authenticated can view title transfers" ON public.title_transfers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Agents and admins can insert title transfers" ON public.title_transfers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'agent')
        )
    );

CREATE POLICY "Admins can update title transfer status" ON public.title_transfers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for fees
CREATE POLICY "Anyone authenticated can view fees" ON public.fees
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can modify fees" ON public.fees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
    p_user_id UUID,
    p_action TEXT,
    p_resource TEXT,
    p_resource_id UUID,
    p_details JSONB,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.audit_logs (
        user_id, action, resource, resource_id, details, ip_address, user_agent
    ) VALUES (
        p_user_id, p_action, p_resource, p_resource_id, p_details, p_ip_address, p_user_agent
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to trigger webhooks
CREATE OR REPLACE FUNCTION trigger_webhooks(p_event_type TEXT, p_payload JSONB)
RETURNS void AS $$
DECLARE
    webhook_record RECORD;
BEGIN
    FOR webhook_record IN 
        SELECT * FROM public.webhooks 
        WHERE event_type = p_event_type AND is_active = TRUE
    LOOP
        -- Log webhook trigger (actual HTTP call handled by edge function)
        INSERT INTO public.webhook_logs (webhook_id, event_type, payload)
        VALUES (webhook_record.id, p_event_type, p_payload);
        
        UPDATE public.webhooks 
        SET last_triggered_at = NOW()
        WHERE id = webhook_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for vehicle updates to trigger webhooks
CREATE OR REPLACE FUNCTION on_vehicle_update()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM trigger_webhooks('vehicle.updated', row_to_json(NEW)::jsonb);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vehicle_update_webhook AFTER UPDATE ON public.vehicles
    FOR EACH ROW EXECUTE FUNCTION on_vehicle_update();

-- Create trigger for registration created
CREATE OR REPLACE FUNCTION on_registration_created()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM trigger_webhooks('registration.created', row_to_json(NEW)::jsonb);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER registration_created_webhook AFTER INSERT ON public.registration_records
    FOR EACH ROW EXECUTE FUNCTION on_registration_created();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
