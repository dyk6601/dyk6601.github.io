// Import Supabase client
import { supabaseClient } from '../js/supabase-config.js';

// DOM Elements
const checklistForm = document.getElementById('checklistForm');
const checklistItems = document.getElementById('checklistItems');
const addItemBtn = document.getElementById('addItemBtn');
const newItemInput = document.getElementById('newItem');

// Function to load checklist items from Supabase
async function loadChecklistItems() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
            console.log('No user session found');
            return;
        }

        const { data, error } = await supabaseClient
            .from('checklist_items')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: true });

        if (error) throw error;

        checklistItems.innerHTML = '';
        data.forEach(item => {
            addChecklistItem(item.id, item.text, item.completed);
        });
    } catch (error) {
        console.error('Error loading checklist items:', error);
    }
}

// Function to add a new checklist item
async function addChecklistItem(id, text, completed = false) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'checklist-item';
    itemDiv.dataset.id = id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = completed;
    checkbox.addEventListener('change', async () => {
        await toggleItemStatus(id, checkbox.checked);
    });

    const itemText = document.createElement('span');
    itemText.textContent = text;
    if (completed) {
        itemText.classList.add('completed');
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', async () => {
        await deleteChecklistItem(id);
        itemDiv.remove();
    });

    itemDiv.appendChild(checkbox);
    itemDiv.appendChild(itemText);
    itemDiv.appendChild(deleteBtn);
    checklistItems.appendChild(itemDiv);
}

// Function to save a new checklist item to Supabase
async function saveChecklistItem(text) {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
            console.log('No user session found');
            return;
        }

        const { data, error } = await supabaseClient
            .from('checklist_items')
            .insert([
                { 
                    text: text,
                    user_id: session.user.id,
                    completed: false
                }
            ])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error saving checklist item:', error);
        throw error;
    }
}

// Function to toggle item status in Supabase
async function toggleItemStatus(id, completed) {
    try {
        const { error } = await supabaseClient
            .from('checklist_items')
            .update({ completed: completed })
            .eq('id', id);

        if (error) throw error;

        const itemText = document.querySelector(`.checklist-item[data-id="${id}"] span`);
        if (itemText) {
            if (completed) {
                itemText.classList.add('completed');
            } else {
                itemText.classList.remove('completed');
            }
        }
    } catch (error) {
        console.error('Error toggling item status:', error);
    }
}

// Function to delete a checklist item from Supabase
async function deleteChecklistItem(id) {
    try {
        const { error } = await supabaseClient
            .from('checklist_items')
            .delete()
            .eq('id', id);

        if (error) throw error;
    } catch (error) {
        console.error('Error deleting checklist item:', error);
    }
}

// Event Listeners
addItemBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const text = newItemInput.value.trim();
    if (text) {
        try {
            const newItem = await saveChecklistItem(text);
            addChecklistItem(newItem.id, text);
            newItemInput.value = '';
        } catch (error) {
            console.error('Error adding new item:', error);
        }
    }
});

// Load checklist items when the page loads
document.addEventListener('DOMContentLoaded', loadChecklistItems);