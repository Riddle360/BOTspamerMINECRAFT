const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const mineflayer = require('mineflayer');
const { SocksClient } = require('socks');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

let activeBots = [];
let spamInterval = null;
let currentSessionId = 0;
let stopSpawningFlag = false;

const defaultNames = [
    'Carlos', 'Sofia', 'Mateo', 'Lucia', 'Alejandro', 'Valeria', 'Daniel', 'Camila',
    'Lucas', 'Elena', 'Diego', 'Martina', 'Leo', 'Paula', 'Manuel', 'Alba', 'Pablo',
    'Hugo', 'Adrian', 'David', 'Mario', 'Marcos', 'Javier', 'Sara', 'Emma', 'Iker'
];

function generateBotName(prefix) {
    if (prefix && prefix.trim() !== '') {
        return `${prefix.trim()}_${Math.floor(1000 + Math.random() * 9000)}`;
    }
    const randomName = defaultNames[Math.floor(Math.random() * defaultNames.length)];
    const randomNum = Math.floor(10 + Math.random() * 90);
    return `${randomName}${randomNum}`;
}

function getProxyList() {
    const proxyPath = path.join(__dirname, 'proxies.txt');
    if (!fs.existsSync(proxyPath)) return [];
    return fs.readFileSync(proxyPath, 'utf8')
        .split('\n')
        .map(p => p.trim())
        .filter(p => p.length > 0);
}

