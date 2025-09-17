import { Router, Request, Response } from "express";
import { WebSocketManager } from "../websocket/manager.js";
import { logger } from "../utils/logger.js";

export function createDashboardRoutes(wsManager: WebSocketManager): Router {
  const router = Router();

  // Servir la interfaz del dashboard
  router.get("/", (req: Request, res: Response) => {
    res.send(generateDashboardHTML());
  });

  // API para obtener estado del room
  router.get("/api/room", (req: Request, res: Response) => {
    try {
      const room = wsManager.getRoom();
      res.json(room);
    } catch (error) {
      logger.error("Error getting room state:", error);
      res.status(500).json({ error: "Error obteniendo estado del room" });
    }
  });

  // API para enviar comandos
  router.post("/api/command", (req: Request, res: Response) => {
    try {
      const { commandType, ...payload } = req.body;

      if (!commandType) {
        return res.status(400).json({ error: "commandType es requerido" });
      }

      let command;

      switch (commandType) {
        case "LOAD":
          if (!payload.sceneId) {
            return res
              .status(400)
              .json({ error: "sceneId es requerido para LOAD" });
          }
          command = {
            type: "COMMAND" as const,
            payload: { commandType: "LOAD" as const, sceneId: payload.sceneId },
          };
          break;

        case "START_AT":
          const epochMs =
            payload.epochMs || Date.now() + (payload.delayMs || 3000);
          command = {
            type: "COMMAND" as const,
            payload: { commandType: "START_AT" as const, epochMs },
          };
          break;

        case "PAUSE":
          command = {
            type: "COMMAND" as const,
            payload: { commandType: "PAUSE" as const },
          };
          break;

        case "RESUME":
          command = {
            type: "COMMAND" as const,
            payload: { commandType: "RESUME" as const },
          };
          break;

        case "SEEK":
          if (typeof payload.deltaMs !== "number") {
            return res
              .status(400)
              .json({ error: "deltaMs es requerido para SEEK" });
          }
          command = {
            type: "COMMAND" as const,
            payload: { commandType: "SEEK" as const, deltaMs: payload.deltaMs },
          };
          break;

        case "SHOW_SCREEN":
          if (!payload.screenType) {
            return res
              .status(400)
              .json({ error: "screenType es requerido para SHOW_SCREEN" });
          }
          command = {
            type: "COMMAND" as const,
            payload: {
              commandType: "SHOW_SCREEN" as const,
              screenType: payload.screenType,
            },
          };
          break;

        case "HIDE_SCREEN":
          if (!payload.screenType) {
            return res
              .status(400)
              .json({ error: "screenType es requerido para HIDE_SCREEN" });
          }
          command = {
            type: "COMMAND" as const,
            payload: {
              commandType: "HIDE_SCREEN" as const,
              screenType: payload.screenType,
            },
          };
          break;

        case "HIDE_ALL_SCREENS":
          command = {
            type: "COMMAND" as const,
            payload: { commandType: "HIDE_ALL_SCREENS" as const },
          };
          break;

        case "SHOW_ALL_SCREENS":
          command = {
            type: "COMMAND" as const,
            payload: { commandType: "SHOW_ALL_SCREENS" as const },
          };
          break;

        case "TOGGLE_SCREEN":
          if (!payload.screenType) {
            return res
              .status(400)
              .json({ error: "screenType es requerido para TOGGLE_SCREEN" });
          }
          command = {
            type: "COMMAND" as const,
            payload: {
              commandType: "TOGGLE_SCREEN" as const,
              screenType: payload.screenType,
            },
          };
          break;

        default:
          return res
            .status(400)
            .json({ error: `Comando ${commandType} no reconocido` });
      }

      wsManager.broadcastCommand(command);
      logger.info(`Comando ${commandType} enviado desde dashboard`);

      return res.json({ success: true, command: commandType });
    } catch (error) {
      logger.error("Error sending command:", error);
      return res.status(500).json({ error: "Error enviando comando" });
    }
  });

  return router;
}

