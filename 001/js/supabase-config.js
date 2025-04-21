// Supabase configuration
const SUPABASE_URL = 'https://dyk6601.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5azY2MDEiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcxMzU5NjQ5NSwiZXhwIjoyMDI5MTcyNDk1fQ.4QwQJ8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q';

// Initialize Supabase client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY); 