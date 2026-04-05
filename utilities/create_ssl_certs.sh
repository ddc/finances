#!/usr/bin/env bash
### Finances SSL Certificate Generator
### Creates a self-signed CA and server certificate for HTTPS
###
### USAGE:
###   ./create_ssl_certs.sh
###
### The certificates will be created in the 'certs' directory
### relative to the project root.
###
### TLS SUPPORT:
### - RSA 3072-bit keys with SHA-256 signatures
###

set -euo pipefail

#############################################################################
RSA_KEY_BITS=3072
CA_KEY_BITS=4096
VALIDITY=3650
CERT_SUBJ_BASE="/C=BR/ST=SP/L=SaoPaulo/O=DDCSoftwares/OU=IT/CN="
SERVER_FILENAMES_PREFIX="finances_server"
CA_FILENAMES_PREFIX="finances_ca"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CERT_DIR="$PROJECT_DIR/certs"
#############################################################################
RED="\033[1;91m"
GREEN="\033[1;92m"
BLUE="\033[1;94m"
NC="\033[0m"
#############################################################################

# Get server IP from .env or use default
if [[ -f "$PROJECT_DIR/.env" ]]; then
    SERVER_IP=$(grep -E "^DJANGO_ALLOWED_HOSTS=" "$PROJECT_DIR/.env" | cut -d= -f2 | tr ',' '\n' | grep -E '^[0-9]+\.' | grep -v '^127\.' | head -1)
fi
SERVER_IP="${SERVER_IP:-127.0.0.1}"

FRONTEND_PORT=$(grep -E "^FRONTEND_PORT=" "$PROJECT_DIR/.env" 2>/dev/null | cut -d= -f2 || echo "8888")

