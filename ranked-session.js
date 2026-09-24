(function(root){
 'use strict';
 const api=root.MoonServer,key=root.MOON_OPERATIONS.storageKey;
 class Session extends EventTarget{
  constructor(){super();this.data={};this.storage=true;this.busy=false;this.attempt=0;this.message='';this.live=false;
   try{localStorage.setItem(key+'-probe','1');localStorage.removeItem(key+'-probe');this.data=JSON.parse(localStorage.getItem(key)||'{}');}catch(_){this.storage=false;}
   if(!this.data||typeof this.data!=='object')this.data={};
   window.addEventListener('online',()=>this.flush());
   window.addEventListener('offline',()=>this.emit());
   window.addEventListener('storage',e=>{if(e.key===key){this.read();this.live=false;this.emit();this.flush();}});
   document.addEventListener('visibilitychange',()=>{if(!document.hidden)this.flush();});
  }
  get snapshot(){return this.data.snapshot;}
  get pending(){return this.data.pending||this.data.start;}
  read(){try{const s=JSON.parse(localStorage.getItem(key)||'{}');if(s&&typeof s==='object')this.data=s;}catch(_){this.storage=false;}}
  save(){try{localStorage.setItem(key,JSON.stringify(this.data));return true;}catch(_){this.storage=false;this.message='이 브라우저는 기록을 저장할 수 없어요. 종이 책자로 참여해 주세요.';this.emit();return false;}}
  emit(result){this.dispatchEvent(new CustomEvent('change',{detail:result}));}
  apply(s){this.data.snapshot=s;this.anchor=performance.now();this.serverTime=Date.parse(s.serverNow);this.live=true;this.save();}
  seconds(){const s=this.snapshot;if(!s)return null;if(s.elapsedSeconds!==null)return s.elapsedSeconds;if(!this.live)return null;return Math.max(0,Math.floor((this.serverTime+performance.now()-this.anchor-Date.parse(s.startedAt))/1000));}
  async start(nickname,last4){
   this.read();if(this.pending||this.snapshot){await this.flush();return;}
   if(!this.storage)throw Error('기록을 저장할 수 없어 시작하지 못했어요. 종이 책자로 참여해 주세요.');
   if(!api.configured)throw new api.ApiError('NOT_CONFIGURED');
   this.data.token=this.data.token||api.token();this.data.start={p_nickname:nickname,p_last4:last4||null};
   if(!this.save())return;this.emit();await this.flush();
  }
  async submit(mission,answer){
   this.read();if(this.pending||this.busy){this.message='앞서 보낸 답을 확인 중이에요. 잠시 기다려 주세요.';this.emit();return;}
   if(!this.snapshot||this.snapshot.deleted)return;
   this.data.pending={p_request:api.uuid(),p_mission:mission,p_answer:answer};
   if(!this.save())return;this.emit();await this.flush();
  }
  async flush(){
   if(this.busy||!api.configured||!this.storage)return;
   if(!navigator.onLine){this.message='연결을 기다리고 있어요. 답을 보관해 두었다가 다시 보내드릴게요.';this.emit();return;}
   this.busy=true;clearTimeout(this.retryTimer);this.message='기록을 확인하고 있어요.';this.emit();
   const execute=async()=>{
    this.read();
    try{
     if(this.data.start){
      const s=await api.rpc('moon_start',{p_token:this.data.token,...this.data.start});
      delete this.data.start;this.apply(s);
     }
     if(this.data.pending){
      const job=this.data.pending;
      const result=await api.rpc('moon_submit',{p_token:this.data.token,...job});
      delete this.data.pending;this.apply(result.session);this.emit({...result,mission:job.p_mission});
     }else if(this.data.token&&this.snapshot){this.apply(await api.rpc('moon_session',{p_token:this.data.token}));}
     this.attempt=0;this.message=this.snapshot?.deleted?'이 기록은 순위에서 제외되었어요. 직원에게 문의해 주세요.':'';
    }catch(e){
     if(e.retry){this.attempt++;this.message='답과 기록을 보관했어요. 연결되면 다시 확인할게요. 완료 시각은 서버에 답이 도착한 시각이에요.';this.retryTimer=setTimeout(()=>this.flush(),Math.min(30000,1000*2**Math.min(this.attempt,5)));}
     else{this.message=e.message;if(['NICKNAME_TAKEN','INVALID_NICKNAME','INVALID_LAST4','ENTRIES_CLOSED'].includes(e.code)){delete this.data.start;}
      if(['MISSION_ORDER','REQUEST_CONFLICT','RECORD_REMOVED','INVALID_REQUEST'].includes(e.code)){delete this.data.pending;}
      this.save();this.emit({error:e.code});}
    }
   };
   try{if(navigator.locks)await navigator.locks.request(key,execute);else await execute();}
   finally{this.busy=false;this.emit();}
  }
 }
 root.MoonSession=new Session();
})(window);
