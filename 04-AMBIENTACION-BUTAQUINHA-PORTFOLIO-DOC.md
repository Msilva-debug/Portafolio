# Ambientación de Windows para butaquinha-portfolio-doc

## Objetivo

Preparar Windows para consumir la skill:

```text
butaquinha-portfolio-doc
```

Esta skill analiza un repositorio local y genera documentación profesional de portafolio en:

```text
.portfolio/
```

No debe modificar código fuente de la aplicación.

---

# 1. Usar WSL 2 como ambiente recomendado

Ejecutar Codex desde WSL permite usar rutas Linux y comandos de análisis de forma consistente.

Entrar a WSL:

```powershell
wsl
```

Entrar al proyecto:

```bash
cd /mnt/c/Users/TU_USUARIO/Proyectos/mi-proyecto
```

---

# 2. Validar herramientas base

Comprobar:

```bash
git --version
node --version
npm --version
python3 --version
```

Para proyectos web también puede ser necesario:

```bash
docker --version
```

Si el proyecto usa Playwright y ya está instalado localmente, la skill puede capturar screenshots. No se deben instalar navegadores o dependencias globales sin autorización.

---

# 3. Ubicar la skill

La skill debe existir en:

```text
~/.codex/skills/butaquinha-portfolio-doc/
```

Comprobar:

```bash
ls ~/.codex/skills/butaquinha-portfolio-doc
```

---

# 4. Estructura generada para proyecto simple

Salida esperada:

```text
.portfolio/
|-- project.json
|-- README.md
|-- public/
|   `-- project.svg
`-- screenshots/
    |-- 01-home.png
    `-- 02-feature.png
```

---

# 5. Estructura generada para proyecto compuesto

Si el proyecto tiene frontend y backend conectados:

```text
.portfolio/
|-- project.json
|-- README.md
|-- public/
|   `-- project.svg
`-- screenshots/
    |-- backend/
    |   `-- 01-api.png
    `-- frontend/
        `-- 01-dashboard.png
```

En este modo se genera un solo `.portfolio/` en el padre del proyecto.

---

# 6. Contrato de project.json

El archivo debe tener esta forma:

```json
{
  "slug": "",
  "name": "",
  "shortDescription": "",
  "description": "",
  "type": [],
  "technologies": {
    "frontend": [],
    "backend": [],
    "database": [],
    "mobile": [],
    "infrastructure": [],
    "tools": []
  },
  "features": [],
  "technicalHighlights": [],
  "architecture": "",
  "role": "",
  "repository": "",
  "screenshots": [],
  "status": "documented",
  "generatedAt": ""
}
```

Las rutas de screenshots deben ser cortas:

```text
01-home.png
backend/01-api.png
frontend/01-dashboard.png
```

No usar:

```text
.portfolio/screenshots/frontend/01-dashboard.png
C:\Users\...
https://...
```

---

# 7. Validar la salida

Cuando exista `.portfolio/`, ejecutar:

```bash
python3 ~/.codex/skills/butaquinha-portfolio-doc/scripts/validate_portfolio_output.py .
```

La validación revisa:

```text
project.json válido
estructura correcta
screenshots existentes
icono público presente
ausencia de .env
ausencia de secretos evidentes
```

---

# 8. Seguridad

Antes de compartir o subir `.portfolio/`, revisar que no contenga:

```text
.env
passwords
tokens
llaves privadas
credenciales
screenshots con datos sensibles
```
