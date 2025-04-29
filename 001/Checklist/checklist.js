// main.js - Enhanced Checklist with Big Goals
import { supabaseClient as supabase } from '../js/supabase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    resetChecklistIfNeeded();
    
    // DOM Elements
    const newItemInput = document.getElementById('newItem');
    const addItemBtn = document.getElementById('addItemBtn');
    const newGoalInput = document.getElementById('newGoalInput');
    const addGoalBtn = document.getElementById('addGoalBtn');
    const checklistContainer = document.getElementById('checklistContainer');
    
    // Check authentication before loading
    checkAuth();
    
    // Event Listeners
    addItemBtn.addEventListener('click', addChecklistItem);
    addGoalBtn.addEventListener('click', addBigGoal);
    
    newItemInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addChecklistItem();
    });
    
    newGoalInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addBigGoal();
    });
    
    // Main Functions
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
        checklistContainer.innerHTML = `
            <div class="auth-message">
                <p>Please <a href="../Login/login.html">login</a> to use the checklist feature.</p>
            </div>
        `;
        newItemInput.disabled = true;
        addItemBtn.disabled = true;
        newGoalInput.disabled = true;
        addGoalBtn.disabled = true;
    }
    
    async function loadBigGoals() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            
            checklistContainer.innerHTML = '<div class="loading">Loading your goals...</div>';
            
            // Load big goals with their checklist items
            const { data: goals, error: goalsError } = await supabase
                .from('big_goals')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
                
            if (goalsError) throw goalsError;
            
            checklistContainer.innerHTML = '';
            
            if (goals.length === 0) {
                checklistContainer.innerHTML = `
                    <div class="empty-state">
                        <p>You don't have any big goals yet.</p>
                        <p>Start by adding a big goal that represents your focus or theme.</p>
                    </div>
                `;
                return;
            }
            
            // For each goal, load its checklist items
            for (const goal of goals) {
                const { data: items, error: itemsError } = await supabase
                    .from('checklist_items')
                    .select('*')
                    .eq('goal_id', goal.id)
                    .order('created_at', { ascending: true });
                    
                if (itemsError) throw itemsError;
                
                addBigGoalToDOM(goal, items || []);
            }
        } catch (error) {
            console.error('Error loading goals:', error);
            checklistContainer.innerHTML = '<p>Error loading your goals. Please try again later.</p>';
        }
    }
    
    async function addBigGoal() {
        try {
            const goalText = newGoalInput.value.trim();
            if (!goalText) return;
            
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Please login to add goals.');
                return;
            }
            
            newGoalInput.disabled = true;
            addGoalBtn.disabled = true;
            
            const { data, error } = await supabase
                .from('big_goals')
                .insert([
                    {
                        title: goalText,
                        user_id: user.id
                    }
                ])
                .select();
                
            if (error) throw error;
            
            if (data && data.length > 0) {
                // Clear empty state if it exists
                if (checklistContainer.innerHTML.includes('You don\'t have any big goals')) {
                    checklistContainer.innerHTML = '';
                }
                
                addBigGoalToDOM(data[0], []);
                newGoalInput.value = '';
            }
        } catch (error) {
            console.error('Error adding big goal:', error);
            alert('Failed to add goal. Please try again.');
        } finally {
            newGoalInput.disabled = false;
            addGoalBtn.disabled = false;
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
                    <button class="edit-goal-btn">Edit</button>
                    <button class="delete-goal-btn">Delete</button>
                    <button class="toggle-goal-btn">▼</button>
                </div>
            </div>
            <div class="goal-items-container">
                <div class="goal-items-list"></div>
                <div class="add-item-to-goal">
                    <input type="text" class="new-item-for-goal" placeholder="Add an action item for this goal">
                    <button class="add-item-to-goal-btn">Add</button>
                </div>
            </div>
        `;
        
        // Add items to this goal
        const itemsList = goalElement.querySelector('.goal-items-list');
        items.forEach(item => {
            addItemToDOM(itemsList, item);
        });
        
        // If no items, show message
        if (items.length === 0) {
            itemsList.innerHTML = '<p class="no-items">No action items yet. Add some steps to work toward this goal!</p>';
        }
        
        // Add event listeners
        const deleteBtn = goalElement.querySelector('.delete-goal-btn');
        deleteBtn.addEventListener('click', () => deleteBigGoal(goal.id));
        
        const editBtn = goalElement.querySelector('.edit-goal-btn');
        editBtn.addEventListener('click', () => editBigGoal(goal.id, goalElement.querySelector('.goal-title')));
        
        const toggleBtn = goalElement.querySelector('.toggle-goal-btn');
        toggleBtn.addEventListener('click', () => {
            const itemsContainer = goalElement.querySelector('.goal-items-container');
            itemsContainer.classList.toggle('collapsed');
            toggleBtn.textContent = itemsContainer.classList.contains('collapsed') ? '▶' : '▼';
        });
        
        const addItemBtn = goalElement.querySelector('.add-item-to-goal-btn');
        const itemInput = goalElement.querySelector('.new-item-for-goal');
        
        addItemBtn.addEventListener('click', () => addItemToGoal(goal.id, itemInput, itemsList));
        itemInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addItemToGoal(goal.id, itemInput, itemsList);
        });
        
        // Add to container (at the top)
        checklistContainer.prepend(goalElement);
    }
    
    async function addItemToGoal(goalId, inputElement, itemsList) {
        try {
            const itemText = inputElement.value.trim();
            if (!itemText) return;
            
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Please login to add items.');
                return;
            }
            
            inputElement.disabled = true;
            
            const { data, error } = await supabase
                .from('checklist_items')
                .insert([
                    {
                        text: itemText,
                        completed: false,
                        user_id: user.id,
                        goal_id: goalId
                    }
                ])
                .select();
                
            if (error) throw error;
            
            if (data && data.length > 0) {
                // Remove "no items" message if it exists
                if (itemsList.querySelector('.no-items')) {
                    itemsList.innerHTML = '';
                }
                
                addItemToDOM(itemsList, data[0]);
                inputElement.value = '';
            }
        } catch (error) {
            console.error('Error adding item to goal:', error);
            alert('Failed to add item. Please try again.');
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
            <div class="item-actions">
                <button class="edit-item-btn">Edit</button>
                <button class="delete-item-btn">Delete</button>
            </div>
        `;
        
        // Add event listeners
        const checkbox = itemElement.querySelector(`#item-${item.id}`);
        checkbox.addEventListener('change', () => toggleItemStatus(item.id, checkbox.checked));
        
        const deleteBtn = itemElement.querySelector('.delete-item-btn');
        deleteBtn.addEventListener('click', () => deleteItem(item.id, item.goal_id));
        
        const editBtn = itemElement.querySelector('.edit-item-btn');
        editBtn.addEventListener('click', () => editItem(item.id, itemElement.querySelector('label')));
        
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
    
                // Optional: Remove event if unchecked
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
    
    async function deleteItem(id, goalId) {
        if (!confirm('Are you sure you want to delete this item?')) return;
        
        try {
            const { error } = await supabase
                .from('checklist_items')
                .delete()
                .eq('id', id);
                
            if (error) throw error;
            
            // Remove from DOM
            const itemElement = document.querySelector(`[data-item-id="${id}"]`);
            const itemsList = itemElement.parentElement;
            itemElement.remove();
            
            // Check if this was the last item in the goal
            if (itemsList.children.length === 0) {
                itemsList.innerHTML = '<p class="no-items">No action items yet. Add some steps to work toward this goal!</p>';
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Failed to delete item. Please try again.');
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
            if (checklistContainer.children.length === 0) {
                checklistContainer.innerHTML = `
                    <div class="empty-state">
                        <p>You don't have any big goals yet.</p>
                        <p>Start by adding a big goal that represents your focus or theme.</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error deleting goal:', error);
            alert('Failed to delete goal. Please try again.');
        }
    }
    
    async function editBigGoal(id, titleElement) {
        const currentTitle = titleElement.textContent;
        const newTitle = prompt('Edit your big goal:', currentTitle);
        
        if (!newTitle || newTitle.trim() === currentTitle) return;
        
        try {
            const { error } = await supabase
                .from('big_goals')
                .update({ title: newTitle.trim() })
                .eq('id', id);
                
            if (error) throw error;
            
            titleElement.textContent = newTitle.trim();
        } catch (error) {
            console.error('Error updating goal:', error);
            alert('Failed to update goal. Please try again.');
        }
    }
    
    async function editItem(id, labelElement) {
        const currentText = labelElement.textContent;
        const newText = prompt('Edit your item:', currentText);
        
        if (!newText || newText.trim() === currentText) return;
        
        try {
            const { error } = await supabase
                .from('checklist_items')
                .update({ text: newText.trim() })
                .eq('id', id);
                
            if (error) throw error;
            
            labelElement.textContent = newText.trim();
        } catch (error) {
            console.error('Error updating item:', error);
            alert('Failed to update item. Please try again.');
        }
    }
});

async function resetChecklistIfNeeded() {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const resetTime = new Date(`${currentDate}T12:00:00`);

    const lastResetDate = localStorage.getItem('lastChecklistReset');

    if (lastResetDate !== currentDate && now >= resetTime) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Reset all checklist items (not goals)
            const { error } = await supabase
                .from('checklist_items')
                .update({ completed: false })
                .eq('user_id', user.id);

            if (error) throw error;

            localStorage.setItem('lastChecklistReset', currentDate);
            console.log('Checklist items reset at noon.');

            // Update UI to reflect reset
            document.querySelectorAll('.checklist-item input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = false;
                checkbox.nextElementSibling.classList.remove('completed');
            });
        } catch (error) {
            console.error('Failed to reset checklist:', error);
        }
    }
}