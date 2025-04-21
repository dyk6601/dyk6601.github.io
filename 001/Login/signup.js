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
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

// Function to hide error message
function hideError() {
    errorMessage.style.display = 'none';
}

// Function to validate password
function validatePassword(password, confirmPassword) {
    if (password.length < 6) {
        return 'Password must be at least 6 characters long';
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

// Function to handle successful signup
function handleSuccessfulSignup() {
    // Redirect to login page
    window.location.href = 'login.html';
}

// Function to handle signup
async function handleSignup(email, password) {
    try {
        showLoading();
        hideError();

        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                emailRedirectTo: window.location.origin + '/Login/login.html'
            }
        });

        if (error) throw error;

        if (data.user) {
            alert('Signup successful! Please check your email to verify your account.');
            handleSuccessfulSignup();
        }
    } catch (error) {
        console.error('Signup error:', error);
        showError(error.message || 'Failed to sign up. Please try again.');
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

    // Validate inputs
    const emailError = validateEmail(email);
    if (emailError) {
        showError(emailError);
        return;
    }

    const passwordError = validatePassword(password, confirmPassword);
    if (passwordError) {
        showError(passwordError);
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