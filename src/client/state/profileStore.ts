export interface Profile {
  brideName: string;
  groomName: string;
  vibe: string[];
  style: string | null;
  venueBooked: boolean;
  city: string | null;
  year: number | null;
  month: number | null;
  budgetRange: string | null;
  guestCount: number | null;
  websiteThemeId: string | null;
  websiteTitle: string;
  websiteMessage: string;
  websiteSchedule: string;
}

export type ProfileUpdate = Partial<Profile>;

export interface ProfileStore {
  getState(): Profile;
  update(update: ProfileUpdate): void;
  subscribe(listener: (profile: Profile) => void): () => void;
}

const STORAGE_KEY = 'wedding_profile_v2';

function readProfile(): Profile | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    return {
      ...getDefaultProfile(),
      ...parsed,
    } satisfies Profile;
  } catch (error) {
    console.warn('Не удалось прочитать профиль из localStorage', error);
    return null;
  }
}

function persistProfile(profile: Profile) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.warn('Не удалось сохранить профиль', error);
  }
}

function getDefaultProfile(): Profile {
  return {
    brideName: '',
    groomName: '',
    vibe: [],
    style: null,
    venueBooked: false,
    city: null,
    year: null,
    month: null,
    budgetRange: null,
    guestCount: null,
    websiteThemeId: null,
    websiteTitle: 'Приглашаем на нашу свадьбу',
    websiteMessage: 'Мы будем рады разделить с вами наш особенный день!',
    websiteSchedule: '',
  };
}

export function createProfileStore(): ProfileStore {
  let state = readProfile() ?? getDefaultProfile();
  const listeners = new Set<(profile: Profile) => void>();

  const notify = () => {
    listeners.forEach((listener) => listener(state));
  };

  const update = (update: ProfileUpdate) => {
    state = { ...state, ...update };
    persistProfile(state);
    notify();
  };

  return {
    getState: () => state,
    update,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
