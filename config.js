// Configuration Supabase — ces valeurs sont publiques par design (clé "anon"),
// la vraie sécurité est gérée par les règles RLS côté Supabase.
window.SUPABASE_URL = "https://fzatwqavzwpufgsododd.supabase.co";
window.SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6YXR3cWF2endwdWZnc29kb2RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5MDMyOTQsImV4cCI6MjEwMjQ3OTI5NH0.Z8OGnwVmxvEwvd7Cwc_KaatUBJinVGVPhuRv4i50xGk";

// Noms des buckets de stockage tels que créés dans ton projet Supabase
window.BUCKETS = {
  avatars: "avatars",
  posts: "posts",
  audio: "audio"
};
