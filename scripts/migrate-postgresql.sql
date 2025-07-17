-- SQL Migration Script for PostgreSQL
-- This script creates the complete database schema for MesaRPG
-- Compatible with Railway PostgreSQL deployment

-- Drop existing tables if they exist (be careful in production)
DROP TABLE IF EXISTS tokens CASCADE;
DROP TABLE IF EXISTS campaign_invites CASCADE;
DROP TABLE IF EXISTS files CASCADE;
DROP TABLE IF EXISTS sheet_templates CASCADE;
DROP TABLE IF EXISTS game_states CASCADE;
DROP TABLE IF EXISTS handouts CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS characters CASCADE;
DROP TABLE IF EXISTS maps CASCADE;
DROP TABLE IF EXISTS campaign_members CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create enum types
CREATE TYPE "Role" AS ENUM ('GM', 'PLAYER', 'ADMIN');
CREATE TYPE "FileCategory" AS ENUM ('MAP', 'TOKEN', 'AVATAR', 'HANDOUT', 'MISC');
CREATE TYPE "CharacterType" AS ENUM ('PC', 'NPC', 'CREATURE');
CREATE TYPE "MessageType" AS ENUM ('CHAT', 'DICE_ROLL', 'SYSTEM', 'OOC');
CREATE TYPE "TokenType" AS ENUM ('PC', 'NPC', 'CREATURE', 'CUSTOM');

-- Create users table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    password TEXT NOT NULL,
    role "Role" DEFAULT 'PLAYER' NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL
);

-- Create campaigns table
CREATE TABLE campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    rpg_system TEXT DEFAULT 'generic' NOT NULL,
    owner_id TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    player_limit INTEGER DEFAULT 8,
    settings TEXT DEFAULT '{}' NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create campaign_members table
CREATE TABLE campaign_members (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role "Role" DEFAULT 'PLAYER' NOT NULL,
    joined_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(campaign_id, user_id)
);

-- Create maps table
CREATE TABLE maps (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT false NOT NULL,
    grid_size INTEGER DEFAULT 20 NOT NULL,
    settings TEXT DEFAULT '{}' NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- Create sheet_templates table
CREATE TABLE sheet_templates (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type "CharacterType" NOT NULL,
    fields TEXT DEFAULT '[]' NOT NULL,
    is_default BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- Create characters table
CREATE TABLE characters (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    user_id TEXT,
    name TEXT NOT NULL,
    type "CharacterType" NOT NULL,
    data TEXT DEFAULT '{}' NOT NULL,
    token_data TEXT DEFAULT '{}' NOT NULL,
    template_id TEXT,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (template_id) REFERENCES sheet_templates(id) ON DELETE SET NULL
);

-- Create chat_messages table
CREATE TABLE chat_messages (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    message TEXT NOT NULL,
    type "MessageType" DEFAULT 'CHAT' NOT NULL,
    metadata TEXT DEFAULT '{}' NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create handouts table
CREATE TABLE handouts (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    attachments TEXT DEFAULT '[]' NOT NULL,
    shared_with TEXT DEFAULT '[]' NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- Create game_states table
CREATE TABLE game_states (
    id TEXT PRIMARY KEY,
    campaign_id TEXT UNIQUE NOT NULL,
    active_map_id TEXT,
    tokens TEXT DEFAULT '[]' NOT NULL,
    game_data TEXT DEFAULT '{}' NOT NULL,
    grid_config TEXT DEFAULT '{}' NOT NULL,
    fog_areas TEXT DEFAULT '[]' NOT NULL,
    map_frozen BOOLEAN DEFAULT false NOT NULL,
    frozen_by TEXT,
    frozen_at TIMESTAMP(3),
    last_activity TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- Create files table
CREATE TABLE files (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL,
    size INTEGER NOT NULL,
    category "FileCategory" DEFAULT 'MISC' NOT NULL,
    uploaded_by_id TEXT NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create campaign_invites table
CREATE TABLE campaign_invites (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    email TEXT,
    created_by_id TEXT NOT NULL,
    used_by_id TEXT,
    expires_at TIMESTAMP(3),
    used_at TIMESTAMP(3),
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (used_by_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create tokens table
CREATE TABLE tokens (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    name TEXT NOT NULL,
    x DOUBLE PRECISION NOT NULL,
    y DOUBLE PRECISION NOT NULL,
    image_url TEXT,
    size DOUBLE PRECISION DEFAULT 1 NOT NULL,
    rotation DOUBLE PRECISION DEFAULT 0 NOT NULL,
    visible BOOLEAN DEFAULT true NOT NULL,
    character_id TEXT,
    owner_id TEXT NOT NULL,
    type "TokenType" DEFAULT 'CUSTOM' NOT NULL,
    auto_created BOOLEAN DEFAULT false NOT NULL,
    sync_avatar BOOLEAN DEFAULT false NOT NULL,
    border_color TEXT DEFAULT '#6b7280' NOT NULL,
    show_name BOOLEAN DEFAULT true NOT NULL,
    show_health_bar BOOLEAN DEFAULT false NOT NULL,
    conditions TEXT DEFAULT '[]' NOT NULL,
    can_player_move BOOLEAN,
    locked BOOLEAN DEFAULT false NOT NULL,
    hidden BOOLEAN DEFAULT false NOT NULL,
    ownership_type TEXT DEFAULT 'manual' NOT NULL,
    last_sync_at TIMESTAMP(3),
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL,
    created_by TEXT NOT NULL,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE SET NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_campaigns_owner_id ON campaigns(owner_id);
CREATE INDEX idx_campaign_members_campaign_id ON campaign_members(campaign_id);
CREATE INDEX idx_campaign_members_user_id ON campaign_members(user_id);
CREATE INDEX idx_characters_campaign_id ON characters(campaign_id);
CREATE INDEX idx_characters_user_id ON characters(user_id);
CREATE INDEX idx_chat_messages_campaign_id ON chat_messages(campaign_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_tokens_campaign_id ON tokens(campaign_id);
CREATE INDEX idx_tokens_character_id ON tokens(character_id);
CREATE INDEX idx_handouts_campaign_id ON handouts(campaign_id);
CREATE INDEX idx_maps_campaign_id ON maps(campaign_id);
CREATE INDEX idx_files_campaign_id ON files(campaign_id);
CREATE INDEX idx_campaign_invites_campaign_id ON campaign_invites(campaign_id);
CREATE INDEX idx_campaign_invites_token ON campaign_invites(token);

-- Set up updated_at trigger function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_timestamp_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_campaigns BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_maps BEFORE UPDATE ON maps FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_characters BEFORE UPDATE ON characters FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_handouts BEFORE UPDATE ON handouts FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_game_states BEFORE UPDATE ON game_states FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_sheet_templates BEFORE UPDATE ON sheet_templates FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_files BEFORE UPDATE ON files FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_tokens BEFORE UPDATE ON tokens FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();