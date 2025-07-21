// src/lib/supabaseClient.js (or .ts)
import { createClient } from '@supabase/supabase-js';

// --- Supabase Client Configuration ---
// Replace with your actual Supabase URL and Public Key
// For a production app, these should be environment variables.
const supabaseUrl = 'https://srnjtgslmhtnxenzfpeq.supabase.co'; // e.g., 'https://abcde12345.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNybmp0Z3NsbWh0bnhlbnpmcGVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNjQyMjcsImV4cCI6MjA2Nzk0MDIyN30.0U6fExNXEIcUMiAgYGv4ZU9xqGLO-u2Of-ycbsreBvY'; // e.g., 'eyJhbGciOiJIUzI1Ni...'

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);