const client=window.supabase.createClient('https://uaawwwdyjogseeanzfav.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhYXd3d2R5am9nc2VlYW56ZmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MzYwNzcsImV4cCI6MjEwMDIxMjA3N30.gjDWOzU1O1sXH3VcP1IIEUp0uQzpRdF_xzzZ9Rwxluk');
const p=new URLSearchParams(location.search);
let chatId,currentUser,otherUser;

init();

async function init(){
 const {data:{session}}=await client.auth.getSession();
 if(!session){location='index.html';return;}
 currentUser=session.user.id;
 chatId=p.get('chat');
 otherUser=p.get('user');

 if(chatId){
   const {data:c}=await client.from('chats').select('*').eq('id',chatId).single();
   otherUser=c.user1_id===currentUser?c.user2_id:c.user1_id;
 }else if(otherUser){
   const {data:c}=await client.from('chats').select('*')
   .or(`and(user1_id.eq.${currentUser},user2_id.eq.${otherUser}),and(user1_id.eq.${otherUser},user2_id.eq.${currentUser})`).maybeSingle();
   if(c){chatId=c.id;}
   else{
      const ins=await client.from('chats').insert({user1_id:currentUser,user2_id:otherUser}).select().single();
      chatId=ins.data.id;
   }
 }

 const {data:u}=await client.from('users').select('*').eq('id',otherUser).single();
 if(u){name.textContent=u.display_name||u.username;avatar.src=u.avatar_url||'';}

 loadMessages();

 client.channel('room-'+chatId).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:`chat_id=eq.${chatId}`},()=>loadMessages()).subscribe();

 sendBtn.onclick=sendMessage;
}

async function loadMessages(){
 const {data}=await client.from('messages').select('*').eq('chat_id',chatId).order('created_at');
 msgs.innerHTML='';
 (data||[]).forEach(m=>{
   msgs.innerHTML+=`<div class="b ${m.sender_id===currentUser?'right':'left'}">${m.message||''}</div>`;
 });
 msgs.scrollTop=msgs.scrollHeight;
}

async function sendMessage(){
 const text=t.value.trim();
 if(!text)return;
 await client.from('messages').insert({chat_id:chatId,sender_id:currentUser,receiver_id:otherUser,message:text,message_type:'text'});
 await client.from('chats').update({last_message:text,last_message_time:new Date().toISOString()}).eq('id',chatId);
 t.value='';
}
