#!/bin/bash
# =========================================================================
# 🚀 KNIFE POS LINUX DEPLOYMENT SCRIPT (deploy.sh)
# =========================================================================
set -e

REMOTE_DIR="/var/www/petpooja"

echo '🧹 Stopping old PM2 server instance if running...'
pm2 delete petpooja-server || true
pm2 save || true

# 1. MongoDB Installation & Startup check
if ! command -v mongod &> /dev/null; then
    echo '🍃 Installing MongoDB Community Server 7.0...'
    sudo apt-get update
    sudo apt-get install -y gnupg curl
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg --yes
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    sudo apt-get update
    sudo apt-get install -y mongodb-org
    sudo systemctl daemon-reload
    sudo systemctl start mongod
    sudo systemctl enable mongod
    echo '🍃 MongoDB installed and started successfully!'
else
    echo '🍃 MongoDB is already installed. Ensuring service status...'
    sudo systemctl start mongod || true
    sudo systemctl enable mongod || true
fi

echo '🧹 Cleaning target folder...'
sudo rm -rf $REMOTE_DIR
sudo mkdir -p $REMOTE_DIR
sudo chown -R ubuntu:ubuntu $REMOTE_DIR

echo '📦 Extracting files...'
if ! command -v unzip &> /dev/null; then
    sudo apt-get update && sudo apt-get install -y unzip
fi
unzip -o /home/ubuntu/petpooja-deploy.zip -d $REMOTE_DIR || true
sudo chown -R ubuntu:ubuntu $REMOTE_DIR
rm -f /home/ubuntu/petpooja-deploy.zip

echo '🛠️ Installing backend dependencies...'
cd $REMOTE_DIR/backend
npm install --production

echo '🚀 Starting Backend API Server via PM2...'
pm2 delete petpooja-server || true
pm2 start server.js --name "petpooja-server"
pm2 save

echo '🌐 Configuring Nginx reverse proxy routing on port 80...'
sudo tee /etc/nginx/sites-available/petpooja.conf > /dev/null <<'NGINX'
server {
    listen 80;
    server_name _;

    # Frontend static files routing
    location / {
        root /var/www/petpooja/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.io connection proxy
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/petpooja.conf /etc/nginx/sites-enabled/
sudo systemctl restart nginx

echo '✅ Remote deployment complete!'
