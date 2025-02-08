import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://klfjkzkxuxmzefgmpnqm.supabase.co'; // 替换为你的 Supabase 项目 URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsZmpremt4dXhtemVmZ21wbnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1NjA5NTUsImV4cCI6MjA1MTEzNjk1NX0.nP4pTPHoBsy9WjkoMh1GcnB6UlPlVKJHmkzUudkGudU'; // 替换为你的匿名密钥

export const supabase = createClient(supabaseUrl, supabaseAnonKey);