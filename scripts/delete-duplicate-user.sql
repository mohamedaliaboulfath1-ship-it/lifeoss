-- Delete duplicate user account (keep admin only)
-- Run in Supabase SQL Editor as postgres role

-- Verify before delete
SELECT u.id, u.email, p.display_name, p.role
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'mohamedaliaboulfath1@gmail.com';

-- Delete user account (cascade removes profile + all user data)
DELETE FROM auth.users
WHERE id = 'c18e622d-fc63-44ca-a0f3-1da16003b875';

-- Verify after delete — should show ONE row (admin)
SELECT u.id, u.email, p.display_name, p.role
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'mohamedaliabouelfath1@gmail.com';
