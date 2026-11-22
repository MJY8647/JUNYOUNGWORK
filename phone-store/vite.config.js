import { defineConfig } from 'vite';

// 상대 경로로 빌드해 어떤 하위 경로에 올려도 동작하게 함
export default defineConfig({ base: './' });
