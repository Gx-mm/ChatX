const SUPABASE_URL='https://uaawwwdyjogseeanzfav.supabase.co';
const SUPABASE_ANON_KEY='PASTE_YOUR_ANON_KEY_HERE';
const supabase=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
document.querySelector('.google').onclick=async()=>{
const {error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:'https://gx-mm.github.io/ChatX/'}});
if(error)alert(error.message);
};