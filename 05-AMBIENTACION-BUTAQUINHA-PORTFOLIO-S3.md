# Ambientación de Windows para butaquinha-portfolio-s3

## Objetivo

Preparar Windows para consumir la skill:

```text
butaquinha-portfolio-s3
```

Esta skill sube a AWS S3 la salida generada por:

```text
butaquinha-portfolio-doc
```

Estructura final:

```text
s3://<bucket>/<prefix>/project.json
s3://<bucket>/<prefix>/README.md
s3://<bucket>/<prefix>/public/project.svg
s3://<bucket>/<prefix>/screenshots/...
```

---

# 1. Usar WSL 2 como ambiente recomendado

La skill usa scripts Bash y Python. Se recomienda ejecutarla desde WSL.

Entrar a WSL:

```powershell
wsl
```

Entrar al proyecto:

```bash
cd /mnt/c/Users/TU_USUARIO/Proyectos/mi-proyecto
```

---

# 2. Validar herramientas

Comprobar:

```bash
aws --version
python3 --version
bash --version
```

Comprobar la identidad AWS:

```bash
aws sts get-caller-identity
```

---

# 3. Ubicar la skill

La skill debe existir en:

```text
~/.codex/skills/butaquinha-portfolio-s3/
```

Comprobar:

```bash
ls ~/.codex/skills/butaquinha-portfolio-s3
```

---

# 4. Preparar la carpeta .portfolio

El repositorio debe tener:

```text
.portfolio/project.json
.portfolio/README.md
.portfolio/public/
.portfolio/screenshots/
```

El `prefix` de S3 sale por defecto de:

```text
.portfolio/project.json -> slug
```

Si existe `AWS_S3_PREFIX`, ese valor reemplaza el `slug`.

---

# 5. Crear archivo .env

El `.env` debe estar en la raíz del repo documentado.

Variables mínimas:

```env
AWS_DEFAULT_REGION=us-east-1
AWS_S3_BUCKET=mateo-silva-portafolio
```

Variables opcionales:

```env
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_SESSION_TOKEN=
AWS_S3_REGION=us-east-2
AWS_S3_PREFIX=
AWS_S3_ACL=
AWS_S3_CACHE_CONTROL_JSON=
AWS_S3_CACHE_CONTROL_MEDIA=
AWS_S3_EXTRA_ARGS=
```

Si las credenciales ya existen con `aws configure`, AWS SSO, perfil o rol, no es obligatorio guardar access keys en `.env`.

---

# 6. Probar sin subir archivos

Ejecutar dry-run:

```bash
python3 ~/.codex/skills/butaquinha-portfolio-s3/scripts/upload_portfolio_s3.py \
  --repo . \
  --env-file .env \
  --dry-run
```

Esto valida qué archivos se subirían sin modificar S3.

---

# 7. Subir a S3

Ejecutar:

```bash
~/.codex/skills/butaquinha-portfolio-s3/scripts/upload_portfolio_s3.sh .
```

La skill debe subir únicamente:

```text
project.json
README.md
public/
screenshots referenciadas en project.json
```

---

# 8. Permisos en AWS

El usuario o perfil AWS necesita permisos para escribir en el bucket.

Si un frontend Angular consume estos archivos desde navegador, revisar:

```text
lectura pública o CloudFront
CORS del bucket
Content-Type correcto
```

---

# 9. Seguridad

No subir:

```text
.env
.env.example
credenciales
historial de terminal
llaves privadas
archivos fuera de .portfolio/
```
