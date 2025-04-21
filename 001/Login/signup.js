import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseClient = createClient(
  'https://wrlxxfnvksegfehlvuls.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndybHh4Zm52a3NlZ2ZlaGx2dWxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyMDA1NTEsImV4cCI6MjA2MDc3NjU1MX0.kSmjtAe2N6NM591vTxX0W6namQGXIz7sZk3WSigg1wY'
);

// Wait for DOM to be fully loaded
    document.addEventListener('DOMContentLoaded', () => {
    console.log('Signup script loaded');
    
    // Get form elements
    const form = document.getElementById('signupForm');
    const errorMsg = document.getElementById('errorMessage');
    const loading = document.getElementById('loadingIndicator');
    
    // Hide loading indicator initially
    loading.style.display = 'none';
    
    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Form submitted');
        
        // Get input values
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();
        
        console.log('Email:', email);
        
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
            console.log('Attempting to sign up with Supabase...');
            
            // Sign up with Supabase
            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    emailRedirectTo: 'https://dyk6601.github.io/Login/login.html'
                }
            });
            
            console.log('Signup response:', { data, error });
            
            if (error) {
                console.error('Signup error:', error);
                showMessage(error.message, 'error');
            } else {
                console.log('Signup successful:', data);
                showMessage('Signup successful! Please check your email to verify your account.', 'success');
                // Redirect after 3 seconds
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 3000);
            }
        } catch (error) {
            console.error('Unexpected error during signup:', error);
            showMessage('Failed to sign up. Please try again.', 'error');
        } finally {
            // Hide loading
            loading.style.display = 'none';
        }
    });
    
    // Helper function to show messages
    function showMessage(message, type) {
        console.log('Showing message:', { message, type });
        errorMsg.textContent = message;
        errorMsg.className = `error-message ${type}`;
        errorMsg.style.display = 'block';
    }
});