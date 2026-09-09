#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
BUILD_DIR="$ROOT_DIR/dist/Portafolio/browser"

if ! command -v aws >/dev/null 2>&1; then
  echo "No encontre AWS CLI. Instala AWS CLI antes de desplegar a S3."
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "No existe $ENV_FILE. Copia .env.example como .env y completa las variables."
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-us-east-1}"
AWS_S3_REGION="${AWS_S3_REGION:-$AWS_DEFAULT_REGION}"

if [ -z "${AWS_S3_BUCKET:-}" ]; then
  echo "Falta AWS_S3_BUCKET en .env."
  exit 1
fi

cd "$ROOT_DIR"
npm run build

aws s3 sync "$BUILD_DIR" "s3://$AWS_S3_BUCKET" \
  --region "$AWS_S3_REGION" \
  --delete \
  --exclude "index.html" \
  --cache-control "public,max-age=31536000,immutable"

aws s3 cp "$BUILD_DIR/index.html" "s3://$AWS_S3_BUCKET/index.html" \
  --region "$AWS_S3_REGION" \
  --cache-control "no-cache,no-store,must-revalidate" \
  --content-type "text/html"

echo "Despliegue S3 completado en s3://$AWS_S3_BUCKET ($AWS_S3_REGION)"
