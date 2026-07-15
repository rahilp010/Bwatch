-- Supabase Schema for BWatch App

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Watches table
CREATE TABLE IF NOT EXISTS watches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10, 2),
  description TEXT,
  gender TEXT DEFAULT 'Men',
  strap TEXT DEFAULT 'Metal',
  type TEXT DEFAULT 'Analogue',
  color TEXT DEFAULT 'Silver',
  image TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Watch images table (for multiple images per watch)
CREATE TABLE IF NOT EXISTS watch_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  watch_id UUID REFERENCES watches(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_watches_brand ON watches(brand);
CREATE INDEX IF NOT EXISTS idx_watches_is_favorite ON watches(is_favorite);
CREATE INDEX IF NOT EXISTS idx_watch_images_watch_id ON watch_images(watch_id);

-- Enable Row Level Security
ALTER TABLE watches ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_images ENABLE ROW LEVEL SECURITY;

-- Policies for watches table
CREATE POLICY "Anyone can view watches"
  ON watches FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert watches"
  ON watches FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update watches"
  ON watches FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete watches"
  ON watches FOR DELETE
  USING (true);

-- Policies for watch_images table
CREATE POLICY "Anyone can view watch images"
  ON watch_images FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert watch images"
  ON watch_images FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can delete watch images"
  ON watch_images FOR DELETE
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_watches_updated_at
  BEFORE UPDATE ON watches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
