# MummyJ2Treats API (.NET)

## Database (PostgreSQL)

The API uses PostgreSQL. On first run it creates the schema automatically (EnsureCreated). If you see **password authentication failed for user "postgres"**, set your real database password:

1. Copy `.env.example` to `.env` in this directory.
2. In `.env`, set `ConnectionStrings__DefaultConnection` and replace `YOUR_POSTGRES_PASSWORD` with your actual PostgreSQL password for the `postgres` user.
3. Ensure PostgreSQL is running and that the database exists (e.g. `railway` on Railway).

On **Railway**, set the variable `ConnectionStrings__DefaultConnection` (or `DATABASE_URL`) in the API service’s **Variables** tab so the app connects to Railway Postgres, not localhost.

### Schema (current)

Tables created by the app: **Users**, **Categories**, **Products**, **Orders**, **OrderItems**, **Locations**, **Payments**, **Carts**, **CartItems**, **Riders**. Blog and delivery-assignment tables are not used and are excluded. For a completely fresh database, the app will create only these tables on startup.
