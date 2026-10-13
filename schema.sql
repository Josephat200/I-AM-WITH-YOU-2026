-- ============================================================================
-- IKODI SPONSORSHIP & SCHOLARSHIP MANAGEMENT SYSTEM
-- PostgreSQL Schema for Supabase
-- ============================================================================

-- Enable pgcrypto extension for UUIDs and password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. USERS & AUTHENTICATION TABLE
-- Roles: Super Admin, Admin, Secretary, Reviewer, Sponsor, Applicant, Parent
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'Applicant / Beneficiary',
        'Parent / Guardian',
        'Sponsor / Funding Organization',
        'Reviewer / Selection Committee',
        'Secretary',
        'Admin',
        'Super Admin'
    )),
    phone VARCHAR(50),
    organization VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Pending', 'Suspended', 'Verified')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. USER SESSIONS TABLE (Login/Logout & Session Tracking)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    login_time TIMESTAMPTZ DEFAULT NOW(),
    logout_time TIMESTAMPTZ,
    ip_address VARCHAR(100),
    user_agent TEXT,
    device_label VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. AUDIT LOGS TABLE (Comprehensive activity history)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    action VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('Authentication', 'Review', 'Organization', 'Application', 'System', 'Session')),
    details JSONB DEFAULT '{}',
    ip_address VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. STUDENTS / BENEFICIARIES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    student_id_code VARCHAR(50) UNIQUE NOT NULL, -- e.g. IK-2048
    school VARCHAR(255) NOT NULL,
    grade VARCHAR(100) NOT NULL,
    county VARCHAR(100) DEFAULT 'Nairobi',
    guardian_name VARCHAR(255),
    guardian_phone VARCHAR(50),
    guardian_email VARCHAR(255),
    photo_url TEXT,
    id_card_status VARCHAR(50) DEFAULT 'Draft' CHECK (id_card_status IN ('Draft', 'Verified', 'Produced', 'Printed')),
    id_card_issued_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. STUDENT DOCUMENTS TABLE (Result slips, Certificates, Photos)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('Result slip', 'School confirmation', 'Birth certificate', 'Recommendation letter', 'Photo')),
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    verification_status VARCHAR(50) DEFAULT 'Received' CHECK (verification_status IN ('Received', 'Verified', 'Rejected')),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. SPONSOR ORGANIZATIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sponsors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_name VARCHAR(255) UNIQUE NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    website VARCHAR(255),
    verification_status VARCHAR(50) DEFAULT 'In review' CHECK (verification_status IN ('In review', 'Verified', 'Suspended')),
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. SCHOLARSHIP OPPORTUNITIES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_id UUID REFERENCES sponsors(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    sponsor_name VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    deadline DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Open' CHECK (status IN ('Open', 'Closing soon', 'Draft', 'Closed')),
    description TEXT NOT NULL,
    criteria JSONB DEFAULT '[]', -- Array of string criteria
    funded_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. SCHOLARSHIP APPLICATIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'Ready for review' CHECK (status IN ('Ready for review', 'In review', 'Completed', 'Shortlisted', 'Awarded', 'Rejected')),
    overall_score NUMERIC(5, 2) DEFAULT 0,
    recommendation VARCHAR(50) DEFAULT 'Pending' CHECK (recommendation IN ('Pending', 'Shortlist', 'Recommend', 'Do not recommend')),
    award_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (opportunity_id, student_id)
);

-- ----------------------------------------------------------------------------
-- 9. SELECTION COMMITTEE REVIEWS TABLE (Scoring Rubric)
-- Rubric: Academics (0-25), Need (0-25), Community (0-25), Readiness (0-25)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    score_academics INT CHECK (score_academics BETWEEN 0 AND 25),
    score_need INT CHECK (score_need BETWEEN 0 AND 25),
    score_community INT CHECK (score_community BETWEEN 0 AND 25),
    score_readiness INT CHECK (score_readiness BETWEEN 0 AND 25),
    total_score INT GENERATED ALWAYS AS (score_academics + score_need + score_community + score_readiness) STORED,
    recommendation VARCHAR(50) NOT NULL CHECK (recommendation IN ('Shortlist', 'Recommend', 'Pending', 'Do not recommend')),
    reviewer_notes TEXT,
    reviewed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 10. COMMUNICATIONS & MESSAGING HUB TABLE
