# NocoBase Helpdesk - Prompt & Pause

Self-hosted NocoBase instance for the helpdesk/ticketing system, replacing the old PDS Desk.

## Railway Deployment

### Option 1: Deploy from GitHub (using Dockerfile)

1. **Create a new repo** and copy `docker-compose.yml`, `Dockerfile`, and `railway.json` into it
2. OR push the `nocobase/` directory to its own branch
3. In Railway dashboard: **New Project** → **Deploy from GitHub repo**
4. Add a **PostgreSQL** plugin (Railway will provision a DB)
5. Set these environment variables in Railway:

```
APP_KEY=<generate a random 32+ char string>
DB_DIALECT=postgres
DB_HOST=<Railway PostgreSQL hostname>
DB_PORT=5432
DB_DATABASE=railway
DB_USER=<Railway PostgreSQL user>
DB_PASSWORD=<Railway PostgreSQL password>
DB_UNDERSCORED=false
```

6. Add a custom domain: `helpdesk.promptandpause.com`

### Option 2: Deploy from Docker image directly

1. Railway: **New Project** → **Deploy from Docker image**
2. Enter: `nocobase/nocobase:beta-full`
3. Add PostgreSQL plugin
4. Set the same env vars as above

### After Deployment

1. Open `https://helpdesk.promptandpause.com`
2. Complete the setup wizard (create admin account)
3. In Plugin Management, enable **Backup Manager**
4. Download the [Ticketing Solution backup](https://static-docs.nocobase.com/nocobase_tickets_v2_backup_260324.nbdata)
5. Go to System Management → Backup Manager → Restore from local backup
6. Upload the backup file

### Updating

NocoBase publishes weekly releases. To update:

1. Railway: Set the image tag to the new version
2. Or rebuild from the Dockerfile
