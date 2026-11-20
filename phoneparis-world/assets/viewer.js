/* 폰 3D 보기 — 1mm STORE v6의 실측 치수 3D 폰 (사용자 본인의 v6 아티팩트에서 옮김)
 * 실제 치수(mm)·카메라 배치·고른 색. Z폴드·Z플립·iPhone Duo는 접은 상태 ↔ 펼친 상태 전환.
 */
(function () {
var colorsOf = window.CAT.colorsOf;
// ===================== 폰 3D 보기 =====================
// 매대 구경 · 상담 중 실물 보기에서 드래그로 360° (상하좌우) 돌려 보기 · 두 손가락/휠 확대
// 크레딧 없이 코드로 만든 모델: 실제 치수(mm) · 카메라 배치 · 고른 색. 폴드·플립·듀오는 접기/펼치기.
// 치수: [가로, 세로, 두께, 모서리 반경, 모양]. 폴드(book)는 한쪽 판 가로·세로·펼친 두께, 플립은 펼친 세로.
const PV_DIM={
  "iPhone Duo":[74,152,4.7,12,"duo"],
  "iPhone 18 Pro":[71.9,150,8.75,11.5,"ipro2"],"iPhone 18 Pro Max":[78,163.4,8.75,12.5,"ipro2"],
  "iPhone 17 Pro":[71.9,150,8.75,11.5,"ipro2"],"iPhone 17 Pro Max":[78,163.4,8.75,12.5,"ipro2"],
  "iPhone 16 Pro":[71.5,149.6,8.25,11,"ipro"],"iPhone 16 Pro Max":[77.6,163,8.25,12,"ipro"],
  "iPhone 15 Pro":[70.6,146.6,8.25,11,"ipro"],"iPhone 15 Pro Max":[76.7,159.9,8.25,12,"ipro"],
  "iPhone 17":[71.5,149.6,7.95,11,"ipill"],"iPhone 16":[71.6,147.6,7.8,11,"ipill"],"iPhone 16 Plus":[77.8,160.9,7.8,12,"ipill"],
  "iPhone 17e":[71.5,146.7,7.8,10,"ione"],"iPhone 16e":[71.5,146.7,7.8,10,"ione"],
  "iPhone 15":[71.6,147.6,7.8,11,"idiag"],"iPhone 15 Plus":[77.8,160.9,7.8,12,"idiag"],
  "iPhone Air":[74.7,156.2,5.64,11,"iair"],"iPhone SE 3":[67.3,138.4,7.3,9,"ise"],
  "Galaxy Z Fold8 Ultra":[72.8,158.4,4.2,7,"fold"],"Galaxy Z Fold8":[80,145,4.3,7,"fold"],"Galaxy Z Fold7":[72.8,158.4,4.2,7,"fold"],"Galaxy Z Fold6":[68.1,153.5,5.6,7,"fold"],
  "Galaxy Z Flip8":[75,166,6.5,9,"flip"],"Galaxy Z Flip7":[75.2,166.7,6.5,9,"flip"],"Galaxy Z Flip7 FE":[71.9,165.1,6.9,9,"flip"],"Galaxy Z Flip6":[71.9,165.1,6.9,9,"flip"],
  "Galaxy S26 Ultra":[78.1,163.6,7.9,6,"ultra"],"Galaxy S25 Ultra":[77.6,162.8,8.2,5,"ultra"],"Galaxy S24 Ultra":[79,162.3,8.6,3,"ultra"],
  "Galaxy S26":[71.7,149.4,7.2,9,"gal"],"Galaxy S26+":[75.8,158.4,7.3,10,"gal"],"Galaxy S26 FE":[76.6,161.3,7.4,9,"gal"],
  "Galaxy S25":[70.5,146.9,7.2,9,"gal"],"Galaxy S25+":[75.8,158.4,7.3,10,"gal"],"Galaxy S25 FE":[76.6,161.3,7.4,9,"gal"],"Galaxy S25 Edge":[75.6,158.2,5.8,9,"edge"],
  "Galaxy S24":[70.6,147,7.6,9,"gal"],"Galaxy S24 FE":[77.3,162,8,9,"gal"],
  "Galaxy A56":[77.5,162.2,7.4,9,"gisl"],"Galaxy A37":[77.5,162.5,7.4,9,"gisl"],"Galaxy A36":[78.2,162.9,7.4,9,"gisl"],"Galaxy A26":[77.5,164,7.7,9,"gisl"],
};
function pvSpec(n){const d=PV_DIM[n]||(/Fold|Duo/.test(n)?[72.8,158.4,4.2,7,"fold"]:/Flip/.test(n)?[75,166,6.5,9,"flip"]:/Ultra/.test(n)?[78,163,8,5,"ultra"]:/iPhone/.test(n)?[71.6,147.6,7.8,11,"ipill"]:[71.7,149.4,7.2,9,"gal"]);
  return {w:d[0],h:d[1],d:d[2],r:d[3],k:d[4],apple:/iPhone/.test(n),fold:d[4]==="fold"||d[4]==="duo"?"book":d[4]==="flip"?"flip":null};}
const pvHex=h=>parseInt(String(h).replace("#",""),16);
// 색은 sRGB로 주어지므로 선형으로 바꿔서 씀 (안 바꾸면 하얗게 날아감)
function pvMix(T,a,b,k){return new T.Color(a).convertSRGBToLinear().lerp(new T.Color(b).convertSRGBToLinear(),k);}
// r: 숫자 또는 [왼위, 오른위, 오른아래, 왼아래] (폴더블 경첩 쪽은 각지게)
const pvR=(r,k=0)=>(Array.isArray(r)?r:[r,r,r,r]).map(v=>v-k);
function pvRR(T,w,h,r){const s=new T.Shape(),x=-w/2,y=-h/2,[tl,tr,br,bl]=pvR(r).map(v=>Math.max(.05,Math.min(v,w/2,h/2)));
  s.moveTo(x+bl,y);s.lineTo(x+w-br,y);s.absarc(x+w-br,y+br,br,-Math.PI/2,0);s.lineTo(x+w,y+h-tr);s.absarc(x+w-tr,y+h-tr,tr,0,Math.PI/2);
  s.lineTo(x+tl,y+h);s.absarc(x+tl,y+h-tl,tl,Math.PI/2,Math.PI);s.lineTo(x,y+bl);s.absarc(x+bl,y+bl,bl,Math.PI,Math.PI*1.5);return s;}
// 둥근 판(가운데 기준, z: -d/2 ~ d/2) · 앞뒤 면 = mats[0], 옆·모서리 = mats[1]
function pvSlab(T,w,h,d,r,mats){const b=Math.min(d*.42,Math.max(...pvR(r))*.9,1.6);
  const g=new T.ExtrudeGeometry(pvRR(T,w-2*b,h-2*b,pvR(r,b)),{depth:Math.max(.01,d-2*b),bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:4,curveSegments:12});
  g.translate(0,0,-Math.max(.01,d-2*b)/2);return new T.Mesh(g,mats);}
// 둥근 평면 (화면·유리) · uv를 [u0,u1]×[v0,v1]로
function pvPlane(T,w,h,r,mat,u0=0,u1=1,v0=0,v1=1){const g=new T.ShapeGeometry(pvRR(T,w,h,r),12),p=g.attributes.position,uv=g.attributes.uv;
  for(let i=0;i<p.count;i++)uv.setXY(i,u0+(p.getX(i)/w+.5)*(u1-u0),v0+(p.getY(i)/h+.5)*(v1-v0));return new T.Mesh(g,mat);}
// 화면 배경 (색에 맞춘 그라데이션 + 시계)
function pvWall(T,c1,c2,aspect,clock=true){const H=1024,W=Math.round(H*aspect),c=document.createElement("canvas");c.width=W;c.height=H;const x=c.getContext("2d");
  const g=x.createLinearGradient(0,0,W*.4,H);g.addColorStop(0,c1);g.addColorStop(1,c2);x.fillStyle=g;x.fillRect(0,0,W,H);
  [[.2,.25,.55,"rgba(255,255,255,.35)"],[.85,.7,.6,"rgba(0,0,0,.18)"],[.6,.95,.5,"rgba(255,255,255,.18)"]].forEach(([a,b,s,col])=>{const r=x.createRadialGradient(W*a,H*b,0,W*a,H*b,H*s);r.addColorStop(0,col);r.addColorStop(1,"rgba(0,0,0,0)");x.fillStyle=r;x.fillRect(0,0,W,H);});
  if(clock){x.fillStyle="rgba(255,255,255,.92)";x.textAlign="center";x.font=`700 ${Math.round(H*.12)}px 'Noto Sans KR',sans-serif`;x.fillText("9:41",W/2,H*.26);
    x.font=`600 ${Math.round(H*.026)}px 'Noto Sans KR',sans-serif`;x.fillText("11월 19일 수요일",W/2,H*.12);}
  const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.anisotropy=4;return t;}
function pvMats(T,S,col,md){const c=new T.Color(col).convertSRGBToLinear(),s0=new T.Color(col),lum=s0.r*.3+s0.g*.59+s0.b*.11;
  return {
    back:new T.MeshPhysicalMaterial({color:c,roughness:S.apple?.48:.22,metalness:0,clearcoat:S.apple?.35:.9,clearcoatRoughness:S.apple?.4:.08}),
    frame:new T.MeshStandardMaterial({color:pvMix(T,c,lum>.6?0xb8b8b8:0x8a8a8a,.45),metalness:.88,roughness:S.k==="ipro"||S.k==="ultra"?.38:.24}),
    black:new T.MeshStandardMaterial({color:0x07080a,roughness:.12,metalness:.3}),
    ring:new T.MeshStandardMaterial({color:pvMix(T,c,0x9a9a9a,.55),metalness:.92,roughness:.22}),
    lens:new T.MeshPhysicalMaterial({color:0x090b12,roughness:.04,metalness:.5,clearcoat:1,clearcoatRoughness:.02}),
    eye:new T.MeshStandardMaterial({color:0x1d2a4a,roughness:.1,metalness:.6,emissive:0x0a1020,emissiveIntensity:.6}),
    flash:new T.MeshStandardMaterial({color:0xf3ead2,roughness:.4,metalness:.1,emissive:0x2a2418}),
    screen:new T.MeshBasicMaterial({map:pvWall(T,md.c[0],md.c[1],S.w/S.h),toneMapped:false}),
    bump:new T.MeshPhysicalMaterial({color:c,roughness:S.apple?.18:.3,metalness:0,clearcoat:.8,clearcoatRoughness:.1}),
  };}
// 뒷면 부품 놓기: 뒤에서 본 왼쪽 위 기준 (xL, yT) mm · 뒷면 z(back)에서 바깥(-z)으로
function pvLens(T,M,g,x,y,z,r,big=true){const h=big?1.6:.8,ring=new T.Mesh(new T.CylinderGeometry(r,r,h,40),M.ring);ring.rotation.x=Math.PI/2;ring.position.set(x,y,z-h/2);g.add(ring);
  const gl=new T.Mesh(new T.CircleGeometry(r*.8,40),M.lens);gl.rotation.y=Math.PI;gl.position.set(x,y,z-h-.02);g.add(gl);
  const e=new T.Mesh(new T.CircleGeometry(r*.32,24),M.eye);e.rotation.y=Math.PI;e.position.set(x,y,z-h-.05);g.add(e);}
function pvDot(T,g,mat,x,y,z,r){const m=new T.Mesh(new T.CircleGeometry(r,24),mat);m.rotation.y=Math.PI;m.position.set(x,y,z-.04);g.add(m);}
// 뒷면 카메라 배치 (판 하나 기준: w,h, 뒷면 z=bz) · 좌표: 뒤에서 본 왼쪽 위 = 앞 기준 +x
function pvCams(T,M,g,S,w,h,bz){const P=(xL,yT)=>[w/2-xL,h/2-yT];const L=(xL,yT,r,big)=>{const [x,y]=P(xL,yT);pvLens(T,M,g,x,y,bz,r,big);};
  const bump=(xL,yT,bw,bh,br,bd)=>{const m=pvSlab(T,bw,bh,bd,br,[M.bump,M.bump]);const [x,y]=P(xL+bw/2,yT+bh/2);m.position.set(x,y,bz-bd/2+.05);g.add(m);return bz-bd;};
  const F=(xL,yT,r)=>{const [x,y]=P(xL,yT);pvDot(T,g,M.flash,x,y,bz,r);};
  switch(S.k){
    case "ipro":{const z=bump(5,5,38,38,9,1.4);L(14,14,7.2);L(14,34,7.2);L(32,24,7.2);const [x,y]=P(32,10);pvDot(T,g,M.flash,x,y,z,2.2);const [a,b]=P(32,37);pvDot(T,g,M.black,a,b,z,2.2);break;}
    case "ipro2":{const m=pvSlab(T,w-6,34,1.6,9,[M.bump,M.frame]);m.position.set(0,h/2-3-17,bz-.75);g.add(m);const z=bz-1.6;
      [[13,13],[13,31],[30,22]].forEach(([a,b])=>{const [x,y]=P(a,b);pvLens(T,M,g,x,y,z,6.8);});const [x,y]=P(w-14,13);pvDot(T,g,M.flash,x,y,z,2.4);const [c,d]=P(w-14,27);pvDot(T,g,M.black,c,d,z,2.4);break;}
    case "ipill":{const z=bump(6,6,19,40,9.5,1.3);[[15.5,15.5],[15.5,36.5]].forEach(([a,b])=>{const [x,y]=P(a,b);pvLens(T,M,g,x,y,z,6.2);});F(30,10,2.2);break;}
    case "idiag":{const z=bump(5,5,32,32,8,1.3);[[13,13],[29,29]].forEach(([a,b])=>{const [x,y]=P(a,b);pvLens(T,M,g,x,y,z,6.3);});const [x,y]=P(29,12);pvDot(T,g,M.flash,x,y,z,2.2);break;}
    case "ione":{const z=bump(6,6,17,17,6,1.2);const [x,y]=P(14.5,14.5);pvLens(T,M,g,x,y,z,5.8);F(28,10,1.8);break;}
    case "ise":L(9,9,4.2,false);F(9,19,1.6);break;
    case "iair":{const m=pvSlab(T,w-4,22,1.8,8,[M.bump,M.frame]);m.position.set(0,h/2-3-11,bz-.85);g.add(m);const z=bz-1.8;let [x,y]=P(14,14);pvLens(T,M,g,x,y,z,6.4);[x,y]=P(30,14);pvDot(T,g,M.black,x,y,z,2.6);[x,y]=P(w-14,14);pvDot(T,g,M.flash,x,y,z,2.2);break;}
    case "gal":L(13,13,5.6);L(13,28,5.6);L(13,43,5.6);F(25,13,1.8);break;
    case "edge":{const z=bump(6,5,15,32,7.5,1.1);L(13.5,13,5.6);L(13.5,28,5.6);F(26,12,1.8);break;}
    case "gisl":{const z=bump(5,5,17,48,8.5,1.4);[[13.5,13.5],[13.5,29],[13.5,44]].forEach(([a,b])=>{const [x,y]=P(a,b);pvLens(T,M,g,x,y,z,5.4);});F(27,13,1.8);break;}
    case "ultra":L(14,14,6.6);L(14,31,6.6);L(14,48,6.6);L(29,14,4.6);L(29,31,4.6);F(29,46,1.8);break;
  }}
// 막대형 폰
function pvBar(T,S,M){const g=new T.Group(),{w,h,d,r}=S;g.add(pvSlab(T,w,h,d,r,[M.back,M.frame]));const fz=d/2+.03;
  const gl=pvPlane(T,w-.8,h-.8,r-.4,M.black);gl.position.z=fz;g.add(gl);
  const by=S.k==="ise"?18:S.apple?2:1.6,bx=S.k==="ise"?5:S.apple?2:1.6;
  const sc=pvPlane(T,w-2*bx,h-2*by,S.k==="ise"?1:r-bx,M.screen);sc.position.z=fz+.03;g.add(sc);
  if(S.k==="ise"){const hb=new T.Mesh(new T.RingGeometry(4.4,5.2,40),M.ring);hb.position.set(0,-h/2+9,fz+.04);g.add(hb);}
  else if(S.apple){const di=pvPlane(T,20,6,3,M.black);di.position.set(0,h/2-by-6.5,fz+.06);g.add(di);}
  else{const ph=new T.Mesh(new T.CircleGeometry(1.7,24),M.black);ph.position.set(0,h/2-by-6,fz+.06);g.add(ph);}
  pvCams(T,M,g,S,w,h,-d/2-.02);return {g,c0:[0,0,0],c1:[0,0,0]};}
// 폴드·듀오: 세로 경첩으로 책처럼 / 플립: 가로 경첩으로 위아래
function pvFolder(T,S,M,md){const g=new T.Group(),t=S.d/2,{r}=S,book=S.fold==="book";
  const w=S.w,h=book?S.h:S.h/2;// 판 하나
  const inner=new T.MeshBasicMaterial({map:pvWall(T,md.c[0],md.c[1],book?2*w/S.h:w/S.h),toneMapped:false});
  const cover=new T.MeshBasicMaterial({map:pvWall(T,md.c[1],md.c[0],w/h),toneMapped:false});
  const q=1.2,rs=book?[q,r,r,q]:[q,q,r,r],rm=book?[r,q,q,r]:[r,r,q,q];// 경첩 쪽 모서리는 거의 각지게
  const panel=(rr)=>{const p=new T.Group(),s=pvSlab(T,w,h,t,rr,[M.back,M.frame]);s.position.z=-t/2;p.add(s);
    const gl=pvPlane(T,w-.6,h-.6,pvR(rr,.3),M.black);gl.position.z=.03;p.add(gl);return p;};
  const hinge=new T.Group(),stat=panel(rs),mov=panel(rm);g.add(stat);g.add(hinge);hinge.add(mov);
  const bz=-t-.02;
  if(book){// 오른쪽 판 고정(x 0~w) · 왼쪽 판이 접혀 덮음 → 접으면 왼쪽 판 뒷면이 커버 화면
    stat.position.x=w/2;mov.position.x=-w/2;
    const sr=pvPlane(T,w-1.2,S.h-2.4,pvR(rs,1.2),inner,.5,1);sr.position.set(-.6,0,.06);stat.add(sr);
    const sl=pvPlane(T,w-1.2,S.h-2.4,pvR(rm,1.2),inner,0,.5);sl.position.set(.6,0,.06);mov.add(sl);
    const cv=pvPlane(T,w-3,h-3,r-1.5,cover);cv.rotation.y=Math.PI;cv.position.z=bz-.02;mov.add(cv);
    const ph=new T.Mesh(new T.CircleGeometry(1.4,20),M.black);ph.rotation.y=Math.PI;ph.position.set(0,h/2-6,bz-.06);mov.add(ph);
    const cam=new T.Group();stat.add(cam);// 바깥 모서리 위쪽 (뒤에서 본 왼쪽 위)
    if(S.k==="duo"){const m=pvSlab(T,16,34,1.2,8,[M.bump,M.frame]);m.position.set(w/2-12,h/2-21,bz-.55);cam.add(m);pvLens(T,M,cam,w/2-12,h/2-12,bz-1.2,5.6);pvLens(T,M,cam,w/2-12,h/2-30,bz-1.2,5.6);}
    else{[[0,12],[0,27],[0,42]].forEach(([a,b])=>pvLens(T,M,cam,w/2-12,h/2-b,bz,5.2));pvDot(T,cam,M.flash,w/2-24,h/2-12,bz,1.6);}
    const sp=new T.Mesh(new T.CylinderGeometry(t*.62,t*.62,h-2*r*.6,24),M.frame);sp.position.set(0,0,-t*.5);g.add(sp);
  }else{// 아래 판 고정(y -h~0) · 위 판이 접혀 덮음 → 접으면 위 판 뒷면이 커버 화면
    stat.position.y=-h/2;mov.position.y=h/2;
    const sb=pvPlane(T,w-2.4,h-1.2,pvR(rs,1.2),inner,0,1,0,.5);sb.position.set(0,.6,.06);stat.add(sb);
    const st=pvPlane(T,w-2.4,h-1.2,pvR(rm,1.2),inner,0,1,.5,1);st.position.set(0,-.6,.06);mov.add(st);
    const ph=new T.Mesh(new T.CircleGeometry(1.5,20),M.black);ph.position.set(0,h/2-6,.09);mov.add(ph);
    const cv=pvPlane(T,w-3.4,h-3.4,r-1.5,cover);cv.rotation.x=Math.PI;cv.position.set(0,0,bz-.02);mov.add(cv);
    // 카메라: 접었을 때 앞에서 본 왼쪽 위(경첩 쪽) → 위 판 좌표로 x<0, y는 경첩(아래쪽) 가까이
    [[-w/2+12,-h/2+12],[-w/2+12,-h/2+26]].forEach(([x,y])=>pvLens(T,M,mov,x,y,bz-.03,5.2,false));
    const sp=new T.Mesh(new T.CylinderGeometry(t*.62,t*.62,w-2*r*.6,24),M.frame);sp.rotation.z=Math.PI/2;sp.position.set(0,0,-t*.5);g.add(sp);}
  return {g,hinge,book,w,h,t};}
// ---------- 뷰어 ----------
const PV={ok:null,key:"",a:1,ta:1,auto:true,vx:0,vy:0,dist:0,dist0:0,raf:0,ptr:new Map(),pinch:0};
function pvInit(){if(PV.ok!==null)return PV.ok;const T=window.THREE;if(!T)return PV.ok=false;
  const el=document.createElement("div");el.className="pv";el.hidden=true;
  el.innerHTML='<canvas aria-label="폰 3D 보기 · 드래그해서 상하좌우로 돌려 보세요"></canvas><div class="pvbar"><span class="pvtip">↻ 드래그로 360° 돌려 보기</span><button type="button" class="pvfold" hidden></button></div>';
  const cv=el.querySelector("canvas");let R;
  try{R=new T.WebGLRenderer({canvas:cv,antialias:true,alpha:true,powerPreference:"high-performance"});}catch(e){return PV.ok=false;}
  if(!R.getContext())return PV.ok=false;
  R.setPixelRatio(Math.min(2,devicePixelRatio||1));R.outputEncoding=T.sRGBEncoding;R.toneMapping=T.ACESFilmicToneMapping;R.toneMappingExposure=.95;R.setClearColor(0,0);
  const scene=new T.Scene(),cam=new T.PerspectiveCamera(28,1,.05,50);
  // 반사용 환경: 밝은 소프트박스 몇 개
  const es=new T.Scene();es.background=new T.Color(0x24201c);const sb=(x,y,z,w,h,c)=>{const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:c,side:T.DoubleSide}));m.position.set(x,y,z);m.lookAt(0,0,0);es.add(m);};
  sb(0,6,4,6,2,0xffffff);sb(-6,2,2,2,7,0xd8ccbb);sb(6,1,-3,2,7,0xbfc8dd);sb(0,-5,3,8,1.5,0x4a4038);
  const pm=new T.PMREMGenerator(R);scene.environment=pm.fromScene(es,.02).texture;
  scene.add(new T.HemisphereLight(0xfff6ea,0x6b5a4a,.45));const k=new T.DirectionalLight(0xffffff,1.15);k.position.set(3,4,6);scene.add(k);
  const rim=new T.DirectionalLight(0xdfe8ff,.8);rim.position.set(-4,2,-5);scene.add(rim);const f=new T.DirectionalLight(0xfff0dd,.5);f.position.set(0,-4,3);scene.add(f);
  const spin=new T.Group();scene.add(spin);
  Object.assign(PV,{T,el,cv,R,scene,cam,spin,ok:true});
  const tk=e=>e.pointerType==="touch"?.5:1;
  cv.addEventListener("pointerdown",e=>{PV.ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});cv.setPointerCapture&&cv.setPointerCapture(e.pointerId);PV.auto=false;PV.vx=PV.vy=0;
    if(PV.ptr.size===2){const a=[...PV.ptr.values()];PV.pinch=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)||1;}pvWake();});
  cv.addEventListener("pointermove",e=>{const p=PV.ptr.get(e.pointerId);if(!p)return;
    if(PV.ptr.size>=2){p.x=e.clientX;p.y=e.clientY;const a=[...PV.ptr.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)||1;PV.dist=Math.max(PV.dist0*.55,Math.min(PV.dist0*1.6,PV.dist*PV.pinch/d));PV.pinch=d;pvWake();return;}
    const dx=(e.clientX-p.x)*.009*tk(e),dy=(e.clientY-p.y)*.009*tk(e);p.x=e.clientX;p.y=e.clientY;pvRot(dy,dx);PV.vx=dy;PV.vy=dx;pvWake();});
  const up=e=>{PV.ptr.delete(e.pointerId);};cv.addEventListener("pointerup",up);cv.addEventListener("pointercancel",up);
  cv.addEventListener("wheel",e=>{e.preventDefault();PV.dist=Math.max(PV.dist0*.55,Math.min(PV.dist0*1.6,PV.dist*(1+e.deltaY*.001)));pvWake();},{passive:false});
  el.querySelector(".pvfold").onclick=()=>{PV.ta=PV.ta>.5?0:1;pvFoldLabel();pvWake();};
  new ResizeObserver(()=>{pvSize();pvWake();}).observe(el);
  return true;}
