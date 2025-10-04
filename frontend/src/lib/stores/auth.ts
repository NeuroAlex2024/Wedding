import { writable } from 'svelte/store';
import pb from '$lib/pocketbase';

function createAuthStore() {
  const currentUser = writable(pb.authStore.model);
  const ready = writable(false);

  const sync = () => {
    currentUser.set(pb.authStore.model);
    if (typeof window !== 'undefined') {
      const cookie = pb.authStore.exportToCookie({ httpOnly: false });
      window.localStorage.setItem('pb_auth', cookie);
    }
  };

  pb.authStore.onChange(() => {
    sync();
  });

  if (typeof window !== 'undefined') {
    (async () => {
      const cookie = window.localStorage.getItem('pb_auth');
      if (cookie) {
        try {
          pb.authStore.loadFromCookie(cookie);
          if (pb.authStore.isValid) {
            await pb.collection('users').authRefresh();
          }
        } catch (error) {
          console.error('Auth refresh failed', error);
          pb.authStore.clear();
        }
      }
      sync();
      ready.set(true);
    })();
  } else {
    ready.set(true);
  }

  const logout = () => {
    pb.authStore.clear();
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('pb_auth');
    }
    sync();
  };

  return { currentUser, ready, logout };
}

export const auth = createAuthStore();
export const currentUser = auth.currentUser;
export const authReady = auth.ready;
export const logout = auth.logout;
