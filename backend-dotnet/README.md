# MummyJ2Treats API (.NET)

## Database (PostgreSQL)

The API uses PostgreSQL. If you see **password authentication failed for user "postgres"**, set your real database password:

1. Copy `.env.example` to `.env` in this directory.
2. In `.env`, set `ConnectionStrings__DefaultConnection` and replace `YOUR_POSTGRES_PASSWORD` with your actual PostgreSQL password for the `postgres` user.
3. Ensure PostgreSQL is running (e.g. on `localhost:5432`) and that the database `mummyj2treats` exists (or run migrations to create it).

Then run the API again.
