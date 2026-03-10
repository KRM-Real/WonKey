from unittest import TestCase

from pydantic import ValidationError

from app.core.config import Settings


class ConfigTests(TestCase):
    def test_non_dev_env_requires_real_secrets(self):
        with self.assertRaises(ValidationError) as ctx:
            Settings(
                ENV="prod",
                SUPABASE_URL="",
                SUPABASE_SERVICE_ROLE_KEY="",
                API_KEY_HMAC_SECRET="",
                ADMIN_API_KEY="",
                API_KEY_PEPPER="change-me",
            )

        self.assertIn("Missing required settings for prod", str(ctx.exception))

    def test_non_dev_env_rejects_default_pepper(self):
        with self.assertRaises(ValidationError) as ctx:
            Settings(
                ENV="staging",
                SUPABASE_URL="https://example.supabase.co",
                SUPABASE_SERVICE_ROLE_KEY="service-role-key",
                API_KEY_HMAC_SECRET="hmac-secret",
                ADMIN_API_KEY="admin-secret",
                API_KEY_PEPPER="change-me",
            )

        self.assertIn("API_KEY_PEPPER must be set to a non-default secret outside dev", str(ctx.exception))

    def test_dev_disable_org_membership_checks_requires_default_org_id(self):
        with self.assertRaises(ValidationError) as ctx:
            Settings(
                ENV="dev",
                DEV_DISABLE_ORG_MEMBERSHIP_CHECKS=True,
                DEFAULT_ORG_ID="",
            )

        self.assertIn("DEFAULT_ORG_ID is required when DEV_DISABLE_ORG_MEMBERSHIP_CHECKS=true", str(ctx.exception))

    def test_dev_override_cannot_be_enabled_outside_dev(self):
        with self.assertRaises(ValidationError) as ctx:
            Settings(
                ENV="prod",
                SUPABASE_URL="https://example.supabase.co",
                SUPABASE_SERVICE_ROLE_KEY="service-role-key",
                API_KEY_HMAC_SECRET="hmac-secret",
                ADMIN_API_KEY="admin-secret",
                API_KEY_PEPPER="pepper-secret",
                DEV_DISABLE_ORG_MEMBERSHIP_CHECKS=True,
                DEFAULT_ORG_ID="11111111-1111-1111-1111-111111111111",
            )

        self.assertIn("DEV_DISABLE_ORG_MEMBERSHIP_CHECKS can only be enabled in dev", str(ctx.exception))

    def test_dev_env_sanitizes_case_and_allows_local_defaults(self):
        settings = Settings(ENV=" DEV ")

        self.assertEqual(settings.ENV, "dev")
