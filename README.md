# PicklePickle-Booking-Pickleball-Court-Web-app

### 0) Prerequisites

Docker + Docker Compose v2

Git

(Khuyến nghị) Ubuntu 22.04 trên EC2

Kiểm tra:
```bash
docker --version
docker compose version
git --version
```

### 1) Clone repository
```bash
git clone https://github.com/Gay22222/PicklePickle-Booking-Pickleball-Court-Web-app.git
```
```bash
cd PicklePickle-Booking-Pickleball-Court-Web-app
```
### 2) Tạo file môi trường (.env.production)
2.1 Frontend env

Tạo file:

nano frontend/.env.production


Nội dung mẫu:
```bash
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Khi chạy qua nginx reverse proxy (recommended)
NEXT_PUBLIC_API_BASE=/api

# Google OAuth Client ID
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
```
2.2 Backend env

Tạo file:
```bash
nano backend/.env.production
```

Nội dung mẫu:
```bash
# =======================
# Server
# =======================
PORT=4000
NODE_ENV=production
API_PREFIX=/api

# =======================
# Database & Cache
# =======================
MONGO_URI=mongodb://mongo:27017/picklepickle_prod
REDIS_URL=redis://redis:6379

# =======================
# Auth / Security
# =======================
JWT_SECRET=CHANGE_ME_TO_A_STRONG_SECRET

# =======================
# CORS
# =======================
# Local test: http://localhost
# Deploy: https://your-domain.com
CORS_ORIGIN=http://localhost

# =======================
# Google OAuth
# =======================
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com

# =======================
# Email (optional)
# =======================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=YOUR_EMAIL@gmail.com
EMAIL_PASS=YOUR_APP_PASSWORD

# =======================
# Payment Sandbox (optional)
# =======================
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_REDIRECT_URL=http://localhost/payment/momo-return
MOMO_IPN_URL=http://localhost/api/payments/momo/ipn

VNPAY_TMN_CODE=YOUR_TMN_CODE
VNPAY_HASH_SECRET=YOUR_HASH_SECRET
VNPAY_PAYMENT_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost/payment/vnpay-return
VNPAY_IPN_URL=http://localhost/api/payments/vnpay/ipn
VNPAY_LOCALE=vn
VNPAY_CURRENCY=VND

ZALOPAY_APP_ID=YOUR_APP_ID
ZALOPAY_KEY1=YOUR_KEY1
ZALOPAY_KEY2=YOUR_KEY2
ZALOPAY_ENDPOINT=https://sb-openapi.zalopay.vn/v2/create
ZALOPAY_REDIRECT_URL=http://localhost/payment/zalopay-return

# =======================
# LLM Settings (required)
# =======================
LLM_BASE_URL=http://llm:8080
CHATBOT_USE_LLM=1
```

Khi deploy đổi tất cả URL localhost thành domain/IP thật.

### 3) Download LLM model (required)

Model sẽ được đặt ở thư mục ./models và mount vào container.

Tạo thư mục:
```bash
mkdir -p models
```
Download bằng wget 

```bash
wget -c -O Arcee-VyLinh.Q4_K_M.gguf   https://huggingface.co/QuantFactory/Arcee-VyLinh-GGUF/resolve/main/Arcee-VyLinh.Q4_K_M.gguf
```


Kiểm tra:
```bash
ls -lah models
```

Bạn phải thấy file .gguf nằm trong models/.

Lưu ý: Không commit model lên git (file rất lớn).


### 4) Nginx config

Tạo file:
```bash
mkdir -p nginx
nano nginx/default.conf
```

Nội dung mẫu (proxy web + api + uploads):


```bash
server {
  listen 80;
  server_name _;

  # Web (Next.js)
  location / {
    proxy_pass http://web:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # API
  location /api/ {
    proxy_pass http://api:4000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # Public uploads (served by backend)
  location /uploads/ {
    proxy_pass http://api:4000/uploads/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```
### 5) Run Production (Docker Compose)

Chạy:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Xem trạng thái:
```bash
docker compose -f docker-compose.prod.yml ps
```

Xem logs:
```bash
docker compose -f docker-compose.prod.yml logs -f --tail=100
```
### 6) Health checks / Smoke tests
6.1 Web
```bash
curl -I http://localhost/
```

6) Stop / Restart / Reset data

Stop:
```bash
docker compose -f docker-compose.prod.yml down
```

Stop + remove volumes (reset DB):
```bash
docker compose -f docker-compose.prod.yml down -v
```
