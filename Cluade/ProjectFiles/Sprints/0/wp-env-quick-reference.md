# wp-env Quick Reference Card
## WordPress Booking Plugin Development

**Last Updated:** January 27, 2026  
**wp-env Version:** 10.37.0

---

## Common Commands (npm scripts)

### Start/Stop Environment
```bash
# Start wp-env Docker containers
npm run wp-env:start

# Stop containers (keeps data)
npm run wp-env:stop

# Restart (destroy + start - fresh environment)
npm run wp-env:restart

# Completely remove environment
npm run wp-env:destroy
```

**Note:** Always have Docker Desktop running before using wp-env commands.

---

## Access URLs

| Environment | URL | Credentials |
|-------------|-----|-------------|
| **Development Site** | http://localhost:8888 | admin / password |
| **Test Site** | http://localhost:8889 | admin / password |
| **Admin Dashboard** | http://localhost:8888/wp-admin | admin / password |

---

## Testing Commands

### Run All PHPUnit Tests
```bash
npm test
```

This runs:
```bash
wp-env run tests-cli --env-cwd=wp-content/plugins/booking-system vendor/bin/phpunit
```

### Run Specific Test File
```bash
wp-env run tests-cli --env-cwd=wp-content/plugins/booking-system vendor/bin/phpunit tests/test-booking.php
```

### Run Test with Code Coverage (HTML report)
```bash
wp-env run tests-cli --env-cwd=wp-content/plugins/booking-system vendor/bin/phpunit --coverage-html coverage/
```

Then open `coverage/index.html` in browser.

---

## Database Commands

### Access MySQL CLI
```bash
wp-env run tests-cli wp db cli
```

Then run SQL commands:
```sql
SHOW TABLES;
DESCRIBE wp_booking_appointments;
SELECT * FROM wp_booking_appointments;
```

### Export Database
```bash
wp-env run tests-cli wp db export backup.sql
```

### Import Database
```bash
wp-env run tests-cli wp db import backup.sql
```

### Reset Database (Dangerous!)
```bash
wp-env run tests-cli wp db reset --yes
```

---

## Debugging Commands

### View wp-env Logs
```bash
wp-env logs
```

### Access Container Shell
```bash
wp-env run tests-cli bash
```

Once inside container:
```bash
# View WordPress files
ls -la /var/www/html/

# View plugin files
ls -la /var/www/html/wp-content/plugins/booking-system/

# View logs
cat /var/www/html/wp-content/uploads/booking-system-logs/error.log
```

Exit container: `exit`

---

## Configuration

### .wp-env.json Location