echo ""
echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}Finances SSL Certificate Generator${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""
echo -e "Server IP: ${GREEN}$SERVER_IP${NC}"
echo -e "Port: ${GREEN}$FRONTEND_PORT${NC}"
echo -e "Output: ${GREEN}$CERT_DIR/${NC}"
echo ""

# Clean up existing certs
if [[ -d "$CERT_DIR" ]]; then
    echo -e "---> ${RED}Removing existing $CERT_DIR/${NC}"
    rm -rf "$CERT_DIR"
fi

mkdir -p "$CERT_DIR"

# Step 1: Generate CA private key
echo "---> [1/6] Generating CA private key"
openssl genrsa -out "$CERT_DIR/${CA_FILENAMES_PREFIX}.key" $CA_KEY_BITS 2>/dev/null

# Step 2: Create CA certificate
echo "---> [2/6] Creating CA certificate"
openssl req -new -x509 -days $VALIDITY -key "$CERT_DIR/${CA_FILENAMES_PREFIX}.key" \
    -out "$CERT_DIR/${CA_FILENAMES_PREFIX}.crt" \
    -subj "${CERT_SUBJ_BASE}Finances CA" \
    -extensions v3_ca -config <(cat <<EOF
[ req ]
distinguished_name = req_distinguished_name
x509_extensions = v3_ca

[ req_distinguished_name ]

[ v3_ca ]
basicConstraints = critical,CA:TRUE
keyUsage = critical,keyCertSign,cRLSign
subjectKeyIdentifier = hash
EOF
) 2>/dev/null

# Step 3: Generate server private key
echo "---> [3/6] Generating server private key"
openssl genrsa -out "$CERT_DIR/${SERVER_FILENAMES_PREFIX}.key" $RSA_KEY_BITS 2>/dev/null

# Step 4: Create certificate extension file with all IPs from .env
echo "---> [4/6] Creating certificate extension file"
{
    echo "[v3_req]"
    echo "authorityKeyIdentifier=keyid,issuer"
    echo "basicConstraints=CA:FALSE"
    echo "keyUsage = digitalSignature, keyEncipherment"
    echo "extendedKeyUsage = serverAuth"
    echo "subjectAltName = @alt_names"
    echo ""
    echo "[alt_names]"
    echo "DNS.1 = finances"
    echo "DNS.2 = localhost"
    echo "IP.1 = 127.0.0.1"
    # Add all IPs from DJANGO_ALLOWED_HOSTS
    IP_COUNT=2
    if [[ -f "$PROJECT_DIR/.env" ]]; then
        while IFS= read -r ip; do
            [[ "$ip" == "127.0.0.1" ]] && continue
            IP_COUNT=$((IP_COUNT + 1))
            echo "IP.$IP_COUNT = $ip"
        done < <(grep -E "^DJANGO_ALLOWED_HOSTS=" "$PROJECT_DIR/.env" | cut -d= -f2 | tr ',' '\n' | grep -E '^[0-9]+\.')
    fi
} > "$CERT_DIR/${SERVER_FILENAMES_PREFIX}.ext"

# Step 5: Generate Certificate Signing Request (CSR)
echo "---> [5/6] Creating Certificate Signing Request (CSR)"
openssl req -new -key "$CERT_DIR/${SERVER_FILENAMES_PREFIX}.key" -out "$CERT_DIR/${SERVER_FILENAMES_PREFIX}.csr" \
    -subj "${CERT_SUBJ_BASE}finances" 2>/dev/null

# Step 6: Sign the certificate with CA
echo "---> [6/6] Signing certificate with CA"
openssl x509 -req -in "$CERT_DIR/${SERVER_FILENAMES_PREFIX}.csr" \
    -CA "$CERT_DIR/${CA_FILENAMES_PREFIX}.crt" \
    -CAkey "$CERT_DIR/${CA_FILENAMES_PREFIX}.key" \
    -CAcreateserial \
    -out "$CERT_DIR/${SERVER_FILENAMES_PREFIX}.crt" \
    -days $VALIDITY \
    -sha256 \
    -extfile "$CERT_DIR/${SERVER_FILENAMES_PREFIX}.ext" \
    -extensions v3_req 2>/dev/null

# Set permissions
chmod 600 "$CERT_DIR/${CA_FILENAMES_PREFIX}.key"
chmod 644 "$CERT_DIR/${CA_FILENAMES_PREFIX}.crt"
chmod 644 "$CERT_DIR/${SERVER_FILENAMES_PREFIX}.key"
chmod 644 "$CERT_DIR/${SERVER_FILENAMES_PREFIX}.crt"

# Clean up temporary files
rm -f "$CERT_DIR/${SERVER_FILENAMES_PREFIX}.csr" "$CERT_DIR/${SERVER_FILENAMES_PREFIX}.ext" "$CERT_DIR/${CA_FILENAMES_PREFIX}.srl"

# Get certificate expiry dates
CA_EXPIRY=$(openssl x509 -in "$CERT_DIR/${CA_FILENAMES_PREFIX}.crt" -noout -enddate | sed 's/notAfter=//')
SERVER_EXPIRY=$(openssl x509 -in "$CERT_DIR/${SERVER_FILENAMES_PREFIX}.crt" -noout -enddate | sed 's/notAfter=//')

# Save certificate metadata
echo "---> Saving certificate metadata"
{
    echo "{"
    echo "  \"SERVER_IP\": \"$SERVER_IP\","
    echo "  \"FRONTEND_PORT\": \"$FRONTEND_PORT\","
    echo "  \"VALIDITY_DAYS\": \"$VALIDITY\","
    echo "  \"CA_EXPIRES\": \"$CA_EXPIRY\","
    echo "  \"SERVER_EXPIRES\": \"$SERVER_EXPIRY\""
    echo "}"
} > "$CERT_DIR/info.json"

echo ""
echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}Certificate generation complete!${NC}"
echo -e "${GREEN}=============================================${NC}"
echo ""
echo "Certificate files created in $CERT_DIR/:"
echo "  - ${CA_FILENAMES_PREFIX}.crt (CA certificate - DISTRIBUTE TO USERS)"
echo "    Expires: $CA_EXPIRY"
echo "  - ${CA_FILENAMES_PREFIX}.key (CA private key - KEEP SECURE)"
echo "  - ${SERVER_FILENAMES_PREFIX}.crt (server certificate)"
echo "    Expires: $SERVER_EXPIRY"
echo "  - ${SERVER_FILENAMES_PREFIX}.key (server private key)"
echo "  - info.json (certificate metadata)"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Import the CA certificate into your browser/OS trust store:"
echo "   - Chrome: Settings -> Privacy -> Security -> Manage Certificates -> Authorities -> Import"
echo "   - Firefox: Settings -> Privacy -> Certificates -> View Certificates -> Authorities -> Import"
echo "   - macOS: Double-click -> Add to Keychain -> Always Trust"
echo "   - Linux: sudo cp $CERT_DIR/${CA_FILENAMES_PREFIX}.crt /usr/local/share/ca-certificates/ && sudo update-ca-certificates"
echo ""
echo "2. Configure nginx to use the certificates (update frontend/nginx.conf):"
echo "   listen 443 ssl;"
echo "   ssl_certificate /etc/nginx/certs/${SERVER_FILENAMES_PREFIX}.crt;"
echo "   ssl_certificate_key /etc/nginx/certs/${SERVER_FILENAMES_PREFIX}.key;"
echo "   ssl_protocols TLSv1.3;"
echo "   ssl_prefer_server_ciphers off;"
echo ""
