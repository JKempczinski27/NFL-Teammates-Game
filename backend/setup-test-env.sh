#!/bin/bash
# Setup script for Railway database connection testing
# This script helps configure environment variables for testing

echo "=================================="
echo "Railway Database Test Setup"
echo "=================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "ℹ No .env file found. Creating from .env.example..."
    
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✓ Created .env file from .env.example"
    else
        echo "✗ .env.example not found"
        echo ""
        echo "Creating a basic .env file..."
        cat > .env << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database

# Server Configuration
PORT=8080

# Admin Authentication
ADMIN_API_KEY=your-secure-api-key-here
EOF
        echo "✓ Created basic .env file"
    fi
    echo ""
else
    echo "✓ .env file already exists"
    echo ""
fi

# Check if DATABASE_URL is set in .env
if grep -q "^DATABASE_URL=postgresql://" .env 2>/dev/null; then
    CURRENT_URL=$(grep "^DATABASE_URL=" .env | cut -d= -f2-)
    
    # Check if it's the default placeholder
    if [[ "$CURRENT_URL" == *"username:password@host:port"* ]]; then
        echo "⚠ DATABASE_URL in .env is using placeholder values"
        echo ""
        echo "To connect to Railway database, you need to:"
        echo "1. Go to your Railway project dashboard"
        echo "2. Click on your PostgreSQL service"
        echo "3. Go to the 'Variables' tab"
        echo "4. Copy the DATABASE_URL value"
        echo "5. Replace the DATABASE_URL value in the .env file"
        echo ""
        echo "Your Railway DATABASE_URL should look like:"
        echo "postgresql://postgres:PASSWORD@HOST.railway.app:PORT/railway"
        echo ""
        read -p "Do you want to update the DATABASE_URL now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo ""
            echo "Paste your Railway DATABASE_URL (it will be hidden):"
            read -s DB_URL
            
            if [ ! -z "$DB_URL" ]; then
                # Update the .env file
                sed -i "s|^DATABASE_URL=.*|DATABASE_URL=$DB_URL|" .env
                echo ""
                echo "✓ DATABASE_URL updated in .env file"
            else
                echo ""
                echo "✗ No URL provided, keeping existing value"
            fi
        fi
    else
        echo "✓ DATABASE_URL is configured in .env"
        # Mask the password for display
        MASKED_URL=$(echo "$CURRENT_URL" | sed -E 's/:[^:@]+@/:****@/')
        echo "  Connection: $MASKED_URL"
    fi
else
    echo "⚠ DATABASE_URL not found in .env file"
    echo ""
    read -p "Do you want to add your Railway DATABASE_URL now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "Paste your Railway DATABASE_URL (it will be hidden):"
        read -s DB_URL
        
        if [ ! -z "$DB_URL" ]; then
            echo "" >> .env
            echo "# Railway Database Connection" >> .env
            echo "DATABASE_URL=$DB_URL" >> .env
            echo ""
            echo "✓ DATABASE_URL added to .env file"
        else
            echo ""
            echo "✗ No URL provided"
        fi
    fi
fi

echo ""
echo "=================================="
echo "Setup Complete!"
echo "=================================="
echo ""
echo "To run the connection test:"
echo "  npm run test:db"
echo ""
echo "Or directly:"
echo "  node test-railway-connection.js"
echo ""
