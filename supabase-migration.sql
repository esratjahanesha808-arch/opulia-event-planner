-- ==============================================================================
-- OPULIA — COMPLETE FORM INGESTION & DATA CONNECTION MIGRATION
-- Run this in your Supabase Dashboard -> SQL Editor -> Click "Run"
-- ==============================================================================

-- 1. ADD ALL INQUIRY FIELDS DIRECTLY TO THE BOOKINGS TABLE
-- Connects client identity, event specs, and vision description into the booking row
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS client_email TEXT,
ADD COLUMN IF NOT EXISTS client_phone TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS event_type TEXT,
ADD COLUMN IF NOT EXISTS event_date DATE,
ADD COLUMN IF NOT EXISTS guest_count TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. ADD CLIENT & VISION DETAILS TO EVENTS TABLE
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS client_email TEXT,
ADD COLUMN IF NOT EXISTS client_phone TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS package_interest TEXT,
ADD COLUMN IF NOT EXISTS budget_range TEXT;

-- 3. BACKFILL EXISTING RECORDS SO ALL TABLES ARE FULLY POPULATED & CONNECTED
UPDATE public.bookings b
SET 
    client_name = COALESCE(b.client_name, c.full_name),
    client_email = COALESCE(b.client_email, c.email),
    client_phone = COALESCE(b.client_phone, c.phone),
    location = COALESCE(b.location, c.city_location),
    description = COALESCE(b.description, b.vision_message),
    guest_count = COALESCE(b.guest_count, b.guest_range)
FROM public.clients c
WHERE b.client_id = c.id;

UPDATE public.bookings b
SET 
    event_type = COALESCE(b.event_type, e.event_type),
    event_date = COALESCE(b.event_date, e.event_date)
FROM public.events e
WHERE e.booking_id = b.id;

UPDATE public.events e
SET 
    client_name = COALESCE(e.client_name, c.full_name),
    client_email = COALESCE(e.client_email, c.email),
    client_phone = COALESCE(e.client_phone, c.phone),
    description = COALESCE(e.description, b.vision_message, b.description),
    package_interest = COALESCE(e.package_interest, b.package_interest),
    budget_range = COALESCE(e.budget_range, b.budget_range)
FROM public.clients c
LEFT JOIN public.bookings b ON b.id = e.booking_id
WHERE e.client_id = c.id;

