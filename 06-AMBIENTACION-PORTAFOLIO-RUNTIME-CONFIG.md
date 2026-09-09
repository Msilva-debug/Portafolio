# Ambientación de configuración runtime del portafolio

## Objetivo

Configurar variables `.env` para que el frontend Angular pueda consumir proyectos y URLs de aplicaciones desplegadas sin recompilar código TypeScript.

Este flujo separa dos tipos de enlaces:

```text
Repositorios GitHub   Salen del campo repository dentro de cada project.json.
Apps desplegadas      Salen del .env del portafolio, una URL por proyecto.
```

No se deben mezclar. El `.env` no reemplaza el campo `repository`; solo agrega enlaces públicos a las aplicaciones alojadas.

El archivo generado es:

```text
Portafolio/public/portfolio-config.json
```

Este archivo no se sube a Git porque se genera en cada ambiente.

---

# 1. Variables base

En `Portafolio/.env` definir:

```env
PORTFOLIO_PROJECTS_BASE_URL=https://portafolio.butaquinha.online
PORTFOLIO_PROJECT_SLUGS=nutrisnap,pokedex
```

Significado:

```text
PORTFOLIO_PROJECTS_BASE_URL  URL base donde viven los project.json.
PORTFOLIO_PROJECT_SLUGS      Lista de carpetas/proyectos separados por coma.
```

Ejemplo de consumo:

```text
https://portafolio.butaquinha.online/nutrisnap/project.json
https://portafolio.butaquinha.online/pokedex/project.json
```

---

# 2. URL de la aplicación desplegada

Cada proyecto debe tener una sola URL pública de aplicación:

```env
PORTFOLIO_APP_URL_NUTRISNAP=https://nutrisnap.butaquinha.online
PORTFOLIO_APP_URL_POKEDEX=https://pokedex.butaquinha.online
```

Esto pinta un botón de aplicación que abre la app publicada, no el repositorio.

El sufijo debe coincidir con el slug en mayúscula:

```text
nutrisnap -> NUTRISNAP
api-pokemon -> API_POKEMON
```

---

# 3. Repositorios separados

Los repositorios no se declaran en el `.env`. Siguen saliendo del `project.json`, por ejemplo:

```json
{
  "repository": "Backend: https://github.com/Msilva-debug/NutriSnap-Backend.git; Frontend: https://github.com/Msilva-debug/NutriSnap-Frontend.git"
}
```

---

# 4. Generar configuración en local

Desde `Portafolio/`:

```bash
npm run generate:portfolio-config
```

También se ejecuta automáticamente antes de:

```bash
npm start
npm run build
npm run watch
npm test
```

---

# 5. Resultado esperado

Ejemplo de `portfolio-config.json`:

```json
{
  "projectsBaseUrl": "https://portafolio.butaquinha.online",
  "projectSlugs": ["nutrisnap", "pokedex"],
  "projectApplications": {
    "nutrisnap": [
      {
        "label": "Aplicación",
        "url": "https://nutrisnap.butaquinha.online"
      }
    ],
    "pokedex": [
      {
        "label": "Aplicación",
        "url": "https://pokedex.butaquinha.online"
      }
    ]
  }
}
```

---

# 6. Funcionamiento en Docker

En Docker, el archivo se genera al iniciar el contenedor mediante:

```text
docker-entrypoint.d/40-portfolio-config.sh
```

Si cambias variables en el `.env` del servidor, reinicia el contenedor para regenerar:

```bash
docker compose up -d --force-recreate
```

No necesitas reconstruir la imagen si solo cambian URLs runtime.

---

# 7. Seguridad

No guardar secretos en estas variables.

Estas URLs quedan expuestas al navegador, por eso solo deben contener información pública:

```text
URLs públicas
slugs públicos
dominios públicos
```
