const SUPABASE_URL='https://uaawwwdyjogseeanzfav.supabase.co';
const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhYXd3d2R5am9nc2VlYW56ZmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MzYwNzcsImV4cCI6MjEwMDIxMjA3N30.gjDWOzU1O1sXH3VcP1IIEUp0uQzpRdF_xzzZ9Rwxluk';
const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);

let currentUser;

async function init(){
 const {data:{session}}=await client.auth.getSession();
 if(!session){location.href='index.html';return;}
 currentUser=session.user;
 const me=await client.from('users').select('*').eq('id',currentUser.id).single();
 if(me.data?.avatar_url)myAvatar.src=me.data.avatar_url;
 loadChats();
 search.oninput=searchUsers;
 fab.onclick=()=>search.focus();
}
init();

async function loadChats(){
 const {data}=await client.from('chats')
 .select('*')
 .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
 .order('last_message_time',{ascending:false});

 chatContainer.innerHTML='';
 for(const c of (data||[])){
   const other=c.user1_id===currentUser.id?c.user2_id:c.user1_id;
   const {data:u}=await client.from('users').select('*').eq('id',other).single();
   chatContainer.innerHTML+=`
   <a class="chat" href="chat.html?chat=${c.id}">
   <img class="pic" src="${u?.avatar_url||''}">
   <div class="mid">
     <div class="user">${u?.display_name||''}</div>
     <div class="at">@${u?.username||''}</div>
     <div class="msg">${c.last_message||''}</div>
   </div>
   <div class="time">${c.last_message_time?new Date(c.last_message_time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}):''}</div>
   </a>`;
 }
}

async function searchUsers(){
 const q=search.value.trim();
 results.innerHTML='';
 if(q.length<2) return;
 const {data}=await client.from('users').select('*').ilike('username',q+'%').limit(10);
 (data||[]).forEach(u=>{
   results.innerHTML+=`
   <a class="chat" href="chat.html?user=${u.id}">
    <img class="pic" src="${u.avatar_url||''}">
    <div class="mid">
      <div class="user">${u.display_name||''}</div>
      <div class="at">@${u.username}</div>
    </div>
   </a>`;
 });
}