function pvRot(ax,ay){const T=PV.T,q=new T.Quaternion();q.setFromAxisAngle(new T.Vector3(0,1,0),ay);PV.spin.quaternion.premultiply(q);q.setFromAxisAngle(new T.Vector3(1,0,0),ax);PV.spin.quaternion.premultiply(q);}
function pvSize(){const r=PV.el.getBoundingClientRect();if(!r.width||!r.height)return;PV.R.setSize(r.width,r.height,false);PV.cam.aspect=r.width/r.height;PV.cam.updateProjectionMatrix();pvFit();}
function pvFit(){if(!PV.M)return;const S=PV.M.S,big=Math.hypot(S.fold==="book"?S.w*2:S.w,S.h)/100,fov=PV.cam.fov*Math.PI/180;
  const vfit=big/2/Math.tan(fov/2),hfit=big/2/Math.tan(fov/2)/Math.min(1,PV.cam.aspect);PV.dist0=Math.max(vfit,hfit)*1.04;if(!PV.dist)PV.dist=PV.dist0;}
function pvFoldLabel(){const b=PV.el.querySelector(".pvfold"),f=PV.M&&PV.M.S.fold;b.hidden=!f;if(f)b.textContent=PV.ta>.5?"📕 접어 보기":"📖 펼쳐 보기";}
function pvDispose(o){o.traverse(m=>{if(m.geometry)m.geometry.dispose();if(m.material){(Array.isArray(m.material)?m.material:[m.material]).forEach(x=>{x.map&&x.map.dispose();x.dispose();});}});}
// 폰 만들기 · 바꾸기 (같은 폰이면 방향 유지)
function pvShow(md,ci,host){if(!md||!pvInit())return false;const T=PV.T,cols=colorsOf(md),col=(cols[ci]||{}).h||md.c[0],key=md.name+col;
  if(PV.el.parentNode!==host)host.appendChild(PV.el);PV.el.hidden=false;
  if(PV.key!==key){const same=PV.M&&PV.M.name===md.name;if(PV.M){PV.spin.remove(PV.M.root);pvDispose(PV.M.root);}
    const S=pvSpec(md.name),M=pvMats(T,S,col,md),b=S.fold?pvFolder(T,S,M,md):pvBar(T,S,M),root=new T.Group(),inner=new T.Group();
    inner.add(b.g);root.add(inner);root.scale.setScalar(.01);PV.spin.add(root);PV.M={name:md.name,S,b,root,inner};PV.key=key;
    if(!same){PV.spin.quaternion.set(0,0,0,1);pvRot(.16,-.55);PV.auto=true;PV.a=PV.ta=1;PV.dist=0;}
    pvSize();pvFoldLabel();pvFold();}
  pvWake();return true;}
