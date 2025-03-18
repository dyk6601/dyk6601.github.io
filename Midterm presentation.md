# Midterm presentation

Created: March 17, 2025 10:19 PM
Class: Intro to ML

# Nav Class

```html
<nav class = "nav">
        <ul>
          <li><a href =../index.html>Home</a></li>
          <li><a href =../Lessons/lesson.html>Lesson</a></li>
          <li><a href= ../Insights/insights.html>Insights</a></li>
          <li><a href= ../Checklist/checklist.html>Checklist</a></li>
          <li><a href= ../Login/login.html>Login</a></li>
        </ul>
    </nav>
```

# Form

```jsx
<nav class="checklist">
      <form>
        <div class="checkbox-container">
          <h1>Checklist</h1>
          <input type="checkbox" id="check1" name="goal1" value="goal1">
          <label for="check1">Good Food</label><br>
          <input type="checkbox" id="check2" name="goal2" value="goal2">
          <label for="check2">Exercise</label><br>
          <input type="checkbox" id="check3" name="goal3" value="goal3">
          <label for="check3">8 hour Sleep</label><br>
          <div class="submit-container">
            <input type="submit" value="Submit">
          </div>
        </div>
      </form>
```

# Box-shadow

```css
box-shadow: 0px 0px 10px 0px;
```

# Full Calendar Js

```jsx
    <script src='https://cdn.jsdelivr.net/npm/fullcalendar/index.global.min.js'></script>
        <script>
    
          document.addEventListener('DOMContentLoaded', function() {
            const calendarEl = document.getElementById('calendar')
            const calendar = new FullCalendar.Calendar(calendarEl, {
              initialView: 'dayGridMonth'
            })
            calendar.render()
          })
        </script>
```

# CSS for Full Calendar

```jsx
.fc-toolbar-title {
  font-size: 1.5em !important; 
}

.fc-daygrid-day-frame {
  padding: 2px !important;
}

.fc-daygrid-day-number {
  font-size: 0.9em !important;
}

```

# Check Mark

```css
  .checkbox-container input[type="checkbox"]:checked::after {
    content: "";
    position: absolute;
    left: 5px;
    top: 1px;
    width: 5px;
    height: 10px;
    border: solid #fff;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
```

# Transition

```css
        .lesson-box:hover {
            transform: translateY(-10px);
            box-shadow: 0 15px 30px rgba(19, 113, 20, 0.698);
        }
```

# Next Step

- Will continue working on the website for final
- If I had time, I will work more on animations.
- Implement Javascript in to the website