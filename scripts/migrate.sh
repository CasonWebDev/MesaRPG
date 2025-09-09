#!/bin/bash
set -e

echo "Starting database migration process..."

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

# Test database connection
echo "Testing database connection..."
PGPASSWORD=$(echo $DATABASE_URL | sed 's|.*://.*:\(.*\)@.*|\1|') psql "$DATABASE_URL" -c "SELECT 1;" || {
  echo "Database connection failed"
  kill $CLOUD_SQL_PID
  exit 1
}

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Migration completed successfully!"
kill $CLOUD_SQL_PID
