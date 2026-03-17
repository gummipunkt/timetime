#!/bin/sh
set -e

echo "🔄 Applying database schema (prisma db push)..."
npx prisma db push

echo "🌱 Running database seed..."
npx tsx prisma/seed.ts

echo "✅ Migration and seeding complete!"
