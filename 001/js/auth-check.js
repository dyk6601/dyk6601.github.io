// Import Supabase client
import { supabaseClient } from './supabase-config.js';

// Function to check login status and update UI
async function checkAuthStatus() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        const authLink = document.getElementById("auth-link");
        
        if (session) {
            // User is logged in
            authLink.innerHTML = '<a href="../Login/logout.html">Logout</a>';
        } else {
            // User is not logged in
            authLink.innerHTML = '<a href="../Login/login.html">Login</a>';
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        // Default to login link if there's an error
        const authLink = document.getElementById("auth-link");
        authLink.innerHTML = '<a href="../001/login.html">Login</a>';
    }
}

// Export the function
export { checkAuthStatus }; 