-- Channels: In-app, Email, SMS
-- Audiences: Individual, Applicants, Parents, Selection Committee, Funded Learners
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sender_name VARCHAR(255) NOT NULL,
    audience VARCHAR(255) NOT NULL,
    recipient_id UUID REFERENCES users(id) ON DELETE SET NULL,
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('In-app', 'Email', 'SMS')),
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Delivered' CHECK (status IN ('Delivered', 'Read', 'Simulated', 'Sent')),
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- INDEXES FOR PERFORMANCE
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_sponsor_id ON opportunities(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_applications_opportunity ON applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_student ON applications(student_id);
CREATE INDEX IF NOT EXISTS idx_reviews_application ON reviews(application_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);

-- ----------------------------------------------------------------------------
-- SEED INITIAL MOCK DATA
-- ----------------------------------------------------------------------------
INSERT INTO users (id, email, password_hash, full_name, role, organization, status)
VALUES
    ('a0000001-0000-0000-0000-000000000001', 'mercy@demo.ikodi', crypt('AdminPass123!', gen_salt('bf')), 'Mercy W. Akinyi', 'Super Admin', 'IKODI Secretariat', 'Active'),
    ('a0000001-0000-0000-0000-000000000002', 'daniel@demo.ikodi', crypt('AdminPass123!', gen_salt('bf')), 'Daniel Kiplagat', 'Admin', 'IKODI Secretariat', 'Active'),
    ('a0000001-0000-0000-0000-000000000003', 'lilian@demo.ikodi', crypt('AdminPass123!', gen_salt('bf')), 'Lilian Atieno', 'Secretary', 'IKODI Secretariat', 'Active'),
    ('a0000001-0000-0000-0000-000000000004', 'nadia@demo.ikodi', crypt('AdminPass123!', gen_salt('bf')), 'Nadia Njoroge', 'Reviewer / Selection Committee', 'Kijani STEM Panel', 'Active'),
    ('a0000001-0000-0000-0000-000000000005', 'programmes@mwangaza.demo', crypt('AdminPass123!', gen_salt('bf')), 'Mwangaza Education Trust', 'Sponsor / Funding Organization', 'Mwangaza Education Trust', 'Verified'),
    ('a0000001-0000-0000-0000-000000000006', 'achieng.wanjala@demo.ikodi', crypt('AdminPass123!', gen_salt('bf')), 'Achieng O. Wanjala', 'Applicant / Beneficiary', 'Kisumu Girls High School', 'Active'),
    ('a0000001-0000-0000-0000-000000000007', 'p.wanjala@demo.ikodi', crypt('AdminPass123!', gen_salt('bf')), 'Peter Wanjala', 'Parent / Guardian', 'Family Account', 'Active')
ON CONFLICT (email) DO NOTHING;

INSERT INTO students (id, user_id, student_id_code, school, grade, county, guardian_name, guardian_phone, guardian_email, id_card_status)
VALUES (
    'b0000001-0000-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000006',
    'IK-2048',
    'Kisumu Girls High School',
    'Form 4 · STEM',
    'Kisumu',
    'Peter Wanjala',
    '+254 712 345 678',
    'p.wanjala@demo.ikodi',
    'Verified'
) ON CONFLICT (student_id_code) DO NOTHING;

INSERT INTO sponsors (id, user_id, organization_name, contact_email, contact_phone, verification_status)
VALUES (
    'c0000001-0000-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000005',
    'Mwangaza Education Trust',
    'programmes@mwangaza.demo',
    '+254 20 223 4567',
    'Verified'
) ON CONFLICT (organization_name) DO NOTHING;

INSERT INTO opportunities (id, sponsor_id, title, sponsor_name, amount, deadline, status, description, criteria, funded_count)
VALUES (
    'd0000001-0000-0000-0000-000000000001',
    'c0000001-0000-0000-0000-000000000001',
    'Kijani STEM Futures Award',
    'Mwangaza Education Trust',
    85000.00,
    '2026-07-18',
    'Open',
    'Supporting ambitious learners entering science, technology, engineering and mathematics pathways across Kenya.',
    '["STEM pathway", "KCSE mean grade B-", "Demonstrated need"]'::jsonb,
    18
) ON CONFLICT DO NOTHING;
