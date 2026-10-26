# Secret Senior Invitation (with PostgreSQL Tracking)

An interactive 3D invitation experience for seniors, equipped with PostgreSQL database tracking to see who visited and who saved/downloaded their invitation.

## Quick Start

1. **Configure Database**:
   Open [.env](file:///.env) and set your PostgreSQL connection string:
   ```env
   # Local PostgreSQL:
   DATABASE_URL=postgresql://postgres:password@localhost:5432/senior_invitation

   # OR Free Cloud PostgreSQL (e.g. Neon.tech, Supabase, Render):
   DATABASE_URL=postgresql://user:password@host/database?sslmode=require
   ```
   *(Note: If no PostgreSQL URL is configured, the server runs in fallback mode so the site still works).*

2. **Run the App**:
   ```bash
   npm run dev
   # (On Windows PowerShell if scripts are restricted: npm.cmd run dev)
   ```
   This starts both the Express PostgreSQL backend (Port 5000) and the Vite frontend simultaneously.

3. **Check Who Visited and Saved**:
   - Click the **Users icon** in the top-right corner of the invitation website.
   - View real-time visitor stats, search by name, filter by saved vs. viewed cards, and download a CSV report.

## Event Details
Edit event text in [`src/config/event.js`](file:///src/config/event.js) (date, venue, name, etc.).