-- 4. UPDATE THE SECURE INGESTION STORED PROCEDURE
-- Ensures every future submission connects Name, Email, Phone, Location, Description, Date, Budget, Package to ALL tables
CREATE OR REPLACE FUNCTION public.submit_public_inquiry(
    p_name TEXT,
    p_email TEXT,
    p_phone TEXT DEFAULT NULL,
    p_location TEXT DEFAULT NULL,
    p_event_type TEXT DEFAULT 'custom',
    p_event_date DATE DEFAULT NULL,
    p_guest_count TEXT DEFAULT NULL,
    p_package TEXT DEFAULT NULL,
    p_budget TEXT DEFAULT NULL,
    p_message TEXT DEFAULT NULL,
    p_referral TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_email TEXT;
    v_clean_name TEXT;
    v_client_id UUID;
    v_booking_id UUID;
    v_event_id UUID;
    v_serial INTEGER;
    v_payload JSONB;
BEGIN
    -- Input sanitization
    v_clean_email := LOWER(TRIM(p_email));
    v_clean_name := TRIM(p_name);

    IF v_clean_email IS NULL OR v_clean_email = '' OR v_clean_email NOT LIKE '%_@__%.__%' THEN
        RAISE EXCEPTION 'Invalid email address provided';
    END IF;

    IF v_clean_name IS NULL OR v_clean_name = '' THEN
        RAISE EXCEPTION 'Name is required';
    END IF;

    -- Build complete JSON payload containing everything from the booking form
    v_payload := jsonb_build_object(
        'name', v_clean_name,
        'email', v_clean_email,
        'phone', NULLIF(TRIM(p_phone), ''),
        'location', NULLIF(TRIM(p_location), ''),
        'event_type', COALESCE(p_event_type, 'wedding'),
        'event_date', p_event_date,
        'guest_count', NULLIF(TRIM(p_guest_count), ''),
        'package', NULLIF(TRIM(p_package), ''),
        'budget', NULLIF(TRIM(p_budget), ''),
        'message', NULLIF(TRIM(p_message), ''),
        'description', NULLIF(TRIM(p_message), ''),
        'referral', NULLIF(TRIM(p_referral), ''),
        'submitted_at', timezone('utc', now())
    );

    -- 1. Deduplication: Find or create client profile
    SELECT id INTO v_client_id FROM public.clients WHERE email = v_clean_email;

    IF v_client_id IS NULL THEN
        INSERT INTO public.clients (
            full_name, email, phone, city_location, classification, status, notes
        )
        VALUES (
            v_clean_name,
            v_clean_email,
            NULLIF(TRIM(p_phone), ''),
            NULLIF(TRIM(p_location), ''),
            'lead',
            'New',
            'Inquiry message: ' || COALESCE(p_message, 'None provided')
        )
        RETURNING id INTO v_client_id;
    ELSE
        UPDATE public.clients
        SET phone = COALESCE(NULLIF(TRIM(p_phone), ''), phone),
            city_location = COALESCE(NULLIF(TRIM(p_location), ''), city_location),
            notes = COALESCE(notes, '') || E'\n[New Inquiry ' || TO_CHAR(now(), 'YYYY-MM-DD') || ']: ' || COALESCE(p_message, 'None'),
            updated_at = timezone('utc', now())
        WHERE id = v_client_id;
    END IF;

    -- 2. Determine sequence order for this client's events
    SELECT COALESCE(MAX(serial_number), 0) + 1 INTO v_serial
    FROM public.events
    WHERE client_id = v_client_id;

    -- 3. Insert submitted inquiry details into bookings (All fields connected!)
    INSERT INTO public.bookings (
        client_id,
        client_name,
        client_email,
        client_phone,
        location,
        event_type,
        event_date,
        guest_count,
        guest_range,
        package_interest,
        budget_range,
        description,
        vision_message,
        referral_source,
        raw_payload
    )
    VALUES (
        v_client_id,
        v_clean_name,
        v_clean_email,
        NULLIF(TRIM(p_phone), ''),
        NULLIF(TRIM(p_location), ''),
        COALESCE(p_event_type, 'wedding'),
        p_event_date,
        NULLIF(TRIM(p_guest_count), ''),
        NULLIF(TRIM(p_guest_count), ''),
        NULLIF(TRIM(p_package), ''),
        NULLIF(TRIM(p_budget), ''),
        NULLIF(TRIM(p_message), ''),
        NULLIF(TRIM(p_message), ''),
        NULLIF(TRIM(p_referral), ''),
        v_payload
    )
    RETURNING id INTO v_booking_id;

    -- 4. Create initial Event record attached to this booking (All fields connected!)
    INSERT INTO public.events (
        client_id,
        booking_id,
        client_name,
        client_email,
        client_phone,
        event_name,
        serial_number,
        event_type,
        event_date,
        venue_location,
        description,
        package_interest,
        budget_range,
        status
    )
    VALUES (
        v_client_id,
        v_booking_id,
        v_clean_name,
        v_clean_email,
        NULLIF(TRIM(p_phone), ''),
        COALESCE(INITCAP(p_event_type), 'Celebration') || ' — ' || v_clean_name,
        v_serial,
        COALESCE(p_event_type, 'wedding'),
        p_event_date,
        NULLIF(TRIM(p_location), ''),
        NULLIF(TRIM(p_message), ''),
        NULLIF(TRIM(p_package), ''),
        NULLIF(TRIM(p_budget), ''),
        'planning'
    )
    RETURNING id INTO v_event_id;

    -- 5. Automatically schedule consultation entry in calendar with complete inquiry info
    INSERT INTO public.calendar_entries (
        client_id,
        event_id,
        title,
        entry_type,
        start_time,
        end_time,
        notes
    )
    VALUES (
        v_client_id,
        v_event_id,
        'Consultation: ' || v_clean_name,
        'consultation',
        CASE 
            WHEN p_event_date IS NOT NULL THEN ((p_event_date + TIME '11:00:00') AT TIME ZONE 'UTC')
            ELSE (timezone('utc', now()) + INTERVAL '1 day')
        END,
        CASE 
            WHEN p_event_date IS NOT NULL THEN ((p_event_date + TIME '12:00:00') AT TIME ZONE 'UTC')
            ELSE (timezone('utc', now()) + INTERVAL '1 day 1 hour')
        END,
        'Client: ' || v_clean_name || ' (' || v_clean_email || ')' ||
        E'\nPhone: ' || COALESCE(NULLIF(TRIM(p_phone), ''), 'Not provided') ||
        E'\nLocation: ' || COALESCE(NULLIF(TRIM(p_location), ''), 'Not provided') ||
        E'\nEvent: ' || COALESCE(INITCAP(p_event_type), 'Wedding') ||
        E'\nDate: ' || COALESCE(p_event_date::TEXT, 'To be decided') ||
        E'\nGuests: ' || COALESCE(NULLIF(TRIM(p_guest_count), ''), 'Not specified') ||
        E'\nPackage: ' || COALESCE(NULLIF(TRIM(p_package), ''), 'Bespoke') ||
        E'\nBudget: ' || COALESCE(NULLIF(TRIM(p_budget), ''), 'Flexible') ||
        E'\nDescription: ' || COALESCE(NULLIF(TRIM(p_message), ''), 'None provided')
    );

    RETURN jsonb_build_object(
        'success', true,
        'client_id', v_client_id,
        'booking_id', v_booking_id,
        'event_id', v_event_id,
        'serial_number', v_serial
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_public_inquiry TO anon;
GRANT EXECUTE ON FUNCTION public.submit_public_inquiry TO authenticated;

-- 5. CREATE A UNIFIED ALL-IN-ONE VIEW FOR VIEWING COMPLETE INQUIRIES DIRECTLY
CREATE OR REPLACE VIEW public.all_inquiries AS
SELECT 
    b.id AS booking_id,
    b.created_at AS submitted_at,
    c.id AS client_id,
    c.full_name AS client_name,
    c.email AS client_email,
    c.phone AS client_phone,
    c.city_location AS location,
    b.event_type,
    b.event_date,
    b.guest_count,
    b.package_interest AS package,
    b.budget_range AS budget,
    b.description,
    b.vision_message,
    b.referral_source,
    b.raw_payload,
    e.id AS event_id,
    e.event_name,
    e.serial_number,
    e.status AS event_status,
    c.status AS client_status,
    c.classification
FROM public.bookings b
JOIN public.clients c ON b.client_id = c.id
LEFT JOIN public.events e ON e.booking_id = b.id
ORDER BY b.created_at DESC;

GRANT SELECT ON public.all_inquiries TO authenticated;

