// main.js - Enhanced Checklist with Big Goals
import { supabaseClient as supabase } from '../js/supabase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const newGoalInput = document.getElementById('newGoalInput');
    const addGoalBtn = document.getElementById('addGoalBtn');
    const goalsContainer = document.getElementById('goalsContainer');
    
    // Create modal element
    const modalHTML = `
        <div id="editGoalModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Edit Goal</h2>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body">
                    <input type="text" id="editGoalTitle" class="modal-input" placeholder="Goal Title">
                    <div id="editItemsList" class="edit-items-list">
                        <!-- Items will be added here -->
                    </div>
                    <div class="add-item-modal">
                        <input type="text" id="newItemModal" placeholder="Add new item">
                        <button id="addItemModal">Add Item</button>
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="saveGoalChanges" class="save-btn">Save Changes</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Modal Elements
    const modal = document.getElementById('editGoalModal');
    const closeBtn = modal.querySelector('.close');
    const editGoalTitle = document.getElementById('editGoalTitle');
    const editItemsList = document.getElementById('editItemsList');
    const newItemModal = document.getElementById('newItemModal');
    const addItemModal = document.getElementById('addItemModal');
    const saveGoalChanges = document.getElementById('saveGoalChanges');

    let currentEditingGoal = null;

    // Modal Event Listeners
    closeBtn.onclick = () => modal.style.display = "none";
    window.onclick = (e) => {
        if (e.target === modal) modal.style.display = "none";
    };

    addItemModal.onclick = () => {
        const itemText = newItemModal.value.trim();
        if (itemText) {
            addItemToEditList(itemText);
            newItemModal.value = '';
        }
    };

    newItemModal.onkeypress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addItemModal.click();
        }
    };

    function addItemToEditList(text, id = null, completed = false) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'edit-item';
        itemDiv.dataset.itemId = id;
        itemDiv.innerHTML = `
            <input type="checkbox" ${completed ? 'checked' : ''}>
            <input type="text" value="${text}" class="item-text">
            <button class="remove-item">×</button>
        `;

        itemDiv.querySelector('.remove-item').onclick = () => itemDiv.remove();
        editItemsList.appendChild(itemDiv);
    }

    saveGoalChanges.onclick = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const newTitle = editGoalTitle.value.trim();
            if (!newTitle) {
                alert('Please enter a goal title');
                return;
            }

            // Update goal title
            await supabase
                .from('big_goals')
                .update({ title: newTitle })
                .eq('id', currentEditingGoal.id);

            // Delete all existing items for this goal
            await supabase
                .from('checklist_items')
                .delete()
                .eq('goal_id', currentEditingGoal.id);

            // Add all items from the modal
            const items = Array.from(editItemsList.children).map(item => ({
                text: item.querySelector('.item-text').value.trim(),
                completed: item.querySelector('input[type="checkbox"]').checked,
                user_id: user.id,
                goal_id: currentEditingGoal.id,
                created_at: new Date().toISOString()
            }));

            if (items.length > 0) {
                await supabase
                    .from('checklist_items')
                    .insert(items);
            }

            // Refresh the display
            loadBigGoals();
            modal.style.display = "none";
        } catch (error) {
            console.error('Error saving changes:', error);
            alert('Failed to save changes. Please try again.');
        }
    };

    // Check authentication and load goals
    checkAuth();
    
    // Event Listeners
    addGoalBtn.addEventListener('click', addBigGoal);
    newGoalInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addBigGoal();
        }
    });
    
    async function checkAuth() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            
            if (error || !user) {
                showAuthMessage();
                return;
            }
            
            loadBigGoals();
        } catch (error) {
            console.error('Authentication error:', error);
            showAuthMessage();
        }
    }
    
    function showAuthMessage() {
        goalsContainer.innerHTML = `
            <div class="auth-message">
                <p>Please <a href="../Login/login.html">login</a> to use the checklist feature.</p>
            </div>
        `;
        newGoalInput.disabled = true;
        addGoalBtn.disabled = true;
    }
    
    async function loadBigGoals() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.log('User not logged in');
                return;
            }

            const { data: goals, error } = await supabase
                .from('big_goals')
                .select('*, checklist_items(*)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });

            if (error) throw error;

            const goalsContainer = document.getElementById('goalsContainer');
            goalsContainer.innerHTML = '';

            console.log('Goals data:', goals); // Debug log

            if (goals && Array.isArray(goals) && goals.length > 0) {
                goals.forEach(goal => {
                    addBigGoalToDOM(goal, goal.checklist_items || []);
                });
            } else {
                goalsContainer.innerHTML = `
                    <div class="empty-state">
                        <p>Start by adding your big goals above!</p>
                        <p>Then add specific tasks to each goal to track your progress.</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading big goals:', error);
            alert('Failed to load goals: ' + error.message);
        }
    }
    
    async function addBigGoal() {
        try {
            const goalText = newGoalInput.value.trim();
            if (!goalText) {
                alert('Please enter a goal description');
                return;
            }
            
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Please login to add goals.');
                return;
            }
            
            newGoalInput.disabled = true;
            addGoalBtn.disabled = true;
            addGoalBtn.textContent = 'Adding...';
            
            const { data, error } = await supabase
                .from('big_goals')
                .insert([
                    {
                        title: goalText,
                        user_id: user.id,
                        created_at: new Date().toISOString()
                    }
                ])
                .select();
                
            if (error) throw error;
            
            if (data && data.length > 0) {
                // Clear empty state if it exists
                if (goalsContainer.querySelector('.empty-state')) {
                    goalsContainer.innerHTML = '';
                }
                
                addBigGoalToDOM(data[0], []);
                newGoalInput.value = '';
                
                // Show success feedback
                const feedback = document.createElement('span');
                feedback.className = 'success-feedback';
                feedback.textContent = '✓ Goal added successfully';
                addGoalBtn.parentNode.appendChild(feedback);
                
                setTimeout(() => {
                    feedback.remove();
                }, 2000);
            }
        } catch (error) {
            console.error('Error adding goal:', error);
            alert('Failed to add goal: ' + (error.message || 'Please try again.'));
        } finally {
            newGoalInput.disabled = false;
            addGoalBtn.disabled = false;
            addGoalBtn.textContent = 'Add Goal';
            newGoalInput.focus();
        }
    }
    
    function addBigGoalToDOM(goal, items) {
        const goalElement = document.createElement('div');
        goalElement.className = 'big-goal';
        goalElement.dataset.goalId = goal.id;
        
        goalElement.innerHTML = `
            <div class="goal-header">
                <h3 class="goal-title">${goal.title}</h3>
                <div class="goal-actions">
                    <button class="edit-goal-btn" title="Edit Goal"><i class="fas fa-edit"></i></button>
                    <button class="delete-goal-btn" title="Delete Goal"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <div class="goal-items-container">
                <div class="goal-items-list"></div>
                <div class="add-item-to-goal">
                    <div class="new-item-checkbox-container">
                        <input type="checkbox" disabled>
                        <input type="text" class="new-item-for-goal" placeholder="Add a new task...">
                    </div>
                </div>
            </div>
        `;
        
        // Add items to this goal
        const itemsList = goalElement.querySelector('.goal-items-list');
        if (items) {
            items.forEach(item => {
                addItemToDOM(itemsList, item);
            });
        }
        
        // Add event listeners
        const deleteBtn = goalElement.querySelector('.delete-goal-btn');
        deleteBtn.addEventListener('click', () => deleteBigGoal(goal.id));
        
        const editBtn = goalElement.querySelector('.edit-goal-btn');
        editBtn.addEventListener('click', () => {
            currentEditingGoal = goal;
            editGoalTitle.value = goal.title;
            editItemsList.innerHTML = '';
            if (items) {
                items.forEach(item => {
                    addItemToEditList(item.text, item.id, item.completed);
                });
            }
            modal.style.display = "block";
        });
        
        const itemInput = goalElement.querySelector('.new-item-for-goal');
        
        itemInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addItemToGoal(goal.id, itemInput, itemsList);
            }
        });
        
        // Add to container (at the top)
        goalsContainer.prepend(goalElement);
    }
    
    async function addItemToGoal(goalId, inputElement, itemsList) {
        try {
            const itemText = inputElement.value.trim();
            if (!itemText) {
                alert('Please enter a task description');
                return;
            }
            
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Please login to add items.');
                return;
            }
            
            // Disable input while adding
            inputElement.disabled = true;
            
            const { data, error } = await supabase
                .from('checklist_items')
                .insert([
                    {
                        text: itemText,
                        completed: false,
                        user_id: user.id,
                        goal_id: goalId,
                        created_at: new Date().toISOString()
                    }
                ])
                .select();
                
            if (error) throw error;
            
            if (data && data.length > 0) {
                // Clear any existing content if this is the first item
                if (itemsList.children.length === 0) {
                    itemsList.innerHTML = '';
                }
                
                addItemToDOM(itemsList, data[0]);
                inputElement.value = '';
                
                // Show success feedback
                const feedback = document.createElement('span');
                feedback.className = 'success-feedback';
                feedback.textContent = '✓';
                inputElement.parentNode.appendChild(feedback);
                
                setTimeout(() => {
                    feedback.remove();
                }, 1000);
            }
        } catch (error) {
            console.error('Error adding item:', error);
            alert('Failed to add item: ' + (error.message || 'Please try again.'));
        } finally {
            inputElement.disabled = false;
            inputElement.focus();
        }
    }
    
    function addItemToDOM(container, item) {
        const itemElement = document.createElement('div');
        itemElement.className = 'checklist-item';
        itemElement.dataset.itemId = item.id;
        
        itemElement.innerHTML = `
            <input type="checkbox" id="item-${item.id}" ${item.completed ? 'checked' : ''}>
            <label for="item-${item.id}" class="${item.completed ? 'completed' : ''}">${item.text}</label>
        `;
        
        // Add event listener for checkbox
        const checkbox = itemElement.querySelector(`#item-${item.id}`);
        checkbox.addEventListener('change', () => toggleItemStatus(item.id, checkbox.checked));
        
        container.appendChild(itemElement);
    }
    
    async function toggleItemStatus(id, completed) {
        try {
            const itemElement = document.querySelector(`[data-item-id="${id}"]`);
            const label = itemElement.querySelector('label');
            const itemText = label.textContent;
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
    
            if (completed) {
                label.classList.add('completed');
    
                // Add to calendar_events if completed
                const today = new Date().toISOString().split('T')[0];
                await supabase
                    .from('calendar_events')
                    .insert([
                        {
                            user_id: user.id,
                            title: itemText,
                            date: today
                        }
                    ]);
            } else {
                label.classList.remove('completed');
    
                // Remove event if unchecked
                await supabase
                    .from('calendar_events')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('title', itemText);
            }
    
            const { error } = await supabase
                .from('checklist_items')
                .update({ completed })
                .eq('id', id);
    
            if (error) throw error;
        } catch (error) {
            console.error('Error updating item status:', error);
            const checkbox = document.querySelector(`#item-${id}`);
            checkbox.checked = !completed;
            alert('Failed to update item status. Please try again.');
        }
    }
    
    async function deleteBigGoal(id) {
        if (!confirm('Are you sure you want to delete this goal and all its items?')) return;
        
        try {
            // First delete all items in this goal
            const { error: itemsError } = await supabase
                .from('checklist_items')
                .delete()
                .eq('goal_id', id);
                
            if (itemsError) throw itemsError;
            
            // Then delete the goal itself
            const { error: goalError } = await supabase
                .from('big_goals')
                .delete()
                .eq('id', id);
                
            if (goalError) throw goalError;
            
            // Remove from DOM
            document.querySelector(`[data-goal-id="${id}"]`).remove();
            
            // Check if this was the last goal
            if (goalsContainer.children.length === 0) {
                goalsContainer.innerHTML = `
                    <div class="empty-state">
                        <p>You don't have any big goals yet.</p>
                        <p>Start by adding a big goal that represents your focus</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error deleting goal:', error);
            alert('Failed to delete goal. Please try again.');
        }
    }
});