import { supabaseClient as supabase } from './supabase-config.js';

let lastLessonDate = null;

// Database operations
const lessonForm = document.getElementById('lessonForm');
const submitButton = document.getElementById('submitButton');
const loadingIndicator = document.getElementById('loadingIndicator');
const loadingLessons = document.getElementById('loadingLessons');
const editModal = document.getElementById('editModal');
const editLessonForm = document.getElementById('editLessonForm');
const deleteLessonForm = document.getElementById('deleteLessonForm');
const closeModal = document.querySelector('.close');
const dailyPercentageElement = document.getElementById('dailyPercentage');
const loginSection = document.getElementById('loginSection');
const lessonSection = document.getElementById('lessonSection');
const loginForm = document.getElementById('loginForm');
const logoutButton = document.getElementById('logoutButton');

// Initialize emoji picker for add form
const emojiPickerBtn = document.getElementById('emojiPickerBtn');
const lessonCategoryInput = document.getElementById('lessonCategory');
let emojiPicker = null;

if (emojiPickerBtn && lessonCategoryInput) {
    emojiPickerBtn.addEventListener('click', () => {
        if (!emojiPicker) {
            emojiPicker = document.createElement('emoji-picker');
            document.body.appendChild(emojiPicker);
            emojiPicker.addEventListener('emoji-click', event => {
                lessonCategoryInput.value += event.detail.unicode;
                emojiPicker.remove();
                emojiPicker = null;
            });
        } else {
            emojiPicker.remove();
            emojiPicker = null;
        }
    });
}

// Function to check if user is authenticated
async function checkAuth() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
}

// Function to show loading state
function showLoading(element) {
    if (element) {
        element.style.display = 'block';
    }
}

// Function to hide loading state
function hideLoading(element) {
    if (element) {
        element.style.display = 'none';
    }
}

// Function to animate percentage change
function animatePercentageChange(startValue, endValue, element, duration = 3000) {
    const startTime = performance.now();
    const startValueNum = parseFloat(startValue);
    const endValueNum = parseFloat(endValue);
    
    function updateNumber(currentTime) {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        // Easing function for smoother animation
        const easeOutQuad = progress * (2 - progress);
        
        // Calculate current value
        const currentValue = startValueNum + (endValueNum - startValueNum) * easeOutQuad;
        
        // Update element with formatted value
        element.textContent = `${currentValue.toFixed(2)}% a day`;
        
        // Continue animation if not complete
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    requestAnimationFrame(updateNumber);
}

// Function to update daily percentage
function updateDailyPercentage() {
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem('lastLessonDate');
    const storedPercentage = localStorage.getItem('currentDailyPercentage');
    
    // Only generate new percentage if it's a new day
    if (storedDate !== today) {
        // Generate random percentage between 0.20 and 0.50
        const randomPercentage = (Math.random() * (0.50 - 0.20) + 0.20).toFixed(2);
        
        // Store the new percentage
        localStorage.setItem('lastLessonDate', today);
        localStorage.setItem('currentDailyPercentage', randomPercentage);
    }
    
    // Always animate from 0.01 to the stored percentage
    if (dailyPercentageElement) {
        const targetPercentage = storedPercentage || '0.01';
        animatePercentageChange(0.01, targetPercentage, dailyPercentageElement);
    }
}

// Function to add a new lesson
async function addLesson(content, category = "") {
    try {
        const { user, error: authError } = await checkAuth();
        if (authError || !user) {
            alert('Please log in to add a lesson');
            showLoginUI();
            return;
        }

        showLoading(loadingIndicator);
        submitButton.disabled = true;

        const { data, error } = await supabase
            .from('lessons')
            .insert([
                { 
                    content: content,
                    category: category,
                    created_at: new Date().toISOString(),
                    user_id: user.id
                }
            ]);

        if (error) throw error;
        
        // Update the percentage with animation
        const today = new Date().toDateString();
        const storedDate = localStorage.getItem('lastLessonDate');
        const storedPercentage = localStorage.getItem('currentDailyPercentage');
        
        if (storedDate !== today) {
            const randomPercentage = (Math.random() * (0.50 - 0.20) + 0.20).toFixed(2);
            localStorage.setItem('lastLessonDate', today);
            localStorage.setItem('currentDailyPercentage', randomPercentage);
            if (dailyPercentageElement) {
                animatePercentageChange(0.01, randomPercentage, dailyPercentageElement);
            }
        } else if (dailyPercentageElement) {
            animatePercentageChange(0.01, storedPercentage, dailyPercentageElement);
        }

        alert('Lesson added successfully!');
        lessonForm.reset();
        await loadLessons();
    } catch (error) {
        console.error('Error adding lesson: ', error);
        alert('Error adding lesson. Please try again.');
    } finally {
        hideLoading(loadingIndicator);
        submitButton.disabled = false;
    }
}

// Function to edit a lesson
async function editLesson(id, content, category = "") {
    try {
        const { user, error: authError } = await checkAuth();
        if (authError || !user) {
            alert('Please log in to edit lessons');
            showLoginUI();
            return;
        }

        // Check if lesson belongs to current user
        const { data: lessonData, error: fetchError } = await supabase
            .from('lessons')
            .select('user_id')
            .eq('id', id)
            .single();
            
        if (fetchError) throw fetchError;
        
        if (lessonData.user_id !== user.id) {
            alert('You can only edit your own lessons');
            return;
        }

        const { error } = await supabase
            .from('lessons')
            .update({ content, category })
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) throw error;

        alert('Lesson updated successfully!');
        hideModal();
        await loadLessons();
    } catch (error) {
        console.error('Error updating lesson: ', error);
        alert('Error updating lesson. Please try again.');
    }
}

