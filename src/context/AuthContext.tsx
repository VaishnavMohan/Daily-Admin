
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../services/SupabaseClient';

interface AuthContextType {
    session: Session | null;
    user: any | null; // Supabase user
    isLoading: boolean;
    isGuest: boolean;
    enterGuestMode: () => void;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    isLoading: true,
    isGuest: false,
    enterGuestMode: () => { },
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

import AsyncStorage from '@react-native-async-storage/async-storage';

// ... other imports ...

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(false);

    useEffect(() => {
        const initializeAuth = async () => {
            // Check for existing session
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                setSession(session);
                setIsGuest(false);
            } else {
                // If no session, check if we've already set guest mode, or default to it?
                // Plan: Default to Guest Mode immediately for new installs.
                // We can check if "hasLaunched" exists to know if it's first launch, but 
                // for "Guest First", we just treat no-session as Guest.
                setIsGuest(true);
            }
            setIsLoading(false);
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) {
                setIsGuest(false);
            } else {
                // If session expires or signs out, go back to Guest
                setIsGuest(true);
            }
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const enterGuestMode = async () => {
        setIsGuest(true);
        // We might want to persist "guest_started" marker if needed later
        await AsyncStorage.setItem('guest_mode_active', 'true');
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setIsGuest(true); // Explicitly go to guest mode
    };

    const value = {
        session,
        user: session?.user ?? null,
        isLoading,
        isGuest,
        enterGuestMode,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
