/// <reference types="vite-plugin-electron/electron-env" />

declare module "*.sql?raw" {
  const content: string;
  export default content;
}
