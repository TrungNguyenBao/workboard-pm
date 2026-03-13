#!/bin/sh
set -eu

echo "== PWD =="
pwd

echo "== HOME LIST =="
ls -la /home/btrung || true

echo "== ATIN-RETAIL 9000 HITS =="
cd /home/btrung/atin-retail 2>/dev/null && grep -R -n 9000 . | head -n 80 || true

echo "== ATIN-RETAIL NGINX FILES =="
cd /home/btrung/atin-retail 2>/dev/null && find . -maxdepth 4 -type f | grep nginx | head -n 80 || true

echo "== DOCKER PS =="
docker ps || true

echo "== SS 9000 =="
ss -ltnp 2>/dev/null | grep 9000 || true

echo "== ROOT NGINX FILE SEARCH =="
find /home/btrung -maxdepth 5 -type f \( -name "*nginx*" -o -name "*.conf" \) 2>/dev/null | head -n 200 || true
