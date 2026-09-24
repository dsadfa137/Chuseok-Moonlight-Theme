(function(){
 'use strict';
 const api=window.MoonServer,$=id=>document.getElementById(id);
 let auth=null,rows=[],open=false,poll=null,busy=false,refreshPromise=null;
 const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const status=t=>$('admin-status').textContent=t;
 async function access(){
  if(!auth)throw Error('다시 로그인해 주세요.');
  if(Date.now()>auth.expires_at*1000-60000){
   if(!refreshPromise)refreshPromise=api.request('/auth/v1/token?grant_type=refresh_token',{refresh_token:auth.refresh_token}).then(data=>{auth=data;auth.expires_at=auth.expires_at||Math.floor(Date.now()/1000)+(auth.expires_in||3600);return data;}).finally(()=>refreshPromise=null);
   await refreshPromise;
  }
  return auth.access_token;
 }
 async function call(name,args={}){return api.rpc(name,args,await access());}
 function loggedOut(){clearInterval(poll);auth=null;rows=[];open=false;$('admin-rows').replaceChildren();$('admin-summary').textContent='';$('admin-console').hidden=true;$('admin-login').hidden=false;}
 function draw(){
  const search=$('admin-search').value.normalize('NFKC').trim().toLowerCase();
  const active=rows.filter(r=>!r.deleted),complete=active.filter(r=>r.finishedAt);
  $('admin-summary').textContent=`신규 접수 ${open?'진행 중':'마감'} · 참여 ${active.length}팀 · 세 미션 완료 ${complete.length}팀 · 제외 ${rows.length-active.length}건`;
  $('entries-toggle').textContent=open?'신규 접수 마감':'신규 접수 시작';
  $('admin-rows').innerHTML=rows.filter(r=>r.nickname.toLowerCase().includes(search)).map(r=>`<tr class="${r.deleted?'removed':''}"><th scope="row">${esc(r.nickname)}</th><td>${esc(r.last4||'—')}</td><td>${r.rank??'—'}</td><td>${r.elapsedSeconds===null?'진행 중':api.duration(r.elapsedSeconds)}</td><td>${api.time(r.startedAt)}</td><td>${api.time(r.finishedAt)}</td><td>${[r.barber,r.shop,r.house].filter(Boolean).length}/3</td><td>${r.final?'완성':'대기'}</td><td><button type="button" data-record="${esc(r.id)}">${r.deleted?'복구':'삭제 (순위 제외)'}</button></td></tr>`).join('');
  $('admin-rows').querySelectorAll('[data-record]').forEach(button=>button.addEventListener('click',async()=>{
   const r=rows.find(x=>x.id===button.dataset.record);const action=r.deleted?'복구':'삭제하여 순위에서 제외';
   const reason=prompt(`${r.nickname}님의 기록을 ${action}합니다. 사유를 입력해 주세요. (2~120자)`);if(reason===null)return;
   if(reason.trim().length<2||reason.trim().length>120){status('사유는 2~120자로 입력해 주세요.');return;}
   button.disabled=true;try{await call('moon_admin_delete',{p_id:r.id,p_deleted:!r.deleted,p_reason:reason.trim()});await load();}catch(e){status(e.message);button.disabled=false;}
  }));
 }
 async function load(){
  if(busy||!auth||document.hidden)return;busy=true;
  try{const data=await call('moon_admin_list');rows=data.rows;open=data.acceptingEntries;draw();status('최근 조회: '+api.time(data.serverNow)+' (한국 시각)');}
  catch(e){status('갱신하지 못했습니다. 표시된 목록은 이전 조회 결과입니다. '+e.message);if(e.status===401||e.status===403||e.code==='ADMIN_REQUIRED')loggedOut();}
  finally{busy=false;}
 }
 $('admin-login').addEventListener('submit',async e=>{
  e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;status('관리자 권한을 확인합니다.');
  try{auth=await api.request('/auth/v1/token?grant_type=password',{email:$('admin-email').value.trim(),password:$('admin-password').value});auth.expires_at=auth.expires_at||Math.floor(Date.now()/1000)+(auth.expires_in||3600);
   const data=await call('moon_admin_list');rows=data.rows;open=data.acceptingEntries;$('admin-password').value='';$('admin-console').hidden=false;$('admin-login').hidden=true;draw();status('최근 조회: '+api.time(data.serverNow)+' (한국 시각)');poll=setInterval(load,10000);
  }catch(e){loggedOut();status(e.code==='NOT_CONFIGURED'?e.message:'로그인 또는 관리자 등록 상태를 확인해 주세요.');}
  finally{button.disabled=false;}
 });
 $('admin-logout').addEventListener('click',async()=>{const token=auth?.access_token;loggedOut();status('로그아웃했습니다.');if(token)await api.request('/auth/v1/logout',undefined,token).catch(()=>{});});
 $('admin-refresh').addEventListener('click',load);$('admin-search').addEventListener('input',draw);
 $('entries-toggle').addEventListener('click',async()=>{
  if(!confirm(open?'신규 참여 접수를 마감할까요? 시작한 가족은 계속 진행할 수 있습니다.':'신규 참여 접수를 시작할까요? 현장 준비를 마친 뒤 시작해 주세요.'))return;
  const b=$('entries-toggle');b.disabled=true;try{await call('moon_admin_open',{p_open:!open});await load();}catch(e){status(e.message);}finally{b.disabled=false;}
 });
 function csvCell(value){const text=String(value??'');return '"'+(/^[=+@\-\t\r\n]/.test(text)?"'"+text:text).replace(/"/g,'""')+'"';}
 $('export-csv').addEventListener('click',()=>{
  const include=$('export-private').checked,head=['닉네임',...(include?['전화번호 뒤 4자리']:[]),'순위','소요 초','시작 시각 (KST)','완료 시각 (KST)','미션 완료 수','초대장 완성','순위 제외','기록 ID'];
  const kst=v=>v?new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date(v)):'';
  const values=rows.map(r=>[r.nickname,...(include?[r.last4||'']:[]),r.rank??'',r.elapsedSeconds??'',kst(r.startedAt),kst(r.finishedAt),[r.barber,r.shop,r.house].filter(Boolean).length,r.final?'완성':'대기',r.deleted?'제외':'유효',r.id]);
  const content='\uFEFF'+[head,...values].map(row=>row.map(csvCell).join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='달빛우체국_참여기록_20260925.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);status('CSV를 저장했습니다. 뒤 4자리의 앞자리 0을 유지하려면 엑셀의 데이터 → 텍스트/CSV에서 해당 열을 텍스트로 지정하세요.');
 });
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)load();});
 if(!api.configured)status('Supabase 연결 설정을 넣은 뒤 운영자 계정으로 로그인해 주세요.');
})();
