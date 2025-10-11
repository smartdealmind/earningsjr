PRAGMA foreign_keys = ON;
PRAGMA user_version = 2;

INSERT OR IGNORE INTO TaskTemplate (id, title, description, min_age, max_age, category, default_points, is_required_default, is_global) VALUES
  ('tmpl-bed','Make bed','Tidy your bed after waking up',4,7,'room',5,1,1),
  ('tmpl-toys','Put toys away','Put all toys back in their bins',4,7,'room',5,1,1),
  ('tmpl-pet-feed','Feed pet (supervised)','Help feed pet with an adult nearby',6,9,'pets',10,0,1),
  ('tmpl-table','Set the table','Set plates, cups, utensils for dinner',7,10,'home',10,0,1),
  ('tmpl-dishwasher','Load dishwasher','Load properly and start if allowed',9,12,'kitchen',15,0,1),
  ('tmpl-sweep','Sweep common area','Sweep living/dining area floors',9,12,'home',12,0,1),
  ('tmpl-lawn','Mow lawn','Mow small section under supervision',12,16,'yard',40,0,1),
  ('tmpl-babysit','Babysit sibling (short)','Watch sibling for a short time with parent nearby',13,17,'family',50,0,1);