function generateDashboardHTML(): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard VR Ecopetrol</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .dashboard {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        
        .header p {
            opacity: 0.9;
            font-size: 1.1rem;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
            border-bottom: 1px solid #dee2e6;
        }
        
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
        }
        
        .stat-number {
            font-size: 2.5rem;
            font-weight: bold;
            color: #2c3e50;
            display: block;
        }
        
        .stat-label {
            color: #6c757d;
            font-size: 0.9rem;
            margin-top: 5px;
        }
        
        .controls {
            padding: 30px;
        }
        
        .control-section {
            margin-bottom: 30px;
        }
        
        .control-section h3 {
            color: #2c3e50;
            margin-bottom: 15px;
            font-size: 1.3rem;
        }
        
        .button-group {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
            flex-wrap: wrap;
        }
        
        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: 600;
        }
        
        .btn-primary {
            background: #007bff;
            color: white;
        }
        
        .btn-primary:hover {
            background: #0056b3;
            transform: translateY(-2px);
        }
        
        .btn-success {
            background: #28a745;
            color: white;
        }
        
        .btn-success:hover {
            background: #1e7e34;
            transform: translateY(-2px);
        }
        
        .btn-warning {
            background: #ffc107;
            color: #212529;
        }
        
        .btn-warning:hover {
            background: #d39e00;
            transform: translateY(-2px);
        }
        
        .btn-danger {
            background: #dc3545;
            color: white;
        }
        
        .btn-danger:hover {
            background: #c82333;
            transform: translateY(-2px);
        }
        
        .input-group {
            display: flex;
            gap: 10px;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .input-group input,
        .input-group select {
            padding: 10px;
            border: 2px solid #dee2e6;
            border-radius: 5px;
            font-size: 1rem;
        }
        
        .clients-table {
            margin-top: 30px;
        }
        
        .table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
        }
        
        .table th,
        .table td {
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid #dee2e6;
        }
        
        .table th {
            background: #f8f9fa;
            font-weight: 600;
            color: #495057;
        }
        
        .status-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
        }
        
        .status-connected { background: #d4edda; color: #155724; }
        .status-ready { background: #d1ecf1; color: #0c5460; }
        .status-playing { background: #d1ecf1; color: #0c5460; }
        .status-paused { background: #f8d7da; color: #721c24; }
        
        .auto-refresh {
            text-align: center;
            margin-top: 20px;
            padding: 10px;
            background: #e9ecef;
            border-radius: 5px;
            font-size: 0.9rem;
            color: #6c757d;
        }
        
        .screen-info {
            margin-top: 10px;
            padding: 8px;
            background: #f8f9fa;
            border-radius: 5px;
            border-left: 4px solid #007bff;
        }
        
        .screen-info small {
            color: #495057;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>🌟 Dashboard VR Ecopetrol</h1>
            <p>Sistema de sincronización para experiencias VR 360°</p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <span class="stat-number" id="total-clients">0</span>
                <div class="stat-label">Dispositivos Conectados</div>
            </div>
            <div class="stat-card">
                <span class="stat-number" id="ready-clients">0</span>
                <div class="stat-label">Dispositivos Listos</div>
            </div>
            <div class="stat-card">
                <span class="stat-number" id="avg-latency">0ms</span>
                <div class="stat-label">Latencia Promedio</div>
            </div>
            <div class="stat-card">
                <span class="stat-number" id="current-scene">-</span>
                <div class="stat-label">Toma Actual</div>
            </div>
        </div>
        
        <div class="controls">
            <div class="control-section">
                <h3>🎬 Control de Escenas</h3>
                <div class="input-group">
                    <select id="scene-select">
                        <option value="base">Escena Base: Vista por Defecto</option>
                        <option value="escena-1">Escena 1: Energías Renovables (Solar y Eólica)</option>
                        <option value="escena-2">Escena 2: Operaciones Petroleras</option>
                        <option value="escena-3">Escena 3: Operaciones de Plataforma</option>
                        <option value="escena-4">Escena 4: Entorno Natural</option>
                        <option value="escena-5">Escena 5: Vista Panorámica</option>
                    </select>
                    <button class="btn btn-primary" onclick="loadScene()">Cargar Escena</button>
                </div>
            </div>
            
            <div class="control-section">
                <h3>▶️ Control de Reproducción</h3>
                <div class="button-group">
                    <button class="btn btn-success" onclick="startIn(3000)">START en 3s</button>
                    <button class="btn btn-success" onclick="startIn(5000)">START en 5s</button>
                    <button class="btn btn-warning" onclick="pausePlayback()">PAUSA</button>
                    <button class="btn btn-success" onclick="resumePlayback()">REANUDAR</button>
                </div>
                
                <div class="button-group">
                    <button class="btn btn-primary" onclick="seek(-5000)">⏪ -5s</button>
                    <button class="btn btn-primary" onclick="seek(-1000)">⏪ -1s</button>
                    <button class="btn btn-primary" onclick="seek(1000)">⏩ +1s</button>
                    <button class="btn btn-primary" onclick="seek(5000)">⏩ +5s</button>
                </div>
                
                <div class="input-group">
                    <input type="number" id="custom-delay" placeholder="Milisegundos" value="3000">
                    <button class="btn btn-success" onclick="startInCustom()">START Custom</button>
                </div>
            </div>
            
            <div class="control-section">
                <h3>📺 Control de Pantallas Flotantes</h3>
                <div class="button-group">
                    <button class="btn btn-success" onclick="showAllScreens()">📺 Mostrar Pantalla Actual</button>
                    <button class="btn btn-warning" onclick="hideAllScreens()">📺 Ocultar Todas</button>
                </div>
                <div class="screen-info">
                    <small id="screen-status">Pantallas: <span id="current-screen-info">-</span></small>
                </div>
            </div>
        </div>
        
        <div class="clients-table">
            <h3>📱 Dispositivos Conectados</h3>
            <table class="table">
                <thead>
                    <tr>
                        <th>Device ID</th>
                        <th>Estado</th>
                        <th>Escena</th>
                        <th>Latencia</th>
                        <th>Offset</th>
                        <th>Batería</th>
                        <th>Conectado</th>
                    </tr>
                </thead>
                <tbody id="clients-tbody">
                    <tr>
                        <td colspan="7" style="text-align: center; color: #6c757d;">
                            No hay dispositivos conectados
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div class="auto-refresh">
            🔄 Actualización automática cada 2 segundos
        </div>
    </div>

    <script>
        let currentRoom = null;
        
        // Actualizar datos cada 2 segundos
        setInterval(updateDashboard, 2000);
        updateDashboard(); // Cargar inmediatamente
        
        async function updateDashboard() {
            try {
                const response = await fetch('/dashboard/api/room');
                currentRoom = await response.json();
                
                updateStats();
                updateClientsTable();
            } catch (error) {
                console.error('Error updating dashboard:', error);
            }
        }
        
        function updateStats() {
            if (!currentRoom) return;
            
            document.getElementById('total-clients').textContent = currentRoom.clients.length;
            document.getElementById('ready-clients').textContent = 
                currentRoom.clients.filter(c => c.status === 'ready').length;
            
            const avgLatency = currentRoom.clients.length > 0 ?
                Math.round(currentRoom.clients.reduce((sum, c) => sum + c.latencyMs, 0) / currentRoom.clients.length) :
                0;
            document.getElementById('avg-latency').textContent = avgLatency + 'ms';
            
            document.getElementById('current-scene').textContent = currentRoom.currentScene || '-';
            
            // Actualizar información de pantalla
            updateScreenInfo();
        }
        
        function updateClientsTable() {
            if (!currentRoom) return;
            
            const tbody = document.getElementById('clients-tbody');
            
            if (currentRoom.clients.length === 0) {
                tbody.innerHTML = \`
                    <tr>
                        <td colspan="7" style="text-align: center; color: #6c757d;">
                            No hay dispositivos conectados
                        </td>
                    </tr>
                \`;
                return;
            }
            
            tbody.innerHTML = currentRoom.clients.map(client => \`
                <tr>
                    <td>\${client.deviceId || client.id.substr(0, 8)}</td>
                    <td><span class="status-badge status-\${client.status}">\${client.status}</span></td>
                    <td>\${client.sceneId || '-'}</td>
                    <td>\${client.latencyMs}ms</td>
                    <td>\${client.offsetMs}ms</td>
                    <td>\${client.battery ? client.battery + '%' : '-'}</td>
                    <td>\${new Date(client.connectedAt).toLocaleTimeString()}</td>
                </tr>
            \`).join('');
        }
        
        async function sendCommand(commandType, payload = {}) {
            try {
                const response = await fetch('/dashboard/api/command', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ commandType, ...payload })
                });
                
                const result = await response.json();
                if (result.success) {
                    console.log(\`Comando \${commandType} enviado exitosamente\`);
                } else {
                    console.error('Error:', result.error);
                    alert('Error: ' + result.error);
                }
            } catch (error) {
                console.error('Error sending command:', error);
                alert('Error enviando comando');
            }
        }
        
        function loadScene() {
            const sceneId = document.getElementById('scene-select').value;
            sendCommand('LOAD', { sceneId });
        }
        
        function startIn(delayMs) {
            sendCommand('START_AT', { delayMs });
        }
        
        function startInCustom() {
            const delayMs = parseInt(document.getElementById('custom-delay').value) || 3000;
            sendCommand('START_AT', { delayMs });
        }
        
        function pausePlayback() {
            sendCommand('PAUSE');
        }
        
        function resumePlayback() {
            sendCommand('RESUME');
        }
        
        function seek(deltaMs) {
            sendCommand('SEEK', { deltaMs });
        }
        
        function showAllScreens() {
            sendCommand('SHOW_ALL_SCREENS');
        }
        
        function hideAllScreens() {
            sendCommand('HIDE_ALL_SCREENS');
        }
        
        function updateScreenInfo() {
            const currentScene = document.getElementById('current-scene').textContent;
            const screenInfoElement = document.getElementById('current-screen-info');
            
            let screenInfo = '-';
            
            switch (currentScene) {
                case 'base':
                    screenInfo = '🏠 Escena Base - Sin pantallas flotantes';
                    break;
                case 'escena-1':
                    screenInfo = '☀️ Energías Renovables disponible';
                    break;
                case 'escena-2':
                    screenInfo = '🛢️ Operaciones Petroleras disponible';
                    break;
                case 'escena-3':
                    screenInfo = '🏗️ Operaciones de Plataforma disponible';
                    break;
                case 'escena-4':
                    screenInfo = '🌿 Entorno Natural disponible';
                    break;
                case 'escena-5':
                    screenInfo = '🌅 Vista Panorámica disponible';
                    break;
                default:
                    screenInfo = 'Sin pantallas flotantes';
            }
            
            screenInfoElement.textContent = screenInfo;
        }
    </script>
</body>
</html>
  `;
}
