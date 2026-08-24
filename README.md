# 🤖 Minecraft Bot Manager Panel

Panel de control web moderno desarrollado en **Node.js**, **Express**, **Socket.io** y **Mineflayer** para gestionar, automatizar y controlar múltiples bots de Minecraft de manera concurrente con soporte para proxies SOCKS5 y autenticación automática.

---

## Vista Previa

### Panel Principal de inicio de conexiones
<img width="1919" height="868" alt="image" src="https://github.com/user-attachments/assets/e26ea51e-d431-42c8-bb25-907488c57ea9" />

### Chat y spam
<img width="1901" height="886" alt="image" src="https://github.com/user-attachments/assets/7d5fbce5-3e6c-4d72-9e0b-733350d0c221" />

### Gestor de proxies
<img width="1918" height="875" alt="image" src="https://github.com/user-attachments/assets/b93b83a6-82f0-4359-b391-76f3538d8975" />

### Movimiento(en desarrolo, probablemente no funcione correctamente)
<img width="1918" height="404" alt="image" src="https://github.com/user-attachments/assets/0ab25475-6d48-41d4-8a59-de87998bcba0" />



---

## Características Principales

* **Panel Web en tiempo real:** Comunicación bidireccional fluida mediante WebSockets con Socket.io.
* **Gestión Masiva de Bots:** Conexión controlada por intervalos con nombres aleatorios o prefijos personalizados.
* **Soporte Proxy SOCKS5:** Capacidad de rutear las conexiones individuales de los bots a través de listas de proxies (proxies.txt).
* **Autenticación Automática:** Detección inteligente de peticiones /register y /login en el chat del servidor para autenticar bots de forma autónoma.
* **Acciones y Spam Global:** Control de movimiento (saltar, caminar) y bucles de mensajes configurables en tiempo real.
* **Gestión de Recursos:** Aceptación automática de paquetes de recursos obligatorios solicitados por el servidor.

---

## Requisitos del Sistema

* **Node.js** (versión 18 o superior recomendada) instalado en tu equipo.

---

## Instalación y Configuración

1. Clona el repositorio:
git clone https://github.com/Riddle360/BOTspamerMINECRAFT.git
cd BOTspamerMINECRAFT

2. Instala las dependencias:
npm install

4. Inicia el servidor:
npm start

5. Abre tu navegador y accede a:
http://localhost:3000

---

## ⚠️ Advertencia Legal
*Este proyecto ha sido desarrollado exclusivamente con fines educativos, de desarrollo de software y para pruebas en servidores locales privados propios (localhost). El uso de herramientas de automatización masiva en servidores públicos sin autorización explícita infringe los Términos de Servicio de la mayoría de plataformas.*
