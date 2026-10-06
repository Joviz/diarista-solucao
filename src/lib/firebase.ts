import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  type Auth,
  signInWithRedirect,
  getRedirectResult,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  type User,
  connectAuthEmulator,
} from 'firebase/auth';
import {
  getFirestore,
  type Firestore,
  collection,
  doc,
  getDocs,
  query,
  where,
  onSnapshot,
  type Unsubscribe,
  writeBatch,
  Timestamp,
  type QueryDocumentSnapshot,
  type DocumentData,
  connectFirestoreEmulator,
} from 'firebase/firestore';

import { USE_EMULATORS } from './emulator';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export function isFirebaseConfigured(): boolean {
  return !!(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId);
}

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

export function initFirebase() {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase não configurado. Defina as variáveis de ambiente VITE_FIREBASE_*.');
  }
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
  db = getFirestore(app);

  // Set persistence to LOCAL for better session persistence
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('Failed to set auth persistence:', err);
  });

  // Connect to emulators in development/test mode
  if (USE_EMULATORS) {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('Connected to Firebase Emulators');
  }

  return { app, auth, db };
}

export function getFirebaseAuth(): Auth {
  if (!auth) initFirebase();
  return auth;
}

export function getFirebaseDb(): Firestore {
  if (!db) initFirebase();
  return db;
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export async function signInWithGoogle(): Promise<User> {
  // Try popup first (works better on Vercel and avoids Safari ITP issues)
  try {
    const result = await signInWithPopup(getFirebaseAuth(), googleProvider);
    return result.user;
  } catch (popupErr) {
    const errorCode = (popupErr as { code?: string })?.code;
    console.warn('Popup blocked or failed, falling back to redirect:', popupErr);

    // If popup is blocked, try redirect as fallback
    if (
      errorCode === 'auth/popup-blocked' ||
      errorCode === 'auth/cancelled-popup-request' ||
      errorCode === 'auth/popup-closed-by-user'
    ) {
      await signInWithRedirect(getFirebaseAuth(), googleProvider);
      throw new Error('Redirect initiated');
    }

    // Re-throw other errors
    throw popupErr;
  }
}

export async function handleRedirectResult(): Promise<User | null> {
  const auth = getFirebaseAuth();
  try {
    const result = await getRedirectResult(auth);
    return result?.user ?? null;
  } catch (err) {
    console.error('Error handling redirect result:', err);
    return null;
  }
}

export async function signOutUser(): Promise<void> {
  const auth = getFirebaseAuth();
  await signOut(auth);
}

export function onAuthStateChangedListener(callback: (user: User | null) => void): () => void {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, callback);
}

export interface AtendimentoFirestore {
  id: string;
  cliente: string;
  endereco: string;
  data: string;
  horario: string;
  duracao?: string;
  valorCombinado: number;
  situacao: 'previsto' | 'realizado' | 'pago' | 'cancelado';
  observacao?: string;
  dataRecebimento?: string;
  valorRecebido?: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

function toFirestore(atendimento: AtendimentoFirestore) {
  return {
    ...atendimento,
    createdAt: Timestamp.fromDate(new Date(atendimento.createdAt)),
    updatedAt: Timestamp.fromDate(new Date(atendimento.updatedAt)),
  };
}

function fromFirestore(doc: QueryDocumentSnapshot<DocumentData>): AtendimentoFirestore {
  const data = doc.data();
  return {
    id: doc.id,
    cliente: data.cliente,
    endereco: data.endereco,
    data: data.data,
    horario: data.horario,
    duracao: data.duracao,
    valorCombinado: data.valorCombinado,
    situacao: data.situacao,
    observacao: data.observacao,
    dataRecebimento: data.dataRecebimento,
    valorRecebido: data.valorRecebido,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    userId: data.userId,
  };
}

export async function loadAtendimentosFromFirebase(
  userId: string
): Promise<AtendimentoFirestore[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, 'atendimentos'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(fromFirestore);
}

export async function saveAtendimentosToFirebase(
  userId: string,
  atendimentos: AtendimentoFirestore[]
): Promise<void> {
  const db = getFirebaseDb();
  const batch = writeBatch(db);

  // Get existing documents to know which ones to update/delete
  const existingSnapshot = await getDocs(
    query(collection(db, 'atendimentos'), where('userId', '==', userId))
  );
  const existingDocs = new Map<string, QueryDocumentSnapshot<DocumentData>>();
  existingSnapshot.docs.forEach((doc) => {
    existingDocs.set(doc.id, doc);
  });

  const incomingIds = new Set<string>();

  atendimentos.forEach((a) => {
    incomingIds.add(a.id);
    const ref = doc(db, 'atendimentos', a.id); // Use existing ID, not random
    batch.set(ref, toFirestore({ ...a, userId }));
  });

  // Delete documents that no longer exist in the incoming list
  existingDocs.forEach((docSnap, id) => {
    if (!incomingIds.has(id)) {
      batch.delete(docSnap.ref);
    }
  });

  await batch.commit();
}

export function subscribeToAtendimentos(
  userId: string,
  callback: (atendimentos: AtendimentoFirestore[]) => void
): Unsubscribe {
  const db = getFirebaseDb();
  const q = query(collection(db, 'atendimentos'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const atendimentos = snapshot.docs.map(fromFirestore);
    callback(atendimentos);
  });
}
