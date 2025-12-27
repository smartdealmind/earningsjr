# How Kids Are Linked to Families in EarningsJr

## Database Relationship Structure

Kids are connected to families through **two tables**:

### 1. **FamilyMember Table** (Primary Relationship)
This is the main join table that links ANY user (parent, kid, or helper) to a family:

```sql
FamilyMember
├── id (unique identifier)
├── family_id → Family.id
├── user_id → User.id
├── role ('parent', 'kid', or 'helper')
└── created_at
```

**Example:**
```
family_id: fam_abc123
user_id: usr_ce38c236ca2a474ef006384cedc39a9e (parent)
role: 'parent'

family_id: fam_abc123
user_id: usr_c6e931b828ec5d5a7ac92105562a8101 (kid)
role: 'kid'
```

### 2. **KidProfile Table** (Kid-Specific Data)
This stores additional information about kids AND also stores `family_id` for convenience:

```sql
KidProfile
├── id (unique identifier)
├── user_id → User.id (UNIQUE, one kid profile per user)
├── family_id → Family.id (duplicates relationship for convenience)
├── display_name
├── birthdate
├── points_balance
└── created_at
```

## How to Query: Which Kids Belong to Which Family?

### Query 1: Get all kids for a specific family
```sql
SELECT 
  U.id as user_id,
  U.email,
  KP.display_name,
  KP.points_balance,
  F.name as family_name
FROM User U
JOIN FamilyMember FM ON FM.user_id = U.id
JOIN Family F ON F.id = FM.family_id
LEFT JOIN KidProfile KP ON KP.user_id = U.id
WHERE FM.family_id = 'fam_abc123'
  AND FM.role = 'kid'
  AND U.role = 'kid';
```

### Query 2: Get all family members (parents + kids) for a family
```sql
SELECT 
  U.id,
  U.email,
  U.role,
  FM.role as family_role,
  KP.display_name,
  F.name as family_name
FROM User U
JOIN FamilyMember FM ON FM.user_id = U.id
JOIN Family F ON F.id = FM.family_id
LEFT JOIN KidProfile KP ON KP.user_id = U.id
WHERE FM.family_id = 'fam_abc123'
ORDER BY U.role, KP.display_name;
```

### Query 3: Find which family a kid belongs to
```sql
SELECT 
  U.id as kid_user_id,
  U.email as kid_email,
  KP.display_name,
  F.id as family_id,
  F.name as family_name,
  FM.role as family_role
FROM User U
JOIN FamilyMember FM ON FM.user_id = U.id
JOIN Family F ON F.id = FM.family_id
LEFT JOIN KidProfile KP ON KP.user_id = U.id
WHERE U.id = 'usr_c6e931b828ec5d5a7ac92105562a8101'
  AND U.role = 'kid';
```

## Your Current Data Structure

Based on your database:

**Parent Account:**
- `usr_ce38c236ca2a474ef006384cedc39a9e` → `gbevek@gmail.com` (role: 'parent')

**Kid Accounts:**
- `usr_c6e931b828ec5d5a7ac92105562a8101` → `usr_c6e931b828ec5d5a7ac92105562a8101@kid.earningsjr.local`
- `usr_1ba283ddf3103b3fb4cd4c02240147ed` → `usr_1ba283ddf3103b3fb4cd4c02240147ed@kid.earningsjr.local`
- `usr_34661d9080d6d217fda3670158198f84` → `usr_34661d9080d6d217fda3670158198f84@kid.earningsjr.local`
- `usr_9a716f0e718d010df5a160b7a5c0de1f` → `usr_9a716f0e718d010df5a160b7a5c0de1f@kid.earningsjr.local`

**To see which family they belong to, check:**
1. `FamilyMember` table - look for rows where `user_id` matches the kid's user_id
2. `KidProfile` table - the `family_id` column shows which family

## Why Two Tables?

**FamilyMember:**
- Universal relationship table (works for parents, kids, helpers)
- Enforces one user can only be in one family (UNIQUE constraint)
- Tracks when they joined

**KidProfile:**
- Stores kid-specific data (display_name, points_balance, birthdate)
- Also stores `family_id` for convenience (faster queries)
- One-to-one with User (UNIQUE constraint on user_id)

## In Code: How It Works

When a parent creates a kid (from `/kids` endpoint):

```typescript
// 1. Create User record (role='kid')
INSERT INTO User (id, email, password_hash, role, ...)

// 2. Link to family via FamilyMember
INSERT INTO FamilyMember (id, family_id, user_id, role='kid', ...)

// 3. Create kid profile with family reference
INSERT INTO KidProfile (id, user_id, family_id, display_name, ...)
```

When querying kids for a family:

```typescript
// The getUserFamilyId() function uses FamilyMember:
SELECT family_id FROM FamilyMember WHERE user_id = ? LIMIT 1

// Kid-specific queries use KidProfile:
SELECT * FROM KidProfile WHERE family_id = ?
```

## Quick SQL to See Your Family Structure

```sql
-- See all families
SELECT * FROM Family;

-- See all family memberships
SELECT 
  FM.id,
  F.name as family_name,
  U.email,
  U.role as user_role,
  FM.role as family_role,
  KP.display_name
FROM FamilyMember FM
JOIN Family F ON F.id = FM.family_id
JOIN User U ON U.id = FM.user_id
LEFT JOIN KidProfile KP ON KP.user_id = U.id
ORDER BY F.name, U.role, KP.display_name;
```

This will show you exactly which kids belong to which families!

