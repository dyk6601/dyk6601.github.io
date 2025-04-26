// main.js - Checklist functionality
import { supabaseClient as supabase } from '../js/supabase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    resetChecklistIfNeeded(); 

    const newItemInput = document.getElementById('newItem');
    const addItemBtn = document.getElementById('addItemBtn');
    const checklistItems = document.getElementById('checklistItems');
    
    // Check authentication before loading checklist
    checkAuth();
    
    // Event listener for adding new items
    addItemBtn.addEventListener('click', addChecklistItem);
    
    // Allow adding items by pressing Enter
    newItemInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addChecklistItem();
        }
    });
    
    // Main functions
    async function checkAuth() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            
            if (error || !user) {
                showAuthMessage();
                return;
            }
            
            // User is authenticated, load their checklist items
            loadChecklistItems();
        } catch (error) {
            console.error('Authentication error:', error);
            showAuthMessage();
        }
    }
    
    function showAuthMessage() {
        checklistItems.innerHTML = `
            <div class="auth-message">
                <p>Please <a href="../Login/login.html">login</a> to use the checklist feature.</p>
            </div>
        `;
        newItemInput.disabled = true;
        addItemBtn.disabled = true;
    }
    
    async function loadChecklistItems() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) return;
            
            checklistItems.innerHTML = '<div class="loading">Loading your checklist...</div>';
            
            const { data, error } = await supabase
                .from('checklist')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            
            checklistItems.innerHTML = '';
            
            if (data.length === 0) {
                checklistItems.innerHTML = '<p>Your checklist is empty. Add some items to get started!</p>';
                return;
            }
            
            data.forEach(item => {
                addItemToDOM(item);
            });
        } catch (error) {
            console.error('Error loading checklist:', error);
            checklistItems.innerHTML = '<p>Error loading your checklist. Please try again later.</p>';
        }
    }
    
    async function addChecklistItem() {
        try {
            const itemText = newItemInput.value.trim();
            
            if (!itemText) return;
            
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                alert('Please login to add items to your checklist.');
                return;
            }
            
            // Disable input while adding
            newItemInput.disabled = true;
            addItemBtn.disabled = true;
            
            const { data, error } = await supabase
                .from('checklist')
                .insert([
                    {
                        text: itemText,
                        completed: false,
                        user_id: user.id
                    }
                ])
                .select();
                
            if (error) throw error;
            
            // Add the new item to the DOM
            if (data && data.length > 0) {
                // Clear the no items message if it exists
                if (checklistItems.innerHTML.includes('Your checklist is empty')) {
                    checklistItems.innerHTML = '';
                }
                
                addItemToDOM(data[0]);
                newItemInput.value = '';
            }
        } catch (error) {
            console.error('Error adding checklist item:', error);
            alert('Failed to add item. Please try again.');
        } finally {
            newItemInput.disabled = false;
            addItemBtn.disabled = false;
            newItemInput.focus();
        }
    }
    
    function addItemToDOM(item) {
        const itemElement = document.createElement('div');
        itemElement.className = 'checklist-item';
        itemElement.dataset.id = item.id;
        
        itemElement.innerHTML = `
            <input type="checkbox" id="item-${item.id}" ${item.completed ? 'checked' : ''}>
            <label for="item-${item.id}" class="${item.completed ? 'completed' : ''}">${item.text}</label>
            <button class="delete-btn">Delete</button>
        `;
        
        // Add event listeners
        const checkbox = itemElement.querySelector(`#item-${item.id}`);
        checkbox.addEventListener('change', () => toggleItemStatus(item.id, checkbox.checked));
        
        const deleteBtn = itemElement.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => deleteItem(item.id));
        
        // Add to the top of the list
        checklistItems.prepend(itemElement);
    }
    
    async function toggleItemStatus(id, completed) {
        try {
            const label = document.querySelector(`[data-id="${id}"] label`);
            const itemText = label.textContent;
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
    
            if (completed) {
                label.classList.add('completed');
    
                // Add to calendar_events if completed
                const today = new Date().toISOString().split('T')[0]; // e.g., '2025-04-25'
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
                    .eq('title', itemText); // or use item_id if more precise
            }
    
            const { error } = await supabase
                .from('checklist')
                .update({ completed })
                .eq('id', id);
    
            if (error) throw error;
        } catch (error) {
            console.error('Error updating item status:', error);
    
            // Revert UI change if something failed
            const checkbox = document.querySelector(`#item-${id}`);
            checkbox.checked = !completed;
            const label = document.querySelector(`[data-id="${id}"] label`);
            if (!completed) {
                label.classList.add('completed');
            } else {
                label.classList.remove('completed');
            }
            alert('Failed to update item status. Please try again.');
        }
    }
    
    
    async function deleteItem(id) {
        if (!confirm('Are you sure you want to delete this item?')) return;
        
        try {
            const { error } = await supabase
                .from('checklist')
                .delete()
                .eq('id', id);
                
            if (error) throw error;
            
            // Remove from DOM
            const itemElement = document.querySelector(`[data-id="${id}"]`);
            itemElement.remove();
            
            // Check if list is now empty
            if (checklistItems.children.length === 0) {
                checklistItems.innerHTML = '<p>Your checklist is empty. Add some items to get started!</p>';
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Failed to delete item. Please try again.');
        }
    }
});
async function resetChecklistIfNeeded() {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // e.g., "2025-04-25"
    const resetTime = new Date(`${currentDate}T12:00:00`);

    const lastResetDate = localStorage.getItem('lastChecklistReset');

    // If it's a new day AND it's after 12pm
    if (lastResetDate !== currentDate && now >= resetTime) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Reset all items for the user
            const { error } = await supabase
                .from('checklist')
                .update({ completed: false })
                .eq('user_id', user.id);

            if (error) throw error;

            localStorage.setItem('lastChecklistReset', currentDate);
            console.log('Checklist reset at noon.');

        } catch (error) {
            console.error('Failed to reset checklist:', error);
        }
    }
};
