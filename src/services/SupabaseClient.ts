import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Configured using user provided credentials
const SUPABASE_URL = 'https://xnmrblnpsttaozgslmcn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhubXJibG5wc3R0YW96Z3NsbWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNjU2MjUsImV4cCI6MjA4Njc0MTYyNX0.HD2S0aTpSZ7UJFETc8Zhsfes0LggB5aiFGS6QK4HSBQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
