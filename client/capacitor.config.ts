import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.theresilienceatlas.app',
  appName: 'Resilience Atlas',
  webDir: 'dist',
  server: {
    // Allow the app to make requests to the production backend.
    // This is only used in development/live-reload; bundled builds
    // use the web assets from dist/ and the apiUrl() helper.
    allowNavigation: ['theresilienceatlas.com'],
  },
  android: {
    // Keep the default splash/status bar behavior.
    backgroundColor: '#1a1a2e',
    // Performance-oriented WebView defaults for Android devices.
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
