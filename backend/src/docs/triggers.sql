-- PG_NOTIFY Trigger (Alerts Node.js)
CREATE OR REPLACE FUNCTION notify_js_listener() RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('new_notification', NEW.notification_id::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_js_listener
    AFTER INSERT ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION notify_js_listener();



-- Trigger for Badges
CREATE OR REPLACE FUNCTION trg_badge_notification() RETURNS TRIGGER AS $$
DECLARE
    v_title TEXT;
    v_desc TEXT;
BEGIN
    SELECT title, description INTO v_title, v_desc FROM badges WHERE badge_id = NEW.badge_id;
    
    INSERT INTO notifications (user_id, type, subject, description, metadata)
    VALUES (
        NEW.user_id, 'BADGE_UNLOCKED', 'Badge Unlocked: ' || v_title || ' 🎖️', 
        v_desc || ' (অভিনন্দন! নতুন ব্যাজ অর্জিত হয়েছে)', jsonb_build_object('badge_id', NEW.badge_id)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_badges_insert AFTER INSERT ON user_badges
    FOR EACH ROW EXECUTE FUNCTION trg_badge_notification();


-- trigger for xp logs
CREATE OR REPLACE FUNCTION trg_xp_notification() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reason = 'lesson_complete' THEN
        INSERT INTO notifications (user_id, type, subject, description, metadata)
        VALUES (
            NEW.user_id,
            'LESSON_COMPLETE',
            'Lesson Completed! 📚',
            'লেসন শেষ করে আপনি +' || NEW.amount || ' XP অর্জন করেছেন।',
            jsonb_build_object('xp', NEW.amount)
        );
    ELSIF NEW.reason = 'chapter_complete' THEN
        INSERT INTO notifications (user_id, type, subject, description, metadata)
        VALUES (
            NEW.user_id,
            'CHAPTER_COMPLETE',
            'Chapter Unlocked! 🏆',
            'চ্যাপ্টার সম্পন্ন করে আপনি +' || NEW.amount || ' XP বোনাস পেয়েছেন।',
            jsonb_build_object('xp', NEW.amount)
        );
    ELSIF NEW.reason = 'test_complete' OR NEW.reason = 'test_completed' THEN
        INSERT INTO notifications (user_id, type, subject, description, metadata)
        VALUES (
            NEW.user_id,
            'TEST_COMPLETE',
            'Speaking Evaluation Done! 🎙️',
            'উচ্চারণ পরীক্ষায় অংশ নিয়ে +' || NEW.amount || ' XP অর্জন করেছেন।',
            jsonb_build_object('xp', NEW.amount)
        );
    ELSIF NEW.reason = 'exam_evaluated' THEN
        INSERT INTO notifications (user_id, type, subject, description, metadata)
        VALUES (
            NEW.user_id,
            'EXAM_EVALUATED',
            'Exam Results Ready! 📝',
            'আপনার পরীক্ষার ফলাফল প্রস্তুত! +' || NEW.amount || ' XP অর্জন করেছেন।',
            jsonb_build_object('xp', NEW.amount)
        );
    ELSE
        INSERT INTO notifications (user_id, type, subject, description, metadata)
        VALUES (
            NEW.user_id,
            'XP_EARNED',
            'XP Gained! ⚡',
            'You earned +' || NEW.amount || ' XP for ' || REPLACE(NEW.reason, '_', ' ') || '.',
            jsonb_build_object('xp', NEW.amount, 'reason', NEW.reason)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_xp_log_insert AFTER INSERT ON user_xp_log
    FOR EACH ROW EXECUTE FUNCTION trg_xp_notification();


-- trigger for level up
CREATE OR REPLACE FUNCTION trg_progress_notification() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.level > OLD.level THEN
        INSERT INTO notifications (user_id, type, subject, description, metadata)
        VALUES (
            NEW.user_id, 
            'LEVEL_UP', 
            'Level Up! 🚀 Level ' || NEW.level, 
            'অভিনন্দন! আপনি Level ' || NEW.level || '-এ উন্নীত হয়েছেন!', 
            jsonb_build_object('newLevel', NEW.level)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_progress_update
    AFTER UPDATE OF level ON user_progress
    FOR EACH ROW EXECUTE FUNCTION trg_progress_notification();