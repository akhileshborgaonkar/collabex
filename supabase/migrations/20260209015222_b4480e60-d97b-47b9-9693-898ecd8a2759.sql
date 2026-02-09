-- Change the default account_type to NULL so users must select it during onboarding
ALTER TABLE public.profiles ALTER COLUMN account_type DROP DEFAULT;
ALTER TABLE public.profiles ALTER COLUMN account_type SET DEFAULT NULL;