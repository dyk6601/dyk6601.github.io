// Import Supabase client
import { supabaseClient } from '../js/supabase-config.js';

async function logoutUser() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            console.error('Error during logout:', error.message);
            alert('Failed to logout. Please try again.');
            return;
        }

        // Redirect to home page after successful logout
        window.location.href = '../index.html';
    } catch (err) {
        console.error('Unexpected error during logout:', err);
        window.location.href = '../index.html'; // Fallback redirect
    }
}

logoutUser();
