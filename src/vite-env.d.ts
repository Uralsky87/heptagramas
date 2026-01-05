/// <reference types="vite/client" />

// Declaración para importar archivos .txt como raw string
declare module '*.txt?raw' {
  const content: string;
  export default content;
}
