# Rails API foundation

See [the project README](../../README.md) for setup and [API contracts](../../docs/API.md) for the implemented/planned boundary.

Ruby 3.4.2; Rails 8.1.4; PostgreSQL. Install with Bundler, configure PostgreSQL environment variables, run `bin/rails db:prepare`, then `bin/rails server`. No dotenv loader is installed: export variables explicitly.

Only `/up` (process liveness) and `/api/v1/health` (database readiness) are implemented. Installation, AI, content-manifest, subscription and webhook business endpoints arrive in later sprints. Database migrations and constraints establish their foundation.

Checks: `RAILS_ENV=test bin/rails db:prepare`, `bin/rails test`, and `bin/rails zeitwerk:check`. Keep all credentials out of Git. Production rate-limit storage and hosting remain unconfigured.
