// Import Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

console.log('Supabase config loaded');

// Supabase configuration
const SUPABASE_URL = 'https://wrlxxfnvksegfehlvuls.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndybHh4Zm52a3NlZ2ZlaGx2dWxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyMDA1NTEsImV4cCI6MjA2MDc3NjU1MX0.kSmjtAe2N6NM591vTxX0W6namQGXIz7sZk3WSigg1wY';

// Initialize Supabase client with error handling
let supabaseClient;
try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    });
    console.log('Supabase client initialized successfully');
} catch (error) {
    console.error('Error initializing Supabase client:', error);
    // Create a mock client that will throw errors when used
    supabaseClient = {
        auth: {
            getSession: async () => { throw new Error('Supabase client failed to initialize') },
            signInWithPassword: async () => { throw new Error('Supabase client failed to initialize') },
            signUp: async () => { throw new Error('Supabase client failed to initialize') }
        }
    };
}

// Export the client
export { supabaseClient };