function pvHide(){if(PV.el)PV.el.hidden=true;}
// 접힘 c: 0 펼침 ~ 1 접힘 · 돌리는 중심이 폰 가운데에 오도록 안쪽 그룹을 옮김
function pvFold(){const M=PV.M;if(!M||!M.S.fold)return;const b=M.b,c=1-PV.a,th=c*(Math.PI-.002);
  if(b.book){b.hinge.rotation.y=th;M.inner.position.set(-c*b.w/2,0,(1-c)*b.t/2);}
  else{b.hinge.rotation.x=th;M.inner.position.set(0,c*b.h/2,(1-c)*b.t/2);}}
function pvWake(){if(!PV.raf&&PV.el&&!PV.el.hidden)PV.raf=requestAnimationFrame(pvFrame);}
function pvFrame(){PV.raf=0;if(!PV.el||PV.el.hidden)return;let busy=PV.ptr.size>0;
  if(PV.auto){pvRot(0,.006);busy=true;}
  else if(Math.abs(PV.vx)+Math.abs(PV.vy)>.0003&&!PV.ptr.size){pvRot(PV.vx,PV.vy);PV.vx*=.92;PV.vy*=.92;busy=true;}
  if(Math.abs(PV.ta-PV.a)>.002){PV.a+=(PV.ta-PV.a)*.09;busy=true;}else PV.a=PV.ta;pvFold();
  const d=PV.dist||PV.dist0;PV.cam.position.set(0,0,d);PV.cam.lookAt(0,0,0);
  PV.R.render(PV.scene,PV.cam);if(busy)pvWake();}


window.PV3D = {
  show: pvShow, hide: pvHide,
  foldable: function (md) { return !!pvSpec(md.name).fold; },
  setOpen: function (open) { if (!PV.M) return; PV.ta = open ? 1 : 0; pvFoldLabel(); pvWake(); },
  isOpen: function () { return PV.ta > .5; },
  folded: function () { return PV.M ? 1 - PV.a : 0; },
};
})();
