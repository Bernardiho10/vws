-- Drop indexes
DROP INDEX IF EXISTS idx_org_members_org_id;
DROP INDEX IF EXISTS idx_org_members_user_id;
DROP INDEX IF EXISTS idx_api_keys_org_id;
DROP INDEX IF EXISTS idx_api_keys_key_hash;
DROP INDEX IF EXISTS idx_voting_systems_org_id;
DROP INDEX IF EXISTS idx_votes_voting_system_id;
DROP INDEX IF EXISTS idx_votes_status;
DROP INDEX IF EXISTS idx_vote_responses_vote_id;
DROP INDEX IF EXISTS idx_vote_responses_user_id;

-- Drop tables in correct order to handle dependencies
DROP TABLE IF EXISTS white_label_settings;
DROP TABLE IF EXISTS vote_responses;
DROP TABLE IF EXISTS votes;
DROP TABLE IF EXISTS voting_systems;
DROP TABLE IF EXISTS api_keys;
DROP TABLE IF EXISTS organization_members;
DROP TABLE IF EXISTS organizations;

-- Drop enum types
DROP TYPE IF EXISTS organization_role;
DROP TYPE IF EXISTS voting_type;
DROP TYPE IF EXISTS api_key_scope; 