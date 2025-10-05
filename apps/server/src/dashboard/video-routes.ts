import { Router, Request, Response } from "express";
import { WebSocketManager } from "../websocket/manager.js";
import { logger } from "../utils/logger.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function createVideoDashboardRoutes(wsManager: WebSocketManager): Router {
  const router = Router();

  // Servir la interfaz del dashboard de video
  router.get("/", (req: Request, res: Response) => {
    // Disable caching for dashboard
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(generateVideoDashboardHTML());
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

  // API para obtener lista de videos disponibles
  router.get("/api/videos", (req: Request, res: Response) => {
    try {
      logger.info("📹 API /api/videos called - fetching available videos");
      const videos = getAvailableVideos();
      logger.info(`📹 Returning ${videos.length} videos to client`);
      res.setHeader('Cache-Control', 'no-cache');
      res.json({ videos });
    } catch (error) {
      logger.error("Error getting videos:", error);
      res.status(500).json({ error: "Error obteniendo videos" });
    }
  });

  // API para enviar comandos de video
  router.post("/api/command", async (req: Request, res: Response) => {
    try {
      const { commandType, ...payload } = req.body;

      if (!commandType) {
        return res.status(400).json({ error: "commandType es requerido" });
      }

      let command;

      switch (commandType) {
        case "LOAD_VIDEO":
          if (!payload.videoUrl) {
            return res
              .status(400)
              .json({ error: "videoUrl es requerido para LOAD_VIDEO" });
          }
          command = {
            type: "COMMAND" as const,
            payload: { commandType: "LOAD_VIDEO" as const, videoUrl: payload.videoUrl },
          };
          break;

        case "PLAY_VIDEO":
          const epochMs = payload.epochMs || Date.now() + (payload.delayMs || 3000);
          command = {
            type: "COMMAND" as const,
            payload: { commandType: "PLAY_VIDEO" as const, epochMs },
          };
          break;

        case "PAUSE_VIDEO":
          command = {
            type: "COMMAND" as const,
            payload: { commandType: "PAUSE_VIDEO" as const },
          };
          break;

        case "STOP_VIDEO":
          command = {
            type: "COMMAND" as const,
            payload: { commandType: "STOP_VIDEO" as const },
          };
          break;

        case "SEEK_VIDEO":
          if (typeof payload.currentTime !== "number") {
            return res
              .status(400)
              .json({ error: "currentTime es requerido para SEEK_VIDEO" });
          }
          command = {
            type: "COMMAND" as const,
            payload: {
              commandType: "SEEK_VIDEO" as const,
              currentTime: payload.currentTime
            },
          };
          break;

        default:
          return res
            .status(400)
            .json({ error: `Comando ${commandType} no reconocido` });
      }

      wsManager.broadcastCommand(command);
      logger.info(`📹 Comando de video enviado: ${commandType}`);

      return res.json({ success: true, command: commandType });
    } catch (error) {
      logger.error("Error sending video command:", error);
      return res.status(500).json({ error: "Error enviando comando" });
    }
  });

  return router;
}

function getAvailableVideos(): Array<{ name: string; path: string; size?: string }> {
  const videos: Array<{ name: string; path: string; size?: string }> = [];

  // Define video directory in clientevideo - use multiple possible paths
  const possiblePaths = [
    path.join(process.cwd(), "apps/clientevideo/videos"),
    path.join(__dirname, "../../../clientevideo/videos"),
    path.join(__dirname, "../../clientevideo/videos"),
  ];

  let baseDir: string | null = null;

  // Find the first existing path
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      baseDir = testPath;
      logger.info(`📹 Using video directory: ${baseDir}`);
      break;
    }
  }

  if (!baseDir) {
    logger.warn(`❌ Video directory not found. Tried paths:`);
    possiblePaths.forEach(p => logger.warn(`   - ${p}`));
    return videos;
  }

  try {
    // Scan for .mp4 and .MP4 files (only top level)
    const items = fs.readdirSync(baseDir);
    logger.info(`📂 Scanning directory: ${baseDir}`);
    logger.info(`📂 Found ${items.length} items`);

    for (const item of items) {
      const fullPath = path.join(baseDir, item);
      const stats = fs.statSync(fullPath);

      if (stats.isFile() && item.toLowerCase().endsWith(".mp4")) {
        const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

        videos.push({
          name: item,
          path: `/videos/${item}`,
          size: `${sizeInMB} MB`
        });

        logger.info(`✅ Found video: ${item} (${sizeInMB} MB)`);
      }
    }

    logger.info(`📹 Total videos available: ${videos.length}`);
  } catch (error) {
    logger.error("Error scanning video directory:", error);
  }

  return videos;
}