// Function to delete a lesson
async function deleteLesson(id) {
    if (!confirm('Are you sure you want to delete this lesson?')) return;

    try {
        const { user, error: authError } = await checkAuth();
        if (authError || !user) {
            alert('Please log in to delete lessons');
            showLoginUI();
            return;
        }

        // Check if lesson belongs to current user
        const { data: lessonData, error: fetchError } = await supabase
            .from('lessons')
            .select('user_id')
            .eq('id', id)
            .single();
            
        if (fetchError) throw fetchError;
        
        if (lessonData.user_id !== user.id) {
            alert('You can only delete your own lessons');
            return;
        }

        const { error } = await supabase
            .from('lessons')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id); // Additional check to ensure user can only delete their own lessons

        if (error) throw error;
        
        alert('Lesson deleted successfully!');
        await loadLessons();
    } catch (error) {
        console.error('Error deleting lesson: ', error);
        alert('Error deleting lesson. Please try again.');
    }
}

// Function to load lessons
async function loadLessons() {
    try {
        const { user, error: authError } = await checkAuth();
        if (authError || !user) {
            console.log('User not authenticated, not loading lessons');
            showLoginUI();
            return;
        }

        const lessonsContainer = document.querySelector('.lesson-container');
        if (!lessonsContainer) return;

        showLoading(loadingLessons);

        const { data: lessons, error } = await supabase
            .from('lessons')
            .select('*')
            .eq('user_id', user.id) // Only fetch lessons belonging to current user
            .order('created_at', { ascending: false });

        if (error) throw error;

        lessonsContainer.innerHTML = '';
        if (lessons.length === 0) {
            lessonsContainer.innerHTML = '<p>No lessons yet. Be the first to add one!</p>';
            return;
        }

        lessons.forEach(lesson => {
            const lessonElement = document.createElement('div');
            lessonElement.className = 'lesson-box'; 
            lessonElement.innerHTML = `
                <h2>${lesson.title}</h2>
                <p>${lesson.content}</p>
                <div class="lesson-date">${new Date(lesson.created_at).toLocaleDateString()}</div>
            `;
            lessonsContainer.appendChild(lessonElement);
        });

        // Add event listeners for edit and delete buttons
        document.querySelectorAll('.edit-button').forEach(button => {
            button.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                const lesson = lessons.find(l => l.id === id);
                if (lesson) {
                    document.getElementById('editLessonId').value = id;
                    document.getElementById('editLessonContent').value = lesson.content;
                    document.getElementById('editLessonCategory').value = lesson.category;
                    showModal();
                }
            });
        });

        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                await deleteLesson(id);
            });
        });
    } catch (error) {
        console.error('Error loading lessons: ', error);
        const lessonsContainer = document.querySelector('.lesson-container');
        if (lessonsContainer) {
            lessonsContainer.innerHTML = '<p>Error loading lessons. Please try refreshing the page.</p>';
        }
    } finally {
        hideLoading(loadingLessons);
    }
}

