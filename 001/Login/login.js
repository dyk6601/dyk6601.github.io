// Import Supabase client
import { supabaseClient } from '../js/supabase-config.js';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('errorMessage');
const loadingIndicator = document.getElementById('loadingIndicator');

// Function to show loading state
function showLoading() {
    loadingIndicator.style.display = 'block';
    loginForm.querySelector('button[type="submit"]').disabled = true;
}

// Function to hide loading state
function hideLoading() {
    loadingIndicator.style.display = 'none';
    loginForm.querySelector('button[type="submit"]').disabled = false;
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

// Function to handle successful login
function handleSuccessfulLogin() {
    // Store user session
    localStorage.setItem('isLoggedIn', 'true');
    
    // Redirect to home page or dashboard
    window.location.href = '../index.html';
}

// Function to handle login
async function handleLogin(email, password) {
    try {
        showLoading();
        hideError();

        // Attempt to login
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
        handleSuccessfulLogin();
    } catch (error) {
        console.error('Unexpected error during login:', error);
        showError('An unexpected error occurred. Please try again.');
    } finally {
        hideLoading();
    }
}

// Function to check if user is already logged in
function checkAuthStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
        window.location.href = '../index.html';
    }
}

// Event listener for form submission
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

// Check auth status when page loads
document.addEventListener('DOMContentLoaded', checkAuthStatus);

// Add event listeners for input validation
emailInput.addEventListener('input', () => {
    hideError();
});

passwordInput.addEventListener('input', () => {
    hideError();
}); 