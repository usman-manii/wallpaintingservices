#!/usr/bin/env bash

# Production Deployment Script
# This script deploys the application to production

set -e  # Exit on error

echo "🚀 Starting Production Deployment..."

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
else
    echo "❌ Error: .env.production file not found"
    exit 1
fi

# Backup database
echo "📦 Creating database backup..."
BACKUP_FILE="postgres-backups/backup-$(date +%Y%m%d_%H%M%S).sql"
mkdir -p postgres-backups
docker exec cms_postgres_prod pg_dump -U $POSTGRES_USER $POSTGRES_DB > $BACKUP_FILE
echo "✅ Database backed up to $BACKUP_FILE"

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Build Docker images
echo "🏗️ Building Docker images..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Stop old containers
echo "🛑 Stopping old containers..."
docker-compose -f docker-compose.prod.yml down

# Start new containers
echo "🚀 Starting new containers..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Run database migrations
echo "🗄️ Running database migrations..."
docker exec cms_backend_prod npx prisma migrate deploy

# Health check
echo "🏥 Running health checks..."
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${BACKEND_PORT:-3001}/health)
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${FRONTEND_PORT:-3000})

if [ "$BACKEND_HEALTH" == "200" ] && [ "$FRONTEND_HEALTH" == "200" ]; then
    echo "✅ Deployment successful!"
    echo "📊 Backend: http://localhost:${BACKEND_PORT:-3001}"
    echo "🌐 Frontend: http://localhost:${FRONTEND_PORT:-3000}"
else
    echo "❌ Health checks failed!"
    echo "Backend status: $BACKEND_HEALTH"
    echo "Frontend status: $FRONTEND_HEALTH"
    exit 1
fi

# Show logs
echo "📋 Showing recent logs..."
docker-compose -f docker-compose.prod.yml logs --tail=50

echo "🎉 Deployment complete!"
