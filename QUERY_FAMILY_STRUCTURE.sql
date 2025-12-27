-- Query to see which kids belong to which families
-- Run this in your D1 database to see the family structure

-- Option 1: See all family memberships (parents + kids)
SELECT 
  F.id as family_id,
  F.name as family_name,
  U.id as user_id,
  U.email,
  U.role as user_role,
  FM.role as family_role,
  KP.display_name as kid_display_name,
  KP.points_balance
FROM FamilyMember FM
JOIN Family F ON F.id = FM.family_id
JOIN User U ON U.id = FM.user_id
LEFT JOIN KidProfile KP ON KP.user_id = U.id
ORDER BY F.name, U.role, KP.display_name;

-- Option 2: See just kids and their families
SELECT 
  U.id as kid_user_id,
  U.email as kid_email,
  KP.display_name,
  F.id as family_id,
  F.name as family_name,
  KP.points_balance
FROM User U
JOIN KidProfile KP ON KP.user_id = U.id
JOIN Family F ON F.id = KP.family_id
WHERE U.role = 'kid'
ORDER BY F.name, KP.display_name;

-- Option 3: See all kids for a specific parent's family
-- Replace 'YOUR_PARENT_USER_ID' with your actual parent user ID
SELECT 
  KP.display_name,
  U.email as kid_email,
  KP.points_balance,
  F.name as family_name
FROM User U
JOIN KidProfile KP ON KP.user_id = U.id
JOIN Family F ON F.id = KP.family_id
JOIN FamilyMember FM ON FM.family_id = F.id
WHERE FM.user_id = 'usr_ce38c236ca2a474ef006384cedc39a9e'  -- Your parent user ID
  AND U.role = 'kid'
ORDER BY KP.display_name;
