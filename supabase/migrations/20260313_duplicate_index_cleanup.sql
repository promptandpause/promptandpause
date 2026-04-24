DROP INDEX IF EXISTS public.admin_activity_logs_action_type_idx;
DROP INDEX IF EXISTS public.admin_activity_logs_admin_email_idx;
DROP INDEX IF EXISTS public.admin_activity_logs_created_at_idx;

DROP INDEX IF EXISTS public.email_logs_recipient_email_idx;
DROP INDEX IF EXISTS public.email_logs_status_idx;
DROP INDEX IF EXISTS public.email_logs_template_name_idx;

DROP INDEX IF EXISTS public.maintenance_windows_created_by_idx;

DROP INDEX IF EXISTS public.support_responses_created_at_idx;
DROP INDEX IF EXISTS public.support_responses_ticket_id_idx;

DROP INDEX IF EXISTS public.support_tickets_assigned_to_idx;
DROP INDEX IF EXISTS public.support_tickets_created_at_idx;
DROP INDEX IF EXISTS public.support_tickets_priority_idx;
DROP INDEX IF EXISTS public.support_tickets_status_idx;
DROP INDEX IF EXISTS public.support_tickets_user_id_idx;
