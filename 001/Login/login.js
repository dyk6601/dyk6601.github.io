// Import Supabase client
import { supabaseClient } from '../js/supabase-config.js';

console.log('Login script loaded');

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM content loaded');
    
    // DOM Elements
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('errorMessage');
    const loadingIndicator = document.getElementById('loadingIndicator');

    console.log('DOM elements loaded:', {
        loginForm: !!loginForm,
        emailInput: !!emailInput,
        passwordInput: !!passwordInput,
        errorMessage: !!errorMessage,
        loadingIndicator: !!loadingIndicator
    });

    // Function to show loading state
    function showLoading() {
        if (loadingIndicator) {
            loadingIndicator.style.display = 'block';
        }
        if (loginForm) {
            const submitButton = loginForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
            }
        }
    }

    // Function to hide loading state
    function hideLoading() {
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        if (loginForm) {
            const submitButton = loginForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    }

    // Function to show error message
    function showError(message, type = 'error') {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.className = `error-message ${type}`;
            errorMessage.style.display = 'block';
        }
    }

    // Function to hide error message
    function hideError() {
        if (errorMessage) {
            errorMessage.style.display = 'none';
        }
    }

    // Function to check login status
    async function checkLoginStatus() {
        try {
            console.log('Checking login status...');
            const { data: { session }, error } = await supabaseClient.auth.getSession();
            if (error) {
                console.error('Error checking session:', error);
                return;
            }
            if (session) {
                console.log('User is logged in:', session.user.email);
                window.location.href = '../index.html';
            } else {
                console.log('No active session found');
            }
        } catch (error) {
            console.error('Error checking login status:', error);
        }
    }

    // Function to handle login
    async function handleLogin(email, password) {
        try {
            showLoading();
            hideError();

            console.log('Attempting to login with:', { email });
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                console.error('Login error:', error);
                showError(error.message);
                return;
            }

            console.log('Login successful:', data);
            showError('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1500);
        } catch (error) {
            console.error('Unexpected error during login:', error);
            showError('An unexpected error occurred. Please try again.');
        } finally {
            hideLoading();
        }
    }

    // Add event listeners
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            if (!email || !password) {
                showError('Please fill in all fields');
                return;
            }

            await handleLogin(email, password);
        });
    }

    // Check login status
    checkLoginStatus();
}); 