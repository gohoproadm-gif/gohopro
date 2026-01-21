
import { db, auth, doc, getDoc, setDoc, deleteDoc, collection, query, orderBy, getDocs } from './firebase'; 
import { UserProfile, WorkoutRecord, NutritionLog, ScheduledWorkout, CalendarEvent } from '../types';
import { MOCK_HISTORY, NUTRITION_LOGS } from '../constants';

// --- SERVICE ABSTRACTION LAYER ---
// Checks if the user is logged in and Firestore is initialized
const isCloudEnabled = () => !!db && !!auth?.currentUser;

// --- SYSTEM KEYS (CLOUD SYNC) ---
export const apiGetSystemKeys = async (): Promise<any> => {
    // Allows any authenticated user to READ the system config (assuming Firestore rules allow it)
    if (!!db) {
        try {
            const docRef = doc(db, "system", "config");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data();
            }
        } catch (e) {
            console.error("Cloud fetch system keys error", e);
        }
    }
    return null;
};

export const apiSaveSystemKeys = async (keys: { googleApiKey?: string, openaiApiKey?: string, openaiBaseUrl?: string, openaiModel?: string }): Promise<void> => {
    // Requires Write Permissions (Admin)
    if (!!db) {
        try {
            // We use setDoc with merge to update keys
            await setDoc(doc(db, "system", "config"), keys, { merge: true });
        } catch (e) {
            console.error("Cloud save system keys error. Ensure you have write permissions.", e);
            throw e; // Rethrow to let UI handle error
        }
    }
};

// --- USER PROFILE ---
export const apiGetUserProfile = async (): Promise<UserProfile | null> => {
    if (isCloudEnabled() && auth.currentUser) {
        try {
            const docRef = doc(db, "users", auth.currentUser.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const profile = docSnap.data() as UserProfile;
                // Cache to local
                localStorage.setItem('fitlife_profile', JSON.stringify(profile));
                return profile;
            }
        } catch (e) {
            console.error("Cloud fetch profile error", e);
        }
    }
    // Fallback to local
    const local = localStorage.getItem('fitlife_profile');
    return local ? JSON.parse(local) : null;
};

export const apiSaveUserProfile = async (profile: UserProfile): Promise<void> => {
    // Always save local as backup/cache/immediate UI update
    localStorage.setItem('fitlife_profile', JSON.stringify(profile));

    if (isCloudEnabled() && auth.currentUser) {
        try {
            await setDoc(doc(db, "users", auth.currentUser.uid), profile, { merge: true });
        } catch (e) {
            console.error("Cloud save profile error", e);
        }
    }
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
            const history = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkoutRecord));
            
            // Update local cache
            localStorage.setItem('fitlife_history', JSON.stringify(history));
            return history;
        } catch (e) {
            console.error("Cloud fetch history error", e);
        }
    }
    const local = localStorage.getItem('fitlife_history');
    return local ? JSON.parse(local) : MOCK_HISTORY;
};

export const apiSaveWorkoutRecord = async (record: WorkoutRecord): Promise<void> => {
    // Local Update
    const current = localStorage.getItem('fitlife_history');
    const history = current ? JSON.parse(current) : MOCK_HISTORY;
    const newHistory = [record, ...history];
    localStorage.setItem('fitlife_history', JSON.stringify(newHistory));

    // Cloud Update
    if (isCloudEnabled() && auth.currentUser) {
        try {
            await setDoc(doc(db, `users/${auth.currentUser.uid}/workouts`, record.id), record);
        } catch (e) {
            console.error("Cloud save workout error", e);
        }
    }
};

export const apiDeleteWorkoutRecord = async (recordId: string): Promise<void> => {
    // Local Update
    const current = localStorage.getItem('fitlife_history');
    if (current) {
        const history = JSON.parse(current);
        const newHistory = history.filter((r: WorkoutRecord) => r.id !== recordId);
        localStorage.setItem('fitlife_history', JSON.stringify(newHistory));
    }

    // Cloud Update
    if (isCloudEnabled() && auth.currentUser) {
        try {
            await deleteDoc(doc(db, `users/${auth.currentUser.uid}/workouts`, recordId));
        } catch (e) {
            console.error("Cloud delete workout error", e);
        }
    }
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
            const logs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NutritionLog));
            
            localStorage.setItem('fitlife_nutrition', JSON.stringify(logs));
            return logs;
        } catch (e) {
            console.error("Cloud fetch nutrition error", e);
        }
    }
    const local = localStorage.getItem('fitlife_nutrition');
    return local ? JSON.parse(local) : NUTRITION_LOGS;
};

