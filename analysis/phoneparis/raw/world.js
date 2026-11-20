import {TourNavigation} from './tour-navigation.js';
// Scroll-controlled source frames avoid mobile video seek stalls. No video playback needed.
const START=6.65,END=44.4,COUNT=320;
const chapters=[
 {id:'square',name:'에펠탑 광장',time:6.65,title:'에펠탑 광장에\n폰 시장이 열렸다.',description:'스크롤을 내려 광장으로 들어가세요.',color:'#6ca9d9'},
 {id:'market',name:'광장 속으로',time:11.6,title:'에펠탑 아래,\n여섯 개의 작은 가게.',description:'광장을 지나 폰팔이들을 만나러 갑니다.',color:'#7cacb7'},
 {id:'designer',name:'디자이너폰팔이',time:13.6,title:'폰 고르면,\n폰꾸까지 한 번에.',description:'케이스 + 키링 + 그립톡 or 마그네틱 지갑.',color:'#b09bd6'},
 {id:'quick',name:'퀵퀵이폰팔이',time:19,title:'기다리지 말고,\n지금 바로.',description:'빠르게 만나는 주황색 폰팔이.',color:'#ec8c30'},
 {id:'price',name:'자린고비폰팔이',time:25,title:'싼 게 제일 중요하지.\n0원부터.',description:'가격을 먼저 보는 카키색 폰팔이.',color:'#989b6d'},
 {id:'safe',name:'세이프티폰팔이',time:29.8,title:'단단한 보호,\n든든한 안심.',description:'강화 케이스 + 강화 필름 + 제조사 휴대폰 보험.',color:'#63739c'},
 {id:'used',name:'중고폰팔이',time:35.2,title:'관리 잘된 중고폰,\n상담으로 골라 드려요.',description:'다시 만나는 폰의 가치를 이야기합니다.',color:'#a5506d'},
 {id:'allinone',name:'올인원폰팔이',time:40,title:'원하는 모델을\n골라 주세요.',description:'광장의 마지막 폰팔이까지 둘러보세요.',color:'#b2b0a1'},
 {id:'finish',name:'다시, 광장',time:44.4,title:'여섯 명과 만났다.\n이제 폰꾸를 시작해 봐.',description:'디자이너폰팔이의 작업실로 이동할 수 있어요.',color:'#b09bd6'}
];
const stops=[{p:0,t:6.65},{p:.17,t:11.6},{p:.25,t:13.6},{p:.36,t:19},{p:.48,t:25},{p:.6,t:29.8},{p:.72,t:35.2},{p:.84,t:40},{p:1,t:44.4}];
export class WorldTour{
 constructor({onDesigner}){this.canvas=document.getElementById('world-canvas');this.safetyPanel=document.getElementById('safety-panel');this.ctx=this.canvas.getContext('2d');this.cache=new Map();this.target=0;this.lastDraw=-1;this.raf=0;this.generation=0;this.onDesigner=onDesigner;this.failed=new Set();this.chapter=-1;this.portrait=matchMedia('(max-width:760px) and (orientation:portrait)');this.mobile=matchMedia('(max-width:900px)');
 this.nav=document.getElementById('world-chapters');chapters.forEach((c,i)=>{const b=document.createElement('button');b.className='chapter';b.style.setProperty('--character-color',c.color);b.innerHTML='<i></i><span></span>';b.querySelector('span').textContent=c.name.replace('폰팔이','').replace('에펠탑 광장','광장').replace('광장 속으로','노점').replace('다시, 광장','마무리');b.setAttribute('aria-label',c.name+' 장면 보기');b.onclick=()=>this.go(i);this.nav.append(b)});
 document.getElementById('world-action').onclick=onDesigner;
 this.navigation=new TourNavigation({positions:stops.map(s=>s.p),getMax:()=>this.maxScroll(),onUpdate:()=>this.schedule(),onArrive:i=>this.waitForFrame(i),isEnabled:()=>!document.getElementById('story').hidden&&!document.querySelector('dialog[open]')});
 this.observer=new ResizeObserver(()=>{this.resize();this.update()});this.observer.observe(this.canvas);addEventListener('resize',()=>this.schedule());
 const logo=document.querySelector('a.brand');logo.onclick=e=>{if(!document.getElementById('studio').hidden)return;e.preventDefault();this.go(0)};
 this.resize();this.navigation.restore(this.progress());this.update();}
 waitForFrame(chapter){const frame=Math.round((stops[chapter].t-START)/(END-START)*(COUNT-1));this.load(frame,true);const img=this.cache.get(frame);if(img?.complete&&img.naturalWidth)return Promise.resolve();return new Promise(resolve=>{let timer;const done=()=>{clearTimeout(timer);img?.removeEventListener('load',done);img?.removeEventListener('error',done);resolve()};img?.addEventListener('load',done,{once:true});img?.addEventListener('error',done,{once:true});timer=setTimeout(done,8000)})}
 resize(){const r=this.canvas.getBoundingClientRect();if(!r.width||!r.height)return;const d=Math.min(devicePixelRatio||1,this.mobile.matches?1.5:2);this.canvas.width=Math.round(r.width*d);this.canvas.height=Math.round(r.height*d);if(this.cache.get(this.lastDraw)?.complete)this.draw(this.lastDraw)}
 schedule(){if(!this.raf)this.raf=requestAnimationFrame(()=>{this.raf=0;this.update()})}
 pause(){if(this.raf)cancelAnimationFrame(this.raf);this.raf=0;this.navigation.pause()}
 resume(p){this.navigation.restore(p);this.update()}
 maxScroll(){return document.querySelector('.story-track').offsetHeight-document.querySelector('.story-stage').offsetHeight}
 progress(){return Math.min(1,Math.max(0,scrollY/this.maxScroll()))}
 go(i){this.navigation.goTo(i)}
 time(p){for(let i=1;i<stops.length;i++)if(p<=stops[i].p){const a=stops[i-1],b=stops[i];return a.t+(b.t-a.t)*(p-a.p)/(b.p-a.p)}return END}
 update(){if(document.getElementById('story').hidden)return;const p=this.progress(),t=this.time(p);this.target=Math.round((t-START)/(END-START)*(COUNT-1));let active=0;for(let i=0;i<stops.length;i++)if(p>=stops[i].p-.035)active=i;
 if(this.target>=175&&this.target<=212)active=5;else if(active===5&&this.target>212)active=6;
 if(active!==this.chapter){this.chapter=active;const c=chapters[active];document.getElementById('world-title').textContent=c.title;document.getElementById('world-description').textContent=c.description;document.getElementById('world-current').textContent=c.name;document.getElementById('world-hint').textContent=active===2?'선택하면 3D 폰꾸 작업실로 이동해요.':active===8?'광장은 계속 둘러볼 수 있어요.':active===5?'케이스·필름·제조사 보험으로 완성하는 보호 조합.':'한 번 스크롤하면 다음 폰팔이에서 멈춰요.';const action=document.getElementById('world-action');action.hidden=active!==2&&active!==8;this.canvas.setAttribute('aria-label',c.name+' — '+c.title.replace('\n',' '));this.nav.querySelectorAll('button').forEach((b,i)=>{b.classList.toggle('active',i===active);b.setAttribute('aria-current',i===active?'location':'false')});document.querySelector('.story-stage').dataset.chapter=c.id;if(this.mobile.matches){const b=this.nav.children[active];const left=b.offsetLeft-this.nav.clientWidth/2+b.offsetWidth/2;this.nav.scrollTo({left:Math.max(0,left),behavior:'instant'})}}
 document.getElementById('world-progress-fill').style.width=p*100+'%';this.load(this.target,true);for(const offset of (navigator.connection?.saveData?[]:this.mobile.matches?[-1,1]:[-1,1,-2,2]))this.load(this.target+offset,false);this.trim();}
 load(i,primary){if(i<0||i>=COUNT)return;let img=this.cache.get(i);if(img){if(primary&&img.complete&&img.naturalWidth)this.draw(i);return}img=new Image();img.decoding='async';img.fetchPriority=primary?'high':'low';this.cache.set(i,img);img.onload=()=>{if(i===this.target)this.draw(i);else if(this.lastDraw<0)this.draw(i)};img.onerror=()=>{this.cache.delete(i);if(i===this.target&&!this.failed.has(i)){this.failed.add(i);setTimeout(()=>this.load(i,true),500)}else if(i===this.target){document.getElementById('world-loading').textContent='장면을 불러오지 못했어요. 장면 버튼을 다시 선택해 주세요.';document.getElementById('world-loading').hidden=false}};img.src=`world/${String(i).padStart(3,'0')}.webp`;}
 trim(){for(const [i,img]of this.cache)if(Math.abs(i-this.target)>(this.mobile.matches?8:18)&&i!==this.lastDraw){img.onload=null;img.onerror=null;this.cache.delete(i)}}
 draw(i){const img=this.cache.get(i);if(!img?.naturalWidth)return;const ctx=this.ctx,w=this.canvas.width,h=this.canvas.height,iw=img.naturalWidth,ih=img.naturalHeight;if(!w||!h)return;ctx.clearRect(0,0,w,h);ctx.fillStyle='#242c31';ctx.fillRect(0,0,w,h);
 // Ambient margins use the same frame; the sharp center always preserves the full source composition.
 if(!this.mobile.matches){const cover=Math.max(w/iw,h/ih);ctx.save();ctx.filter=`blur(${Math.round(28*Math.min(devicePixelRatio||1,this.mobile.matches?1.5:2))}px)`;ctx.globalAlpha=.32;ctx.drawImage(img,(w-iw*cover)/2,(h-ih*cover)/2,iw*cover,ih*cover);ctx.restore();
 }
 const fit=this.portrait.matches?w/iw:Math.min(w/iw,h/ih),dw=iw*fit,dh=ih*fit,dx=(w-dw)/2,dy=this.portrait.matches?Math.max(0,(h-dh)/2):(h-dh)/2;
 const safety=i>=175&&i<=212;
 if(safety){
 // The reference's baked-in dealer card is masked, then replaced with editable HTML copy.
 ctx.drawImage(img,0,0,iw,300,dx,dy,dw,300*fit);ctx.fillStyle='#202b47';ctx.fillRect(dx,dy+300*fit,dw,dh-300*fit);
 const ratio=this.canvas.clientWidth/w,stage=this.canvas.parentElement;stage.style.setProperty('--safety-left',(dx*ratio+8)+'px');stage.style.setProperty('--safety-top',(this.mobile.matches?Math.min((dy+280*fit)*ratio,this.canvas.clientHeight*.30):(dy+280*fit)*ratio)+'px');stage.style.setProperty('--safety-width',(dw*ratio-16)+'px');
 }else ctx.drawImage(img,dx,dy,dw,dh);
 this.safetyPanel.hidden=!safety;this.canvas.dataset.safety=String(safety);this.lastDraw=i;document.getElementById('world-loading').hidden=true;this.canvas.dataset.frame=String(i);this.canvas.dataset.sourceTime=(START+i*(END-START)/(COUNT-1)).toFixed(2)}
}