function generateVideoDashboardHTML(): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Control de Video - Ecopetrol</title>
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
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .dashboard {
            max-width: 600px;
            width: 100%;
            background: white;
            border-radius: 20px;
            box-shadow: 0 30px 60px rgba(0,0,0,0.2);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }

        .header h1 {
            font-size: 2rem;
            margin-bottom: 15px;
        }

        .devices-count {
            font-size: 1.2rem;
            opacity: 0.95;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }

        .count-badge {
            background: rgba(255,255,255,0.2);
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
        }

        .controls {
            padding: 40px 30px;
        }

        .video-selector {
            margin-bottom: 30px;
        }

        .video-selector label {
            display: block;
            font-size: 1rem;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 10px;
        }

        .video-selector select {
            width: 100%;
            padding: 18px;
            border: 2px solid #e0e0e0;
            border-radius: 12px;
            font-size: 1.1rem;
            background: white;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .video-selector select:hover {
            border-color: #667eea;
        }

        .video-selector select:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .button-group {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .btn {
            padding: 25px;
            border: none;
            border-radius: 12px;
            font-size: 1.5rem;
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: 700;
            color: white;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }

        .btn:hover:not(:disabled) {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        }

        .btn:active:not(:disabled) {
            transform: translateY(-1px);
        }

        .btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
            transform: none !important;
        }

        .btn-play {
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
        }

        .btn-pause {
            background: linear-gradient(135deg, #FF9800 0%, #f57c00 100%);
        }

        .btn-stop {
            background: linear-gradient(135deg, #F44336 0%, #d32f2f 100%);
        }

        .video-info {
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 12px;
            text-align: center;
        }

        .video-info-label {
            font-size: 0.9rem;
            color: #6c757d;
            margin-bottom: 5px;
        }

        .video-info-value {
            font-size: 1.1rem;
            font-weight: 600;
            color: #2c3e50;
        }

        .loading {
            display: inline-block;
            width: 18px;
            height: 18px;
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 0.8s linear infinite;
            margin-left: 10px;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .footer {
            padding: 20px;
            text-align: center;
            background: #f8f9fa;
            color: #6c757d;
            font-size: 0.9rem;
        }

        @media (max-width: 640px) {
            .header h1 {
                font-size: 1.5rem;
            }

            .btn {
                font-size: 1.2rem;
                padding: 20px;
            }

            .controls {
                padding: 30px 20px;
            }
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>🎬 Control de Video</h1>
            <div class="devices-count">
                <span>📱</span>
                <span class="count-badge" id="total-clients">0</span>
                <span>Dispositivos Conectados</span>
            </div>
        </div>

        <div class="controls">
            <div class="video-selector">
                <label for="video-select">Seleccionar Video:</label>
                <select id="video-select">
                    <option value="">Cargando videos...</option>
                </select>
            </div>

            <div class="button-group">
                <button id="play-video" class="btn btn-play" disabled>
                    ▶️ PLAY
                </button>
                <button id="pause-video" class="btn btn-pause" disabled>
                    ⏸️ PAUSE
                </button>
                <button id="stop-video" class="btn btn-stop" disabled>
                    ⏹️ STOP
                </button>
            </div>

            <div class="video-info">
                <div class="video-info-label">Video Actual:</div>
                <div class="video-info-value" id="current-video-name">Ninguno</div>
            </div>
        </div>

        <div class="footer">
            🔄 Actualización automática cada 2 segundos
        </div>
    </div>

    <script>
        let currentRoom = null;
        let availableVideos = [];
        let currentVideo = null;

        // Update dashboard every 2 seconds
        setInterval(updateDashboard, 2000);
        updateDashboard();
        loadVideos();

        async function updateDashboard() {
            try {
                const response = await fetch('/video-dashboard/api/room');
                currentRoom = await response.json();
                updateStats();
            } catch (error) {
                console.error('Error updating dashboard:', error);
            }
        }

        async function loadVideos() {
            try {
                console.log('🎬 Cargando lista de videos...');
                // Add timestamp to prevent caching
                const response = await fetch(\`/video-dashboard/api/videos?t=\${Date.now()}\`);
                const data = await response.json();
                availableVideos = data.videos || [];

                console.log(\`✅ Videos recibidos: \${availableVideos.length}\`, availableVideos);

                const select = document.getElementById('video-select');
                select.innerHTML = '<option value="">Seleccionar video...</option>';

                if (availableVideos.length === 0) {
                    console.warn('⚠️ No hay videos disponibles');
                    select.innerHTML = '<option value="">No hay videos disponibles</option>';
                } else {
                    availableVideos.forEach(video => {
                        const option = document.createElement('option');
                        option.value = video.path;
                        option.textContent = \`\${video.name}\`;
                        select.appendChild(option);
                        console.log(\`   📹 \${video.name} - \${video.size}\`);
                    });
                }

                setupEventListeners();
            } catch (error) {
                console.error('❌ Error loading videos:', error);
                const select = document.getElementById('video-select');
                select.innerHTML = '<option value="">Error cargando videos</option>';
            }
        }

        function setupEventListeners() {
            // Auto-load video when selected
            document.getElementById('video-select').addEventListener('change', function() {
                if (this.value) {
                    loadVideo();
                }
            });

            document.getElementById('play-video').addEventListener('click', playVideo);
            document.getElementById('pause-video').addEventListener('click', pauseVideo);
            document.getElementById('stop-video').addEventListener('click', stopVideo);
        }

        function updateStats() {
            if (!currentRoom) return;
            document.getElementById('total-clients').textContent = currentRoom.clients.length;
        }

        async function sendCommand(commandType, payload = {}) {
            try {
                const response = await fetch('/video-dashboard/api/command', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ commandType, ...payload })
                });

                const result = await response.json();

                if (result.success) {
                    console.log(\`✅ Comando \${commandType} enviado\`);
                } else {
                    console.error('Error:', result.error);
                    alert('Error: ' + result.error);
                }
            } catch (error) {
                console.error('Error sending command:', error);
                alert('Error enviando comando');
            }
        }

        async function loadVideo() {
            const videoUrl = document.getElementById('video-select').value;
            if (!videoUrl) return;

            const videoName = availableVideos.find(v => v.path === videoUrl)?.name || videoUrl;
            currentVideo = { url: videoUrl, name: videoName };

            document.getElementById('current-video-name').textContent = videoName;

            // Enable controls
            document.getElementById('play-video').disabled = false;
            document.getElementById('pause-video').disabled = false;
            document.getElementById('stop-video').disabled = false;

            // Send LOAD command
            await sendCommand('LOAD_VIDEO', { videoUrl });
        }

        function playVideo() {
            if (!currentVideo) return;
            const delayMs = 3000; // 3 second delay for sync
            sendCommand('PLAY_VIDEO', { delayMs });
        }

        function pauseVideo() {
            sendCommand('PAUSE_VIDEO');
        }

        function stopVideo() {
            sendCommand('STOP_VIDEO');
            currentVideo = null;
            document.getElementById('current-video-name').textContent = 'Ninguno';
            document.getElementById('video-select').value = '';

            // Disable controls
            document.getElementById('play-video').disabled = true;
            document.getElementById('pause-video').disabled = true;
            document.getElementById('stop-video').disabled = true;
        }
    </script>
</body>
</html>
  `;
}
