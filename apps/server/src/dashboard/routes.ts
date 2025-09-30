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

  // API para obtener secuencias disponibles
  router.get("/api/sequences", (req: Request, res: Response) => {
    try {
      const sequences = wsManager.getAvailableSequences();
      res.json({ sequences });
    } catch (error) {
      logger.error("Error getting sequences:", error);
      res.status(500).json({ error: "Error obteniendo secuencias" });
    }
  });

  // API para enviar comandos
  router.post("/api/command", async (req: Request, res: Response) => {
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

        // Sequence automation commands
        case "START_SEQUENCE":
          if (!payload.sequenceId) {
            return res
              .status(400)
              .json({ error: "sequenceId es requerido para START_SEQUENCE" });
          }

          try {
            const result = await wsManager.startSequence(
              payload.sequenceId,
              payload.config
            );
            return res.json({ success: result, command: commandType });
          } catch (error) {
            return res.status(500).json({ error: "Error iniciando secuencia" });
          }

        case "STOP_SEQUENCE":
          try {
            await wsManager.stopSequence();
            return res.json({ success: true, command: commandType });
          } catch (error) {
            return res
              .status(500)
              .json({ error: "Error deteniendo secuencia" });
          }

        case "PAUSE_SEQUENCE":
          try {
            const result = wsManager.pauseSequence();
            return res.json({ success: result, command: commandType });
          } catch (error) {
            return res.status(500).json({ error: "Error pausando secuencia" });
          }

        case "RESUME_SEQUENCE":
          try {
            const result = wsManager.resumeSequence();
            return res.json({ success: result, command: commandType });
          } catch (error) {
            return res
              .status(500)
              .json({ error: "Error reanudando secuencia" });
          }

        case "NEXT_SCENE":
          try {
            const result = await wsManager.nextScene();
            return res.json({ success: result, command: commandType });
          } catch (error) {
            return res.status(500).json({ error: "Error avanzando escena" });
          }

        case "PREVIOUS_SCENE":
          try {
            const result = await wsManager.previousScene();
            return res.json({ success: result, command: commandType });
          } catch (error) {
            return res
              .status(500)
              .json({ error: "Error retrocediendo escena" });
          }

        case "JUMP_TO_SCENE":
          if (typeof payload.sceneIndex !== "number") {
            return res
              .status(400)
              .json({ error: "sceneIndex es requerido para JUMP_TO_SCENE" });
          }

          try {
            const result = await wsManager.jumpToScene(payload.sceneIndex);
            return res.json({ success: result, command: commandType });
          } catch (error) {
            return res.status(500).json({ error: "Error saltando a escena" });
          }

        case "UPDATE_SEQUENCE":
          if (!payload.sequenceId || !payload.scenes) {
            return res.status(400).json({
              error: "sequenceId y scenes son requeridos para UPDATE_SEQUENCE",
            });
          }

          try {
            wsManager.updateSequence(
              payload.sequenceId,
              payload.scenes,
              payload.config
            );
            return res.json({ success: true, command: commandType });
          } catch (error) {
            return res
              .status(500)
              .json({ error: "Error actualizando secuencia" });
          }

        default:
          return res
            .status(400)
            .json({ error: `Comando ${commandType} no reconocido` });
      }

      wsManager.broadcastCommand(command);
      // Command sent from dashboard

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
        
        /* New sequence automation styles */
        .sequence-control-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            margin-bottom: 25px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        }
        
        .sequence-timeline {
            margin: 20px 0;
            position: relative;
        }
        
        .progress-bar {
            width: 100%;
            height: 8px;
            background: rgba(255,255,255,0.2);
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 10px;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #4CAF50, #8BC34A);
            border-radius: 4px;
            transition: width 0.3s ease;
            width: 0%;
        }
        
        .scene-markers {
            display: flex;
            justify-content: space-between;
            font-size: 0.8rem;
            opacity: 0.9;
        }
        
        .sequence-controls {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        
        .sequence-info {
            margin-top: 15px;
            padding: 15px;
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            backdrop-filter: blur(10px);
        }
        
        .sequence-selector {
            margin-bottom: 20px;
        }
        
        .sequence-selector select {
            width: 100%;
            padding: 12px;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            background: rgba(255,255,255,0.9);
        }
        
        .duration-editor {
            margin-top: 20px;
            max-height: 300px;
            overflow-y: auto;
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            padding: 15px;
        }
        
        .scene-duration-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .scene-duration-item:last-child {
            border-bottom: none;
        }
        
        .duration-input {
            width: 80px;
            padding: 4px 8px;
            border: none;
            border-radius: 4px;
            text-align: center;
        }
        
        .sequence-status {
            font-size: 0.9rem;
            opacity: 0.9;
        }
        
        .btn-sequence {
            background: rgba(255,255,255,0.2);
            color: white;
            border: 1px solid rgba(255,255,255,0.3);
        }
        
        .btn-sequence:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-2px);
        }
        
        .btn-play { background: #4CAF50 !important; }
        .btn-pause { background: #FF9800 !important; }
        .btn-stop { background: #F44336 !important; }
        
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
            <!-- NEW: Sequence Automation Control Section -->
            <div class="sequence-control-section">
                <h3>🎭 Control Automático de Secuencias</h3>
                
                <div class="sequence-selector">
                    <select id="sequence-select">
                        <option value="">Seleccionar secuencia...</option>
                    </select>
                </div>
                
                <!-- Timeline Visual -->
                <div class="sequence-timeline">
                    <div class="progress-bar">
                        <div class="progress-fill" id="sequence-progress"></div>
                    </div>
                    <div class="scene-markers" id="scene-markers">
                        <span>Sin secuencia activa</span>
                    </div>
                </div>
                
                <!-- Main Playback Controls -->
                <div class="sequence-controls">
                    <button id="play-sequence" class="btn btn-sequence btn-play" disabled>
                        ▶️ PLAY
                    </button>
                    <button id="pause-sequence" class="btn btn-sequence btn-pause" disabled>
                        ⏸️ PAUSE
                    </button>
                    <button id="stop-sequence" class="btn btn-sequence btn-stop" disabled>
                        ⏹️ STOP
                    </button>
                    <button id="prev-scene" class="btn btn-sequence" disabled>
                        ⏮️ ANTERIOR
                    </button>
                    <button id="next-scene" class="btn btn-sequence" disabled>
                        ⏭️ SIGUIENTE
                    </button>
                </div>
                
                <!-- Sequence Information -->
                <div class="sequence-info">
                    <div class="sequence-status" id="sequence-status">
                        Estado: <span id="sequence-state">Inactivo</span> | 
                        Escena: <span id="current-scene-info">-</span> | 
                        Progreso: <span id="sequence-progress-text">0%</span>
                    </div>
                    <div class="sequence-status" id="sequence-details" style="margin-top: 5px;">
                        Tiempo restante: <span id="remaining-time">-</span> | 
                        Total: <span id="total-duration">-</span>
                    </div>
                </div>
                
                <!-- Duration Editor (collapsible) -->
                <div style="margin-top: 15px;">
                    <button id="toggle-editor" class="btn btn-sequence" style="font-size: 0.9rem;">
                        ⚙️ Editor de Tiempos
                    </button>
                    <div id="duration-editor" class="duration-editor" style="display: none;">
                        <h4 style="margin-bottom: 15px;">Editar Duración de Escenas</h4>
                        <div id="duration-controls">
                            <!-- Dynamic content will be populated here -->
                        </div>
                        <div style="text-align: center; margin-top: 15px;">
                            <button id="save-durations" class="btn btn-sequence">
                                💾 Guardar Cambios
                            </button>
                            <button id="reset-durations" class="btn btn-sequence">
                                🔄 Restaurar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="control-section">
                <h3>🎬 Control Manual de Escenas</h3>
                <div class="input-group">
                    <select id="scene-select">
                        <option value="base">Escena Base: Vista por Defecto</option>
                        <option value="escena-1">Escena 1: Energías Renovables (Solar y Eólica)</option>
                        <option value="escena-2">Escena 2: Operaciones Petroleras</option>
                        <option value="escena-3">Escena 3: Operaciones de Plataforma</option>
                        <option value="escena-4">Escena 4: Entorno Natural</option>
                        <option value="escena-5">Escena 5: Vista Panorámica</option>
                        <option value="escena-6">Escena 6: Operaciones Especializadas</option>
                        <option value="escena-7">Escena 7: Vista Industrial Avanzada</option>
                        <option value="escena-8">Escena 8: Operaciones Industriales</option>
                        <option value="escena-9">Escena 9: Instalaciones Avanzadas</option>
                        <option value="escena-10">Escena 10: Operaciones Especializadas</option>
                        <option value="escena-11">Escena 11: Infraestructura Completa</option>
                        <option value="guajira-1">Guajira 1</option>
                        <option value="guajira-2">Guajira 2</option>
                        <option value="guajira-3">Guajira 3</option>
                        <option value="guajira-4">Guajira 4</option>
                        <option value="guajira-5">Guajira 5</option>
                        <option value="guajira-6">Guajira 6</option>
                        <option value="guajira-7">Guajira 7</option>
                        <option value="guajira-8">Guajira 8</option>
                        <option value="guajira-9">Guajira 9</option>
                        <option value="guajira-10">Guajira 10</option>
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
        let availableSequences = [];
        let currentSequence = null;
        let isEditorOpen = false;
        
        // Actualizar datos cada 2 segundos
        setInterval(updateDashboard, 2000);
        updateDashboard(); // Cargar inmediatamente
        loadSequences(); // Cargar secuencias disponibles
        
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
            
            // Actualizar estado de secuencias
            updateSequenceState();
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
                case 'escena-6':
                    screenInfo = '⚙️ Operaciones Especializadas disponible';
                    break;
                case 'escena-7':
                    screenInfo = '🏭 Vista Industrial Avanzada disponible';
                    break;
                case 'escena-8':
                    screenInfo = '🏭 Operaciones Industriales disponible';
                    break;
                case 'escena-9':
                    screenInfo = '🏗️ Instalaciones Avanzadas disponible';
                    break;
                case 'escena-10':
                    screenInfo = '⚙️ Operaciones Especializadas disponible';
                    break;
                case 'escena-11':
                    screenInfo = '🏢 Infraestructura Completa disponible';
                    break;
                case 'guajira-1':
                    screenInfo = '🎬 Guajira 1: Video disponible';
                    break;
                case 'guajira-2':
                    screenInfo = '🖼️ Guajira 2: Imágenes disponibles';
                    break;
                case 'guajira-3':
                    screenInfo = '🎬 Guajira 3: Videos disponibles';
                    break;
                case 'guajira-4':
                    screenInfo = '🖼️ Guajira 4: Imágenes disponibles';
                    break;
                case 'guajira-5':
                    screenInfo = '🎬 Guajira 5: Videos disponibles';
                    break;
                case 'guajira-6':
                    screenInfo = '🖼️ Guajira 6: Imágenes disponibles';
                    break;
                case 'guajira-7':
                    screenInfo = '🖼️ Guajira 7: Imágenes disponibles';
                    break;
                case 'guajira-8':
                    screenInfo = '🖼️ Guajira 8: Imágenes disponibles';
                    break;
                case 'guajira-9':
                    screenInfo = '🎬 Guajira 9: Videos disponibles';
                    break;
                case 'guajira-10':
                    screenInfo = '🖼️ Guajira 10: Imágenes disponibles';
                    break;
                default:
                    screenInfo = 'Sin pantallas flotantes';
            }
            
            screenInfoElement.textContent = screenInfo;
        }
        
        // ========== SEQUENCE AUTOMATION FUNCTIONS ==========
        
        async function loadSequences() {
            try {
                const response = await fetch('/dashboard/api/sequences');
                const data = await response.json();
                availableSequences = data.sequences || [];
                
                const sequenceSelect = document.getElementById('sequence-select');
                sequenceSelect.innerHTML = '<option value="">Seleccionar secuencia...</option>';
                
                availableSequences.forEach(seq => {
                    const option = document.createElement('option');
                    option.value = seq.id;
                    const minutes = Math.floor(seq.totalDuration / 60000);
                    const seconds = Math.floor((seq.totalDuration % 60000) / 1000);
                    option.textContent = \`\${seq.name} (\${minutes}:\${seconds.toString().padStart(2, '0')})\`;
                    sequenceSelect.appendChild(option);
                });
                
                setupSequenceEventListeners();
            } catch (error) {
                console.error('Error loading sequences:', error);
            }
        }
        
        function setupSequenceEventListeners() {
            // Sequence selector change
            document.getElementById('sequence-select').addEventListener('change', function() {
                const sequenceId = this.value;
                currentSequence = availableSequences.find(s => s.id === sequenceId) || null;
                updateSequenceUI();
            });
            
            // Playback controls
            document.getElementById('play-sequence').addEventListener('click', startSequence);
            document.getElementById('pause-sequence').addEventListener('click', pauseSequence);
            document.getElementById('stop-sequence').addEventListener('click', stopSequence);
            document.getElementById('prev-scene').addEventListener('click', previousScene);
            document.getElementById('next-scene').addEventListener('click', nextScene);
            
            // Editor toggle
            document.getElementById('toggle-editor').addEventListener('click', toggleDurationEditor);
            document.getElementById('save-durations').addEventListener('click', saveDurations);
            document.getElementById('reset-durations').addEventListener('click', resetDurations);
        }
        
        function updateSequenceUI() {
            const hasSequence = currentSequence !== null;
            
            // Enable/disable controls
            document.getElementById('play-sequence').disabled = !hasSequence;
            document.getElementById('pause-sequence').disabled = !hasSequence;
            document.getElementById('stop-sequence').disabled = !hasSequence;
            document.getElementById('prev-scene').disabled = !hasSequence;
            document.getElementById('next-scene').disabled = !hasSequence;
            
            if (hasSequence) {
                // Update timeline markers
                updateSceneMarkers();
                // Update sequence details
                const minutes = Math.floor(currentSequence.totalDuration / 60000);
                const seconds = Math.floor((currentSequence.totalDuration % 60000) / 1000);
                document.getElementById('total-duration').textContent = \`\${minutes}:\${seconds.toString().padStart(2, '0')}\`;
                
                // Update duration editor
                updateDurationEditor();
            } else {
                // Clear UI
                document.getElementById('scene-markers').innerHTML = '<span>Sin secuencia activa</span>';
                document.getElementById('total-duration').textContent = '-';
                document.getElementById('sequence-progress').style.width = '0%';
            }
        }
        
        function updateSceneMarkers() {
            if (!currentSequence) return;
            
            const markersContainer = document.getElementById('scene-markers');
            markersContainer.innerHTML = '';
            
            currentSequence.scenes.forEach((scene, index) => {
                const marker = document.createElement('span');
                marker.textContent = \`\${index + 1}. \${scene.name || scene.sceneId}\`;
                marker.style.cursor = 'pointer';
                marker.addEventListener('click', () => jumpToScene(index));
                markersContainer.appendChild(marker);
            });
        }
        
        function updateSequenceState() {
            if (!currentRoom?.sequenceState) return;
            
            const sequenceState = currentRoom.sequenceState;
            const stateElement = document.getElementById('sequence-state');
            const progressElement = document.getElementById('sequence-progress');
            const progressTextElement = document.getElementById('sequence-progress-text');
            const remainingTimeElement = document.getElementById('remaining-time');
            const currentSceneInfoElement = document.getElementById('current-scene-info');
            
            // Update state text
            let stateText = 'Inactivo';
            if (sequenceState.isActive) {
                stateText = sequenceState.isPaused ? 'Pausado' : 'Reproduciendo';
            }
            stateElement.textContent = stateText;
            
            // Update progress
            const progress = (sequenceState.progress || 0) * 100;
            progressElement.style.width = progress + '%';
            progressTextElement.textContent = Math.round(progress) + '%';
            
            // Update remaining time
            if (sequenceState.remainingTime) {
                const minutes = Math.floor(sequenceState.remainingTime / 60000);
                const seconds = Math.floor((sequenceState.remainingTime % 60000) / 1000);
                remainingTimeElement.textContent = \`\${minutes}:\${seconds.toString().padStart(2, '0')}\`;
            } else {
                remainingTimeElement.textContent = '-';
            }
            
            // Update current scene info
            if (sequenceState.currentSequence && sequenceState.currentSequence.scenes) {
                const currentScene = sequenceState.currentSequence.scenes[sequenceState.currentSceneIndex];
                if (currentScene) {
                    currentSceneInfoElement.textContent = \`\${sequenceState.currentSceneIndex + 1}. \${currentScene.name || currentScene.sceneId}\`;
                } else {
                    currentSceneInfoElement.textContent = '-';
                }
            } else {
                currentSceneInfoElement.textContent = '-';
            }
            
            // Update button states
            const isActive = sequenceState.isActive;
            const isPaused = sequenceState.isPaused;
            
            document.getElementById('pause-sequence').disabled = !isActive || isPaused;
            document.getElementById('stop-sequence').disabled = !isActive;
            document.getElementById('prev-scene').disabled = !isActive;
            document.getElementById('next-scene').disabled = !isActive;
            
            // Update play button
            const playButton = document.getElementById('play-sequence');
            if (isActive && !isPaused) {
                playButton.textContent = '▶️ REPRODUCIENDO...';
                playButton.disabled = true;
            } else if (isActive && isPaused) {
                playButton.textContent = '▶️ REANUDAR';
                playButton.disabled = false;
            } else {
                playButton.textContent = '▶️ PLAY';
                playButton.disabled = !currentSequence;
            }
        }
        
        function updateDurationEditor() {
            if (!currentSequence) return;
            
            const container = document.getElementById('duration-controls');
            container.innerHTML = '';
            
            currentSequence.scenes.forEach((scene, index) => {
                const item = document.createElement('div');
                item.className = 'scene-duration-item';
                
                const label = document.createElement('span');
                label.textContent = \`\${index + 1}. \${scene.name || scene.sceneId}\`;
                
                const input = document.createElement('input');
                input.type = 'number';
                input.className = 'duration-input';
                input.value = Math.round(scene.duration / 1000);
                input.min = 15;
                input.max = 300;
                input.dataset.sceneIndex = index;
                
                const unit = document.createElement('span');
                unit.textContent = 's';
                
                item.appendChild(label);
                const controls = document.createElement('div');
                controls.appendChild(input);
                controls.appendChild(unit);
                item.appendChild(controls);
                
                container.appendChild(item);
            });
        }
        
        function toggleDurationEditor() {
            const editor = document.getElementById('duration-editor');
            const button = document.getElementById('toggle-editor');
            
            isEditorOpen = !isEditorOpen;
            editor.style.display = isEditorOpen ? 'block' : 'none';
            button.textContent = isEditorOpen ? '▲ Cerrar Editor' : '⚙️ Editor de Tiempos';
        }
        
        // Sequence control functions
        async function startSequence() {
            if (!currentSequence) return;
            
            try {
                const response = await fetch('/dashboard/api/command', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        commandType: 'START_SEQUENCE',
                        sequenceId: currentSequence.id,
                        config: {
                            autoLoop: currentSequence.autoLoop,
                            showScreensAutomatically: currentSequence.showScreensAutomatically
                        }
                    })
                });
                
                const result = await response.json();
                if (!result.success) {
                    alert('Error: ' + result.error);
                }
            } catch (error) {
                console.error('Error starting sequence:', error);
                alert('Error iniciando secuencia');
            }
        }
        
        async function pauseSequence() {
            await sendSequenceCommand('PAUSE_SEQUENCE');
        }
        
        async function stopSequence() {
            await sendSequenceCommand('STOP_SEQUENCE');
        }
        
        async function previousScene() {
            await sendSequenceCommand('PREVIOUS_SCENE');
        }
        
        async function nextScene() {
            await sendSequenceCommand('NEXT_SCENE');
        }
        
        async function jumpToScene(sceneIndex) {
            await sendSequenceCommand('JUMP_TO_SCENE', { sceneIndex });
        }
        
        async function sendSequenceCommand(commandType, payload = {}) {
            try {
                const response = await fetch('/dashboard/api/command', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ commandType, ...payload })
                });
                
                const result = await response.json();
                if (!result.success) {
                    alert('Error: ' + result.error);
                }
            } catch (error) {
                console.error(\`Error executing \${commandType}:\`, error);
                alert('Error ejecutando comando');
            }
        }
        
        async function saveDurations() {
            if (!currentSequence) return;
            
            const inputs = document.querySelectorAll('.duration-input');
            const updatedScenes = [...currentSequence.scenes];
            
            inputs.forEach(input => {
                const sceneIndex = parseInt(input.dataset.sceneIndex);
                const newDuration = parseInt(input.value) * 1000; // Convert to ms
                if (newDuration >= 15000 && newDuration <= 300000) {
                    updatedScenes[sceneIndex].duration = newDuration;
                }
            });
            
            try {
                const response = await fetch('/dashboard/api/command', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        commandType: 'UPDATE_SEQUENCE',
                        sequenceId: currentSequence.id,
                        scenes: updatedScenes,
                        config: {
                            autoLoop: currentSequence.autoLoop,
                            showScreensAutomatically: currentSequence.showScreensAutomatically,
                            transitions: currentSequence.transitions
                        }
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    alert('✅ Duraciones guardadas exitosamente');
                    loadSequences(); // Reload sequences
                } else {
                    alert('Error: ' + result.error);
                }
            } catch (error) {
                console.error('Error saving durations:', error);
                alert('Error guardando duraciones');
            }
        }
        
        function resetDurations() {
            updateDurationEditor();
        }
    </script>
</body>
</html>
  `;
}
