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

