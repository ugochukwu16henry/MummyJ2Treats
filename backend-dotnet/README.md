# MummyJ2Treats API (.NET)

## Database (PostgreSQL)

The API uses PostgreSQL. On first run it creates the schema automatically (EnsureCreated). If you see **password authentication failed for user "postgres"**, set your real database password:

1. Copy `.env.example` to `.env` in this directory.
2. In `.env`, set `ConnectionStrings__DefaultConnection` and replace `YOUR_POSTGRES_PASSWORD` with your actual PostgreSQL password for the `postgres` user.
3. Ensure PostgreSQL is running and that the database exists (e.g. `railway` on Railway).

On **Railway**, set the variable `ConnectionStrings__DefaultConnection` (or `DATABASE_URL`) in the API service’s **Variables** tab so the app connects to Railway Postgres, not localhost.

### Login / JWT

Login and registration require a JWT signing key. If you see **"Login failed"** or **"JWT Key is not configured"** in the UI (or in logs), set in the API’s environment (e.g. Railway Variables):

- **Jwt__Key** – a long secret string (e.g. 32+ random characters). Example: `Jwt__Key=my-super-secret-key-change-in-production`

Optional: `Jwt__Issuer`, `Jwt__Audience`, `Jwt__AccessTokenMinutes`, `Jwt__RefreshTokenDays` (defaults are used if unset).

### Admin seed (optional)

To get an Admin user who can add products, set these in the API service’s **Variables** (e.g. on Railway):

- **FOUNDER_ADMIN_EMAIL** – your email (e.g. `you@example.com`)
- **ADMIN_SEED_PASSWORD** – the password for that admin account

On first startup, if no user with that email exists, one Admin user is created. Log in with that email and password, then use the dashboard to add products. Change the password after first login if you want (via profile/change-password if you add that, or leave as-is for now).

### Schema (current)

Tables created by the app: **Users**, **Categories**, **Products**, **Orders**, **OrderItems**, **Locations**, **Payments**, **Carts**, **CartItems**, **Riders**. Blog and delivery-assignment tables are not used and are excluded. For a completely fresh database, the app will create only these tables on startup.
