// One accepted gesture produces one stop, regardless of wheel distance or momentum.
export class StepGate {
 constructor({idle=280,cooldown=1250,threshold=32}={}){this.idle=idle;this.cooldown=cooldown;this.threshold=threshold;this.lastWheel=-Infinity;this.blockedUntil=0;this.consumed=false;this.amount=0}
 wheel(delta,now){if(now-this.lastWheel>this.idle){this.consumed=false;this.amount=0}this.lastWheel=now;if(this.consumed)return 0;if(now<this.blockedUntil){this.consumed=true;return 0}if(this.amount&&Math.sign(delta)!==Math.sign(this.amount))this.amount=0;this.amount+=delta;if(Math.abs(this.amount)<this.threshold)return 0;this.consumed=true;this.blockedUntil=now+this.cooldown;return Math.sign(this.amount)}
 fresh(now){if(now<this.blockedUntil)return false;this.blockedUntil=now+this.cooldown;return true}
 block(until){this.blockedUntil=Math.max(this.blockedUntil,until)}
}
export class TourNavigation {
 constructor({positions,getMax,onUpdate,onArrive=()=>Promise.resolve(),isEnabled}){
 this.onArrive=onArrive;this.serial=0;this.positions=positions;this.getMax=getMax;this.onUpdate=onUpdate;this.isEnabled=isEnabled;this.index=0;this.gate=new StepGate();this.animation=0;this.suspended=false;this.lastY=scrollY;this.touch=null;
 addEventListener('wheel',e=>this.wheel(e),{passive:false});
 addEventListener('touchstart',e=>this.touchStart(e),{passive:true});
 addEventListener('touchmove',e=>this.touchMove(e),{passive:false});
 addEventListener('touchend',()=>{this.touch=null},{passive:true});addEventListener('touchcancel',()=>{this.touch=null},{passive:true});
 addEventListener('keydown',e=>this.key(e));addEventListener('scroll',()=>this.nativeScroll(),{passive:true});
 addEventListener('resize',()=>{if(this.enabled())this.restore(this.positions[this.index])});
 }
 enabled(){return !this.suspended&&this.isEnabled()}
 anchor(i=this.index){return this.positions[i]*this.getMax()}
 // Scrollable cards and the horizontal chapter menu keep their native gestures.
 internal(target){return target instanceof Element&&!!target.closest('.safety-panel,.world-chapters,dialog,input,textarea,select,[contenteditable="true"]')}
 write(y){this.lastY=y;scrollTo({top:y,behavior:'instant'})}
 cancel(){if(this.animation)cancelAnimationFrame(this.animation);this.animation=0;this.serial++}
 pause(){this.suspended=true;this.cancel()}
 restore(progress=0){this.cancel();this.suspended=false;let closest=0;for(let i=1;i<this.positions.length;i++)if(Math.abs(this.positions[i]-progress)<Math.abs(this.positions[closest]-progress))closest=i;this.index=closest;this.gate.blockedUntil=Infinity;const serial=this.serial;this.write(this.anchor());this.onUpdate();Promise.resolve(this.onArrive(closest)).finally(()=>{if(serial===this.serial)this.gate.blockedUntil=performance.now()+420})}
 goTo(i,{animate=true}={}){
 i=Math.max(0,Math.min(this.positions.length-1,i));this.cancel();this.index=i;const serial=this.serial,from=Math.min(scrollY,this.getMax()),to=this.anchor(i);this.gate.blockedUntil=Infinity;
 const finish=()=>{this.animation=0;this.write(to);this.onUpdate();Promise.resolve(this.onArrive(i)).finally(()=>{if(serial===this.serial)this.gate.blockedUntil=performance.now()+420})};
 if(!animate||matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return}
 const start=performance.now(),duration=820;
 const frame=now=>{const p=Math.min(1,(now-start)/duration),ease=p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;this.write(from+(to-from)*ease);this.onUpdate();if(p<1)this.animation=requestAnimationFrame(frame);else finish()};
 this.animation=requestAnimationFrame(frame);
 }
 step(direction){const next=this.index+direction;if(next<0||next>=this.positions.length)return false;this.goTo(next);return true}
 wheel(e){if(!this.enabled()||e.ctrlKey||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;const panel=e.target instanceof Element?e.target.closest('.safety-panel'):null;if(panel&&panel.scrollHeight>panel.clientHeight+2&&((e.deltaY>0&&panel.scrollTop+panel.clientHeight<panel.scrollHeight-2)||(e.deltaY<0&&panel.scrollTop>2))){this.gate.lastWheel=performance.now();this.gate.consumed=true;return}const direction=Math.sign(e.deltaY);if(!direction)return;
 if(this.index===0&&direction<0&&scrollY<2&&!this.animation)return;
 if(this.index===this.positions.length-1&&direction>0&&scrollY>this.getMax()+3)return;
 // Prevent native scroll and its inertia before interpreting the gesture.
 if(e.cancelable)e.preventDefault();const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1),accepted=this.gate.wheel(delta,performance.now());if(!accepted)return;
 if(!this.step(accepted)&&this.index===this.positions.length-1&&accepted>0){this.lastY=scrollY;scrollTo({top:this.getMax()+Math.min(innerHeight,document.querySelector('footer').offsetHeight),behavior:'instant'})}
 }
 touchStart(e){if(!this.enabled()||e.touches.length!==1){this.touch=null;return}const t=e.touches[0],target=e.target instanceof Element?e.target:null,panel=target?.closest('.safety-panel');this.touch={x:t.clientX,y:t.clientY,used:false,ignored:!!target?.closest('dialog,input,textarea,select,[contenteditable="true"]')||!!(panel&&panel.scrollHeight>panel.clientHeight+2)}}
 touchMove(e){if(!this.enabled()||!this.touch||this.touch.ignored||e.touches.length!==1)return;const t=e.touches[0],dx=t.clientX-this.touch.x,dy=this.touch.y-t.clientY;if(Math.abs(dx)>Math.abs(dy))return;
 if(e.cancelable)e.preventDefault();if(Math.abs(dy)<8)return;if(this.touch.used||Math.abs(dy)<40)return;this.touch.used=true;
 if(!this.gate.fresh(performance.now()))return;const direction=Math.sign(dy);if(!this.step(direction)&&this.index===this.positions.length-1&&direction>0)this.write(this.getMax()+document.querySelector('footer').offsetHeight);
 }
 key(e){if(!this.enabled()||e.metaKey||e.ctrlKey||e.altKey)return;if(e.target instanceof Element&&e.target.closest('.safety-panel,dialog,input,textarea,select,[contenteditable="true"]'))return;if(e.key===' '&&e.target instanceof Element&&e.target.closest('button,a'))return;let direction=0;if(e.key==='ArrowDown'||e.key==='PageDown'||e.key===' ')direction=e.shiftKey?-1:1;if(e.key==='ArrowUp'||e.key==='PageUp')direction=-1;if(!direction)return;e.preventDefault();if(e.repeat||!this.gate.fresh(performance.now()))return;if(!this.step(direction)&&this.index===this.positions.length-1&&direction>0)this.write(this.getMax()+document.querySelector('footer').offsetHeight)}
 nativeScroll(){if(!this.enabled())return;const y=scrollY;if(this.animation){if(Math.abs(y-this.lastY)>3)this.write(this.lastY);this.onUpdate();return}if(Math.abs(y-this.lastY)<3){this.onUpdate();return}if(this.index===this.positions.length-1&&y>=this.getMax()-3){this.lastY=y;this.onUpdate();return}
 // Scrollbar drags or browser-generated page jumps cannot skip several dealers either.
 const expected=this.anchor(),direction=Math.sign(y-expected);this.write(expected);if(direction&&this.gate.fresh(performance.now()))this.step(direction);else this.onUpdate();
 }
}
