#!/bin/bash

set -e

echo "=========================================="
echo "  ProtoHub 部署脚本"
echo "=========================================="

PROJECT_DIR="/opt/protohub"
NGINX_CONF="/etc/nginx/sites-available/protohub"
NGINX_LINK="/etc/nginx/sites-enabled/protohub"

echo ""
echo "[1/5] 安装依赖"
echo "------------------------------------------"

if ! command -v node &> /dev/null; then
    echo "安装 Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

if ! command -v pm2 &> /dev/null; then
    echo "安装 PM2..."
    sudo npm install -g pm2
fi

if ! command -v nginx &> /dev/null; then
    echo "安装 Nginx..."
    sudo apt-get update
    sudo apt-get install -y nginx
fi

echo ""
echo "[2/5] 创建项目目录"
echo "------------------------------------------"

sudo mkdir -p "$PROJECT_DIR"
sudo chown -R "$USER":"$USER" "$PROJECT_DIR"

echo ""
echo "[3/5] 构建前端项目"
echo "------------------------------------------"

cd "$(dirname "$0")/.."

echo "安装前端依赖..."
npm install

echo "构建前端项目..."
npm run build

echo "复制前端文件..."
sudo cp -r dist/* "$PROJECT_DIR/"

echo ""
echo "[4/5] 配置后端服务"
echo "------------------------------------------"

cd backend

echo "安装后端依赖..."
npm install

echo "编译后端代码..."
npm run build

echo "创建上传目录..."
sudo mkdir -p "$PROJECT_DIR/uploads"
sudo chown -R "$USER":"$USER" "$PROJECT_DIR/uploads"

echo ""
echo "[5/5] 配置 Nginx"
echo "------------------------------------------"

cat > "$NGINX_CONF" <<EOF
server {
    listen 80;
    server_name _;

    root $PROJECT_DIR;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /files/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
    }

    location /p/ {
        try_files \$uri \$uri/ /index.html;
    }

    client_max_body_size 500M;
}
EOF

if [ -f "$NGINX_LINK" ]; then
    sudo rm "$NGINX_LINK"
fi
sudo ln -s "$NGINX_CONF" "$NGINX_LINK"

echo "重启 Nginx..."
sudo systemctl restart nginx

echo ""
echo "=========================================="
echo "  部署完成！"
echo "=========================================="
echo ""
echo "服务启动命令："
echo "  cd $PROJECT_DIR/backend && pm2 start dist/index.js --name protohub"
echo ""
echo "访问地址："
echo "  http://<你的服务器IP>"
echo ""
echo "登录信息："
echo "  默认超级管理员: admin"
echo "  默认密码: admin123"