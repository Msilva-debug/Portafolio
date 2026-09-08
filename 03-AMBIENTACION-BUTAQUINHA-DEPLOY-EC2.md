# Ambientación de Windows para butaquinha-deploy-ec2

## Objetivo

Preparar Windows para consumir la skill:

```text
butaquinha-deploy-ec2
```

Esta skill despliega un proyecto Dockerizado a AWS EC2.

Flujo:

```text
WSL / Windows
   |
   | docker build
   |
   v
Imagen Docker local
   |
   | SSH + gzip
   |
   v
AWS EC2
   |
   | docker compose up -d
   v
Contenedor actualizado
```

No usa:

```text
ECR
Docker Hub
S3
git push
```

---

# 1. Usar WSL 2 como ambiente recomendado

La skill usa Bash, SSH, Docker y rutas Linux. Por eso se recomienda ejecutar Codex desde WSL.

Entrar a WSL:

```powershell
wsl
```

Entrar al proyecto:

```bash
cd /mnt/c/Users/TU_USUARIO/Proyectos/portfolio
```

---

# 2. Validar herramientas locales

Dentro de WSL comprobar:

```bash
docker --version
docker compose version
ssh -V
gzip --version
yq --version
```

`yq` debe ser versión 4.

Docker Desktop debe tener integración activa con la distribución WSL usada.

---

# 3. Ubicar la skill

La skill debe existir en:

```text
~/.codex/skills/butaquinha-deploy-ec2/
```

Comprobar:

```bash
ls ~/.codex/skills/butaquinha-deploy-ec2
```

---

# 4. Configurar SSH hacia EC2

Crear o editar:

```text
~/.ssh/config
```

Agregar:

```text
Host butaquinha
    HostName EC2_IP_O_ELASTIC_IP
    User ubuntu
    IdentityFile ~/.ssh/butaquinha.pem
```

Probar:

```bash
ssh butaquinha
```

Salir:

```bash
exit
```

---

# 5. Preparar el proyecto local

El repositorio debe tener:

```text
.deploy/project.yml
Dockerfile
```

Ejemplo:

```yaml
project: portfolio
```

El valor `project` debe existir en:

```text
~/.codex/deployments/butaquinha/deployments.yml
```

---

# 6. Preparar el registro global

Ejemplo:

```yaml
version: 1

defaults:
  ssh_host: butaquinha
  image_tag: latest
  build_context: .
  dockerfile: Dockerfile
  compose_file: docker-compose.yml
  health_attempts: 15
  health_interval_seconds: 2

projects:
  portfolio:
    image: butaquinha-portfolio
    remote_dir: /opt/butaquinha/portfolio
    compose_service: portfolio
    health_url: http://127.0.0.1:8081
```

---

# 7. Preparar EC2

En EC2 debe existir:

```text
/opt/butaquinha/<project>/docker-compose.yml
```

El servicio definido en `compose_service` debe existir dentro del Compose.

Si el contenedor requiere variables runtime, crear:

```text
/opt/butaquinha/<project>/.env
```

El `docker-compose.yml` remoto puede referenciarlo con:

```yaml
env_file:
  - .env
```

---

# 8. Validar antes de desplegar

Desde la raíz del repo:

```bash
~/.codex/skills/butaquinha-deploy-ec2/scripts/validate.sh
```

Este comando revisa:

```text
YAML
Docker local
SSH
Docker Compose remoto
Servicio remoto
Directorio remoto
Health check
Espacio visible en disco
```

---

# 9. Desplegar

Cuando la validación pase:

```bash
~/.codex/skills/butaquinha-deploy-ec2/scripts/deploy.sh
```

El script:

```text
1. Construye la imagen local.
2. La comprime.
3. La envía por SSH.
4. La carga en Docker dentro de EC2.
5. Recrea el servicio con Docker Compose.
6. Ejecuta health check.
7. Hace rollback si el health check falla.
```

---

# 10. Assets runtime para frontends

La skill incluye assets reutilizables en:

```text
~/.codex/skills/butaquinha-deploy-ec2/assets/docker-entrypoint.d/
```

Ejemplos:

```text
40-portfolio-config.sh
40-runtime-config.sh
```

Si el `Dockerfile` referencia uno de estos scripts y no existe en el repo, la skill puede inyectarlo en un contexto temporal de build sin ensuciar el código fuente.
