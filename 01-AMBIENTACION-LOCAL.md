# Ambientación de Windows para despliegues a AWS EC2

## Objetivo

Preparar un computador Windows desde cero para desarrollar y desplegar proyectos Dockerizados al servidor AWS EC2.

Al terminar deben estar disponibles:

```text
Git
Node.js / npm
Docker
AWS CLI
SSH
Llave privada de EC2
```

Arquitectura de despliegue:

```text
Windows
   |
   | Docker build
   |
   v
Imagen Docker
   |
   | SSH
   |
   v
AWS EC2
```

El despliegue es manual.

```text
git commit != deploy
git push   != deploy
```

Posteriormente el despliegue se ejecutará explícitamente mediante un comando como:

```text
npm run deploy:prod
```

---

# 1. Abrir PowerShell como administrador

Las instalaciones iniciales pueden realizarse desde:

```text
Windows Terminal
→ PowerShell
→ Ejecutar como administrador
```

Comprobar que `winget` esté disponible:

```powershell
winget --version
```

En instalaciones modernas de Windows normalmente viene incluido.

---

# 2. Instalar Git

```powershell
winget install --id Git.Git -e
```

Cerrar y abrir nuevamente la terminal.

Comprobar:

```powershell
git --version
```

---

# 3. Instalar Node.js

Instalar Node.js LTS:

```powershell
winget install --id OpenJS.NodeJS.LTS -e
```

Cerrar y abrir nuevamente la terminal.

Comprobar:

```powershell
node --version
npm --version
```

Node se utilizará para desarrollo local y para ejecutar comandos del proyecto como:

```powershell
npm install
npm run build
npm run deploy:prod
```

La compilación de producción también podrá realizarse dentro de Docker.

---

# 4. Instalar AWS CLI

```powershell
winget install --id Amazon.AWSCLI -e
```

Cerrar y abrir nuevamente PowerShell.

Comprobar:

```powershell
aws --version
```

---

# 5. Configurar AWS CLI

Ejecutar:

```powershell
aws configure
```

Ingresar:

```text
AWS Access Key ID:
AWS Secret Access Key:
Default region name: us-east-1
Default output format: json
```

Las credenciales quedan almacenadas para el usuario de Windows.

Comprobar que AWS reconoce correctamente la cuenta:

```powershell
aws sts get-caller-identity
```

La cuenta esperada actualmente es:

```text
055394703815
```

y el usuario utilizado para administración desde CLI corresponde a:

```text
portafolio-deploy
```

No guardar Access Keys dentro de los repositorios.

No colocar estas credenciales en:

```text
.env
Dockerfile
docker-compose.yml
GitHub
```

---

# 6. Instalar Docker Desktop

Instalar:

```powershell
winget install --id Docker.DockerDesktop -e
```

Después de la instalación:

1. Reiniciar Windows si Docker lo solicita.
2. Abrir Docker Desktop.
3. Esperar hasta que Docker Engine esté iniciado.

Comprobar desde PowerShell:

```powershell
docker --version
docker compose version
```

Probar:

```powershell
docker run --rm hello-world
```

Si aparece:

```text
Hello from Docker!
```

Docker funciona correctamente.

---

# 7. WSL 2

Docker Desktop normalmente utiliza WSL 2 como backend en Windows.

Comprobar:

```powershell
wsl --status
```

Si WSL no está instalado:

```powershell
wsl --install
```

Reiniciar Windows después de la instalación si es solicitado.

Comprobar nuevamente:

```powershell
wsl --status
```

No es necesario desarrollar dentro de WSL para utilizar Docker Desktop.

---

# 8. Preparar SSH

Windows incluye cliente SSH en versiones modernas.

Comprobar:

```powershell
ssh -V
```

Crear el directorio:

```powershell
New-Item -ItemType Directory -Force "$HOME\.ssh"
```

---

# 9. Guardar la llave privada de EC2

La llave utilizada actualmente para EC2 es:

```text
Butaquinha-key.pem
```

Moverla desde Descargas:

```powershell
Move-Item `
  "$HOME\Downloads\Butaquinha-key.pem" `
  "$HOME\.ssh\butaquinha.pem"
```

Resultado:

```text
C:\Users\TU_USUARIO\.ssh\butaquinha.pem
```

La llave `.pem` es privada.

Nunca debe almacenarse en:

```text
Git
GitHub
OneDrive público
Docker image
.env
repositorio
```

---

# 10. Configurar permisos de la llave

En Windows debemos impedir que otros usuarios tengan acceso innecesario a la llave.

Ejecutar:

```powershell
icacls "$HOME\.ssh\butaquinha.pem" /inheritance:r
```

Después:

```powershell
icacls "$HOME\.ssh\butaquinha.pem" /grant:r "$($env:USERNAME):(R)"
```

Comprobar:

```powershell
icacls "$HOME\.ssh\butaquinha.pem"
```

---

# 11. Configurar alias SSH

Crear o editar:

```text
C:\Users\TU_USUARIO\.ssh\config
```

