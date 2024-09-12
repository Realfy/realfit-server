import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue, Filter } from 'firebase-admin/firestore';
import { FIRESTORE_CONFIG } from '../envConfig.js';

initializeApp({
    credential: cert(FIRESTORE_CONFIG)
});

const db = getFirestore();

export default db;