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

// Initialize emoji picker for edit form
const editEmojiPickerBtn = document.getElementById('editEmojiPickerBtn');
const editLessonCategoryInput = document.getElementById('editLessonCategory');
let editEmojiPicker = null;

if (editEmojiPickerBtn && editLessonCategoryInput) {
    editEmojiPickerBtn.addEventListener('click', () => {
        if (!editEmojiPicker) {
            editEmojiPicker = document.createElement('emoji-picker');
            // Position the emoji picker relative to the button
            const buttonRect = editEmojiPickerBtn.getBoundingClientRect();
            editEmojiPicker.style.position = 'absolute';
            editEmojiPicker.style.top = `${buttonRect.bottom + window.scrollY}px`;
            editEmojiPicker.style.left = `${buttonRect.left + window.scrollX}px`;
            editEmojiPicker.style.zIndex = '1000';
            document.body.appendChild(editEmojiPicker);
            editEmojiPicker.addEventListener('emoji-click', event => {
                editLessonCategoryInput.value += event.detail.unicode;
                editEmojiPicker.remove();
                editEmojiPicker = null;
            });
        } else {
            editEmojiPicker.remove();
            editEmojiPicker = null;
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

// Close modal when pressing ESC key
window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && editModal.style.display === 'block') {
        hideModal();
    }
});

// Function to animate percentage change
function animatePercentageChange(startValue, endValue, element, duration = 1500) {
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
    
    // Check if we already added a lesson today
    if (lastLessonDate !== today) {
        // Generate random percentage between 0.20 and 0.50
        const randomPercentage = (Math.random() * (0.50 - 0.20) + 0.20).toFixed(2);
        
        // Update the displayed percentage
        if (dailyPercentageElement) {
            const currentDailyPercentage = parseFloat(dailyPercentageElement.textContent);
            animatePercentageChange(currentDailyPercentage || 0.01, randomPercentage, dailyPercentageElement);
        }
        
        // Update the last lesson date
        lastLessonDate = today;
        
        //Store in localStorage to persist across page refreshes
        localStorage.setItem('lastLessonDate', today);
        localStorage.setItem('currentDailyPercentage', randomPercentage);
    }
}

// Function to add a new lesson
async function addLesson(content, category) {
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
        
        updateDailyPercentage();

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
async function editLesson(id, content, category) {
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
        hideModal(); // Close the modal after successful deletion
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
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Update category filter buttons
        updateCategoryFilters(lessons);

        // Store lessons in a global variable for filtering
        window.allLessons = lessons;

        // Display all lessons initially
        displayFilteredLessons('all');

    } catch (error) {
        console.error('Error loading lessons: ', error);
        alert('Error loading lessons. Please try again.');
    } finally {
        hideLoading(loadingLessons);
    }
}

// Function to update category filter buttons
function updateCategoryFilters(lessons) {
    const categoryFilter = document.querySelector('.category-filter');
    if (!categoryFilter) return;

    // Count category occurrences
    const categoryCounts = lessons.reduce((acc, lesson) => {
        if (lesson.category) {
            acc[lesson.category] = (acc[lesson.category] || 0) + 1;
        }
        return acc;
    }, {});

    // Convert to array and sort by count
    const sortedCategories = Object.entries(categoryCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 10)  // Take only top 10
        .map(([category]) => category);

    // Keep the "All" button
    categoryFilter.innerHTML = '<button class="category-btn active" data-category="all">All</button>';

    // Add buttons for each category
    sortedCategories.forEach(category => {
        const button = document.createElement('button');
        button.className = 'category-btn';
        button.dataset.category = category;
        button.textContent = category;
        categoryFilter.appendChild(button);
    });

    // Add click event listeners to category buttons
    categoryFilter.addEventListener('click', (e) => {
        if (e.target.classList.contains('category-btn')) {
            // Remove active class from all buttons
            categoryFilter.querySelectorAll('.category-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            // Add active class to clicked button
            e.target.classList.add('active');
            // Filter lessons
            displayFilteredLessons(e.target.dataset.category);
        }
    });
}

// Function to display filtered lessons
function displayFilteredLessons(category) {
    const lessonsContainer = document.querySelector('.lesson-container');
    if (!lessonsContainer || !window.allLessons) return;

    const filteredLessons = category === 'all' 
        ? window.allLessons 
        : window.allLessons.filter(lesson => lesson.category === category);

    lessonsContainer.innerHTML = '';
    
    if (filteredLessons.length === 0) {
        lessonsContainer.innerHTML = '<p>No lessons found in this category.</p>';
        return;
    }

    filteredLessons.forEach(lesson => {
        const lessonElement = document.createElement('div');
        lessonElement.className = 'lesson-box';
        const date = new Date(lesson.created_at);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        lessonElement.innerHTML = `
            <p>${lesson.content}</p>
            <div class="lesson-category"><span>${lesson.category}</span></div>
            <div class="lesson-date">${date.toLocaleDateString('en-US', options)}</div>
        `;
        
        // Add click event to open modal
        lessonElement.addEventListener('click', () => {
            document.getElementById('editLessonId').value = lesson.id;
            document.getElementById('editLessonContent').value = lesson.content;
            document.getElementById('editLessonCategory').value = lesson.category;
            document.querySelector('.lesson-date-display').textContent = `${date.toLocaleDateString('en-US', options)}`;
            showModal();
        });
        
        lessonsContainer.appendChild(lessonElement);
    });
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

// Event listener for login form submission
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        await handleLogin(email, password);
    });
}

// Event listener for logout button
if (logoutButton) {
    logoutButton.addEventListener('click', async (e) => {
        e.preventDefault();
        await handleLogout();
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

// Add event listener for delete button
if (deleteLessonForm) {
    deleteLessonForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editLessonId').value;
        await deleteLesson(id);
        hideModal();
    });
}

// Add event listener for delete option in dropdown
document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-option')) {
        const id = document.getElementById('editLessonId').value;
        await deleteLesson(id);
        hideModal();
    }
});

// Toggle dropdown menu
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('more-options')) {
        const dropdown = document.querySelector('.dropdown-content');
        dropdown.classList.toggle('show');
    } else if (!e.target.closest('.dropdown')) {
        const dropdown = document.querySelector('.dropdown-content');
        if (dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
        }
    }
});

// Add keyboard shortcut for Add Lesson button
document.addEventListener('keydown', (e) => {
    // Check if Ctrl+Enter (Windows) or Cmd+Enter (Mac) is pressed, or Shift+Enter
    if (((e.ctrlKey || e.metaKey) && e.key === 'Enter') || (e.shiftKey && e.key === 'Enter')) {
        // Check if we're in the main form
        if (document.activeElement.id === 'lessonContent') {
            e.preventDefault();
            document.getElementById('submitButton').click();
        }
        // Check if we're in the edit form
        else if (document.activeElement.id === 'editLessonContent') {
            e.preventDefault();
            document.querySelector('#editLessonForm button[type="submit"]').click();
        }
    }
    
    // Check if Ctrl+D (Windows) or Cmd+D (Mac) is pressed and modal is open
    if ((e.ctrlKey || e.metaKey) && e.key === 'd' && editModal.style.display === 'block') {
        e.preventDefault();
        const id = document.getElementById('editLessonId').value;
        deleteLesson(id);
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