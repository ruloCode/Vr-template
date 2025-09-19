import { z } from "zod";

// Esquemas de mensajes del cliente al servidor
export const ClientHelloSchema = z.object({
  type: z.literal("HELLO"),
  payload: z.object({
    deviceId: z.string().min(1).max(50),
    version: z.string().default("1.0.0"),
    userAgent: z.string().optional(),
    battery: z.number().min(0).max(100).optional(),
  }),
});

export const ClientPingSchema = z.object({
  type: z.literal("PING"),
  payload: z.object({
    tClient: z.number().int().positive(),
  }),
});

export const ClientReadySchema = z.object({
  type: z.literal("READY"),
  payload: z.object({
    sceneId: z.string().min(1).max(50),
  }),
});

export const ClientStateSchema = z.object({
  type: z.literal("STATE"),
  payload: z.object({
    sceneId: z.string().min(1).max(50),
    currentTime: z.number().min(0),
    playing: z.boolean(),
    buffered: z.number().min(0).max(100).optional(),
  }),
});

// Esquemas de mensajes del servidor al cliente
export const ServerWelcomeSchema = z.object({
  type: z.literal("WELCOME"),
  payload: z.object({
    serverEpochMs: z.number().int().positive(),
    clientId: z.string(),
    serverVersion: z.string(),
  }),
});

export const ServerPongSchema = z.object({
  type: z.literal("PONG"),
  payload: z.object({
    tServer: z.number().int().positive(),
    tClient: z.number().int().positive(),
  }),
});

export const ServerCommandSchema = z.object({
  type: z.literal("COMMAND"),
  payload: z.discriminatedUnion("commandType", [
    z.object({
      commandType: z.literal("LOAD"),
      sceneId: z.string().min(1).max(50),
    }),
    z.object({
      commandType: z.literal("START_AT"),
      epochMs: z.number().int().positive(),
    }),
    z.object({
      commandType: z.literal("PAUSE"),
    }),
    z.object({
      commandType: z.literal("RESUME"),
    }),
    z.object({
      commandType: z.literal("SEEK"),
      deltaMs: z.number().int(),
    }),
    z.object({
      commandType: z.literal("SHOW_SCREEN"),
      screenType: z.enum(["solar", "petroleo", "plataforma"]),
    }),
    z.object({
      commandType: z.literal("HIDE_SCREEN"),
      screenType: z.enum(["solar", "petroleo", "plataforma"]),
    }),
    z.object({
      commandType: z.literal("HIDE_ALL_SCREENS"),
    }),
    z.object({
      commandType: z.literal("SHOW_ALL_SCREENS"),
    }),
    z.object({
      commandType: z.literal("TOGGLE_SCREEN"),
      screenType: z.enum(["solar", "petroleo", "plataforma"]),
    }),
  ]),
});

export const ServerErrorSchema = z.object({
  type: z.literal("ERROR"),
  payload: z.object({
    message: z.string(),
  }),
});

// Esquemas de estado del cliente
export const ClientStatusSchema = z.object({
  id: z.string(),
  deviceId: z.string(),
  lastPingMs: z.number().int(),
  latencyMs: z.number().min(0),
  offsetMs: z.number(),
  sceneId: z.string().optional(),
  status: z.enum(["connected", "ready", "playing", "paused", "disconnected"]),
  battery: z.number().min(0).max(100).optional(),
  userAgent: z.string().optional(),
  connectedAt: z.number().int().positive(),
  lastStateUpdate: z.number().int().positive(),
});

// Room state
export const RoomStateSchema = z.object({
  id: z.string(),
  clients: z.array(ClientStatusSchema),
  currentScene: z.string().optional(),
  isPlaying: z.boolean(),
  startedAt: z.number().int().optional(),
  pausedAt: z.number().int().optional(),
  seekOffset: z.number().default(0),
});

// Tipos derivados
export type ClientHello = z.infer<typeof ClientHelloSchema>;
export type ClientPing = z.infer<typeof ClientPingSchema>;
export type ClientReady = z.infer<typeof ClientReadySchema>;
export type ClientState = z.infer<typeof ClientStateSchema>;

export type ServerWelcome = z.infer<typeof ServerWelcomeSchema>;
export type ServerPong = z.infer<typeof ServerPongSchema>;
export type ServerCommand = z.infer<typeof ServerCommandSchema>;

export type ClientStatus = z.infer<typeof ClientStatusSchema>;
export type RoomState = z.infer<typeof RoomStateSchema>;

// Union types para todos los mensajes
export const ClientMessageSchema = z.discriminatedUnion("type", [
  ClientHelloSchema,
  ClientPingSchema,
  ClientReadySchema,
  ClientStateSchema,
]);

export const ServerMessageSchema = z.discriminatedUnion("type", [
  ServerWelcomeSchema,
  ServerPongSchema,
  ServerCommandSchema,
  ServerErrorSchema,
]);

export type ClientMessage = z.infer<typeof ClientMessageSchema>;
export type ServerMessage = z.infer<typeof ServerMessageSchema>;

// Constantes del protocolo
export const PROTOCOL_VERSION = "1.0.0";
export const MAX_LATENCY_MS = 5000;
export const HEARTBEAT_INTERVAL_MS = 30000;
export const CLIENT_TIMEOUT_MS = 60000;
export const SYNC_TOLERANCE_MS = 120; // Máximo desvío antes de corrección
export const PING_INTERVAL_MS = 5000;
