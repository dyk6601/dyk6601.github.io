document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    
    //modal elements
    const modal = document.getElementById("check-popup");
    const addButton = document.getElementById("add-button");
    const closeButton = document.getElementsByClassName("close")[0];
    const itemList = document.getElementById("item-list");
    const addNewButton = document.getElementById("add-new-button");
    const newItemInput = document.getElementById("new-item");
    const checkboxContainer = document.getElementById("checklist-container");

    console.log('Modal element:', modal);
    console.log('Add button:', addButton);
    console.log('Checkbox container:', checkboxContainer);

    addButton.onclick = function() {
        console.log('Add button clicked');
        // Clear the current list
        itemList.innerHTML = "";
        
        // Get all current checklist items
        const checkboxes = checkboxContainer.querySelectorAll('input[type="checkbox"]');
        console.log('Found checkboxes:', checkboxes.length);
        
        // Add each item to the modal
        checkboxes.forEach(checkbox => {
            const label = document.querySelector(`label[for="${checkbox.id}"]`);
            console.log('Processing checkbox:', checkbox.id, 'with label:', label.textContent);
            
            const itemEntry = document.createElement("div");
            itemEntry.className = "item-entry";
            itemEntry.innerHTML = `
                <span>${label.textContent}</span>
                <button class="delete-button" data-id="${checkbox.id}">-</button>
            `;
            
            itemList.appendChild(itemEntry);
        });
        
        // Show the modal
        modal.style.display = "block";
        console.log('Modal display set to block');
        
        // Add event listeners to delete buttons
        const deleteButtons = document.querySelectorAll(".delete-button");
        deleteButtons.forEach(button => {
            button.onclick = function() {
                const itemId = this.getAttribute("data-id");
                const itemToRemove = document.getElementById(itemId);
                const labelToRemove = document.querySelector(`label[for="${itemId}"]`);
                
                // Remove the checkbox and label
                if (itemToRemove && labelToRemove) {
                    itemToRemove.nextSibling.remove(); // Remove the line break
                    labelToRemove.remove();
                    itemToRemove.remove();
                }
                
                // Remove the item from the modal
                this.parentElement.remove();
            };
        });
    };
  
  // Close modal when close button is clicked
  closeButton.onclick = function() {
    modal.style.display = "none";
  };
  
  // Close modal when clicking outside of it
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };
  
  // Add new checklist item
  addNewButton.onclick = function() {
    const newItemText = newItemInput.value.trim();
    
    if (newItemText !== "") {
      // Create a unique ID for the new checkbox
      const checkboxes = checkboxContainer.querySelectorAll('input[type="checkbox"]');
      const newId = `check${checkboxes.length + 1}`;
      
      // Add to the actual checklist
      const submitContainer = document.querySelector(".submit-container");
      
      // Create new checkbox
      const newCheckbox = document.createElement("input");
      newCheckbox.type = "checkbox";
      newCheckbox.id = newId;
      newCheckbox.name = `goal${checkboxes.length + 1}`;
      newCheckbox.value = `goal${checkboxes.length + 1}`;
      
      // Create new label
      const newLabel = document.createElement("label");
      newLabel.htmlFor = newId;
      newLabel.textContent = newItemText;
      
      // Create line break
      const lineBreak = document.createElement("br");
      
      // Insert new elements before the submit button container
      checkboxContainer.insertBefore(newCheckbox, submitContainer);
      checkboxContainer.insertBefore(newLabel, submitContainer);
      checkboxContainer.insertBefore(lineBreak, submitContainer);
      
      // Add the new item to the modal list
      const itemEntry = document.createElement("div");
      itemEntry.className = "item-entry";
      itemEntry.innerHTML = `
        <span>${newItemText}</span>
        <button class="delete-button" data-id="${newId}">-</button>
      `;
      
      itemList.appendChild(itemEntry);
      
      // Add event listener to the new delete button
      const deleteButton = itemEntry.querySelector(".delete-button");
      deleteButton.onclick = function() {
        const itemId = this.getAttribute("data-id");
        const itemToRemove = document.getElementById(itemId);
        const labelToRemove = document.querySelector(`label[for="${itemId}"]`);
        
        // Remove the checkbox and label
        if (itemToRemove && labelToRemove) {
          itemToRemove.nextSibling.remove(); // Remove the line break
          labelToRemove.remove();
          itemToRemove.remove();
        }
        
        // Remove the item from the modal
        this.parentElement.remove();
      };
      
      // Clear the input field
      newItemInput.value = "";
    }
  };
  
  // Allow adding new item by pressing Enter
  newItemInput.addEventListener("keyup", function(event) {
    if (event.key === "Enter") {
      addNewButton.click();
    }
  });
});