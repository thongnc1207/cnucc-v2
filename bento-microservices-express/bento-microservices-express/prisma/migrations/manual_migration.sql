-- First, create a temporary column
ALTER TABLE posts ADD COLUMN image_json JSON NULL;

-- Convert existing image strings to JSON arrays
UPDATE posts 
SET image_json = 
  CASE 
    WHEN image IS NULL THEN NULL
    WHEN image = '' THEN JSON_ARRAY()
    ELSE JSON_ARRAY(image)
  END;

-- Drop the old column
ALTER TABLE posts DROP COLUMN image;

-- Rename the new column
ALTER TABLE posts RENAME COLUMN image_json TO image;