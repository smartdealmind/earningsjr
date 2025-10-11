-- Extended age-appropriate task templates
-- Migration 0010: Add comprehensive age-grouped chore templates

-- ============================================
-- 🧒 Age 3-5: "Little Helpers"
-- Focus: routine, care, participation
-- ============================================

INSERT INTO TaskTemplate (id, title, description, min_age, max_age, category, default_points, is_required_default, is_global)
VALUES
  ('tmpl-bed-3-5', 'Make your bed', 'Pull up covers and arrange pillow', 3, 5, 'room', 5, 1, 1),
  ('tmpl-toys-3-5', 'Put toys away', 'Put all toys back in their bins', 3, 5, 'room', 5, 1, 1),
  ('tmpl-set-table-3-5', 'Help set the table', 'Put out napkins and utensils', 3, 5, 'kitchen', 5, 0, 1),
  ('tmpl-feed-pet-3-5', 'Feed the pet', 'Help pour food with supervision', 3, 5, 'pets', 10, 0, 1),
  ('tmpl-water-plant-3-5', 'Water a plant', 'Water your assigned plant', 3, 5, 'home', 5, 0, 1),
  ('tmpl-wipe-table-3-5', 'Wipe low table', 'Clean your small table after snack', 3, 5, 'home', 5, 1, 1);

-- ============================================
-- 👧 Age 6-8: "Junior Doers"
-- Focus: responsibility, repetition
-- ============================================

INSERT INTO TaskTemplate (id, title, description, min_age, max_age, category, default_points, is_required_default, is_global)
VALUES
  ('tmpl-brush-teeth-6-8', 'Brush teeth morning & night', 'Brush for 2 minutes, twice daily', 6, 8, 'self-care', 5, 1, 1),
  ('tmpl-pack-bag-6-8', 'Pack school bag', 'Pack homework, lunch, and supplies', 6, 8, 'self-care', 10, 1, 1),
  ('tmpl-laundry-basket-6-8', 'Put laundry in basket', 'Collect dirty clothes and bring to laundry room', 6, 8, 'home', 10, 1, 1),
  ('tmpl-fold-clothes-6-8', 'Fold small clothes', 'Fold your socks, underwear, and towels', 6, 8, 'home', 10, 0, 1),
  ('tmpl-feed-pet-6-8', 'Feed pet and check water', 'Fill food bowl and check water level', 6, 8, 'pets', 10, 0, 1),
  ('tmpl-clean-desk-6-8', 'Clean your desk / play area', 'Organize desk and tidy play space', 6, 8, 'room', 15, 0, 1);

-- ============================================
-- 🧑 Age 9-11: "Growing Independence"
-- Focus: time management, care for surroundings
-- ============================================

INSERT INTO TaskTemplate (id, title, description, min_age, max_age, category, default_points, is_required_default, is_global)
VALUES
  ('tmpl-breakfast-9-11', 'Make breakfast / snack', 'Prepare simple meal independently', 9, 11, 'kitchen', 15, 0, 1),
  ('tmpl-vacuum-9-11', 'Vacuum or sweep small area', 'Clean your room or assigned area', 9, 11, 'home', 15, 0, 1),
  ('tmpl-trash-9-11', 'Empty small trash cans', 'Empty bedroom and bathroom trash', 9, 11, 'home', 10, 1, 1),
  ('tmpl-dishwasher-9-11', 'Load/unload dishwasher', 'Help with dishes after meals', 9, 11, 'kitchen', 15, 0, 1),
  ('tmpl-read-9-11', 'Read for 15 minutes', 'Daily reading time', 9, 11, 'learning', 10, 1, 1),
  ('tmpl-help-sibling-9-11', 'Help younger sibling', 'Assist with homework or play', 9, 11, 'family', 15, 0, 1);

-- ============================================
-- 🧑‍🎓 Age 12-14: "Responsible Teens"
-- Focus: ownership, initiative
-- ============================================

INSERT INTO TaskTemplate (id, title, description, min_age, max_age, category, default_points, is_required_default, is_global)
VALUES
  ('tmpl-cook-meal-12-14', 'Cook a simple meal', 'Prepare dinner for the family', 12, 14, 'kitchen', 25, 0, 1),
  ('tmpl-wash-dishes-12-14', 'Wash dishes after dinner', 'Clean and dry all dinner dishes', 12, 14, 'kitchen', 20, 1, 1),
  ('tmpl-vacuum-room-12-14', 'Vacuum / mop room', 'Deep clean your bedroom', 12, 14, 'room', 20, 0, 1),
  ('tmpl-grocery-list-12-14', 'Plan grocery list', 'Help plan meals and write shopping list', 12, 14, 'home', 25, 0, 1),
  ('tmpl-take-trash-12-14', 'Take out trash / recycling', 'Take bins to curb and bring back', 12, 14, 'home', 20, 1, 1),
  ('tmpl-tutor-12-14', 'Tutor younger sibling', 'Help with homework or school project', 12, 14, 'family', 25, 0, 1);

-- ============================================
-- 🧔 Age 15-17: "Life Skills Builders"
-- Focus: real-world prep
-- ============================================

INSERT INTO TaskTemplate (id, title, description, min_age, max_age, category, default_points, is_required_default, is_global)
VALUES
  ('tmpl-laundry-15-17', 'Wash and fold your laundry', 'Complete laundry cycle independently', 15, 17, 'self-care', 25, 1, 1),
  ('tmpl-mow-lawn-15-17', 'Mow the lawn', 'Mow entire yard safely', 15, 17, 'yard', 30, 0, 1),
  ('tmpl-cook-dinner-15-17', 'Help cook dinner for family', 'Plan, shop, and prepare family meal', 15, 17, 'kitchen', 25, 0, 1),
  ('tmpl-babysit-15-17', 'Babysit younger sibling', 'Watch sibling while parents are out', 15, 17, 'family', 30, 0, 1),
  ('tmpl-budget-15-17', 'Budget pocket money', 'Track spending and plan savings', 15, 17, 'learning', 20, 1, 1),
  ('tmpl-deep-clean-15-17', 'Deep-clean bedroom', 'Organize closet, clean under bed, dust everything', 15, 17, 'room', 30, 0, 1);

-- ============================================
-- Additional useful templates (all ages)
-- ============================================

INSERT INTO TaskTemplate (id, title, description, min_age, max_age, category, default_points, is_required_default, is_global)
VALUES
  ('tmpl-homework', 'Complete homework', 'Finish all school assignments', 6, 17, 'learning', 15, 1, 1),
  ('tmpl-practice-instrument', 'Practice instrument', 'Practice music for 20 minutes', 6, 17, 'learning', 15, 0, 1),
  ('tmpl-exercise', 'Exercise or sports', '30 minutes of physical activity', 8, 17, 'self-care', 15, 0, 1),
  ('tmpl-garden', 'Help in garden', 'Weed, plant, or water garden', 8, 17, 'yard', 20, 0, 1),
  ('tmpl-car-wash', 'Wash the car', 'Clean family car inside and out', 10, 17, 'home', 25, 0, 1),
  ('tmpl-meal-plan', 'Plan weekly meals', 'Create meal plan for the week', 12, 17, 'kitchen', 30, 0, 1);