Desde PowerShell:

```powershell
notepad "$HOME\.ssh\config"
```

Agregar:

```text
Host butaquinha
    HostName EC2_IP_O_ELASTIC_IP
    User ubuntu
    IdentityFile ~/.ssh/butaquinha.pem
```

Cuando el servidor tenga una Elastic IP, utilizar esa dirección en:

```text
HostName
```

Ejemplo:

```text
Host butaquinha
    HostName 18.XXX.XXX.XXX
    User ubuntu
    IdentityFile ~/.ssh/butaquinha.pem
```

---

# 12. Probar SSH

Ejecutar:

```powershell
ssh butaquinha
```

La primera conexión puede preguntar:

```text
Are you sure you want to continue connecting?
```

Responder:

```text
yes
```

Si funciona se mostrará una terminal similar a:

```text
ubuntu@ip-172-31-xx-xx:~$
```

Salir:

```bash
exit
```

---

# 13. Probar transferencia de archivos

Crear un archivo temporal:

```powershell
"Prueba de despliegue" | Set-Content "$env:TEMP\prueba-ec2.txt"
```

Enviar:

```powershell
scp "$env:TEMP\prueba-ec2.txt" butaquinha:/tmp/prueba-ec2.txt
```

Comprobar:

```powershell
ssh butaquinha "cat /tmp/prueba-ec2.txt"
```

Eliminarlo:

```powershell
ssh butaquinha "rm /tmp/prueba-ec2.txt"
```

Si funciona:

```text
Windows
   |
   | SSH / SCP
   |
   v
EC2
```

está correctamente configurado.

---

# 14. Clonar los proyectos

Ejemplo:

```powershell
git clone URL_DEL_REPOSITORIO
```

Entrar:

```powershell
cd proyecto
```

Instalar dependencias cuando sea necesario:

```powershell
npm ci
```

---

# 15. Probar Docker con un proyecto

Desde un proyecto que tenga `Dockerfile`:

```powershell
docker build -t proyecto:local .
```

Comprobar:

```powershell
docker images
```

Para un frontend Angular servido por Nginx:

```powershell
docker run --rm -p 8081:80 proyecto:local
```

Abrir:

```text
http://localhost:8081
```

---

# 16. Scripts `.sh` en Windows

Actualmente algunos proyectos pueden utilizar scripts como:

```text
scripts/deploy-prod.sh
```

PowerShell no ejecuta scripts Bash directamente.

Existen tres alternativas:

```text
1. Git Bash
2. WSL
3. Crear una versión PowerShell .ps1
```

Para mantener una ambientación Windows limpia, la opción recomendada será crear posteriormente:

```text
scripts/deploy-prod.ps1
```

y hacer que Windows ejecute:

```powershell
npm run deploy:prod
```

sin depender de Bash.

La lógica del despliegue será la misma independientemente del sistema operativo.

---

# 17. Archivos que nunca deben subir a Git

Como mínimo:

```gitignore
.env
.env.*
*.pem
*.key

!.env.example
```

Especialmente nunca subir:

```text
AWS Access Key
AWS Secret Access Key
EC2 .pem
contraseñas
tokens
credenciales de bases de datos
```

---

# 18. Diferencia entre las credenciales

## AWS CLI

Configuradas mediante:

```powershell
aws configure
```

Permiten ejecutar:

```text
aws ec2 ...
aws cloudfront ...
aws iam ...
aws s3 ...
```

Comprobar:

```powershell
aws sts get-caller-identity
```

---

## Llave EC2

Archivo:

```text
~/.ssh/butaquinha.pem
```

Permite:

```powershell
ssh butaquinha
scp ...
```

No es una credencial de AWS CLI.

---

## Docker

Para la arquitectura actual no se utiliza ECR.

Por lo tanto NO es necesario configurar:

```text
docker login ECR
ECR credentials
ECR repository
```

Docker se utilizará para:

```text
docker build
docker run
docker save
```

y la imagen será transferida directamente al EC2 mediante SSH.

---

# 19. Checklist de ambientación

Antes de considerar el computador listo, deben funcionar:

```powershell
git --version
```

```powershell
node --version
```

```powershell
npm --version
```

```powershell
docker --version
```

```powershell
docker compose version
```

```powershell
docker ps
```

```powershell
aws --version
```

```powershell
aws sts get-caller-identity
```

```powershell
ssh butaquinha
```

---

# 20. Resultado final

El computador queda preparado de esta manera:

```text
Windows
│
├── Git
│
├── Node.js / npm
│
├── Docker Desktop
│   └── WSL 2
│
├── AWS CLI
│   └── credenciales AWS
│
└── SSH
    ├── ~/.ssh/butaquinha.pem
    └── ~/.ssh/config
```

Y podrá realizar posteriormente el flujo:

```text
Proyecto local
      |
      v
Docker build
      |
      v
Imagen Docker
      |
      v
SSH
      |
      v
EC2
```

La configuración interna de EC2 y el procedimiento de despliegue se documentarán por separado.
