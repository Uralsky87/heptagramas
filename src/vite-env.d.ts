/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Declaración para importar archivos .txt como raw string
declare module '*.txt?raw' {
  const content: string;
  export default content;
}
