#!/bin/bash

# ClassFlow Azure Setup Helper

echo "----------------------------------------------------------------"
echo "ClassFlow Azure Connection Setup"
echo "----------------------------------------------------------------"

# 1. Download SSL Certificate
echo "Step 1: Downloading Azure SSL Certificate..."
CERT_DIR="backend/config/certs"
mkdir -p "$CERT_DIR"
curl -s -o "$CERT_DIR/DigiCertGlobalRootG2.crt.pem" https://dl.cacerts.digicert.com/DigiCertGlobalRootG2.crt.pem

if [ -f "$CERT_DIR/DigiCertGlobalRootG2.crt.pem" ]; then
    echo "✅ SSL Certificate downloaded to $CERT_DIR/DigiCertGlobalRootG2.crt.pem"
else
    echo "❌ Failed to download SSL Certificate."
    exit 1
fi

# 2. Collect Credentials
echo ""
echo "Step 2: Enter your Azure Database Details"
echo "(Find these in the Azure Portal > Your MySQL Resource > Overview)"
echo ""

read -p "Server Name (Host): " DB_HOST
read -p "Admin Username: " DB_USER
read -s -p "Password: " DB_PASS
echo ""
read -p "Database Name (default: classflow_db): " DB_NAME
DB_NAME=${DB_NAME:-classflow_db}

# 3. Create .env file for Backend
echo ""
echo "Step 3: configuring environment..."
ENV_FILE="backend/.env"

# Create/Overwrite .env
cat > "$ENV_FILE" <<EOL
DB_HOST=$DB_HOST
DB_USER=$DB_USER
DB_PASS=$DB_PASS
DB_NAME=$DB_NAME
DB_PORT=3306
DB_SSL=true
DB_SSL_CA=$(pwd)/$CERT_DIR/DigiCertGlobalRootG2.crt.pem
EOL

echo "✅ Created $ENV_FILE with your credentials."

# 4. Prompt to export
echo ""
echo "----------------------------------------------------------------"
echo "Setup Complete!"
echo "1. Ensure you added your Client IP in Azure Portal > Networking."
echo "2. Run the following command to load these settings:"
echo "   export \$(cat backend/.env | xargs)"
echo "   Then restart your backend script."
echo "----------------------------------------------------------------"
