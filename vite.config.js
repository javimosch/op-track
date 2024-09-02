import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  // Load environment variables based on the current mode
  const env = loadEnv(mode, process.cwd());

  console.log({env});

  // Check if the environment is production
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    root: resolve(__dirname, 'src/client'),
    plugins: [react({ jsxRuntime: 'automatic', include: '**/*.tsx' }), tailwindcss()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'), // Adjust this alias to use resolve for better compatibility
      },
    },
    build: {
      minify: false, // Disable minification
      sourcemap: true, // Enable source maps
      rollupOptions: {
        input: resolve(__dirname, 'src/client', 'index.html'), // Ensure this path is correct
      },
    },
    server: !isProduction ? {
      proxy: {
        '/api': env.VITE_SERVER_URL || 'http://localhost:3000', // Use the environment variable
      },
    } : {},
    define: {
      'import.meta.env.VITE_SERVER_URL': JSON.stringify(env.VITE_SERVER_URL || 'http://localhost:3000'), // Define the VITE_SERVER_URL
    }
  };
});