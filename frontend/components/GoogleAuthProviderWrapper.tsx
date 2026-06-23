"use client";

import { GoogleOAuthProvider } from '@react-oauth/google';

export function GoogleAuthProviderWrapper({
  children,
  clientId
}: {
  children: React.ReactNode;
  clientId: string | null;
}) {
  return (
    <GoogleOAuthProvider clientId={clientId || "missing-client-id"}>
      {children}
    </GoogleOAuthProvider>
  );
}
