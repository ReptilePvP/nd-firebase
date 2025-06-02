import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, onAuthStateChanged, User } from 'firebase/auth';

// Re-export User type for use in other components
export type { User } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, query, where, orderBy, getDocs, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';

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
  console.log("saveAnalysisResult called with result:", result);
  try {
    const resultRef = doc(collection(db, 'analysisResults'));
    console.log("Firestore document reference created:", resultRef.id);
    let imageUrl = '';
    if (imageData) {
      // Check if imageData matches the expected data URL format
      if (imageData.startsWith('data:')) {
        const imageRef = ref(storage, `analysisImages/${resultRef.id}`);
        try {
          console.log("Attempting image upload to Storage...");
          await uploadString(imageRef, imageData, 'data_url');
          imageUrl = await getDownloadURL(imageRef);
          console.log("Image uploaded, URL:", imageUrl);
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          // Continue with saving the result even if image upload fails
        }
      } else {
        console.warn('Image data does not match data URL format, skipping upload:', imageData.substring(0, 50) + (imageData.length > 50 ? '...' : ''));
      }
    }
    // Set a timeout for the Firestore operation to allow more time for completion
    const savePromise = setDoc(resultRef, {
      ...result,
      id: resultRef.id,
      imageUrl: imageUrl || '',
      timestamp: Date.now()
    });
    console.log("Attempting to save document to Firestore...");
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Firestore save operation timed out after 60 seconds')), 60000);
    });
    await Promise.race([savePromise, timeoutPromise]);
    console.log("Document saved successfully to Firestore.");
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
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Convert Firestore Timestamp to number (milliseconds since epoch)
      if (data.timestamp && typeof data.timestamp.toDate === 'function') {
        data.timestamp = data.timestamp.toDate().getTime();
      }
      return data as AnalysisResult;
    });
  } catch (error) {
    console.error('Error getting user analysis results:', error);
    return [];
  }
};

// Function to clear user's saved analysis history
export const clearUserAnalysisHistory = async (userId: string): Promise<void> => {
  try {
    const q = query(
      collection(db, 'analysisResults'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map(async (doc) => {
      const data = doc.data() as AnalysisResult;
      // Delete associated image from Firebase Storage if it exists
      if (data.imageUrl) {
        try {
          const imageRef = ref(storage, `analysisImages/${doc.id}`);
          await deleteObject(imageRef);
        } catch (storageError) {
          console.error(`Error deleting image for analysis ${doc.id}:`, storageError);
          // Continue with deletion even if image deletion fails
        }
      }
      // Delete the Firestore document
      await deleteDoc(doc.ref);
    });
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error clearing user analysis history:', error);
    throw error;
  }
};

// Function to submit AI feedback
export const submitAiFeedback = async (userId: string, analysisResult: AnalysisResult, feedbackType: 'correct' | 'incorrect', feedbackText?: string, imageData?: string, groundingMetadata?: any) => {
  try {
    const feedbackRef = doc(collection(db, 'ai_feedback'));
    let imageUrl = '';
    if (imageData && imageData.startsWith('data:')) {
      const imageRef = ref(storage, `feedbackImages/${feedbackRef.id}`);
      try {
        await uploadString(imageRef, imageData, 'data_url');
        imageUrl = await getDownloadURL(imageRef);
      } catch (uploadError) {
        console.error('Error uploading feedback image:', uploadError);
        // Continue with saving the feedback even if image upload fails
      }
    }
    const feedbackData = {
      id: feedbackRef.id,
      userId,
      analysisResult,
      feedbackType,
      feedbackText: feedbackText || '',
      imageUrl: imageUrl || '',
      groundingMetadata: groundingMetadata || null,
      timestamp: Date.now()
    };
    await setDoc(feedbackRef, feedbackData);
    return feedbackRef.id;
  } catch (error) {
    console.error('Error submitting AI feedback:', error);
    throw error;
  }
};

export default auth;
