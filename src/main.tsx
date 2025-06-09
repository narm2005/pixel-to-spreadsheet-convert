import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { GoogleOAuthProvider } from "@react-oauth/google";
import React from 'react';

createRoot(document.getElementById("root")!).render(
<React.StrictMode>
    <GoogleOAuthProvider clientId="281532092006-7q4of0in8g5kjgnv0upl53f0iu62hj7o.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);