import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  type Auth,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  type User,
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
} from 'firebase/firestore';

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

export async function signInWithGoogle(): Promise<void> {
  const auth = getFirebaseAuth();
  await signInWithRedirect(auth, googleProvider);
}

export async function handleRedirectResult(): Promise<User | null> {
  const auth = getFirebaseAuth();
  const result = await getRedirectResult(auth);
  return result?.user ?? null;
}

export async function signOutUser(): Promise<void> {
  const auth = getFirebaseAuth();
  await signOut(auth);
}

export function onAuthStateChangedListener(callback: (user: User | null) => void): Unsubscribe {
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
  const atendimentosRef = collection(db, 'atendimentos');

  const existingSnapshot = await getDocs(query(atendimentosRef, where('userId', '==', userId)));
  existingSnapshot.docs.forEach((doc) => batch.delete(doc.ref));

  atendimentos.forEach((a) => {
    const ref = doc(atendimentosRef);
    batch.set(ref, toFirestore({ ...a, userId }));
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