export const apiSyncNutritionState = async (logs: NutritionLog[]): Promise<void> => {
    // Local Sync
    localStorage.setItem('fitlife_nutrition', JSON.stringify(logs));

    // Cloud Sync (Batched or Individual - Simplified for this app)
    // In a real app, we would track diffs. Here, we blindly ensure the items in 'logs' exist in cloud.
    // NOTE: This simple implementation doesn't handle deletions from another device efficiently without a proper sync engine.
    // For now, we rely on individual save/delete actions to keep things in sync.
};

export const apiSaveNutritionLog = async (log: NutritionLog): Promise<void> => {
    if (isCloudEnabled() && auth.currentUser) {
        try {
            await setDoc(doc(db, `users/${auth.currentUser.uid}/nutrition`, log.id), log);
        } catch (e) {
            console.error("Cloud save nutrition error", e);
        }
    }
};

export const apiDeleteNutritionLog = async (logId: string): Promise<void> => {
    if (isCloudEnabled() && auth.currentUser) {
        try {
            await deleteDoc(doc(db, `users/${auth.currentUser.uid}/nutrition`, logId));
        } catch (e) {
            console.error("Cloud delete nutrition error", e);
        }
    }
};


// --- SCHEDULE ---
export const apiGetSchedule = async (): Promise<ScheduledWorkout[]> => {
    if (isCloudEnabled() && auth.currentUser) {
        try {
            const docRef = doc(db, `users/${auth.currentUser.uid}/settings/schedule`);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                const schedule = data.items as ScheduledWorkout[];
                localStorage.setItem('fitlife_schedule', JSON.stringify(schedule));
                return schedule;
            }
        } catch (e) {
            console.error("Cloud fetch schedule error", e);
        }
    }
    const local = localStorage.getItem('fitlife_schedule');
    return local ? JSON.parse(local) : [];
};

export const apiSaveSchedule = async (schedule: ScheduledWorkout[]): Promise<void> => {
    localStorage.setItem('fitlife_schedule', JSON.stringify(schedule));
    
    if (isCloudEnabled() && auth.currentUser) {
        try {
            // Save schedule as a single array inside a document for simplicity
            await setDoc(doc(db, `users/${auth.currentUser.uid}/settings/schedule`), { items: schedule });
        } catch (e) {
            console.error("Cloud save schedule error", e);
        }
    }
};

// --- EVENTS (Timetable) ---
export const apiGetEvents = async (): Promise<CalendarEvent[]> => {
    if (isCloudEnabled() && auth.currentUser) {
        try {
            const q = query(
                collection(db, `users/${auth.currentUser.uid}/events`)
            );
            const querySnapshot = await getDocs(q);
            const events = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CalendarEvent));
            localStorage.setItem('fitlife_events', JSON.stringify(events));
            return events;
        } catch (e) {
            console.error("Cloud fetch events error", e);
        }
    }
    const local = localStorage.getItem('fitlife_events');
    return local ? JSON.parse(local) : [];
};

export const apiSaveEvent = async (event: CalendarEvent): Promise<void> => {
     // Local Update
    const current = localStorage.getItem('fitlife_events');
    const events = current ? JSON.parse(current) : [];
    // remove existing if exists (edit) then add
    const newEvents = [...events.filter((e: CalendarEvent) => e.id !== event.id), event];
    localStorage.setItem('fitlife_events', JSON.stringify(newEvents));

    if (isCloudEnabled() && auth.currentUser) {
        try {
            await setDoc(doc(db, `users/${auth.currentUser.uid}/events`, event.id), event);
        } catch (e) {
            console.error("Cloud save event error", e);
        }
    }
};

export const apiDeleteEvent = async (eventId: string): Promise<void> => {
     // Local Update
    const current = localStorage.getItem('fitlife_events');
    if (current) {
        const events = JSON.parse(current);
        const newEvents = events.filter((e: CalendarEvent) => e.id !== eventId);
        localStorage.setItem('fitlife_events', JSON.stringify(newEvents));
    }

    if (isCloudEnabled() && auth.currentUser) {
        try {
            await deleteDoc(doc(db, `users/${auth.currentUser.uid}/events`, eventId));
        } catch (e) {
            console.error("Cloud delete event error", e);
        }
    }
};
