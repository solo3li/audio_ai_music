"use client";

import { GoogleLogin } from '@react-oauth/google';
import { useRouter } from '../src/i18n/routing';
import api from '../src/utils/api';
import { useAppStore } from '../src/store/useAppStore';

export function GoogleLoginButton() {
  const router = useRouter();
  const setUser = useAppStore(state => state.setUser);

  return (
    <div className="w-full flex justify-center">
      <GoogleLogin
        onSuccess={async (credentialResponse) => {
          if (!credentialResponse.credential) return;
          try {
            // Post to our new backend endpoint
            const res = await api.post(`/api/auth/google-login`, {
              token: credentialResponse.credential
            });
            
            if (res.status === 200) {
              setUser(res.data);
              router.push('/profile');
            }
          } catch (error) {
            console.error("Login failed", error);
            alert("Google login failed. Please try again.");
          }
        }}
        onError={() => {
          console.error('Google Login Failed');
          alert("Google login failed. Please try again.");
        }}
        theme="outline"
        size="large"
        width="100%"
        text="continue_with"
        shape="rectangular"
      />
    </div>
  );
}
