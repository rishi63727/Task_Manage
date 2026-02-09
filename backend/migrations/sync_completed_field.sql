-- One-time migration to sync completed field with status field
-- This ensures data consistency after implementing single-source-of-truth status model
-- Run this migration once during deployment

-- Update completed field based on status
UPDATE tasks
SET completed = (status = 'done');

-- Update completed_at for tasks that are done but don't have completed_at set
UPDATE tasks
SET completed_at = updated_at
WHERE status = 'done' 
  AND completed_at IS NULL;

-- Clear completed_at for tasks that are not done
UPDATE tasks
SET completed_at = NULL
WHERE status != 'done' 
  AND completed_at IS NOT NULL;

-- Verify the migration
SELECT 
    status,
    COUNT(*) as total,
    SUM(CASE WHEN completed = true THEN 1 ELSE 0 END) as completed_count,
    SUM(CASE WHEN completed_at IS NOT NULL THEN 1 ELSE 0 END) as has_completed_at
FROM tasks
WHERE is_deleted = false
GROUP BY status;
