/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare const __VR_VERSION__: string;
declare const __BUILD_TIME__: string;

interface ImportMetaEnv {
  readonly VITE_WS_URL: string;
  readonly VITE_SERVER_URL: string;
  readonly VITE_DEBUG: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}


