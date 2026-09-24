(function(root){
 'use strict';
 const cfg=root.MOON_OPERATIONS;
 const configured=Boolean(cfg.supabaseUrl&&cfg.supabasePublishableKey);
 const messages={NOT_CONFIGURED:'서버 연결을 준비하고 있어요. 지금은 입구 직원에게 종이 책자를 받아주세요.',ENTRIES_CLOSED:'지금은 새 참여 접수를 받고 있지 않아요. 입구 직원에게 안내받아 주세요.',NICKNAME_TAKEN:'이미 사용 중인 닉네임이에요. 다른 이름으로 함께해 볼까요?',INVALID_NICKNAME:'닉네임은 한글·영문·숫자로 2~8자 입력해 주세요.',INVALID_LAST4:'뒤 4자리는 숫자 네 자리로 적거나 비워 주세요.',SESSION_NOT_FOUND:'저장된 참여 기록을 찾지 못했어요. 직원에게 화면을 보여주세요.',RECORD_REMOVED:'이 기록은 순위에서 제외되었어요. 완료 확인 직원에게 문의해 주세요.',MISSION_ORDER:'이발소 → 구판장 → 직원사택 순서로 부탁을 해결해 볼까요?',ADMIN_REQUIRED:'관리자로 등록된 계정만 사용할 수 있어요.',REQUEST_CONFLICT:'전송 기록을 확인해야 해요. 직원에게 화면을 보여주세요.'};
 class ApiError extends Error{constructor(code,retry=false,status=0){super(messages[code]||'요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.');this.code=code;this.retry=retry;this.status=status;}}
 async function request(path,body,accessToken,method='POST'){
  if(!configured)throw new ApiError('NOT_CONFIGURED');
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),12000);
  const headers={'apikey':cfg.supabasePublishableKey,'Content-Type':'application/json'};
  // Publishable keys are not JWTs. Only an authenticated user's JWT is a Bearer token.
  if(accessToken)headers.Authorization='Bearer '+accessToken;
  try{
   const res=await fetch(cfg.supabaseUrl.replace(/\/$/,'')+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:ctrl.signal,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});
   const data=await res.json().catch(()=>({}));
   if(!res.ok){const code=Object.keys(messages).find(k=>String(data.message||data.msg||'').includes(k))||data.error_code||'REQUEST_FAILED';throw new ApiError(code,res.status===429||res.status>=500,res.status);}
   return data;
  }catch(e){if(e instanceof ApiError)throw e;throw new ApiError('NETWORK',true);}
  finally{clearTimeout(timer);}
 }
 function rpc(name,args={},accessToken){return request('/rest/v1/rpc/'+name,{p_event:cfg.eventId,...args},accessToken);}
 function token(){return [...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,'0')).join('');}
 const uuid=()=>crypto.randomUUID();
 const duration=seconds=>`${String(Math.floor(Math.max(0,seconds)/60)).padStart(2,'0')}분 ${String(Math.floor(Math.max(0,seconds)%60)).padStart(2,'0')}초`;
 const time=value=>value?new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date(value)):'—';
 root.MoonServer={configured,rpc,request,token,uuid,duration,time,ApiError};
})(window);
