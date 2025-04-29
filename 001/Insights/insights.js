import { checkAuthStatus } from '../js/auth-check.js';
import { supabaseClient as supabase } from '../js/supabase-config.js';

document.addEventListener('DOMContentLoaded', async () => {
    checkAuthStatus();

    const calendarEl = document.getElementById('calendar');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        calendarEl.innerHTML = '<p>Please log in to view your calendar.</p>';
        return;
    }

    // Function to check if user has completed any activity today
    async function checkTodayActivity() {
        const today = new Date().toISOString().slice(0, 10);
        
        // Check for lessons added today
        const { data: lessons, error: lessonsError } = await supabase
            .from('lessons')
            .select('created_at')
            .eq('user_id', user.id)
            .gte('created_at', today)
            .lt('created_at', new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000).toISOString());

        // Check for checklist items completed today
        const { data: checklistItems, error: checklistError } = await supabase
            .from('checklist_items')
            .select('completed_at')
            .eq('user_id', user.id)
            .gte('completed_at', today)
            .lt('completed_at', new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000).toISOString());

        return (lessons && lessons.length > 0) || (checklistItems && checklistItems.length > 0);
    }

    // Function to update streak
    async function updateStreak() {
        const today = new Date().toISOString().slice(0, 10);
        let streakData = JSON.parse(localStorage.getItem('streakData')) || {
            lastActivityDate: null,
            currentStreak: 0
        };

        const hasActivityToday = await checkTodayActivity();
        
        if (hasActivityToday) {
            if (!streakData.lastActivityDate) {
                // First activity ever
                streakData.currentStreak = 1;
            } else {
                const lastActivityDate = new Date(streakData.lastActivityDate);
                const todayDate = new Date(today);
                const dayDifference = Math.floor((todayDate - lastActivityDate) / (1000 * 60 * 60 * 24));

                if (dayDifference === 1) {
                    // Consecutive day
                    streakData.currentStreak++;
                } else if (dayDifference > 1) {
                    // Streak broken
                    streakData.currentStreak = 1;
                }
            }
            streakData.lastActivityDate = today;
        }

        localStorage.setItem('streakData', JSON.stringify(streakData));
        displayStreak(streakData.currentStreak);
    }

    function displayStreak(count) {
        const streakElement = document.getElementById('daysStreak');
        if (streakElement) {
            streakElement.textContent = `${count} Days`;
            // Also update the flame image based on streak count
            const flameImg = streakElement.nextElementSibling;
            if (flameImg && flameImg.tagName === 'IMG') {
                if (count >= 7) {
                    flameImg.src = 'blueflame.gif';
                } else {
                    flameImg.src = 'blue-blueflame.gif';
                }
            }
        }
    }

    // Update streak when page loads
    await updateStreak();

    // Load events from Supabase
    const { data: events, error } = await supabase
        .from('calendar_events')
        .select('title, date')
        .eq('user_id', user.id);

    if (error) {
        console.error('Failed to load calendar events:', error);
    }

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        events: events.map(event => ({
            title: event.title,
            start: event.date
        }))
    });

    calendar.render();
});

