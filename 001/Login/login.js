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
function showError(message, type = 'error') {
    errorMessage.textContent = message;
    errorMessage.className = `error-message ${type}`;
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

// Function to check login status on page load
async function checkLoginStatus() {
    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (session) {
            console.log('User is logged in:', session.user.email);
            // Redirect to dashboard or home page
            window.location.href = '../index.html';
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

        // Attempt to login
        console.log('Attempting to login with:', { email, password });
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
        // Show success message
        showError('Login successful! Redirecting...', 'success');
        // Redirect to dashboard or home page after a short delay
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

// Check login status on page load
document.addEventListener('DOMContentLoaded', checkLoginStatus);

// Add event listeners for input validation
emailInput.addEventListener('input', () => {
    hideError();
});

passwordInput.addEventListener('input', () => {
    hideError();
}); 