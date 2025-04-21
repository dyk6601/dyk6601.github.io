// Import Supabase client from config file
import { supabaseClient } from '../js/supabase-config.js';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get form elements
    const form = document.getElementById('signupForm');
    const errorMsg = document.getElementById('errorMessage');
    const loading = document.getElementById('loadingIndicator');
    
    // Hide loading indicator initially
    loading.style.display = 'none';
    
    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get input values
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();
        
        // Simple validation
        if (!email || !password || !confirmPassword) {
            showMessage('Please fill in all fields', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showMessage('Passwords do not match', 'error');
            return;
        }
        
        // Show loading and hide error
        loading.style.display = 'block';
        errorMsg.style.display = 'none';
        
        try {
            // Sign up with Supabase
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
            });
            
            if (error) {
                showMessage(error.message, 'error');
            } else {
                showMessage('Signup successful! Check your email to verify.', 'success');
                // Redirect after 3 seconds
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 3000);
            }
        } catch (error) {
            showMessage('Failed to sign up. Please try again.', 'error');
        }
        
        // Hide loading
        loading.style.display = 'none';
    });
    
    // Helper function to show messages
    function showMessage(message, type) {
        errorMsg.textContent = message;
        errorMsg.className = `error-message ${type}`;
        errorMsg.style.display = 'block';
    }
});