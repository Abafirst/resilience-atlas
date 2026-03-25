import React from 'react';
import ReactDOM from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App.jsx';

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;
const redirectUri = import.meta.env.VITE_AUTH0_REDIRECT_URI || window.location.origin;

if (!domain || !clientId) {
  throw new Error(
    `Auth0 configuration is missing.\n` +
    `Local development: set VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID in client/.env (see client/.env.example).\n` +
    `Production/Docker: pass them as build ARGs: --build-arg VITE_AUTH0_DOMAIN=... --build-arg VITE_AUTH0_CLIENT_ID=...\n` +
    `Railway: set VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID in the Railway environment variables before deploying.`
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
        ...(audience ? { audience } : {}),
      }}
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>
);
