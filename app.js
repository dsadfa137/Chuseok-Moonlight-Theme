(function () {
  'use strict';
  const A = window.MoonAnswers;
  const S = window.MOON_STORY;
  const O = window.MOON_OPERATIONS;
  const IS_FIELD = true;
  const API = window.MoonServer, session = window.MoonSession;
  const main = document.getElementById('main');
  let storageAvailable = session.storage;
  let acceptedReason = '';
  let state = {loggedIn:false,barber:false,shopTrade:false,shop:false,house:false,final:false,hints:{}};
  function save() { session.data.hints=state.hints;session.save(); }
  function applySnapshot() {
    const v=session.snapshot;
    for(const k of ['barber','shopTrade','shop','house','final'])state[k]=Boolean(v?.[k]);
    state.loggedIn=Boolean(v);state.hints=session.data.hints||{};storageAvailable=session.storage;
  }
  applySnapshot();
  function esc(text) { return String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function view(route) { const hash = '#'+route; if(location.hash === hash) render(); else location.hash = hash; }
  function count() { return ['barber','shop','house'].filter(k=>state[k]).length; }
  function progress() { return `<div class="row"><span class="muted">모은 달 조각</span><strong>${count()} / 3</strong></div><div class="progress" aria-label="3개 미션 중 ${count()}개 완료">${['barber','shop','house'].map(k=>`<span class="${state[k]?'done':''}"></span>`).join('')}</div>`; }
  function moon(type) {
    const path = type === 'crescent' ? '<path d="M43 6A24 24 0 1 0 43 54A26 26 0 0 1 43 6Z" fill="currentColor"/>' : type === 'half' ? '<circle cx="30" cy="30" r="24" fill="none" stroke="currentColor" stroke-width="2"/><path d="M30 6A24 24 0 0 1 30 54Z" fill="currentColor"/>' : '<circle cx="30" cy="30" r="24" fill="currentColor"/>';
    return `<span class="moon" aria-hidden="true"><svg viewBox="0 0 60 60">${path}</svg></span>`;
  }
  const fragments = {
    barber:{moon:'half',label:'반달',words:'더 풍성한',place:'이발소',next:'shop',nextLabel:'구판장으로'},
    shop:{moon:'crescent',label:'초승달',words:'함께 나누면',place:'구판장',next:'house',nextLabel:'직원사택으로'},
    house:{moon:'full',label:'보름달',words:'한가위',place:'직원사택',next:'final',nextLabel:'초대장 완성하기'}
  };
  function stamp(id,showWords=true) {
    const f=fragments[id];
    return `<div class="stamp">${moon(f.moon)}<small>${f.label}</small>${showWords?`<strong>${f.words}</strong>`:''}</div>`;
  }
  function heading(label,title,description='') {
    return `<button class="back" data-go="home">배달길로 돌아가기</button>${progress()}<span class="mission-tag">${label}</span><h1>${title}</h1>${description?`<p class="story">${description}</p>`:''}`;
  }
  function prologue() {
    return `<section class="prologue-card" aria-labelledby="prologue-title"><h2 id="prologue-title">달빛 우체국에서 온 부탁</h2><p>${esc(S.prologue.short)}</p><details class="story-more"><summary>마을 이야기 더 읽기</summary>${S.prologue.full.map(p=>`<p>${esc(p)}</p>`).join('')}<p class="story-setting">${esc(S.setting)}예요.</p></details></section>`;
  }
  function feedback(message,kind='error',focus=false) {
    const box=document.getElementById('feedback'); if(!box)return;
    box.className='feedback '+kind;box.textContent=message;
    if(focus){box.tabIndex=-1;box.focus();}
  }
  function storageNotice() { return storageAvailable?'':'<p class="storage-warning">이 브라우저에서는 기록 저장이 제한되어 있어요. 화면을 닫기 전에 내용을 확인해 주세요.</p>'; }
  function cornerFrame() {
    const pattern='<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M1 31V1h30M6 25V6h19v13H12V12h7v13H6M1 19h11V1M1 12h5M19 1v5M25 1v11h6M1 25h11v6"/></svg>';
    return ['tl','tr','br','bl'].map(position=>`<span class="frame-corner ${position}" aria-hidden="true">${pattern}</span>`).join('');
  }
  function ornamentButton(label) {
    const symbol='<span class="button-ornament" aria-hidden="true"><svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="18" cy="18" r="16"/><circle cx="18" cy="18" r="12.5"/><path d="M18 5v26M5 18h26M8 13h5V8M23 8v5h5M28 23h-5v5M13 28v-5H8M13 13h10v10H13Z"/></svg></span>';
    return `${symbol}<span class="button-label">${label}</span>${symbol}`;
  }
  function reviewMeta() {
    if (IS_FIELD) return '<div class="review-meta"><span>문경에코월드 · 탄광사택촌</span><span>2026. 9. 25.(금)</span></div>';
    return '<div class="review-meta"><span class="review-label">검토용 시제품</span><span data-review-address></span><time data-review-date></time></div>';
  }
  function refreshReviewMeta() {
    if (IS_FIELD) return;
    const date=new Date();
    const parts=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
    const part=type=>parts.find(p=>p.type===type).value;
    const localAddress=['127.0.0.1','localhost'].includes(location.hostname)?location.host:location.protocol==='file:'?'로컬 HTML':'웹 미리보기';
    document.querySelectorAll('[data-review-address]').forEach(el=>{el.textContent=localAddress;});
    document.querySelectorAll('[data-review-date]').forEach(el=>{el.dateTime=`${part('year')}-${part('month')}-${part('day')}`;el.textContent=`열어본 날짜 ${part('year')}. ${part('month')}. ${part('day')}.`;});
  }
  function helpPage() {
    return `<div class="help-toolbar"><span class="help-kicker">달빛 집배원 안내</span><button type="button" id="help-close" class="dialog-close" aria-label="참여 안내 닫기">×</button></div>
      <div class="help-heading"><h2 id="help-title">${IS_FIELD ? '참여 방법과 도움말' : '체험 코드로 둘러보기'}</h2></div>
      <div class="help-sticker"><img loading="lazy" src="${window.MOON_ASSETS.pair}" alt="" aria-hidden="true"></div>
      <section class="qa-card ornate-frame" aria-labelledby="qa-title">${cornerFrame()}<span class="qa-label">참여 안내 · Q&amp;A</span>
        <h3 id="qa-title">휴대전화 이용이 어려운 가족도 참여할 수 있나요?</h3>
        <p><strong>네, 종이 책자로도 함께할 수 있어요.</strong><br>전시 속 단서를 살펴보고 책자에 답을 기록해요. 도움이 필요하면 입구 또는 완료 확인 장소의 직원에게 알려주세요.</p>
        <p class="qa-note">달 스티커 3장은 입구에서 함께 받아요. 통신이 끊겨도 책자 기록으로 완료를 확인받을 수 있어요.</p>
      </section>
      <div class="help-actions">${IS_FIELD ? '<p>입구에서 책자와 스티커를 받고 닉네임으로 시작해요. 순위 기록은 인터넷 연결이 필요해요.</p>' : `<button type="button" id="help-demo-start" class="primary ornament-button">${ornamentButton('미션 시작하기')}</button><p>체험 코드 <strong>DAL-2026</strong>으로 미션을 둘러봐요.</p>`}<button type="button" class="help-link" id="help-back">시작 화면으로 돌아가기</button></div>
      <div class="review-footer">${reviewMeta()}<span class="page-badge" aria-label="시작 및 안내 화면 2개 중 2번째">2<span aria-hidden="true">/</span>2</span></div>`;
  }
  function gate() {
    return `<section class="hero" aria-labelledby="welcome-title">
      <div class="hero-stage"><span class="hero-moon" aria-hidden="true"></span><span class="chalk-star one" aria-hidden="true">✧</span><span class="chalk-star two" aria-hidden="true">✧</span><span class="chalk-star three" aria-hidden="true">·</span>
        <svg class="hero-mailbox" aria-hidden="true" viewBox="0 0 60 100" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 28a20 20 0 0 1 40 0v59H10ZM6 88h48v6H6ZM17 35h26v7H17ZM18 53h24v22H18Z"/><path d="m18 54 12 10 12-10M18 22h24"/></svg>
        <svg class="hero-letter" aria-hidden="true" viewBox="0 0 64 54" fill="none" stroke="currentColor" stroke-width="1.6"><path stroke-dasharray="3 2" d="M3 4h58v44H3Z"/><path d="m5 7 27 22L59 7M5 46l20-20M59 46 39 26"/><circle cx="45" cy="13" r="5"/></svg>
        <img class="hero-mascots" src="${window.MOON_ASSETS.mascots}" alt="함께 모인 문경에코월드 랄라스타즈">
      </div>
      <div class="hero-badges"><span class="hero-event">2026 추석 문경에코월드</span><span class="hero-brand">문경에코월드 랄라스타즈</span></div>
      <p class="event-date"><time datetime="${esc(O.eventDate)}">2026. 9. 25.(금)</time> · 추석 당일 하루</p>
      <h1 id="welcome-title"><span class="hero-title-line">달빛 우체국<span class="hero-separator"> ·</span></span> <span class="hero-title-line">한가위 초대장</span></h1><p>전시 속 단서를 찾아 가족의 마음을 모아주세요.</p>
    </section>
    <section class="intro-form" aria-label="닉네임으로 시작하기">
      ${state.loggedIn ? `<div class="nickname-card ornate-frame">${cornerFrame()}<h2>${esc(session.snapshot.nickname)} 집배원님!</h2><p>우리 가족이 모은 마음을 이어가 볼까요?</p><button class="primary" data-go="home">미션 이어가기</button></div>` : `
      <form id="nickname-form" class="nickname-card ornate-frame" novalidate>${cornerFrame()}
        <h2>우리 가족의 집배원 이름은?</h2>
        <label for="nickname-input" class="field-label">닉네임</label>
        <input id="nickname-input" class="input" type="text" autocomplete="off" spellcheck="false" maxlength="16" placeholder="예: 달토끼" aria-describedby="nickname-help feedback">
        <p id="nickname-help" class="format-note">한글·영문·숫자 2~8자예요. 다른 가족과 겹치지 않는 이름을 지어봐요!</p>
        <button type="button" id="check-name" class="text-button">사용할 수 있는 이름인지 확인</button>
        <label for="last4-input" class="field-label">전화번호 뒤 4자리 <small>(선택)</small></label>
        <input id="last4-input" class="input" type="text" inputmode="numeric" autocomplete="off" maxlength="4" placeholder="입력하지 않아도 참여할 수 있어요" aria-describedby="last4-help">
        <p id="last4-help" class="format-note">기록 확인을 돕는 보조 정보예요. 관리자만 볼 수 있고, 순위표에는 표시하지 않아요.</p>
        <label class="privacy-check"><input type="checkbox" id="public-check"><span>닉네임과 미션 기록이 순위표에 공개되는 것을 확인했어요.</span></label>
        <p class="format-note">실명이나 연락처를 닉네임에 적지 말아 주세요. ‘출발’부터 세 번째 미션 정답 확인까지 시간을 재요.</p>
        <div id="feedback" class="feedback" role="status" aria-live="polite"></div>
        <button class="primary ornament-button" type="submit">${ornamentButton('달빛 집배원, 출발!')}</button>
      </form>`}
      ${API.configured?'':'<p class="field-start-note">웹 기록 서버를 준비하고 있어요.<br>지금은 입구에서 종이 책자를 받아주세요.</p>'}
      <p class="field-start-note">달빛 우체국 안내자 랄라스타즈와 함께! ✨<br>옛 사택촌의 정겨운 한가위 이야기로 떠나봐요.</p>
      <button type="button" class="help-link" id="help-open" aria-haspopup="dialog" aria-controls="help-dialog">참여 방법과 도움말 →</button>${storageNotice()}
    </section>`;
  }

  function home() {
    const cards=[['barber','1','이발소','잃어버린 대기표 찾기'],['shop','2','구판장','함께 나눌 한가위 장보기'],['house','3','직원사택','가족의 한가위 인사']];
    return `<div class="content"><div class="eyebrow">우리 가족의 배달길 · ${esc(session.snapshot?.nickname || '')}</div><h1>세 조각을 모아<br>초대장을 완성해요.</h1>${prologue()}${progress()}<div class="notice">전시는 유리 너머에서 눈으로 살펴봐요. 책자와 비교한 뒤, 잠시 비켜 답을 입력해 주세요.</div>${cards.map(([id,n,title,desc])=>`<div class="route-card ${state[id]?'done':''}"><button data-go="${id}"><span class="route-number">${state[id]?'✓':n}</span><span class="route-copy"><strong>${title}</strong><small>${desc}</small></span><span class="route-state">${state[id]?'완료':'시작'}</span></button></div>`).join('')}<div class="button-stack"><button class="primary" data-go="final" ${A.allMissionsComplete(state)?'':'disabled'}>${state.final?'완성한 초대장 보기':'한가위 초대장 완성하기'}</button></div>${A.allMissionsComplete(state)?'':'<p class="format-note">세 장소를 완료하면 마지막 초대장이 열려요.</p>'}<button type="button" class="secondary rank-button" data-rank>우리 가족 순위 보기</button><details class="helpdetails"><summary>책자와 웹은 어떻게 함께 쓰나요?</summary><p>입구에서 책자 1부와 달 스티커 3장을 함께 받아요. 각 미션을 풀면 받은 스티커를 직접 붙여주세요.</p><p>책자 2~3쪽의 쪽지와 현장에 놓인 단서를 비교해요.</p><p>${esc(S.rewardLogic.overview)}</p><p>진행 순서: 이발소 → 구판장 → 직원사택 → 완료 확인 → 하단 통로 퇴장.</p></details>${storageNotice()}</div>`;
  }
  const hints={
    barber:['책자의 손님은 두 사람이 함께 사진을 찍었어요. 인원수가 맞는 사진을 찾아보세요.','두 사람 사진 아래에는 나무 표식이 있어요. 이발 대기 순서표에서 같은 표식을 찾아보세요.','나무 표식의 대기 번호는 42예요. 사진과 대기 순서표에서 같은 표식을 함께 찾아봐요.'],
    trade:['거래메모에서 확인하는 물건의 이름을 찾아보세요.','‘인’으로 시작하는 세 글자예요.','인감증이에요. 거래메모에서 같은 단어를 찾고 다음으로 가볼까요?'],
    symbols:['책자의 부탁은 먹는 떡이 먼저, 손 씻는 물건이 다음이에요.','부탁한 물건은 송편과 비누예요. 주문장에서 그림 옆 표식 이름을 읽어보세요.','송편 옆에는 별, 비누 옆에는 동그라미가 있어요. 별 → 동그라미 순서로 골라요.'],
    house:['주방에서는 천으로 감싼 꾸러미를, 방에서는 수화기가 있는 물건을 찾아보세요.','보자기 가까이의 쪽지와 전화기 가까이의 쪽지에서 밑줄 친 말을 비교해 보세요.','주방의 ‘함께여서’와 방의 ‘고마워요’를 이어 읽어요. 함께여서 고마워요!'],
    final:['스티커에 표시된 달 모양과 이름을 확인해 보세요.','구판장의 초승달 → 이발소의 반달 → 직원사택의 보름달 순서예요.','완성한 문장은 ‘함께 나누면 더 풍성한 한가위’예요. 책자의 조각을 함께 읽어보세요.']
  };
  function hintControls(key) {
    return `<div class="hint-action"><button type="button" class="text-button" id="hint-button">힌트 보기</button></div><div id="hint-panel" class="hint-panel" aria-live="polite"></div>`;
  }
  function formText(id,label,helper,numeric=false) {
    return `<form id="answer-form" novalidate><label class="field-label" for="answer-input">${label}</label><input class="input" id="answer-input" type="text" ${numeric?'inputmode="numeric"':''} autocomplete="off" maxlength="100" spellcheck="false" aria-describedby="input-help feedback"><p class="format-note" id="input-help">${helper}</p><div id="feedback" class="feedback" role="status" aria-live="polite"></div><button class="primary" type="submit">답 확인하기</button></form>${hintControls(id)}`;
  }
  function barber() {
    return `<div class="content">${heading('① 이발소 · 책자 2쪽','잃어버린<br>대기표 찾기',esc(S.missions.barber.story))}<div class="paper-note"><div class="note-title">책자 속 기억 쪽지</div><p>우리는 <strong>두 사람이 함께</strong> 기념사진을 찍었어요.<br>사진 제목은 ‘1978년 한가위 기념 가족사진’이에요.<br>사진 아래 표식과 ‘한가위 이발 대기 순서표’를 비교해 주세요.</p></div><div class="question"><h2>손님의 대기 번호는 무엇일까요?</h2>${formText('barber','찾은 대기 번호','대기 순서표에 적힌 두 자리 숫자를 입력해 주세요.',true)}</div></div>`;
  }
  function shopTrade() {
    return `<div class="content">${heading('② 구판장 · 1/2','한가위 장보기',esc(S.missions.shop.story))}<div class="question"><h2>외상으로 물건을 살 때 무엇을 확인했을까요?</h2><form id="trade-form" novalidate><div class="choices" role="radiogroup" aria-label="거래메모의 단어">${['기차표','인감증','한가위 초대장'].map(v=>`<label class="choice"><input type="radio" name="trade" value="${v}"><span>${v}</span></label>`).join('')}</div><div id="feedback" class="feedback" role="status" aria-live="polite"></div><button type="submit" class="primary">답 확인하기</button></form>${hintControls('trade')}</div></div>`;
  }
  function shapeGroup(n,label) {
    const values=[['별','★'],['동그라미','○'],['세모','△'],['네모','□']];
    return `<fieldset class="choice-group"><legend>${label}</legend><div class="shape-grid">${values.map(([v,icon])=>`<label class="choice"><input type="radio" name="shape${n}" value="${v}"><span><span class="symbol" aria-hidden="true">${icon}</span> ${v}</span></label>`).join('')}</div></fieldset>`;
  }
  function shopSymbols() {
    return `<div class="content">${heading('② 구판장 · 2/2','장보기 표식을 찾아요',esc(S.missions.shop.secondStage))}<div class="paper-note"><div class="note-title">책자 속 장보기 쪽지</div><ol><li>한가위에 함께 나누어 먹는 떡.</li><li>손을 씻을 때 쓰는 물건.</li></ol></div><div class="question"><h2>한가위 주문장에서 두 물건의 그림 옆 표식 이름을 읽고 순서대로 골라주세요.</h2><form id="symbols-form" novalidate>${shapeGroup(1,'첫째 물건의 표식')}${shapeGroup(2,'둘째 물건의 표식')}<div id="feedback" class="feedback" role="status" aria-live="polite"></div><button type="submit" class="primary">표식 확인하기</button></form>${hintControls('symbols')}</div></div>`;
  }
  function house() {
    return `<div class="content">${heading('③ 직원사택 · 책자 3쪽','가족의 한가위 인사',esc(S.missions.house.story))}<div class="paper-note"><div class="note-title">책자 속 두 수수께끼</div><ol><li>음식이나 물건을 싸서 건네는 <strong>천</strong>. 주방에서 찾아요.</li><li>멀리 있는 사람의 <strong>목소리</strong>를 들려주는 물건. 방에서 찾아요.</li></ol></div><div class="question"><h2>두 쪽지가 전하는 가족의 인사말은 무엇일까요?</h2><p class="format-note">물건 곁 ‘한가위에 전하는 말’ 쪽지의 밑줄 친 말을 주방 → 방 순서로 이어요. 답을 확인하면 보름달 조각을 받아요.</p>${formText('house','가족의 인사말','띄어쓰기와 마침표는 달라도 괜찮아요.')}</div></div>`;
  }
  function success(id) {
    const f=fragments[id];let next=f.next,nextLabel=f.nextLabel;
    if(id==='house'&&!A.allMissionsComplete(state)){next='home';nextLabel='남은 미션 보기';}
    const canonical=id==='house'?'<div class="canonical">함께여서 고마워요</div>':id==='barber'?'<div class="canonical">대기 번호 <strong>42</strong></div>':'<div class="canonical">인감증 · 별 → 동그라미</div>';
    return `<div class="content success-content"><button class="back" data-go="home">배달길 보기</button><div class="success-line">✓ ${f.place} 미션 완료</div><h1>달 조각이<br>도착했어요!</h1><section class="answer-summary" aria-label="이번 장소의 미션 정답"><h2 class="result-label">이번 장소의 미션 정답</h2>${canonical}</section><p class="story-resolution">${esc(S.missions[id].success)}</p>${acceptedReason==='known-typo'?'<p class="muted">작은 입력 차이는 정답으로 인정했어요.</p>':''}<section class="reward-summary" aria-label="초대장에 붙일 달 조각"><h2 class="result-label">초대장에 붙일 달 조각</h2>${stamp(id)}</section>${id==='house'?`<button type="button" class="secondary rank-button" data-rank>내 순위 보기</button><p class="reward-note">${esc(S.rewardLogic.house)}</p>`:''}<p>입구에서 받은 스티커를 책자 4쪽의<br><strong>${f.label} 칸</strong>에 붙여주세요.</p><div class="button-stack"><button class="primary" data-go="${next}">${nextLabel}</button><button class="secondary" data-go="home">배달길 보기</button></div></div>`;
  }
  function finalQuestion() {
    if(!A.allMissionsComplete(state))return `<div class="content">${heading('마지막 초대장','달 조각을 모아주세요.')}<p>세 장소를 순서대로 완료하면 마지막 답을 입력할 수 있어요.</p><button class="primary" data-go="home">남은 미션 보기</button></div>`;
    return `<div class="content">${heading('마지막 미션 · 책자 4쪽','한가위 초대장을<br>완성해요!',esc(S.final.story))}<div class="sticker-row">${stamp('shop',false)}${stamp('barber',false)}${stamp('house',false)}</div><p class="muted">방문한 순서와 스티커 칸의 순서는 달라요. 왼쪽부터 읽어주세요.</p><div class="notice">${esc(S.rewardLogic.final)}</div><div class="question"><h2>완성한 초대장의 인사말은 무엇일까요?</h2>${formText('final','마지막 인사말','띄어쓰기와 마침표는 달라도 괜찮아요.')}</div></div>`;
  }
  function completed() {
    return `<div class="content success-content"><div class="eyebrow">달빛 집배원의 배달 완료</div><h1>한가위 초대장이<br>완성되었어요!</h1><p class="story-resolution">${esc(S.ending)}</p><div class="complete-card"><div class="muted">우리 가족의 집배원</div><div class="code-mark">${esc(session.snapshot?.nickname || '')}</div><div class="canonical">함께 나누면<br>더 풍성한 한가위</div><ul class="complete-checks"><li>✓ 이발소 · 반가운 만남 준비</li><li>✓ 구판장 · 장보기와 나눔</li><li>✓ 직원사택 · 가족의 인사</li><li>✓ 마지막 초대장 완성</li></ul></div><button type="button" class="secondary rank-button" data-rank>내 순위 보기</button><h2>완료 확인 장소로 와주세요.</h2><p>현장에서는 웹 완료 화면과 책자를 보여주세요. 종이로 참여한 가족은 책자의 기록으로 확인받아요. 미션 완료 확인 후 가족 1팀당 기념품 1종 1개를 받아요.</p>${IS_FIELD ? '<div class="notice">책자의 지급 확인란에 직원 확인을 받아 주세요.<br>기념품 지급은 책자 번호로 확인해요.</div>' : '<div class="notice">지금은 검토용 시제품이에요.<br>이 화면으로 실제 기념품을 받을 수는 없어요.</div>'}<p class="muted">완료 확인과 기념품 수령을 마친 뒤에는 하단 통로로 이동해요.</p><section class="consent-card" aria-labelledby="consent-title"><h2 id="consent-title">고객만족도 조사 안내</h2><p>지방공기업 고객만족도 조사를 위한 <strong>개인정보 수집·이용 및 제3자 제공 동의서</strong>예요. 네이버 폼에서 내용을 읽고 동의 여부를 직접 선택해 주세요.</p><p class="muted">미션 완료·기념품 지급과 별도로 안내해요. 휴대전화 이용이 어려우면 완료 확인 직원에게 알려주세요.</p><a id="consent-link" class="secondary consent-link" href="${esc(O.consentUrl)}" target="_blank" rel="noopener noreferrer">네이버 동의서 확인하기 <span aria-label="새 창">↗</span></a></section><button class="primary" data-go="home">모은 달 조각 다시 보기</button><img class="image-end" src="${window.MOON_ASSETS.mascots}" alt="고마운 마음을 전하는 랄라스타즈"></div>`;
  }
  function markComplete(key,answer) { return session.submit(key,answer); }
  function bindHints(key) {
    const button=document.getElementById('hint-button');if(!button)return;
    const panel=document.getElementById('hint-panel');
    function paint() {
      const n=state.hints[key]||0;
      panel.replaceChildren();
      if(n){const p=document.createElement('p');p.textContent=hints[key][n-1];panel.append(p);}
      button.textContent=n===0?'힌트 보기':n<3?'힌트 하나 더 보기':'힌트를 모두 확인했어요';
      button.disabled=n>=3;

    }
    button.addEventListener('click',()=>{state.hints[key]=Math.min(3,(state.hints[key]||0)+1);save();paint();});paint();
  }
  function bindText(key) {
    const form=document.getElementById('answer-form'),input=document.getElementById('answer-input');if(!form)return;
    let composing=false;
    input.addEventListener('compositionstart',()=>{composing=true;});input.addEventListener('compositionend',()=>{composing=false;});
    input.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.isComposing||composing||e.keyCode===229))e.preventDefault();});
    input.addEventListener('input',()=>{input.removeAttribute('aria-invalid');});
    form.addEventListener('submit',e=>{
      e.preventDefault();if(composing)return;
      const result=key==='barber'?{correct:A.validateTicket(input.value),reason:input.value.trim()?'mismatch':'empty'}:A.validateSentence(key==='house'?'greeting':'invitation',input.value);
      if(result.correct){acceptedReason=result.reason;markComplete(key,{value:input.value});return;}
      input.setAttribute('aria-invalid','true');
      const message=result.reason==='empty'?'찾은 답을 입력해 주세요.':key==='barber'?'사진 속 사람 수와 대기 순서표의 같은 표식을 다시 비교해 볼까요?':key==='house'?'주방 쪽지의 말이 먼저예요. 밑줄 친 두 말을 순서대로 이어주세요.':'달 스티커의 모양과 이름을 맞춰 왼쪽부터 읽어볼까요?';
      feedback(message+'\n앞서 완료한 미션은 그대로 남아 있어요.');
    });bindHints(key);
  }
  function bind() {
    main.querySelectorAll('[data-go]').forEach(button=>button.addEventListener('click',()=>view(button.dataset.go)));
    const route=location.hash.slice(1)||'home';
    if(!state.loggedIn||route==='intro'){
      const form=document.getElementById('nickname-form');
      if(form){
        const input=document.getElementById('nickname-input');let composing=false;
        input.addEventListener('compositionstart',()=>composing=true);input.addEventListener('compositionend',()=>composing=false);
        function values(){const name=input.value.normalize('NFKC').trim(),last4=document.getElementById('last4-input').value;
          if(!/^[가-힣A-Za-z0-9]{2,8}$/u.test(name)){feedback('닉네임은 한글·영문·숫자로 2~8자 적어주세요.');return null;}
          if(last4&&!/^[0-9]{4}$/.test(last4)){feedback('뒤 4자리는 숫자 네 자리로 적거나 비워 주세요.');return null;}return {name,last4};}
        document.getElementById('check-name').addEventListener('click',async()=>{const v=values();if(!v)return;try{const result=await API.rpc('moon_check_name',{p_nickname:v.name});feedback(result.available?'사용할 수 있는 이름이에요! 출발할 때 한 번 더 확인해요.':'다른 가족이 쓰고 있어요. 새로운 이름을 지어볼까요?',result.available?'success':'error');}catch(e){feedback(e.message);}});
        form.addEventListener('submit',async e=>{e.preventDefault();if(composing)return;const v=values();if(!v)return;
          if(!document.getElementById('public-check').checked){feedback('닉네임과 기록의 공개 안내를 확인해 주세요.');return;}
          try{await session.start(v.name,v.last4);if(session.snapshot&&!session.snapshot.deleted)view('home');}catch(e){feedback(e.message);}});
      }
      document.getElementById('help-open').addEventListener('click',()=>{helpDialog.showModal();helpDialog.scrollTop=0;});return;
    }
    if(route==='barber'&&!state.barber)bindText('barber');
    if(route==='house'&&state.shop&&!state.house)bindText('house');
    if(route==='final'&&!state.final&&A.allMissionsComplete(state))bindText('final');
    const trade=document.getElementById('trade-form');
    if(trade){trade.addEventListener('submit',e=>{e.preventDefault();const value=new FormData(trade).get('trade');if(value==='인감증'){markComplete('trade',{value});}else feedback(value?'거래메모에서 확인하는 물건의 이름을 찾아보세요.':'단어를 하나 골라주세요.');});bindHints('trade');}
    const symbols=document.getElementById('symbols-form');
    if(symbols){symbols.addEventListener('submit',e=>{e.preventDefault();const data=new FormData(symbols),a=data.get('shape1'),b=data.get('shape2');if(!a||!b){feedback('표식 두 개를 모두 골라주세요.');return;}if(a==='별'&&b==='동그라미'){markComplete('symbols',{first:a,second:b});return;}feedback(a==='동그라미'&&b==='별'?'두 물건은 잘 찾았어요! 먹는 떡 먼저, 손 씻는 물건 다음으로 골라주세요.':'주문장 속 물건과 그림 옆에 쓰인 표식 이름을 비교해 주세요.');});bindHints('symbols');}
  }
  function render() {
    const route=location.hash.slice(1)||'home';
    const isIntro=!state.loggedIn||route==='intro';
    if(session.snapshot?.deleted)main.innerHTML='<div class="content"><h1>기록 확인이 필요해요.</h1><p>이 기록은 순위에서 제외되었어요. 완료 확인 직원에게 안내받아 주세요.</p></div>';
    else if(isIntro)main.innerHTML=gate();
    else if((route==='shop'&&!state.barber)||(route==='house'&&!state.shop))main.innerHTML='<div class="content"><h1>배달길을 따라가 볼까요?</h1><p>이발소 → 구판장 → 직원사택 순서로 단서를 찾아요.</p><button class="primary" data-go="home">배달길 보기</button></div>';
    else if(route==='barber')main.innerHTML=state.barber?success('barber'):barber();
    else if(route==='shop')main.innerHTML=state.shop?success('shop'):state.shopTrade?shopSymbols():shopTrade();
    else if(route==='house')main.innerHTML=state.house?success('house'):house();
    else if(route==='final')main.innerHTML=state.final?completed():finalQuestion();
    else main.innerHTML=home();
    document.querySelector('.phone-shell').classList.toggle('is-intro',isIntro);
    if(!session.snapshot?.deleted)bind();
    main.querySelectorAll('[data-rank]').forEach(el=>el.addEventListener('click',openRanks));
    document.getElementById('reset-button').hidden=true;
    updateStatus();
    document.getElementById('intro-page-badge').hidden=!isIntro;
    main.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});
  }
  document.getElementById('brand').addEventListener('click',e=>{e.preventDefault();view('home');});
  document.getElementById('intro-preview').addEventListener('click',()=>view('intro'));
  document.getElementById('village-art').src=window.MOON_ASSETS.village;
  const helpDialog=document.getElementById('help-dialog');
  helpDialog.innerHTML=helpPage();
  helpDialog.addEventListener('keydown',e=>{
    if(e.key!=='Tab')return;
    const controls=[...helpDialog.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),[tabindex="0"]')].filter(el=>el.getClientRects().length);
    const first=controls[0],last=controls[controls.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  });
  document.getElementById('help-close').addEventListener('click',()=>helpDialog.close());
  document.getElementById('help-back').addEventListener('click',()=>{helpDialog.close();document.getElementById('nickname-input')?.focus();});

  if (IS_FIELD) {
    document.querySelector('.site-footer .review-meta').innerHTML = '<span>문경에코월드 · 탄광사택촌</span><span>2026. 9. 25.(금)</span>';
    document.querySelector('#reset-dialog p').textContent = '이 휴대전화에 저장된 미션 기록이 지워집니다. 기념품을 받기 전에는 기록을 유지해 주세요.';
  }
  refreshReviewMeta();
  const rankDialog=document.getElementById('rank-dialog');
  let rankTimer,rankBusy=false,rankRequest=0;
  async function loadRanks(){
    if(rankBusy||!rankDialog.open||document.hidden)return;
    rankBusy=true;const request=++rankRequest;
    try{const board=await API.rpc('moon_leaderboard',{p_token:session.data.token||null});if(request!==rankRequest||!rankDialog.open)return;
      const mine=document.getElementById('rank-mine');
      mine.textContent=board.mine?`${board.mine.nickname} · ${board.mine.rank}위 · ${API.duration(board.mine.elapsedSeconds)}`:session.snapshot?.finishedAt?'기록을 확인하고 있어요.':'세 미션을 마치면 우리 가족의 순위가 보여요.';
      document.getElementById('rank-rows').innerHTML=board.rows.map(r=>`<tr class="${r.id===session.snapshot?.id?'my-row':''}"><th scope="row">${r.rank}</th><td>${esc(r.nickname)}</td><td>${API.duration(r.elapsedSeconds)}</td><td>${API.time(r.finishedAt)}</td></tr>`).join('');
      document.getElementById('rank-status').textContent=board.rows.length?`한국 시각 ${API.time(board.serverNow)} 기준 · 상위 100팀 · 5초마다 새로고침`:'첫 달빛 집배원의 기록을 기다리고 있어요.';
    }catch(e){document.getElementById('rank-status').textContent='순위를 새로 불러오지 못했어요. 표시 중인 기록은 이전 조회 결과예요.';}
    finally{rankBusy=false;}
  }
  function openRanks(){rankDialog.showModal();loadRanks();clearInterval(rankTimer);rankTimer=setInterval(loadRanks,5000);}
  document.getElementById('rank-close').addEventListener('click',()=>rankDialog.close());
  document.getElementById('rank-refresh').addEventListener('click',loadRanks);
  rankDialog.addEventListener('close',()=>{clearInterval(rankTimer);rankRequest++;});
  function updateStatus(){
    const note=document.getElementById('network-note'), timer=document.getElementById('mission-timer');
    const waiting=Boolean(session.pending), s=session.snapshot;
    const message=!session.storage?'기록을 저장할 수 없는 브라우저예요. 종이 책자로 참여해 주세요.':session.message||(!navigator.onLine?'인터넷 연결이 끊겼어요. 책자에 답을 적어두고 연결 후 다시 확인해 주세요.':'');
    note.hidden=!message;document.getElementById('network-text').textContent=message;
    document.getElementById('network-retry').hidden=!(waiting||!session.live)&&!message;
    main.querySelectorAll('form button[type=submit],#check-name,#nickname-input,#last4-input,#public-check').forEach(el=>el.disabled=waiting||session.busy||!session.storage);
    timer.hidden=!s;
    if(s){const sec=session.seconds();timer.textContent=(s.finishedAt?'세 미션 완료 기록 · ':'우리 가족의 배달 시간 · ')+(sec===null?'연결 확인 중':API.duration(sec));}
  }
  document.getElementById('network-retry').addEventListener('click',()=>session.flush());
  let signature=JSON.stringify(session.snapshot&&[session.snapshot.id,session.snapshot.barber,session.snapshot.shopTrade,session.snapshot.shop,session.snapshot.house,session.snapshot.final,session.snapshot.deleted]);
  session.addEventListener('change',e=>{
    const old=state.loggedIn;applySnapshot();
    const next=JSON.stringify(session.snapshot&&[session.snapshot.id,session.snapshot.barber,session.snapshot.shopTrade,session.snapshot.shop,session.snapshot.house,session.snapshot.final,session.snapshot.deleted]);
    if(next!==signature){signature=next;if(!old&&state.loggedIn)view('home');else render();}
    if(e.detail?.correct===false)feedback('현장 단서와 다시 비교해 볼까요? 앞서 모은 달 조각은 그대로예요.');
    updateStatus();
  });
  window.addEventListener('hashchange',()=>{acceptedReason='';render();});
  setInterval(updateStatus,1000);
  render();session.flush();
})();
