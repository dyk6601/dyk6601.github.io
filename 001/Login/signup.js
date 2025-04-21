// Import Supabase client
import { supabaseClient } from '../js/supabase-config.js';

// DOM Elements
const signupForm = document.getElementById('signupForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const errorMessage = document.getElementById('errorMessage');
const loadingIndicator = document.getElementById('loadingIndicator');

// Function to show loading state
function showLoading() {
    loadingIndicator.style.display = 'block';
    signupForm.querySelector('button[type="submit"]').disabled = true;
}

// Function to hide loading state
function hideLoading() {
    loadingIndicator.style.display = 'none';
    signupForm.querySelector('button[type="submit"]').disabled = false;
}

// Function to show error message
function showError(message, type = 'error') {
    errorMessage.textContent = message;
    errorMessage.className = `error-message ${type}`;
    errorMessage.style.display = 'block';
}

// Function to hide error message
function hideError() {
    errorMessage.style.display = 'none';
}

// Function to validate password
function validatePassword(password, confirmPassword) {
    if (password.length < 4) {
        return 'Password must be at least 4 characters long';
    }
    if (password !== confirmPassword) {
        return 'Passwords do not match';
    }
    return null;
}

// Function to validate email
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return 'Please enter a valid email address';
    }
    return null;
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

// Event listener for form submission
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

// Add event listeners for input validation
emailInput.addEventListener('input', () => {
    hideError();
});

passwordInput.addEventListener('input', () => {
    hideError();
});

confirmPasswordInput.addEventListener('input', () => {
    hideError();
}); 