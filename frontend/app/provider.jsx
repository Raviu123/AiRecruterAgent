"use client"
import { useState, useEffect, useContext, useRef } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/services/supabaseClient'
import { apiRequest } from '@/services/apiClient'
import UserDetailContext from '@/context/UserDetailContext';

/**
 * Tracks the Supabase auth session (email/password sign-in goes through the backend,
 * see services/authService.js) and syncs the user's profile row through the backend.
 */
const Provider = ({children}) => {
    const [user, setUser] = useState();
    const [session, setSession] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const syncedTokenRef = useRef(null);

    useEffect(() => {
        const syncUser = async (currentSession) => {
            setSession(currentSession);
            if (!currentSession) {
                syncedTokenRef.current = null;
                setUser(undefined);
                setAuthLoading(false);
                return;
            }
            if (syncedTokenRef.current === currentSession.access_token) {
                setAuthLoading(false);
                return;
            }
            syncedTokenRef.current = currentSession.access_token;
            try {
                const profile = await apiRequest('/api/users/me', {
                    method: 'POST',
                    token: currentSession.access_token,
                });
                setUser(profile);
            } catch (err) {
                console.error('Error syncing user with backend:', err);
                toast.error(`Could not load your profile: ${err.message}`);
            } finally {
                setAuthLoading(false);
            }
        };

        // Emits INITIAL_SESSION immediately, then SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
            // Supabase recommends not awaiting other calls inside this callback.
            setTimeout(() => syncUser(currentSession), 0);
        });

        return () => subscription.unsubscribe();
    }, [])

    return (
        <UserDetailContext.Provider value={{user, setUser, session, authLoading}}>
            <div>{children}</div>
        </UserDetailContext.Provider>
    )
}

export default Provider

export const useUser = () => {
    const context = useContext(UserDetailContext);
    return context
}
