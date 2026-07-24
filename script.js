alert("script loaded");
const SUPABASE_URL = "https://uaawwwdyjogseeanzfav.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhYXd3d2R5am9nc2VlYW56ZmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MzYwNzcsImV4cCI6MjEwMDIxMjA3N30.gjDWOzU1O1sXH3VcP1IIEUp0uQzpRdF_xzzZ9Rwxluk";

const client = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

document.querySelector(".google").onclick = async () => {
  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "https://gx-mm.github.io/ChatX/auth.html"
    }
  });

  if (error) {
    alert(error.message);
  }
};