// Function to show login UI and hide lesson UI
function showLoginUI() {
    if (loginSection) {
        loginSection.style.display = 'block';
    }
    if (lessonSection) {
        lessonSection.style.display = 'none';
    }
}

// Function to show lesson UI and hide login UI
function showLessonUI() {
    if (loginSection) {
        loginSection.style.display = 'none';
    }
    if (lessonSection) {
        lessonSection.style.display = 'block';
    }
}

/*
// Function to handle user login
async function handleLogin(email, password) {
    try {
        showLoading(document.getElementById('loginLoading'));
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;
        
        showLessonUI();
        loadLessons();
    } catch (error) {
        console.error('Error logging in: ', error);
        alert('Error logging in: ' + error.message);
    } finally {
        hideLoading(document.getElementById('loginLoading'));
    }
}

// Function to handle user signup
async function handleSignup(email, password) {
    try {
        showLoading(document.getElementById('signupLoading'));
        
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password
        });

        if (error) throw error;
        
        alert('Signup successful! Please check your email for verification.');
    } catch (error) {
        console.error('Error signing up: ', error);
        alert('Error signing up: ' + error.message);
    } finally {
        hideLoading(document.getElementById('signupLoading'));
    }
}
// Event listener for login form submission
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        await handleLogin(email, password);
    });
}
// Event listener for signup form submission
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        await handleSignup(email, password);
    });
}

    */

/*
// Function to show modal
function showModal() {
    if (editModal) {
        editModal.style.display = 'block';
    }
}

// Function to hide modal
function hideModal() {
    if (editModal) {
        editModal.style.display = 'none';
    }
}

if (closeModal) {
    closeModal.addEventListener('click', hideModal);
}

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === editModal) {
        hideModal();
    }
});
*/

// Function to handle user logout
async function handleLogout() {
    try {
        await supabase.auth.signOut();
        showLoginUI();
        alert('You have been logged out');
    } catch (error) {
        console.error('Error logging out: ', error);
        alert('Error logging out: ' + error.message);
    }
}


// Event listener for logout button
if (logoutButton) {
    logoutButton.addEventListener('click', async (e) => {
        e.preventDefault();
        await handleLogout();
    });
}


// Event listener for form submission
if (lessonForm) {
    lessonForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const content = document.getElementById('lessonContent').value;
        const category = document.getElementById('lessonCategory').value;
        await addLesson(content, category);
    });
}

// Event listener for edit form submission
if (editLessonForm) {
    editLessonForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editLessonId').value;
        const content = document.getElementById('editLessonContent').value;
        const category = document.getElementById('editLessonCategory').value;
        await editLesson(id, content, category);
    });
}

// Add keyboard shortcut for Add Lesson button
document.addEventListener('keydown', (e) => {
    // Check if Ctrl+Enter (Windows) or Cmd+Enter (Mac) is pressed, or Shift+Enter
    if (((e.ctrlKey || e.metaKey) && e.key === 'Enter') || (e.shiftKey && e.key === 'Enter')) {
        // Check if we're in the main form
        if (document.activeElement.id === 'lessonContent') {
            e.preventDefault();
            document.getElementById('submitButton').click();
        }
    }
});

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication status
    const { user, error } = await checkAuth();
    
    if (user) {
        // User is logged in
        showLessonUI();
        loadLessons();
        
        // Initialize percentage display
        const storedDate = localStorage.getItem('lastLessonDate');
        const storedPercentage = localStorage.getItem('currentDailyPercentage');
        const today = new Date().toDateString();
        
        if (storedDate && storedDate === today && storedPercentage && dailyPercentageElement) {
            dailyPercentageElement.textContent = `${storedPercentage}% a day`;
            lastLessonDate = storedDate;
        } else if (dailyPercentageElement) {
            // Default value if no lesson has been added today
            dailyPercentageElement.textContent = '0.01% a day';
        }
    } else {
        // User is not logged in
        showLoginUI();
    }
});

// Add event listener for homepage navbar click
document.addEventListener('DOMContentLoaded', () => {
    const homeLink = document.querySelector('.nav a[href="../index.html"]');
    if (homeLink) {
        homeLink.addEventListener('click', (e) => {
            e.preventDefault();
            updateDailyPercentage();
            window.location.href = '../index.html';
        });
    }
});