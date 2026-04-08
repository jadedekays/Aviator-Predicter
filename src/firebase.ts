import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDocFromCache, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Test connection to Firestore
async function testConnection() {
  try {
    // Try to get a non-existent doc to trigger a network request
    await getDocFromServer(doc(db, '_connection_test_', 'test'));
    console.log("Firebase connection established.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Firebase connection failed: The client is offline or configuration is incorrect.");
    }
  }
}
testConnection();
