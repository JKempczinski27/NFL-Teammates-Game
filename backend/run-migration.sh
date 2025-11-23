#!/bin/bash
# Run this script to migrate your Railway database to the consolidated schema
# Usage: ./run-migration.sh

echo "🚀 Running database migration on Railway..."
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null
then
    echo "❌ Railway CLI is not installed."
    echo ""
    echo "Install it with:"
    echo "  npm install -g @railway/cli"
    echo ""
    exit 1
fi

echo "✅ Railway CLI found"
echo ""

# Run the migration
echo "📦 Running migration script..."
railway run node backend/migrate-to-single-table.js

echo ""
echo "✅ Migration complete!"
echo ""
echo "Next steps:"
echo "  1. Check the output above for migration statistics"
echo "  2. Your server is now running with the new schema"
echo "  3. Test your API endpoints to verify everything works"
echo ""
