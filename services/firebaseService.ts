import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, onAuthStateChanged, User } from 'firebase/auth';

// Re-export User type for use in other components
export type { User } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, query, where, orderBy, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';

// Firebase configuration
// TODO: Replace with your Firebase project configuration
// You can find these values in your Firebase Console under Project Settings
const firebaseConfig = {
  apiKey: "AIzaSyBPHtkye2BFQomAbXZqK76ttficenccfKE",
  authDomain: "ai-general-knowledge.firebaseapp.com",
  projectId: "ai-general-knowledge",
  storageBucket: "ai-general-knowledge.firebasestorage.app",
  messagingSenderId: "835868315237",
  appId: "1:835868315237:web:bb5901c7533f7702b1808c",
  measurementId: "G-8ZW09057PX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Authentication providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// User data interface
export interface UserProfile {
  uid: string;
  email: string | null;
  username?: string;
  fullName?: string;
  profilePicture?: string;
  bio?: string;
}

// Authentication functions
export const registerWithEmail = async (email: string, password: string, username: string, fullName?: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // Store additional user data in Firestore
    await saveUserProfile({
      uid: user.uid,
      email: user.email,
      username,
      fullName
    });
    return user;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error logging in with email:', error);
    throw error;
  }
};

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    // Check if user profile exists, if not create one
    const profile = await getUserProfile(user.uid);
    if (!profile) {
      await saveUserProfile({
        uid: user.uid,
        email: user.email,
        username: user.displayName || 'User' + Math.floor(Math.random() * 10000),
        fullName: user.displayName || undefined,
        profilePicture: user.photoURL || undefined
      });
    }
    return user;
  } catch (error) {
    console.error('Error logging in with Google:', error);
    throw error;
  }
};

export const loginWithGithub = async () => {
  try {
    const result = await signInWithPopup(auth, githubProvider);
    const user = result.user;
    // Check if user profile exists, if not create one
    const profile = await getUserProfile(user.uid);
    if (!profile) {
      await saveUserProfile({
        uid: user.uid,
        email: user.email,
        username: user.displayName || 'User' + Math.floor(Math.random() * 10000),
        fullName: user.displayName || undefined,
        profilePicture: user.photoURL || undefined
      });
    }
    return user;
  } catch (error) {
    console.error('Error logging in with GitHub:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Firestore user profile functions
export const saveUserProfile = async (profile: UserProfile) => {
  try {
    await setDoc(doc(db, 'users', profile.uid), profile);
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// Analysis result interface
export interface AnalysisResult {
  id?: string;
  userId: string;
  productName: string;
  description: string;
  averageSalePrice: string;
  resellPrice: string;
  imageUrl?: string;
  timestamp: number;
}

// Function to save analysis results
export const saveAnalysisResult = async (result: AnalysisResult, imageData?: string) => {
  try {
    const resultRef = doc(collection(db, 'analysisResults'));
    let imageUrl = '';
    if (imageData) {
      const imageRef = ref(storage, `analysisImages/${resultRef.id}`);
      await uploadString(imageRef, imageData, 'data_url');
      imageUrl = await getDownloadURL(imageRef);
    }
    await setDoc(resultRef, {
      ...result,
      id: resultRef.id,
      imageUrl: imageUrl || '',
      timestamp: Date.now()
    });
    return resultRef.id;
  } catch (error) {
    console.error('Error saving analysis result:', error);
    throw error;
  }
};

// Function to get user's saved analysis results
export const getUserAnalysisResults = async (userId: string): Promise<AnalysisResult[]> => {
  try {
    const q = query(
      collection(db, 'analysisResults'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as AnalysisResult);
  } catch (error) {
    console.error('Error getting user analysis results:', error);
    return [];
  }
};

export default auth;
