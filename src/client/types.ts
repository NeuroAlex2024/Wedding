import type { ProfileStore } from './state/profileStore';

export interface AppContext {
  root: HTMLElement;
  store: ProfileStore;
}
