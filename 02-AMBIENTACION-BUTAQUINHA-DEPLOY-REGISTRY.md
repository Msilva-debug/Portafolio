# Ambientación de Windows para butaquinha-deploy-registry

## Objetivo

Preparar Windows para consumir la skill:

```text
butaquinha-deploy-registry
```

Esta skill sirve para crear o actualizar proyectos dentro del registro global de despliegues:

```text
~/.codex/deployments/butaquinha/deployments.yml
```

No despliega, no ejecuta Docker, no conecta a EC2 y no modifica código fuente.

---

# 1. Usar WSL 2 como ambiente recomendado

Aunque Windows puede ejecutar varias herramientas desde PowerShell, esta skill trabaja mejor desde WSL 2 porque usa rutas Linux como:

```text
~/.codex
/mnt/c/Users/TU_USUARIO/...
```

Entrar a Ubuntu desde PowerShell:

```powershell
wsl
```

Comprobar ubicación:

```bash
pwd
```

---

# 2. Validar herramientas base

Dentro de WSL comprobar:

```bash
yq --version
```

La versión esperada es:

```text
yq v4
```

Si no está instalado:

```bash
sudo snap install yq
```

---

# 3. Ubicar la skill

La skill debe existir en:

```text
~/.codex/skills/butaquinha-deploy-registry/
```

Comprobar:

```bash
ls ~/.codex/skills/butaquinha-deploy-registry
```

---

# 4. Crear identidad del proyecto

Cada repositorio desplegable debe tener:

```text
.deploy/project.yml
```

Ejemplo:

```yaml
project: portfolio
```

El valor `portfolio` debe coincidir con una llave dentro de:

```text
projects:
```

en `deployments.yml`.

---

# 5. Crear registro global

Crear la carpeta:

```bash
mkdir -p ~/.codex/deployments/butaquinha
```

Crear el archivo:

```text
~/.codex/deployments/butaquinha/deployments.yml
```

Base recomendada:

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

projects: {}
```

---

# 6. Registrar un proyecto

Ejemplo completo:

```yaml
projects:
  portfolio:
    image: butaquinha-portfolio
    remote_dir: /opt/butaquinha/portfolio
    compose_service: portfolio
    health_url: http://127.0.0.1:8081
```

Campos principales:

```text
image           Imagen Docker que se cargará en EC2.
remote_dir      Carpeta remota donde vive docker-compose.yml.
compose_service Servicio dentro del Compose remoto.
health_url      URL local en EC2 para validar el despliegue.
```

---

# 7. Usar rutas compatibles con WSL

Si se usa `local_path`, debe quedar como ruta Linux:

```text
/mnt/c/Users/TU_USUARIO/Proyectos/portfolio
```

No usar:

```text
C:\Users\TU_USUARIO\Proyectos\portfolio
```

---

# 8. Seguridad

No guardar secretos en `deployments.yml`.

No colocar:

```text
AWS keys
passwords
tokens
JWT secrets
DATABASE_URL
.env
```

Los secretos runtime deben vivir en EC2, normalmente en:

```text
/opt/butaquinha/<project>/.env
```
