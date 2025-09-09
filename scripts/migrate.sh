#!/bin/bash
set -e

echo "Starting database migration process..."
echo "Current environment variables:"
echo "DATABASE_URL length: ${#DATABASE_URL}"
echo "DATABASE_URL preview: ${DATABASE_URL:0:50}..."

# Check if DATABASE_URL is available
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set!"
  exit 1
fi

# Install required packages
apt-get update && apt-get install -y wget postgresql-client

# Download and setup Cloud SQL Proxy
wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O /usr/local/bin/cloud_sql_proxy
chmod +x /usr/local/bin/cloud_sql_proxy

echo "Starting Cloud SQL Proxy..."
/usr/local/bin/cloud_sql_proxy -instances=cason-471520:us-central1:mesarpg-db-instance=tcp:5432 &
CLOUD_SQL_PID=$!

# Wait for proxy to be ready
echo "Waiting for Cloud SQL Proxy to be ready..."
sleep 10

# Parse DATABASE_URL to extract credentials
# DATABASE_URL format: postgresql://user:password@host/database?host=/cloudsql/instance
echo "Parsing DATABASE_URL..."
echo "Full DATABASE_URL: $DATABASE_URL"

# Extract using cut command (more reliable)
DB_USER=$(echo "$DATABASE_URL" | cut -d'/' -f3 | cut -d':' -f1)
DB_PASSWORD=$(echo "$DATABASE_URL" | cut -d':' -f3 | cut -d'@' -f1)
DB_HOST=$(echo "$DATABASE_URL" | cut -d'@' -f2 | cut -d'/' -f1)
DB_NAME=$(echo "$DATABASE_URL" | cut -d'/' -f4 | cut -d'?' -f1)

echo "Extracted credentials:"
echo "User: $DB_USER"
echo "Host: $DB_HOST"
echo "Database: $DB_NAME"
echo "Password length: ${#DB_PASSWORD}"

# Test database connection using local proxy
echo "Testing database connection..."
PGPASSWORD="$DB_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" || {
  echo "Database connection failed"
  echo "Debug info:"
  echo "DATABASE_URL: $DATABASE_URL"
  echo "Command: PGPASSWORD=*** psql -h 127.0.0.1 -p 5432 -U $DB_USER -d $DB_NAME -c 'SELECT 1;'"
  kill $CLOUD_SQL_PID
  exit 1
}

# Set DATABASE_URL to use local proxy for Prisma
export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@127.0.0.1:5432/$DB_NAME"

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Migration completed successfully!"
kill $CLOUD_SQL_PID
