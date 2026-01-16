
import { db, auth, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy } from './firebase'; // Updated to import from local mock
import { UserProfile, WorkoutRecord, NutritionLog, ScheduledWorkout } from '../types';
import { MOCK_HISTORY, NUTRITION_LOGS } from '../constants';

// --- SERVICE ABSTRACTION LAYER ---
// This allows switching between LocalStorage (Demo) and Firestore (Production) effortlessly.

const isCloudEnabled = () => !!db && !!auth?.currentUser;

// --- USER PROFILE ---
export const apiGetUserProfile = async (): Promise<UserProfile | null> => {
    if (isCloudEnabled() && auth.currentUser) {
        try {
            const docRef = doc(db, "users", auth.currentUser.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data() as UserProfile;
            }
            return null;
        } catch (e) {
            console.error("Cloud fetch profile error", e);
            return null;
        }
    } else {
        const local = localStorage.getItem('fitlife_profile');
        return local ? JSON.parse(local) : null;
    }
};

export const apiSaveUserProfile = async (profile: UserProfile): Promise<void> => {
    if (isCloudEnabled() && auth.currentUser) {
        await setDoc(doc(db, "users", auth.currentUser.uid), profile, { merge: true });
    }
    // Always save local as backup/cache
    localStorage.setItem('fitlife_profile', JSON.stringify(profile));
};

// --- WORKOUT HISTORY ---
export const apiGetWorkoutHistory = async (): Promise<WorkoutRecord[]> => {
    if (isCloudEnabled() && auth.currentUser) {
        try {
            const q = query(
                collection(db, `users/${auth.currentUser.uid}/workouts`),
                orderBy("date", "desc")
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkoutRecord));
        } catch (e) {
            console.error("Cloud fetch history error", e);
            return [];
        }
    } else {
        const local = localStorage.getItem('fitlife_history');
        return local ? JSON.parse(local) : MOCK_HISTORY;
    }
};

export const apiSaveWorkoutRecord = async (record: WorkoutRecord): Promise<void> => {
    if (isCloudEnabled() && auth.currentUser) {
        // Use record.id or generate a new one
        await setDoc(doc(db, `users/${auth.currentUser.uid}/workouts`, record.id), record);
    }
    
    // Local Update
    const current = localStorage.getItem('fitlife_history');
    const history = current ? JSON.parse(current) : MOCK_HISTORY;
    const newHistory = [record, ...history];
    localStorage.setItem('fitlife_history', JSON.stringify(newHistory));
};

// --- NUTRITION LOGS ---
export const apiGetNutritionLogs = async (): Promise<NutritionLog[]> => {
    if (isCloudEnabled() && auth.currentUser) {
        try {
            const q = query(
                collection(db, `users/${auth.currentUser.uid}/nutrition`),
                orderBy("date", "desc"),
                orderBy("time", "desc")
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NutritionLog));
        } catch (e) {
            console.error("Cloud fetch nutrition error", e);
            return [];
        }
    } else {
        const local = localStorage.getItem('fitlife_nutrition');
        // Initial mock data if empty
        return local ? JSON.parse(local) : NUTRITION_LOGS;
    }
};

export const apiSaveNutritionLog = async (log: NutritionLog, isDelete: boolean = false): Promise<void> => {
    if (isCloudEnabled() && auth.currentUser) {
        // Simplified: We assume syncing whole state or individual. 
        // For individual log actions (Add/Delete), we would strictly need deleteDoc etc.
        // For this hybrid demo, we might just re-sync mostly on major updates, 
        // but let's do a single doc write for 'Add/Update'.
        if (!isDelete) {
            await setDoc(doc(db, `users/${auth.currentUser.uid}/nutrition`, log.id), log);
        } else {
            // Delete not implemented in this simple abstraction for brevity, 
            // usually you'd import deleteDoc(doc(db, ...))
        }
    }
};

export const apiSyncNutritionState = async (logs: NutritionLog[]): Promise<void> => {
    // Bulk sync for local -> cloud (simple version)
    localStorage.setItem('fitlife_nutrition', JSON.stringify(logs));
};


// --- SCHEDULE ---
export const apiGetSchedule = async (): Promise<ScheduledWorkout[]> => {
    const local = localStorage.getItem('fitlife_schedule');
    return local ? JSON.parse(local) : [];
};

export const apiSaveSchedule = async (schedule: ScheduledWorkout[]): Promise<void> => {
    localStorage.setItem('fitlife_schedule', JSON.stringify(schedule));
    // TODO: Add cloud sync for schedule
};
