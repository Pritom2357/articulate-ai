-- xp log
CREATE OR REPLACE FUNCTION fn_user_xp_log()
RETURNS trigger AS $$
BEGIN
    -- Only log when the XP value actually changes
    IF NEW.xp <> OLD.xp THEN
        INSERT INTO user_xp_log (user_id, amount, reason)
        VALUES (
            NEW.user_id,
            NEW.xp - OLD.xp,
            COALESCE(NEW.reason, 'XP update via trigger')
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_user_xp_log
AFTER UPDATE OF xp ON user_progress
FOR EACH ROW
EXECUTE FUNCTION fn_user_xp_log();

