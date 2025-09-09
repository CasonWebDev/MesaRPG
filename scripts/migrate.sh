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

# Extract database credentials from DATABASE_URL
# DATABASE_URL format: postgresql://user:password@host/database?host=/cloudsql/instance
DB_USER=$(echo $DATABASE_URL | sed 's|postgresql://\([^:]*\):.*|\1|')
DB_PASSWORD=$(echo $DATABASE_URL | sed 's|postgresql://[^:]*:\([^@]*\)@.*|\1|')
DB_NAME=$(echo $DATABASE_URL | sed 's|.*/\([^?]*\).*|\1|')

# Test database connection using local proxy
echo "Testing database connection..."
PGPASSWORD=$DB_PASSWORD psql -h 127.0.0.1 -p 5432 -U $DB_USER -d $DB_NAME -c "SELECT 1;" || {
  echo "Database connection failed"
  kill $CLOUD_SQL_PID
  exit 1
}

# Set DATABASE_URL to use local proxy for Prisma
export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@127.0.0.1:5432/$DB_NAME"

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Migration completed successfully!"
kill $CLOUD_SQL_PID