io.on('connection', (socket) => {
    console.log('Cliente conectado al panel');

    if (fs.existsSync(path.join(__dirname, 'proxies.txt'))) {
        const proxies = fs.readFileSync(path.join(__dirname, 'proxies.txt'), 'utf8');
        socket.emit('load-proxies', proxies);
    }

    socket.on('save-proxies', (proxyData) => {
        fs.writeFile(path.join(__dirname, 'proxies.txt'), proxyData, 'utf8', (err) => {
            if (err) {
                io.emit('system-log', { text: 'Error al guardar el archivo de proxies.' });
            } else {
                io.emit('system-log', { text: 'Lista de proxies actualizada correctamente.' });
            }
        });
    });

    socket.on('start-bots', (config) => {
        const { host, port, version, count, prefix, delay, autoCracked, botPassword, useProxies } = config;
        stopSpawningFlag = false;
        currentSessionId++;
        const sessionId = currentSessionId;
        const passwordToUse = botPassword || 'Pass1234';

        const proxyList = useProxies ? getProxyList() : [];

        io.emit('system-log', { text: `Iniciando proceso para ${count} bots en ${host}:${port}...` });

        let spawned = 0;
        const interval = setInterval(() => {
            if (stopSpawningFlag || sessionId !== currentSessionId || spawned >= parseInt(count)) {
                clearInterval(interval);
                return;
            }

            const botName = generateBotName(prefix);
            const botOptions = {
                host: host,
                port: parseInt(port),
                username: botName,
                version: version || false
            };

            // Conexión con SOCKS5
            if (useProxies && proxyList.length > 0) {
                const rawProxy = proxyList[spawned % proxyList.length];
                const [pHost, pPort] = rawProxy.split(':');

                botOptions.connect = (client) => {
                    SocksClient.createConnection({
                        proxy: {
                            host: pHost,
                            port: parseInt(pPort),
                            type: 5
                        },
                        command: 'connect',
                        destination: {
                            host: host,
                            port: parseInt(port)
                        }
                    }, (err, info) => {
                        if (err) {
                            io.emit('system-log', { text: `Error de Proxy [${rawProxy}] para ${botName}: ${err.message}` });
                            return;
                        }
                        client.setSocket(info.socket);
                        client.emit('connect');
                    });
                };
                io.emit('system-log', { text: `[${botName}] Conectando mediante proxy ${rawProxy}...` });
            }

            try {
                const bot = mineflayer.createBot(botOptions);
                bot._clientName = botName;
                bot._authDone = false;

                // Aceptar automáticamente cualquier Resource Pack obligatorio/opcional
                bot.on('resourcePack', (url, hash) => {
                    io.emit('system-log', { text: `[${botName}] Paquete de recursos solicitado. Aceptando...` });
                    bot.acceptResourcePack();
                });

                bot.once('spawn', () => {
                    io.emit('system-log', { text: `Bot ${botName} en el mundo.` });

                    if (autoCracked) {
                        setTimeout(() => {
                            bot.chat('/cracked');
                            io.emit('system-log', { text: `[${botName}] Enviado /cracked prioritario.` });
                        }, 1000);
                    }
                });

                // Detección de /register y /login desde la consola
                bot.on('messagestr', (message) => {
                    const msgLower = message.toLowerCase();

                    if ((msgLower.includes('/register') || msgLower.includes('registrate') || msgLower.includes('register')) && !bot._authDone) {
                        setTimeout(() => {
                            bot.chat(`/register ${passwordToUse} ${passwordToUse}`);
                            bot._authDone = true;
                            io.emit('system-log', { text: `[${botName}] Ejecutó /register automáticamente.` });
                        }, 1000);
                    } else if ((msgLower.includes('/login') || msgLower.includes('inicia sesion') || msgLower.includes('login')) && !bot._authDone) {
                        setTimeout(() => {
                            bot.chat(`/login ${passwordToUse}`);
                            bot._authDone = true;
                            io.emit('system-log', { text: `[${botName}] Ejecutó /login automáticamente.` });
                        }, 1000);
                    }
                });

                // Retransmisión del chat del servidor al panel
                bot.on('chat', (username, message) => {
                    io.emit('chat-log', { name: username, text: message });
                });

                bot.on('kicked', (reason) => {
                    io.emit('system-log', { text: `Bot ${botName} expulsado: ${reason}` });
                });

                bot.on('error', (err) => {
                    io.emit('system-log', { text: `Error en ${botName}: ${err.message}` });
                });

                bot.on('end', () => {
                    activeBots = activeBots.filter(b => b !== bot);
                });

                activeBots.push(bot);
            } catch (e) {
                io.emit('system-log', { text: `Error al crear el bot ${botName}: ${e.message}` });
            }

            spawned++;
        }, parseInt(delay) || 3000);
    });

    socket.on('stop-spawning', () => {
        stopSpawningFlag = true;
        io.emit('system-log', { text: 'Generación de nuevos bots pausada.' });
    });

    socket.on('stop-bots', () => {
        currentSessionId++;
        stopSpawningFlag = true;

        if (spamInterval) {
            clearInterval(spamInterval);
            spamInterval = null;
        }

        activeBots.forEach(bot => {
            try {
                bot.end();
            } catch (e) {}
        });
        activeBots = [];
        io.emit('system-log', { text: 'Todos los bots fueron desconectados.' });
    });

    socket.on('global-chat', (message) => {
        activeBots.forEach(bot => {
            try {
                bot.chat(message);
            } catch (e) {}
        });
        io.emit('chat-log', { name: 'PANEL', text: message });
    });

    socket.on('start-spam', (data) => {
        const { message, spamDelay } = data;
        const safeSpamDelay = Math.max(parseInt(spamDelay) || 2000, 500);

        if (!message || message.trim() === '') return;

        if (spamInterval) clearInterval(spamInterval);

        io.emit('system-log', { text: `Spam iniciado (Cada ${safeSpamDelay}ms)` });

        spamInterval = setInterval(() => {
            activeBots.forEach(bot => {
                try {
                    bot.chat(message);
                } catch (e) {}
            });
        }, safeSpamDelay);
    });

    socket.on('stop-spam', () => {
        if (spamInterval) {
            clearInterval(spamInterval);
            spamInterval = null;
            io.emit('system-log', { text: 'Spam detenido.' });
        }
    });

    socket.on('bot-action', (data) => {
        const { action } = data;
        activeBots.forEach(bot => {
            try {
                if (action === 'jump') {
                    bot.setControlState('jump', true);
                    setTimeout(() => bot.setControlState('jump', false), 500);
                }
                if (action === 'forward') {
                    bot.setControlState('forward', true);
                    setTimeout(() => bot.setControlState('forward', false), 1000);
                }
                if (action === 'stop') bot.clearControlStates();
            } catch (e) {}
        });
        io.emit('system-log', { text: `Acción física ejecutada: ${action}` });
    });
});

const PORT = 4000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});