// Import Supabase client
import { supabaseClient } from '../js/supabase-config.js';

console.log('Signup script loaded');

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM content loaded');
    
    // DOM Elements
    const signupForm = document.getElementById('signupForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const errorMessage = document.getElementById('errorMessage');
    const loadingIndicator = document.getElementById('loadingIndicator');

    console.log('DOM elements loaded:', {
        signupForm: !!signupForm,
        emailInput: !!emailInput,
        passwordInput: !!passwordInput,
        confirmPasswordInput: !!confirmPasswordInput,
        errorMessage: !!errorMessage,
        loadingIndicator: !!loadingIndicator
    });

    // Function to show loading state
    function showLoading() {
        if (loadingIndicator) {
            loadingIndicator.style.display = 'block';
        }
        if (signupForm) {
            const submitButton = signupForm.querySelector('button[type="submit"]');
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
        if (signupForm) {
            const submitButton = signupForm.querySelector('button[type="submit"]');
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

    // Function to handle signup
    async function handleSignup(email, password) {
        try {
            showLoading();
            hideError();

            console.log('Attempting to sign up with:', { email });
            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
            });

            if (error) {
                console.error('Signup error:', error);
                showError(error.message);
                return;
            }

            console.log('Signup successful:', data);
            showError('Signup successful! Please check your email to verify your account.', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
        } catch (error) {
            console.error('Unexpected error during signup:', error);
            showError('An unexpected error occurred. Please try again.');
        } finally {
            hideLoading();
        }
    }

    // Add event listeners
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            const confirmPassword = confirmPasswordInput.value.trim();

            if (!email || !password || !confirmPassword) {
                showError('Please fill in all fields');
                return;
            }

            if (password !== confirmPassword) {
                showError('Passwords do not match');
                return;
            }

            await handleSignup(email, password);
        });
    }
});