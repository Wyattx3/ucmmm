-- UC ERA Database Schema for Supabase (PostgreSQL)
-- Myanmar Cultural Registration System

-- Users table (main collection)
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    member_id VARCHAR(7) UNIQUE NOT NULL,
    
    -- Names
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100) DEFAULT '',
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(300) NOT NULL,
    
    -- Contact Information
    email VARCHAR(255) UNIQUE,
    phone_number VARCHAR(20),
    country_code VARCHAR(10) DEFAULT '+95',
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP,
    
    -- Personal Information
    date_of_birth DATE,
    gender VARCHAR(20),
    
    -- Location & Cultural Data
    citizenships TEXT, -- JSON array stored as text
    living_city VARCHAR(100),
    
    -- Authentication
    passcode VARCHAR(255), -- Base64 encoded
    
    -- Registration Progress
    registration_step INTEGER DEFAULT 1,
    registration_started_at TIMESTAMP DEFAULT NOW(),
    registration_completed BOOLEAN DEFAULT FALSE,
    registration_completed_at TIMESTAMP,
    account_status VARCHAR(20) DEFAULT 'pending',
    
    -- Member Card Data
    has_member_card BOOLEAN DEFAULT FALSE,
    member_card_completed_at TIMESTAMP,
    relationship_status VARCHAR(50),
    favorite_food TEXT,
    favorite_artist TEXT,
    love_language VARCHAR(100),
    
    -- Photos (stored as base64 or URLs)
    public_photo TEXT, -- Base64 for member card display
    public_photo_url TEXT, -- Cloud storage URL
    private_photo_id VARCHAR(100),
    private_photo_url TEXT,
    private_photo_size INTEGER,
    
    -- Presence/Status
    is_online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- OTP Codes table
CREATE TABLE otp_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    purpose VARCHAR(50) DEFAULT 'email-verification',
    is_used BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    expires_at TIMESTAMP,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Messages table (for chat system)
CREATE TABLE messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- text, image, file
    
    -- Image/File data
    image_url TEXT,
    image_size INTEGER,
    file_name VARCHAR(255),
    
    -- Message Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_member_id ON users(member_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone_number, country_code);
CREATE INDEX idx_users_registration_step ON users(registration_step);
CREATE INDEX idx_users_account_status ON users(account_status);
CREATE INDEX idx_users_is_online ON users(is_online);

CREATE INDEX idx_otp_codes_user_id ON otp_codes(user_id);
CREATE INDEX idx_otp_codes_email ON otp_codes(email);
CREATE INDEX idx_otp_codes_is_used ON otp_codes(is_used);
CREATE INDEX idx_otp_codes_expires_at ON otp_codes(expires_at);

CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_is_read ON messages(is_read);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Basic policies (can be adjusted based on requirements)
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Anyone can insert users" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can manage own OTP codes" ON otp_codes
    FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can read messages they sent or received" ON messages
    FOR SELECT USING (
        auth.uid()::text = sender_id::text OR 
        auth.uid()::text = receiver_id::text
    );

CREATE POLICY "Users can insert messages they send" ON messages
    FOR INSERT WITH CHECK (auth.uid()::text = sender_id::text);

CREATE POLICY "Users can update messages they received (read status)" ON messages
    FOR UPDATE USING (auth.uid()::text = receiver_id::text);

