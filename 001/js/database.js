// Database operations
const lessonForm = document.getElementById('lessonForm');
const submitButton = document.getElementById('submitButton');
const loadingIndicator = document.getElementById('loadingIndicator');
const loadingLessons = document.getElementById('loadingLessons');
const editModal = document.getElementById('editModal');
const editLessonForm = document.getElementById('editLessonForm');
const closeModal = document.querySelector('.close');

// Function to show loading state
function showLoading(element) {
    element.style.display = 'block';
}

// Function to hide loading state
function hideLoading(element) {
    element.style.display = 'none';
}

// Function to show modal
function showModal() {
    editModal.style.display = 'block';
}

// Function to hide modal
function hideModal() {
    editModal.style.display = 'none';
}

// Close modal when clicking the X
closeModal.addEventListener('click', hideModal);

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === editModal) {
        hideModal();
    }
});

// Function to add a new lesson
async function addLesson(title, content) {
    try {
        showLoading(loadingIndicator);
        submitButton.disabled = true;

        const { data, error } = await supabase
            .from('lessons')
            .insert([
                { 
                    title: title, 
                    content: content,
                    created_at: new Date().toISOString()
                }
            ]);

        if (error) throw error;
        
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
async function editLesson(id, title, content) {
    try {
        const { error } = await supabase
            .from('lessons')
            .update({ title, content })
            .eq('id', id);

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
        const { error } = await supabase
            .from('lessons')
            .delete()
            .eq('id', id);

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
        const lessonsContainer = document.querySelector('.lesson-container');
        if (!lessonsContainer) return;

        showLoading(loadingLessons);

        const { data: lessons, error } = await supabase
            .from('lessons')
            .select('*')
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
                <button class="edit-button" data-id="${lesson.id}">Edit</button>
                <button class="delete-button" data-id="${lesson.id}">Delete</button>
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
                    document.getElementById('editLessonTitle').value = lesson.title;
                    document.getElementById('editLessonContent').value = lesson.content;
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
        lessonsContainer.innerHTML = '<p>Error loading lessons. Please try refreshing the page.</p>';
    } finally {
        hideLoading(loadingLessons);
    }
}

// Event listener for form submission
lessonForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('lessonTitle').value;
    const content = document.getElementById('lessonContent').value;
    await addLesson(title, content);
});

// Event listener for edit form submission
editLessonForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editLessonId').value;
    const title = document.getElementById('editLessonTitle').value;
    const content = document.getElementById('editLessonContent').value;
    await editLesson(id, title, content);
});

// Load lessons when the page loads
document.addEventListener('DOMContentLoaded', loadLessons); 