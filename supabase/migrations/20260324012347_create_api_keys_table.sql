/*
  # Create API Keys Storage Table

  1. New Tables
    - `user_api_keys`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `api_key` (text, encrypted)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_api_keys` table
    - Add policy for users to read their own keys
    - Add policy for users to insert their own keys
    - Add policy for users to update their own keys
    - Add policy for users to delete their own keys
*/

CREATE TABLE IF NOT EXISTS user_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own API keys"
  ON user_api_keys FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API keys"
  ON user_api_keys FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys"
  ON user_api_keys FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys"
  ON user_api_keys FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
