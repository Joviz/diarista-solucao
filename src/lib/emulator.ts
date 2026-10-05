// Firebase Emulator configuration for local development and testing
export const USE_EMULATORS = import.meta.env.VITE_USE_EMULATORS === 'true';

export const EMULATOR_CONFIG = {
  auth: {
    host: 'localhost',
    port: 9099,
  },
  firestore: {
    host: 'localhost',
    port: 8080,
  },
};

export function connectToEmulators(): void {
  if (!USE_EMULATORS) return;

  // This will be called from the app entry point when USE_EMULATORS is true
  // The actual connection is done in firebase.ts
}
