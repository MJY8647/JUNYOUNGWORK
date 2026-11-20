/* 1mm STORE v6 상품·지원금 계산 (사용자 본인의 1mm STORE v6 아티팩트에서 옮김, 2026-11-20)
 * - DATA: Apple/Samsung 전 모델 · 카테고리(CAT_TABS) · 용량별 출고가
 * - OFFICIAL: SKT 공시지원금(T 다이렉트샵 2026-11-17), KT 공통지원금(KT초이스 2026-11-19)
 * - MARKET: 모요 휴대폰 성지 공개 목록(2026-11-18) → 번호이동 추가지원금
 * - MM_SUPPORT: 1mm 매장 지원금, MEMBER_DC: 멤버십, BUNDLE_RULE: 결합 할인, 선택약정 25%
 * 이미지 경로는 assets/img/ 로 바꿈.
 */
(function () {
const sz=(gb,price,subsidy,est=false)=>({gb,price,subsidy,est});
const m=(name,gen,c,storages,opt={})=>({name,gen,c,storages,...opt});
const SOON={soon:true};
const DATA={
  apple:{label:"Apple",cats:{
    duo:{label:"DUO",sub:"애플 첫 폴더블 · 2026.10 출시",art:"fold",c:["#e9e4dc","#9b948a"],img:"assets/img/iphone-duo-white.webp",wide:true,series:[
      {key:"duo",label:"아이폰 듀오",older:g=>`아이폰 듀오 ${g}세대 이하`,models:[
        m("iPhone Duo",1,["#e9e4dc","#9b948a"],[sz("256GB",3290000,200000),sz("512GB",3590000,200000,true),sz("1TB",3890000,200000,true)],{img:"assets/img/iphone-duo-white.webp",try3d:"duo"}),
      ]}]},
    pro:{label:"Pro",sub:"Pro · Pro Max",art:"pro",c:["#f4b285","#bf5a22"],img:"assets/img/iphone-18-pro.webp",series:[
      {key:"pro",label:"아이폰 Pro 시리즈",older:g=>`아이폰 ${g} Pro 이하`,models:[
        m("iPhone 18 Pro",18,["#8d7bb8","#3e3361"],[sz("256GB",1990000,150000),sz("512GB",2290000,150000,true),sz("1TB",2690000,150000,true),sz("2TB",3790000,150000)],{img:"assets/img/iphone-18-pro.webp"}),
        m("iPhone 18 Pro Max",18,["#e6e2da","#99938a"],[sz("256GB",2190000,150000),sz("512GB",2490000,150000,true),sz("1TB",2890000,150000,true),sz("2TB",3990000,150000)],{img:"assets/img/iphone-18-pro-max.webp"}),
        m("iPhone 17 Pro",17,["#f4b285","#bf5a22"],[sz("256GB",1790000,250000),sz("512GB",2090000,250000),sz("1TB",2390000,250000)],{img:"assets/img/iphone-17-pro.webp"}),
        m("iPhone 17 Pro Max",17,["#f4b285","#bf5a22"],[sz("256GB",1990000,280000),sz("512GB",2290000,280000),sz("1TB",2590000,280000),sz("2TB",3290000,280000)],{img:"assets/img/iphone-17-pro.webp"}),
        m("iPhone 16 Pro",16,["#d9c8b1","#8c7556"],[sz("128GB",1550000,350000),sz("256GB",1700000,350000),sz("512GB",2000000,350000),sz("1TB",2300000,350000)],{img:"assets/img/iphone-16-pro.webp"}),
        m("iPhone 16 Pro Max",16,["#d9c8b1","#8c7556"],[sz("256GB",1900000,380000),sz("512GB",2200000,380000),sz("1TB",2500000,380000)],{img:"assets/img/iphone-16-pro.webp"}),
        m("iPhone 15 Pro",15,["#cfc9bd","#7f786c"],[sz("128GB",1550000,450000),sz("256GB",1700000,450000),sz("512GB",2000000,450000)],{img:"assets/img/iphone-15-pro.webp"}),
        m("iPhone 15 Pro Max",15,["#cfc9bd","#7f786c"],[sz("256GB",1900000,480000),sz("512GB",2200000,480000),sz("1TB",2500000,480000)],{img:"assets/img/iphone-15-pro.webp"}),
      ]}]},
    basic:{label:"일반",sub:"기본 · Plus · e",art:"basic",c:["#dacff1","#9884c8"],img:"assets/img/iphone-17.webp",series:[
      {key:"basic",label:"아이폰 일반 시리즈",older:g=>`아이폰 ${g} 이하`,models:[
        m("iPhone 17",17,["#dacff1","#9884c8"],[sz("256GB",1290000,300000),sz("512GB",1590000,300000)],{img:"assets/img/iphone-17.webp"}),
        m("iPhone 17e",17,["#f6d3dc","#c98ea0"],[sz("256GB",990000,350000),sz("512GB",1290000,350000,true)],{img:"assets/img/iphone-17e.webp"}),
        m("iPhone 16",16,["#9aa6f2","#3f4fc4"],[sz("128GB",1250000,400000),sz("256GB",1400000,400000),sz("512GB",1700000,400000)],{img:"assets/img/iphone-16.webp"}),
        m("iPhone 16 Plus",16,["#9aa6f2","#3f4fc4"],[sz("128GB",1350000,400000),sz("256GB",1500000,400000),sz("512GB",1800000,400000)],{img:"assets/img/iphone-16.webp"}),
        m("iPhone 16e",16,["#5a5c62","#1e1f23"],[sz("128GB",990000,450000),sz("256GB",1150000,450000)],{img:"assets/img/iphone-16e.webp"}),
        m("iPhone 15",15,["#f6cfd9","#c88e9e"],[sz("128GB",1250000,500000),sz("256GB",1400000,500000)],{img:"assets/img/iphone-15.webp"}),
        m("iPhone 15 Plus",15,["#f6cfd9","#c88e9e"],[sz("128GB",1350000,500000),sz("256GB",1500000,500000)],{img:"assets/img/iphone-15.webp"}),
      ]}]},
    air:{label:"Air",sub:"초슬림 디자인",art:"air",c:["#d5e5f5","#8daed2"],img:"assets/img/iphone-air.webp",series:[
      {key:"air",label:"아이폰 Air",older:g=>`아이폰 Air ${g}세대 이하`,models:[
        m("iPhone Air",1,["#d5e5f5","#8daed2"],[sz("256GB",1590000,270000),sz("512GB",1890000,270000),sz("1TB",2190000,270000)],{img:"assets/img/iphone-air.webp"}),
      ]}]},
    se:{label:"SE",sub:"컴팩트 · 홈버튼",art:"se",c:["#3b404b","#15171d"],img:"assets/img/iphone-se-3.webp",series:[
      {key:"se",label:"아이폰 SE",older:g=>`아이폰 SE ${g}세대 이하`,models:[
        m("iPhone SE 3",3,["#3b404b","#15171d"],[sz("64GB",590000,400000),sz("128GB",650000,400000)],{img:"assets/img/iphone-se-3.webp"}),
      ]}]},
  }},
  samsung:{label:"Samsung",cats:{
    flip:{label:"Z플립",sub:"반으로 접는 폴더블",art:"flip",c:["#86a8ea","#3a5dab"],img:"assets/img/galaxy-z-flip8.webp",series:[
      {key:"flip",label:"갤럭시 Z플립 시리즈",older:g=>`갤럭시 Z플립${g} 이하`,models:[
        m("Galaxy Z Flip8",8,["#f6c9e0","#c9789f"],[sz("256GB",1683000,450000),sz("512GB",1936000,450000)],{img:"assets/img/galaxy-z-flip8.webp"}),
        m("Galaxy Z Flip7",7,["#f3a38f","#c9573f"],[sz("256GB",1485000,550000),sz("512GB",1606000,550000)],{img:"assets/img/galaxy-z-flip7.webp"}),
        m("Galaxy Z Flip7 FE",7,["#eceef1","#b4b9c2"],[sz("128GB",1199000,600000,true),sz("256GB",1320000,600000,true)],{img:"assets/img/galaxy-z-flip7-fe.webp"}),
        m("Galaxy Z Flip6",6,["#f3e08c","#c2a43c"],[sz("256GB",1485000,650000),sz("512GB",1606000,650000)],{img:"assets/img/galaxy-z-flip6.webp"}),
      ]}]},
    fold:{label:"Z폴드",sub:"펼치면 태블릿",art:"fold",c:["#c7cdd8","#7a8394"],img:"assets/img/galaxy-z-fold8.webp",series:[
      {key:"fold",label:"갤럭시 Z폴드 시리즈",older:g=>`갤럭시 Z폴드${g} 이하`,models:[
        m("Galaxy Z Fold8 Ultra",8,["#3e4554","#171a21"],[sz("256GB",2577300,400000,true),sz("512GB",2850000,400000,true),sz("1TB",3451800,400000)],{img:"assets/img/galaxy-z-fold8-ultra.webp"}),
        m("Galaxy Z Fold8",8,["#dcd3ea","#9b8fb8"],[sz("256GB",2270000,450000,true),sz("512GB",2530000,450000,true),sz("1TB",3152600,450000)],{img:"assets/img/galaxy-z-fold8.webp"}),
        m("Galaxy Z Fold7",7,["#5a6ea8","#1f2b5c"],[sz("256GB",2379300,500000),sz("512GB",2537700,500000),sz("1TB",2932600,500000)],{img:"assets/img/galaxy-z-fold7.webp"}),
        m("Galaxy Z Fold6",6,["#f1cfd8","#c3889a"],[sz("256GB",2229700,600000),sz("512GB",2388100,600000)],{img:"assets/img/galaxy-z-fold6.webp"}),
      ]}]},
    basic:{label:"일반",sub:"S · S+ · Edge · A",art:"galaxy",c:["#d0e0f1","#84a2c3"],img:"assets/img/galaxy-s26.webp",series:[
      {key:"s",label:"갤럭시 S시리즈",older:g=>`갤럭시 S${g} 이하`,models:[
        m("Galaxy S27",27,["#d8dce4","#8a919e"],[],SOON),
        m("Galaxy S26",26,["#c9c3d6","#8b84a0"],[sz("256GB",1403600,450000),sz("512GB",1557600,450000,true)],{img:"assets/img/galaxy-s26.webp"}),
        m("Galaxy S26 FE",26,["#cfe9dd","#7aa996"],[sz("256GB",1045000,500000)],{img:"assets/img/galaxy-s26-fe.webp"}),
        m("Galaxy S26+",26,["#c9c3d6","#8b84a0"],[sz("256GB",1601600,450000),sz("512GB",1755600,450000,true)],{img:"assets/img/galaxy-s26-plus.webp"}),
        m("Galaxy S25",25,["#d6e3f3","#8ea6c6"],[sz("256GB",1155000,550000),sz("512GB",1270000,550000)],{img:"assets/img/galaxy-s25.webp"}),
        m("Galaxy S25+",25,["#5b6a8a","#2d3650"],[sz("256GB",1353000,550000),sz("512GB",1479000,550000)],{img:"assets/img/galaxy-s25-plus.webp"}),
        m("Galaxy S25 Edge",25,["#dbe3f3","#9aa6c2"],[sz("256GB",1496000,550000),sz("512GB",1633000,550000)],{img:"assets/img/galaxy-s25-edge.webp"}),
        m("Galaxy S24",24,["#7d73b3","#3d3670"],[sz("256GB",1155000,600000)],{img:"assets/img/galaxy-s24.webp"}),
        m("Galaxy S24 FE",24,["#d3e4f6","#8aa6c8"],[sz("256GB",845000,600000)],{img:"assets/img/galaxy-s24-fe.webp"}),
      ]},
      {key:"a",label:"갤럭시 A시리즈",older:g=>`갤럭시 A${g}x 이하`,models:[
        m("Galaxy A37",7,["#d9dde3","#8f97a3"],[sz("128GB",598400,170000)],{img:"assets/img/kt/c-a37.webp"}),
        m("Galaxy A17",7,["#cfe3f2","#86a9c8"],[sz("128GB",319000,200000,true)],{img:"assets/img/kt/c-a17.webp"}),
        m("Galaxy A56",6,["#e3e5e8","#a7abb2"],[sz("128GB",598000,500000),sz("256GB",650000,500000)],{img:"assets/img/galaxy-a56.webp"}),
        m("Galaxy A36",6,["#55595f","#24272c"],[sz("128GB",499000,450000)],{img:"assets/img/galaxy-a36.webp"}),
        m("Galaxy A26",6,["#cfe9da","#7fb5a0"],[sz("128GB",429000,400000)],{img:"assets/img/galaxy-a26.webp"}),
      ]},
      {key:"folder",label:"폴더폰",older:g=>"폴더폰",models:[
        m("클래식 폴더",1,["#2b2c30","#111214"],[sz("32GB",205700,150000,true)],{img:"assets/img/kt/c-classic.webp"}),
      ]}]},
    ultra:{label:"울트라",sub:"S펜 · 최고 사양",art:"ultra",c:["#cad2dc","#788395"],img:"assets/img/galaxy-s26-ultra.webp",series:[
      {key:"ultra",label:"갤럭시 S 울트라",older:g=>`갤럭시 S${g} 울트라 이하`,models:[
        m("Galaxy S27 Ultra",27,["#3a3f4b","#14161c"],[],SOON),
        m("Galaxy S26 Ultra",26,["#cfe0f0","#7f9cbc"],[sz("256GB",1947000,400000),sz("512GB",2147000,400000,true),sz("1TB",2821500,400000)],{img:"assets/img/galaxy-s26-ultra.webp"}),
        m("Galaxy S25 Ultra",25,["#c8d0dc","#7b8696"],[sz("256GB",1698400,500000),sz("512GB",1848000,500000),sz("1TB",2147300,500000)],{img:"assets/img/galaxy-s25-ultra.webp"}),
        m("Galaxy S24 Ultra",24,["#bbb8b1","#6c6860"],[sz("256GB",1698400,600000),sz("512GB",1841400,600000)],{img:"assets/img/galaxy-s24-ultra.webp"}),
      ]}]},
  }},
};
const OFFICIAL={date:"2026-11-17",skt:{plan:"베스트 109",fee:109000,src:"T 다이렉트샵 공시지원금 조회",list:{"iPhone 15":{"256GB":[1397000,650000],"128GB":[1243000,650000],"512GB":[1694000,650000]},"iPhone Air":{"256GB":[1584000,650000],"512GB":[1881000,650000],"1TB":[2189000,650000]},"iPhone 15 Pro":{"256GB":[1694000,650000],"1TB":[2299000,650000],"512GB":[1991000,650000],"128GB":[1540000,650000]},"Galaxy S24 Ultra":{"256GB":[1544400,630000]},"Galaxy Z Fold8":{"256GB":[2278100,600000],"1TB":[3152600,600000],"512GB":[2531100,600000]},"Galaxy S26 Ultra":{"256GB":[1797400,600000],"512GB":[2050400,600000],"1TB":[2545400,600000]},"Galaxy S26+":{"256GB":[1452000,600000],"512GB":[1705000,600000]},"Galaxy S26":{"256GB":[1254000,600000],"512GB":[1507000,600000]},"Galaxy Z Flip6":{"256GB":[1485000,600000]},"Galaxy S25 Edge":{"256GB":[1254000,580000],"512GB":[1507000,580000]},"Galaxy S26 FE":{"256GB":[1045000,500000]},"Galaxy Z Flip8":{"256GB":[1683000,500000],"512GB":[1936000,500000]},"Galaxy Z Fold8 Ultra":{"256GB":[2577300,500000],"512GB":[2830300,500000],"1TB":[3451800,500000]},"Galaxy S25 FE":{"256GB":[946000,500000]},"Galaxy Z Flip7 FE":{"256GB":[1199000,500000]},"Galaxy Z Flip7":{"256GB":[1485000,500000],"512GB":[1643400,500000]},"Galaxy Z Fold7":{"256GB":[2379300,500000],"512GB":[2537700,500000],"1TB":[2933700,500000]},"Galaxy S25 Ultra":{"256GB":[1698400,500000],"1TB":[2127400,500000],"512GB":[1841400,500000]},"Galaxy S25+":{"256GB":[1353000,500000],"512GB":[1496000,500000]},"Galaxy S25":{"256GB":[1155000,500000],"512GB":[1298000,500000]},"iPhone 15 Plus":{"128GB":[1342000,470000],"512GB":[1793000,470000]},"iPhone Duo":{"256GB":[3300000,450000],"512GB":[3597000,450000],"2TB":[5093000,450000],"1TB":[4191000,450000]},"iPhone 17":{"512GB":[1760000,450000],"256GB":[1452000,450000]},"iPhone 18 Pro":{"256GB":[1991000,450000],"1TB":[2893000,450000],"512GB":[2299000,450000],"2TB":[3795000,450000]},"iPhone 17 Pro":{"256GB":[1782000,450000],"512GB":[2090000,450000],"1TB":[2387000,450000]},"Galaxy A36":{"128GB":[499400,400000]},"Galaxy 퀀텀6":{"128GB":[618200,357000]},"Galaxy 와이드9":{"128GB":[469700,373400]},"Galaxy 퀀텀7":{"128GB":[717200,357000]},"MOTO G86 power":{"256GB":[429000,293400]},"Galaxy 와이드8":{"128GB":[374000,293400]},"iPhone 18 Pro Max":{"1TB":[3091000,220000],"256GB":[2200000,220000],"2TB":[3993000,220000],"512GB":[2497000,220000]},"iPhone 17 Pro Max":{"512GB":[2288000,220000],"256GB":[1980000,220000],"1TB":[2585000,220000]},"iPhone 16e":{"256GB":[1133000,220000],"512GB":[1430000,220000],"128GB":[990000,220000]},"iPhone 16 Pro Max":{"1TB":[2497000,220000],"512GB":[2200000,220000],"256GB":[1892000,220000]},"iPhone 16 Pro":{"128GB":[1540000,220000],"256GB":[1694000,220000],"512GB":[1991000,220000],"1TB":[2299000,220000]},"iPhone 16":{"128GB":[1243000,220000],"256GB":[1397000,220000],"512GB":[1694000,220000]},"Galaxy A37":{"128GB":[598400,170000]},"iPhone 17e":{"256GB":[990000,128000],"512GB":[1287000,128000]},"홍미 14C (4GB RAM)":{"128GB":[149600,125000]}}}};
const MARKET=/*MARKET*/{"date": "2026-11-18", "src": "모요 휴대폰 성지 공개 목록", "list": {"Galaxy Z Fold8": {"k": "lgu", "total": 1260000, "price": 2278100, "device": 1018100, "seller": "LGU+ 더끌림컴퍼니 낙성대입구역점", "deals": 20}, "iPhone 18 Pro": {"k": "skt", "total": 1050000, "price": 1991000, "device": 941000, "seller": "SKT 큰사랑대리점 관악점", "deals": 19}, "Galaxy Z Fold8 Ultra": {"k": "skt", "total": 1180000, "price": 2577300, "device": 1397300, "seller": "SKT 이안대리점 낙성대역점", "deals": 20}, "iPhone 18 Pro Max": {"k": "lgu", "total": 664000, "price": 2200000, "device": 1536000, "seller": "LGU+ 더끌림컴퍼니 낙성대입구역점", "deals": 18}, "Galaxy Z Flip8": {"k": "skt", "total": 1180000, "price": 1683000, "device": 503000, "seller": "SKT 이안대리점 낙성대역점", "deals": 20}, "iPhone Duo": {"k": "lgu", "total": 900000, "price": 3300000, "device": 2400000, "seller": "LGU+ 더끌림컴퍼니 낙성대입구역점", "deals": 14}, "Galaxy S26": {"k": "lgu", "total": 1254000, "price": 1254000, "device": 0, "seller": "LGU+ 더끌림컴퍼니 낙성대입구역점", "deals": 19}, "iPhone 17": {"k": "lgu", "total": 1062500, "price": 1452000, "device": 389500, "seller": "LGU+ 더끌림컴퍼니 낙성대입구역점", "deals": 18}, "Galaxy S26 Ultra": {"k": "lgu", "total": 1244500, "price": 1797400, "device": 552900, "seller": "LGU+ 더끌림컴퍼니 낙성대입구역점", "deals": 21}, "iPhone 17 Pro": {"k": "lgu", "total": 1050000, "price": 1782000, "device": 732000, "seller": "LGU+ 더끌림컴퍼니 낙성대입구역점", "deals": 10}, "Galaxy S26+": {"k": "lgu", "total": 1170000, "price": 1452000, "device": 282000, "seller": "LGU+ 더끌림컴퍼니 낙성대입구역점", "deals": 15}, "Galaxy Z Fold7": {"k": "skt", "total": 880000, "price": 2379300, "device": 1499300, "seller": "SKT 이안대리점 낙성대역점", "deals": 2}, "iPhone 17 Pro Max": {"k": "lgu", "total": 704000, "price": 1980000, "device": 1276000, "seller": "LGU+ 더끌림컴퍼니 낙성대입구역점", "deals": 13}, "iPhone Air": {"k": "skt", "total": 1400000, "price": 1584000, "device": 184000, "seller": "SKT 큰사랑대리점 관악점", "deals": 21}, "Galaxy S25 Edge": {"k": "skt", "total": 960000, "price": 1496000, "device": 536000, "seller": "SKT 이안대리점 낙성대역점", "deals": 3}, "Galaxy S25": {"k": "kt", "total": 680000, "price": 1155000, "device": 475000, "seller": "KT 친절텔레콤 서울대점", "deals": 6}, "iPhone 16 Pro": {"k": "skt", "total": 220000, "price": 1540000, "device": 1320000, "seller": "SKT 이안대리점 낙성대역점", "deals": 2}, "Galaxy S25 Ultra": {"k": "skt", "total": 720000, "price": 1698400, "device": 978400, "seller": "SKT 이안대리점 낙성대역점", "deals": 9}, "iPhone 16 Pro Max": {"k": "lgu", "total": 900000, "price": 1892000, "device": 992000, "seller": "LGU+ 더끌림컴퍼니 낙성대입구역점", "deals": 6}}}/*END*/;
for(const b of Object.values(DATA))for(const c of Object.values(b.cats))for(const se of c.series)for(const md of se.models){
  const m=MARKET.list[md.name];if(m&&md.storages)for(const st of md.storages)st.mkt=m;
}
for(const b of Object.values(DATA))for(const c of Object.values(b.cats))for(const se of c.series)for(const md of se.models){
  const o=OFFICIAL.skt.list[md.name];if(!o||!md.storages)continue;
  for(const st of md.storages){const v=o[st.gb];if(v){st.price=v[0];st.est=false;st.pub={skt:v[1]};}}
}
// KT 공통지원금: KT초이스 공개 페이지 표시값(허락 받음, 2026-11-19 수집) · 베이직 110GB(69,000원) 기준 · 기기 할인가와 월 할부금 계산이 맞아떨어지는 4종만
OFFICIAL.kt={plan:"베이직 110GB",fee:69000,src:"KT초이스 공개 페이지 (2026-11-19)",lbl:"공통지원금(KT초이스 표시)",list:{"iPhone 18 Pro":400000,"iPhone 17":500000,"Galaxy Z Fold8":600000,"iPhone 17 Pro":450000}};
for(const b of Object.values(DATA))for(const c of Object.values(b.cats))for(const se of c.series)for(const md of se.models){
  const v=OFFICIAL.kt.list[md.name];if(v&&md.storages)for(const st of md.storages)st.pub=Object.assign(st.pub||{},{kt:v});
}
const C=(n,h,i=null)=>({n,h,img:i&&i!=="@"&&!i.startsWith("assets/img/")?`assets/img/col/${i}.webp`:i});
const COLORS={
  "iPhone Duo":[C("스타 화이트","#ece8e0","assets/img/iphone-duo-white.webp"),C("나이트 스카이","#2b3140","assets/img/iphone-duo-night.webp")],
  "iPhone 17 Pro":[C("코스믹 오렌지","#e8823f","@"),C("딥 블루","#2e3b5a"),C("실버","#dfe1e4")],
  "iPhone 17 Pro Max":[C("코스믹 오렌지","#e8823f","@"),C("딥 블루","#2e3b5a"),C("실버","#dfe1e4")],
  "iPhone 17":[C("라벤더","#d9c9ea","i17-lavender"),C("미스트 블루","#a9c0dc","i17-mistblue"),C("세이지","#b6c7a0","i17-sage"),C("화이트","#f2f2f2","i17-white"),C("블랙","#2b2b2d","i17-black")],
  "iPhone Air":[C("스카이 블루","#c9dbee","air-blue"),C("라이트 골드","#ece2cc","air-gold"),C("클라우드 화이트","#f3f3f1","air-white"),C("스페이스 블랙","#2a2a2c","air-black")],
  "iPhone 16 Pro":[C("데저트 티타늄","#c8ad8a","@"),C("내추럴 티타늄","#bdb6aa"),C("화이트 티타늄","#e8e6e1"),C("블랙 티타늄","#3a3a3c")],
  "iPhone 16 Pro Max":[C("데저트 티타늄","#c8ad8a","@"),C("내추럴 티타늄","#bdb6aa"),C("화이트 티타늄","#e8e6e1"),C("블랙 티타늄","#3a3a3c")],
  "iPhone 16":[C("울트라마린","#5a6ee0","@"),C("틸","#a6d3cd"),C("핑크","#f3c1d3"),C("화이트","#f2f2f2"),C("블랙","#2e2e30")],
  "iPhone 16 Plus":[C("울트라마린","#5a6ee0","@"),C("틸","#a6d3cd"),C("핑크","#f3c1d3"),C("화이트","#f2f2f2"),C("블랙","#2e2e30")],
  "iPhone 16e":[C("블랙","#2e2e30","@"),C("화이트","#f2f2f2")],
  "iPhone 15":[C("핑크","#f3d5d8","@"),C("옐로","#f5ebc0"),C("그린","#d9e5cf"),C("블루","#cfe0ea"),C("블랙","#3b3d40")],
  "iPhone 15 Plus":[C("핑크","#f3d5d8","@"),C("옐로","#f5ebc0"),C("그린","#d9e5cf"),C("블루","#cfe0ea"),C("블랙","#3b3d40")],
  "iPhone 15 Pro":[C("내추럴 티타늄","#bdb6aa","@"),C("블루 티타늄","#3f4a5c"),C("화이트 티타늄","#e8e6e1"),C("블랙 티타늄","#3a3a3c")],
  "iPhone 15 Pro Max":[C("내추럴 티타늄","#bdb6aa","@"),C("블루 티타늄","#3f4a5c"),C("화이트 티타늄","#e8e6e1"),C("블랙 티타늄","#3a3a3c")],
  "iPhone SE 3":[C("미드나이트","#2a2e36"),C("스타라이트","#f0ebe2"),C("(PRODUCT)RED","#c8102e")],
  "Galaxy Z Flip8":[C("핑크","#f6c9e0","flip8-pink"),C("그린","#cfe8b8","flip8-green"),C("화이트","#f2f2f4","flip8-white"),C("블랙","#2c2d31","flip8-black")],
  "Galaxy Z Flip7":[C("코랄레드","#f3a38f","flip7-coral"),C("민트","#cfe9e3","flip7-mint"),C("제트블랙","#2a2b2f","flip7-black"),C("블루 섀도우","#3a4f9a")],
  "Galaxy Z Flip7 FE":[C("화이트","#eceef1","@"),C("블랙","#2a2b2f")],
  "Galaxy Z Flip6":[C("옐로","#f3e08c","flip6-yellow"),C("블루","#b8c8f0","flip6-blue"),C("민트","#c9ebd8","flip6-mint"),C("실버 섀도우","#c9ccd1","flip6-silver"),C("피치","#f6b49c","flip6-peach"),C("화이트","#f2f2f2","flip6-white"),C("크래프티드 블랙","#2b2c30","flip6-black")],
  "Galaxy Z Fold8 Ultra":[C("그레이","#3e4554","fold8u-gray"),C("버건디","#4a2232","fold8u-burgundy"),C("그린","#2f3b32","fold8u-green"),C("화이트","#f1f1ef","fold8u-white")],
  "Galaxy Z Fold8":[C("라벤더","#dcd3ea","fold8-lavender"),C("민트","#cfe3df","fold8-mint"),C("화이트","#f4f4f2","fold8-white"),C("그레이","#3b3f48","fold8-gray")],
  "Galaxy Z Fold7":[C("블루 섀도우","#2c3e7a","fold7-blue"),C("실버 섀도우","#c4c7cc","fold7-silver"),C("제트블랙","#1f2024","fold7-black"),C("민트","#d5ebe6","fold7-mint")],
  "Galaxy Z Fold6":[C("핑크","#f1cfd8","fold6-pink"),C("실버 섀도우","#c4c7cc","fold6-silver"),C("네이비","#2f3a55","fold6-navy"),C("크래프티드 블랙","#1f2024","fold6-black"),C("화이트","#f2f2f2","fold6-white")],
  "Galaxy S26 Ultra":[C("스카이 블루","#c6dbea","s26u-skyblue"),C("바이올렛","#5d5a8f","s26u-violet"),C("화이트","#f2f2f2","s26u-white")],
  "Galaxy S26 FE":[C("민트","#cfe9da","s26fe-mint"),C("네이비","#33396a","s26fe-navy"),C("그레이","#3a3c42","s26fe-gray")],
  "Galaxy S25":[C("아이시블루","#c9d9ee","s25-icyblue"),C("민트","#cbe8d9","s25-mint"),C("네이비","#26346a","s25-navy"),C("실버 섀도우","#b9bcc1","s25-silver")],
  "Galaxy S25+":[C("아이시블루","#c9d9ee","s25p-icyblue"),C("민트","#cbe8d9","s25p-mint"),C("네이비","#26346a","s25p-navy"),C("실버 섀도우","#b9bcc1","s25p-silver")],
  "Galaxy S25 Ultra":[C("티타늄 실버블루","#9fb0c4","s25u-silverblue"),C("티타늄 그레이","#8c8a85","s25u-gray"),C("티타늄 화이트실버","#e6e4e0","s25u-whitesilver"),C("티타늄 블랙","#2d2f33","s25u-black")],
  "Galaxy S24":[C("코발트 바이올렛","#6f5fb0","s24-violet"),C("앰버 옐로","#efe2b3","s24-yellow"),C("마블 그레이","#c9c9c9","s24-gray"),C("오닉스 블랙","#2b2c30","s24-black"),C("제이드 그린","#cfe6d2","s24-green"),C("사파이어 블루","#b9c6e6","s24-blue"),C("샌드스톤 오렌지","#e49a6a","s24-orange")],
  "Galaxy S24 Ultra":[C("티타늄 그레이","#8c8a85","s24u-gray"),C("티타늄 바이올렛","#4b4560","s24u-violet"),C("티타늄 옐로","#e8dcae","s24u-yellow"),C("티타늄 블랙","#2d2f33","s24u-black"),C("티타늄 그린","#cfe2d0","s24u-green"),C("티타늄 블루","#b8c8de","s24u-blue"),C("티타늄 오렌지","#e1915e","s24u-orange")],
  "Galaxy S24 FE":[C("블루","#cddcf0","@"),C("민트","#cfe9da"),C("옐로","#f2e6a6"),C("그레이","#c9cacc"),C("블랙","#2b2c30")],
  "Galaxy A56":[C("라이트그레이","#e3e5e8","@"),C("그래파이트","#4b4e56"),C("올리브","#a7b39c"),C("핑크","#ecd3dc")],
  "Galaxy A36":[C("블랙","#2b2c30","@"),C("화이트","#f2f2f2"),C("라벤더","#ddd3ee"),C("라임","#dfeec2")],
  "Galaxy A26":[C("민트","#cfe9da","@"),C("블랙","#2b2c30"),C("화이트","#f2f2f2"),C("피치핑크","#f3cfc4")],
};

// KT 공식 샵(shop.kt.com) 색상별 실제 사진·색 이름 (2026-11-20 수집): 최신 모델은 KT 판매 색상으로 맞춤
const KT_COLORS={"iPhone 18 Pro": [{"n": "글레이셔", "h": "#A4B1C4", "img": "assets/img/kt/iphone-18-pro-0.webp"}, {"n": "버건디", "h": "#46282D", "img": "assets/img/kt/iphone-18-pro-1.webp"}, {"n": "블랙", "h": "#242426", "img": "assets/img/kt/iphone-18-pro-2.webp"}, {"n": "실버", "h": "#DBDBD9", "img": "assets/img/kt/iphone-18-pro-3.webp"}], "iPhone 18 Pro Max": [{"n": "버건디", "h": "#46282D", "img": "assets/img/kt/iphone-18-pro-max-1.webp"}, {"n": "블랙", "h": "#242426", "img": "assets/img/kt/iphone-18-pro-max-2.webp"}, {"n": "실버", "h": "#DBDBD9", "img": "assets/img/kt/iphone-18-pro-max-3.webp"}, {"n": "글레이셔", "h": "#A4B1C4", "img": "assets/img/kt/iphone-18-pro-max-g.webp"}], "iPhone 17 Pro": [{"n": "딥 블루", "h": "#42475A", "img": "assets/img/kt/iphone-17-pro-0.webp"}, {"n": "실버", "h": "#EEEEEC", "img": "assets/img/kt/iphone-17-pro-1.webp"}, {"n": "코스믹 오렌지", "h": "#F88C4C", "img": "assets/img/kt/iphone-17-pro-2.webp"}], "Galaxy S26": [{"n": "블랙", "h": "#494D53", "img": "assets/img/kt/galaxy-s26-0.webp"}, {"n": "스카이 블루", "h": "#B3CBD9", "img": "assets/img/kt/galaxy-s26-1.webp"}, {"n": "코발트 바이올렛", "h": "#686884", "img": "assets/img/kt/galaxy-s26-2.webp"}, {"n": "화이트", "h": "#F3F4F5", "img": "assets/img/kt/galaxy-s26-3.webp"}], "Galaxy S26+": [{"n": "블랙", "h": "#494D53", "img": "assets/img/kt/galaxy-s26-plus-0.webp"}, {"n": "스카이 블루", "h": "#B3CBD9", "img": "assets/img/kt/galaxy-s26-plus-1.webp"}, {"n": "코발트 바이올렛", "h": "#686884", "img": "assets/img/kt/galaxy-s26-plus-2.webp"}, {"n": "화이트", "h": "#F3F4F5", "img": "assets/img/kt/galaxy-s26-plus-3.webp"}], "Galaxy S26 Ultra": [{"n": "블랙", "h": "#494D53", "img": "assets/img/kt/galaxy-s26-ultra-0.webp"}, {"n": "스카이 블루", "h": "#B3CBD9", "img": "assets/img/kt/galaxy-s26-ultra-1.webp"}, {"n": "화이트", "h": "#F3F4F5", "img": "assets/img/kt/galaxy-s26-ultra-3.webp"}, {"n": "코발트 바이올렛", "h": "#686884", "img": "assets/img/kt/galaxy-s26-ultra-v.webp"}], "Galaxy S25 Edge": [{"n": "티타늄 실버", "h": "#D6D6D8", "img": "assets/img/kt/galaxy-s25-edge-0.webp"}, {"n": "티타늄 제트블랙", "h": "#3A3B3F", "img": "assets/img/kt/galaxy-s25-edge-1.webp"}], "Galaxy A37": [{"n": "어썸 라벤더", "h": "#BCBDE2", "img": "assets/img/kt/galaxy-a37-0.webp"}, {"n": "어썸 차콜", "h": "#525257", "img": "assets/img/kt/galaxy-a37-1.webp"}, {"n": "어썸 화이트", "h": "#F3F4F5", "img": "assets/img/kt/galaxy-a37-2.webp"}]};
for(const n in KT_COLORS)COLORS[n]=KT_COLORS[n];
// Apple 공식 스토어 색상별 사진 (store.storeimages.cdn-apple.com, 2026-11-20): 사진 없는 색에 넣고, 없는 색은 추가
const APPLE_IMG={"iPhone 16": {"틸": "assets/img/apple/iphone-16-finish-select-202409-6-1inch-teal.webp", "핑크": "assets/img/apple/iphone-16-finish-select-202409-6-1inch-pink.webp", "화이트": "assets/img/apple/iphone-16-finish-select-202409-6-1inch-white.webp", "블랙": "assets/img/apple/iphone-16-finish-select-202409-6-1inch-black.webp", "울트라마린": "assets/img/apple/iphone-16-finish-select-202409-6-1inch-ultramarine.webp"}, "iPhone 16 Plus": {"틸": "assets/img/apple/iphone-16-finish-select-202409-6-7inch-teal.webp", "핑크": "assets/img/apple/iphone-16-finish-select-202409-6-7inch-pink.webp", "화이트": "assets/img/apple/iphone-16-finish-select-202409-6-7inch-white.webp", "블랙": "assets/img/apple/iphone-16-finish-select-202409-6-7inch-black.webp", "울트라마린": "assets/img/apple/iphone-16-finish-select-202409-6-7inch-ultramarine.webp"}, "iPhone 16 Pro": {"내추럴 티타늄": "assets/img/apple/iphone-16-pro-finish-select-202409-6-3inch-naturaltitanium.webp", "화이트 티타늄": "assets/img/apple/iphone-16-pro-finish-select-202409-6-3inch-whitetitanium.webp", "블랙 티타늄": "assets/img/apple/iphone-16-pro-finish-select-202409-6-3inch-blacktitanium.webp", "데저트 티타늄": "assets/img/apple/iphone-16-pro-finish-select-202409-6-3inch-deserttitanium.webp"}, "iPhone 16 Pro Max": {"내추럴 티타늄": "assets/img/apple/iphone-16-pro-finish-select-202409-6-9inch-naturaltitanium.webp", "화이트 티타늄": "assets/img/apple/iphone-16-pro-finish-select-202409-6-9inch-whitetitanium.webp", "블랙 티타늄": "assets/img/apple/iphone-16-pro-finish-select-202409-6-9inch-blacktitanium.webp", "데저트 티타늄": "assets/img/apple/iphone-16-pro-finish-select-202409-6-9inch-deserttitanium.webp"}, "iPhone 15 Pro": {"블루 티타늄": "assets/img/apple/iphone-15-pro-finish-select-202309-6-1inch-bluetitanium.webp", "화이트 티타늄": "assets/img/apple/iphone-15-pro-finish-select-202309-6-1inch-whitetitanium.webp", "블랙 티타늄": "assets/img/apple/iphone-15-pro-finish-select-202309-6-1inch-blacktitanium.webp", "내추럴 티타늄": "assets/img/apple/iphone-15-pro-finish-select-202309-6-1inch-naturaltitanium.webp"}, "iPhone 15 Pro Max": {"블루 티타늄": "assets/img/apple/iphone-15-pro-finish-select-202309-6-7inch-bluetitanium.webp", "화이트 티타늄": "assets/img/apple/iphone-15-pro-finish-select-202309-6-7inch-whitetitanium.webp", "블랙 티타늄": "assets/img/apple/iphone-15-pro-finish-select-202309-6-7inch-blacktitanium.webp", "내추럴 티타늄": "assets/img/apple/iphone-15-pro-finish-select-202309-6-7inch-naturaltitanium.webp"}, "iPhone 15": {"옐로": "assets/img/apple/iphone-15-finish-select-202309-6-1inch-yellow.webp", "그린": "assets/img/apple/iphone-15-finish-select-202309-6-1inch-green.webp", "블루": "assets/img/apple/iphone-15-finish-select-202309-6-1inch-blue.webp", "블랙": "assets/img/apple/iphone-15-finish-select-202309-6-1inch-black.webp", "핑크": "assets/img/apple/iphone-15-finish-select-202309-6-1inch-pink.webp"}, "iPhone 15 Plus": {"옐로": "assets/img/apple/iphone-15-finish-select-202309-6-7inch-yellow.webp", "그린": "assets/img/apple/iphone-15-finish-select-202309-6-7inch-green.webp", "블루": "assets/img/apple/iphone-15-finish-select-202309-6-7inch-blue.webp", "블랙": "assets/img/apple/iphone-15-finish-select-202309-6-7inch-black.webp", "핑크": "assets/img/apple/iphone-15-finish-select-202309-6-7inch-pink.webp"}, "iPhone 16e": {"화이트": "assets/img/apple/iphone-16e-finish-select-202502-white.webp", "블랙": "assets/img/apple/iphone-16e-finish-select-202502-black.webp"}, "iPhone 17e": {"소프트 핑크": "assets/img/apple/iphone-17e-finish-select-softpink-202603.webp", "화이트": "assets/img/apple/iphone-17e-finish-select-white-202603.webp", "블랙": "assets/img/apple/iphone-17e-finish-select-black-202603.webp"}, "iPhone 17 Pro Max": {"딥 블루": "assets/img/apple/iphone-17-pro-finish-select-202509-6-9inch-deepblue.webp", "실버": "assets/img/apple/iphone-17-pro-finish-select-202509-6-9inch-silver.webp", "코스믹 오렌지": "assets/img/apple/iphone-17-pro-finish-select-202509-6-9inch-cosmicorange.webp"}};
const APPLE_HEX={"소프트 핑크":"#f3d3d8","울트라마린":"#5a6ee0","데저트 티타늄":"#c8ad8a"};
for(const n in APPLE_IMG){const L=COLORS[n]=COLORS[n]||[];for(const c in APPLE_IMG[n]){const x=L.find(o=>o.n===c);if(x)x.img=APPLE_IMG[n][c];else L.push({n:c,h:APPLE_HEX[c]||"#cccccc",img:APPLE_IMG[n][c]});}}
// 삼성 뉴스룸(국내) 색상별 공식 사진: 갤럭시 A36 5G 국내 출시 색상 3종 (2025-06 보도자료)
COLORS["Galaxy A36"]=[{n:"어썸 블랙",h:"#2b2c30",img:"assets/img/samsung/a36-black.webp"},{n:"어썸 화이트",h:"#f2f2f2",img:"assets/img/samsung/a36-white.webp"},{n:"어썸 라벤더",h:"#ddd3ee",img:"assets/img/samsung/a36-lavender.webp"}];
const TIERS=["최소","적당히","넉넉하게","무제한 1Mbps","무제한 3Mbps","무제한 5Mbps","완전 무제한"];
const INF=Infinity;
const PLANS={
  skt:[{n:"라이트39",fee:39000,gb:6,qos:400},{n:"라이트49",fee:49000,gb:11,qos:400},{n:"라이트55",fee:55000,gb:15,qos:1000},
       {n:"라이트59",fee:59000,gb:24,qos:1000},{n:"라이트69",fee:69000,gb:110,qos:5000,chk:1},
       {n:"베스트89",fee:89000,gb:INF,qos:0},{n:"베스트Max",fee:129000,gb:INF,qos:0}],
  kt:[{n:"베이직 600MB",fee:28900,gb:0.6,qos:400},{n:"베이직 1.4GB",fee:33000,gb:1.4,qos:400},{n:"베이직 4GB",fee:37000,gb:4,qos:400},
      {n:"베이직 7GB",fee:45000,gb:7,qos:400},{n:"베이직 10GB",fee:50000,gb:10,qos:400},{n:"베이직 14GB",fee:55000,gb:14,qos:1000},
      {n:"베이직 30GB",fee:61000,gb:30,qos:1000},{n:"베이직 50GB",fee:63000,gb:50,qos:1000},{n:"베이직 110GB",fee:69000,gb:110,qos:5000},
      {n:"초이스90",fee:90000,gb:INF,qos:0},{n:"초이스110",fee:110000,gb:INF,qos:0}],
  lgu:[{n:"데이터플랜 300MB",fee:28000,gb:0.3,qos:400},{n:"데이터플랜 9GB",fee:47000,gb:9,qos:400},{n:"데이터플랜 14GB",fee:55000,gb:14,qos:1000},
       {n:"데이터플랜 95GB",fee:68000,gb:95,qos:3000},{n:"데이터플랜 125GB",fee:70000,gb:125,qos:5000},{n:"데이터플랜 150GB",fee:75000,gb:150,qos:5000},
       {n:"데이터플랜MAX",fee:85000,gb:INF,qos:0},{n:"플러스플랜95",fee:95000,gb:INF,qos:0}],
};
const TIER_RULE=[p=>true, p=>p.gb>=10, p=>p.gb>=50, p=>p.qos>=1000||p.qos===0, p=>p.qos>=3000||p.qos===0, p=>p.qos>=5000||p.qos===0, p=>p.qos===0];
const pickPlan=(k,t)=>PLANS[k].filter(TIER_RULE[t]).sort((a,b)=>a.fee-b.fee)[0];
const gbText=p=>p.gb===INF?"무제한":p.gb<1?Math.round(p.gb*1000)+"MB":p.gb+"GB";
const qosText=p=>p.qos===0?"속도 제한 없음":p.qos>=1000?`다 쓰면 ${p.qos/1000}Mbps`:`다 쓰면 ${p.qos}Kbps`;
const QOS_PLAN=n=>{for(const k in PLANS){const p=PLANS[k].find(x=>x.n===n);if(p)return p;}return null;};
const qTag=n=>{const p=typeof n==="string"?QOS_PLAN(n):n;return p&&[1000,3000,5000].includes(p.qos)?`<span class="qtag q${p.qos/1000}">다 쓰면 ${p.qos/1000}Mbps</span>`:"";};
const planLine=p=>`${p.n}${p.n.includes(gbText(p))?"":" · "+gbText(p)}${p.qos?" · 다 쓰면 "+qosText(p).replace("다 쓰면 ",""):" · 속도 제한 없음"}`;
const CARRIERS={
  skt:{name:"SKT",color:"#ea5b1e",sub:1.0},
  kt:{name:"KT",color:"#e2242c",sub:1.1},
  lgu:{name:"LG U+",color:"#d6177d",sub:1.2},
};
for(const k in CARRIERS)CARRIERS[k].plans=TIERS.map((_,t)=>t).map(t=>pickPlan(k,t).fee);
const EXTRA={"번호이동":200000,"기기변경":50000,"신규":120000};
const MM_SUPPORT=50000;
const INSTALL_RATE=0.059;
const inv=(id,brand,name,art,gb,grade,battery,price,colors)=>({id,brand,name,art,gb,grade,battery,price,colors});
const col=(name,hex,qty)=>({name,hex,qty});
const USED=[
  inv("u1","apple","iPhone 17 Pro","pro","256GB","S",100,1450000,[col("코스믹 오렌지","#e8823f",2),col("실버","#dfe1e4",1),col("딥 블루","#2e3b5a",0)]),
  inv("u2","apple","iPhone 16 Pro","pro","256GB","A",91,1050000,[col("데저트 티타늄","#c8ad8a",3),col("블랙 티타늄","#3a3a3c",2)]),
  inv("u3","apple","iPhone 16","basic","128GB","A",94,790000,[col("울트라마린","#5a6ee0",1),col("화이트","#f2f2f2",2),col("핑크","#f3c1d3",0)]),
  inv("u4","apple","iPhone 15 Pro Max","pro","256GB","B",86,920000,[col("내추럴 티타늄","#bdb6aa",2),col("블루 티타늄","#3f4a5c",1)]),
  inv("u5","apple","iPhone 15","basic","128GB","A",89,620000,[col("블랙","#3b3d40",3),col("블루","#cfe0ea",1)]),
  inv("u6","samsung","Galaxy S25 Ultra","ultra","256GB","S",99,1190000,[col("티타늄 실버블루","#9fb0c4",2),col("티타늄 블랙","#2d2f33",1)]),
  inv("u7","samsung","Galaxy S24 Ultra","ultra","256GB","A",90,850000,[col("티타늄 그레이","#8c8a85",2),col("티타늄 바이올렛","#8c7fa8",1)]),
  inv("u8","samsung","Galaxy Z Fold6","fold","256GB","B",87,1090000,[col("실버 섀도우","#bfc3c9",1),col("네이비","#2f3a55",0)]),
  inv("u9","samsung","Galaxy Z Flip6","flip","256GB","A",92,720000,[col("블루","#9bb4e0",1),col("실버 섀도우","#c9ccd1",2)]),
  inv("u10","samsung","Galaxy S24","galaxy","256GB","A",93,580000,[col("앰버 옐로","#e8cc6a",1),col("코발트 바이올렛","#6f5fb0",2)]),
];
const stock=it=>it.colors.reduce((a,c)=>a+c.qty,0);
const won=n=>Math.round(n).toLocaleString("ko-KR")+"원";
const man=n=>(Math.round(n/1000)/10).toLocaleString("ko-KR")+"만원";
const monthlyInstall=(p,months)=>{const r=INSTALL_RATE/12;return p<=0?0:Math.round(p*r*Math.pow(1+r,months)/(Math.pow(1+r,months)-1));};
const colorsOf=md=>typeof COLORS!=="undefined"&&COLORS[md.name]||[];
const curCol=md=>{const L=colorsOf(md);return L[Math.min(S.mcol||0,L.length-1)]||null;};
const mdImg=md=>{const c=curCol(md);return c&&c.img?(c.img==="@"?md.img:c.img):md.img;};
const S={screen:"home",mode:null,brand:null,cat:null,bucket:null,model:null,storageIdx:0,cur:null,tier:5,months:24,pick:null,w:{cur:null,budget:100000,tier:5,brand:"any",kind:"all"},
  pay:"full",con:"best",ub:"all",used:null,colorIdx:0,cart:null,track:null,errors:{},
  f:{name:"",phone:"",birth:"",sido:"",sigungu:"",detail:"",remote:false,req:"문 앞에 놓아주세요",ship:null,a1:false,a2:false,
     q:"",road:"",jibun:"",zip:"",manual:false,picked:false}};
const cat=()=>DATA[S.brand].cats[S.cat];
const allModels=c=>c.series.flatMap(s=>s.models);
const R=[];
const ref=x=>{R.push(x);return R.length-1;};
function mmModels(){const o=[];for(const [b,B] of Object.entries(DATA))for(const [ck,c] of Object.entries(B.cats))for(const se of c.series)for(const m of se.models)if(!m.soon&&m.storages&&m.storages.length)o.push({b,ck,c,m});return o;}
const mmUsed=name=>USED.filter(u=>u.name===name&&stock(u)>0).sort((a,b)=>a.price-b.price);
const mmModelOf=name=>mmModels().find(x=>x.m.name===name);
const MM_WORDS=[["아이폰","iphone"],["애플","iphone"],["갤럭시","galaxy"],["삼성","galaxy"],["폴드","fold"],["플립","flip"],["울트라","ultra"],["프로맥스","promax"],["프로","pro"],["맥스","max"],["플러스","plus"],["에어","air"],["듀오","duo"],["엣지","edge"],["에스","s"],["에이","a"],["+","plus"]];
function mmNorm(t){t=t.toLowerCase();for(const [k,v] of MM_WORDS)t=t.split(k).join(v);return t.replace(/\s+/g,"").replace(/iphone|galaxy/g,"").replace(/z(?=fold|flip)/g,"");}
function mmFind(q){
  const n=mmNorm(q);if(!n)return [];
  return mmModels().map(x=>{const k=mmNorm(x.m.name);const i=k.indexOf(n);return i<0?null:{x,score:(i===0?0:10)+(k.length-n.length)};}).filter(Boolean)
    .sort((a,b)=>a.score-b.score||(b.x.m.gen||0)-(a.x.m.gen||0)).slice(0,6).map(r=>r.x);
}
const MM_HOT=["iPhone 18 Pro","iPhone Duo","iPhone 17","Galaxy Z Fold8","Galaxy S26 Ultra","Galaxy Z Flip8","iPhone 18 Pro Max","Galaxy S26"];
const MVNO_PLANS=[13200,22000,29700,22000,29700,33000,39000];
const keepBundle=cur=>S.bundle==="keep"&&!!CARRIERS[cur];
const BUNDLE_RULE={
  kt:{name:"프리미엄 가족결합",f:fee=>fee>=77000?Math.round(fee*.25/10)*10:5500},
  skt:{name:"요즘가족결합",f:fee=>fee>=69000?11000:5500},
  lgu:{name:"참 쉬운 가족결합",f:fee=>fee>=65890?11000:5500}};
const bundleDc=(k,fee)=>BUNDLE_RULE[k]?BUNDLE_RULE[k].f(fee):0;
function selfPlan(tier,cur){
  const mv={fee:MVNO_PLANS[tier],label:"알뜰폰 요금"};
  // 결합 유지: 알뜰폰으로 옮기면 결합이 깨지니 지금 통신사 요금(선택약정 25%)으로
  if(keepBundle(cur)){const f=CARRIERS[cur].plans[tier],b=bundleDc(cur,f);return {fee:Math.max(0,Math.round(f*.75)-b),bdc:b,label:`${CARRIERS[cur].name} 선택약정 · 결합 -${won(b)}`};}
  if(CARRIERS[cur]){const k=Math.round(CARRIERS[cur].plans[tier]*.75);if(k<mv.fee)return {fee:k,label:`${CARRIERS[cur].name} 선택약정 요금`};}
  return mv;
}
const CAT_TABS={apple:[["duo",["duo"],"DUO"],["pro",["pro"],"Pro"],["basic",["basic"],"일반"],["airse",["air","se"],"Air · SE"]],
  samsung:[["fold",["fold"],"Z폴드"],["flip",["flip"],"Z플립"],["basic",["basic"],"일반"],["ultra",["ultra"],"울트라"]]};
function catTabs(b,has){return CAT_TABS[b].map(([k,cs,l])=>[k,cs.filter(c=>DATA[b].cats[c]&&(!has||has(c))),l]).filter(t=>t[1].length);}
const CMP_MONTHS=24;
const instLabel=m=>m?m+"개월 할부":"일시불";
const CON_NAME={sub:"공시지원금",sel24:"선택약정 24개월",sel12:"선택약정 12개월"};
function pubSub(s,k,pp){
  const o=s.pub&&s.pub[k],ref=OFFICIAL[k];
  if(o&&ref){const r=Math.min(1,pp.fee/ref.fee);return {amt:Math.round(o*r/1000)*1000,src:r>=1?"official":"scaled",label:`${CARRIERS[k].name} ${ref.lbl||"공식"}`+(r>=1?"":` ${man(o)}에서 요금 비례`)};}
  // 공식 데이터가 없는 통신사: SKT 공식값(없으면 기본 예시값)을 같은 요금 비례로 적용한 추정치
  const base=(s.pub&&s.pub.skt)||s.subsidy,r=Math.min(1,pp.fee/OFFICIAL.skt.fee);
  return {amt:Math.round(base*r/1000)*1000,src:"sample",label:"예시"};
}
function mktExtra(s,k,way,fee){
  const m=s.mkt;if(!m||m.k!==k||way!=="번호이동")return 0;
  const top=(s.pub&&s.pub[k])||(s.pub&&s.pub.skt)||s.subsidy;
  const ex=Math.max(0,m.total-top-MM_SUPPORT);
  return Math.round(ex*Math.min(1,fee/OFFICIAL.skt.fee)/1000)*1000;
}
const qosLabel=q=>q===0?"속도 줄지 않음":q>=5000?"5Mbps · 영상 1080p":q>=3000?"3Mbps · 영상 720p":q>=1000?"1Mbps · 영상 360p":`${q}Kbps · 카톡·검색`;
function tierInfo(t){
  const ps=Object.keys(CARRIERS).map(k=>planFor(k,t)),gbs=ps.map(p=>p.gb===INF?Infinity:p.gb),lo=Math.min(...gbs),hi=Math.max(...gbs),qos=Math.min(...ps.map(p=>p.qos));
  if(lo===Infinity)return {base:"무제한",after:"속도 줄지 않음",video:"영상 시간 제한 없음",unl:true};
  return {base:lo===hi?`${Math.round(lo)}GB`:`${Math.round(lo)}~${Math.round(hi)}GB`,after:qosLabel(qos),video:`HD 영상 약 ${Math.round(lo/1.5)}시간`,unl:false};
}
function planFor(k,t){const n=S.planSel&&S.planSel[k];return (n&&PLANS[k].find(p=>p.n===n))||pickPlan(k,t);}
function calcOptions(s,cur,t,months,con="best"){
  const out=[];
  for(const [k,c] of Object.entries(CARRIERS)){
    if(keepBundle(cur)&&k!==cur)continue; // 결합 유지: 지금 통신사 기기변경만
    const way=cur==="none"?"신규":cur===k?"기기변경":"번호이동",pp=planFor(k,t),plan=pp.fee,ps=pubSub(s,k,pp),subsidy=ps.amt,mx=mktExtra(s,k,way,plan),extra=Math.max(EXTRA[way],mx),extraSrc=mx>EXTRA[way]?"market":"sample";
    for(const m of con==="best"?["sub","sel24"]:[con]){
      const sel=m!=="sub", discMon=m==="sel12"?12:CMP_MONTHS;
      const sub=sel?0:subsidy, mem=memDc(), principal=Math.max(0,s.price-sub-extra-MM_SUPPORT-mem);
      // months=기기값 결제 방식(0=일시불, 12·24·36=할부). 비교는 약정 기준 24개월 총 비용으로 통일
      const bdc=keepBundle(cur)&&k===cur?bundleDc(k,plan):0; // 결합 유지 할인
      const deviceMonthly=months?monthlyInstall(principal,months):0, planMonthly=Math.max(0,plan-(sel?Math.round(plan*.25):0)-bdc);
      const deviceTotal=months?deviceMonthly*months:principal, interest=deviceTotal-principal;
      out.push({id:k+"-"+m,con:m,pubSrc:ps.src,pubLabel:ps.label,extraSrc,carrier:c.name,color:c.color,way,planName:pp.n,planLine:planLine(pp),planChk:!!pp.chk,
        method:sel?`${CON_NAME[m]} (요금 25% 할인)`:"공시지원금 (기기값 할인)",
        price:s.price,subsidy:sub,extra,principal,deviceMonthly,planMonthly,planDiscount:sel?Math.round(plan*.25):0,
        inst:months,deviceTotal,interest,upfront:months?0:principal,
        monthly:deviceMonthly+planMonthly,grand:deviceTotal+plan*CMP_MONTHS-(sel?Math.round(plan*.25)*discMon:0)-bdc*CMP_MONTHS,
        bundleDc:bdc,bundleName:bdc?BUNDLE_RULE[k].name:"",mem,saved:sub+extra+MM_SUPPORT+mem+bdc*CMP_MONTHS+(sel?Math.round(plan*.25)*discMon:0)});
    }
  }
  return out.sort((a,b)=>a.grand-b.grand);
}
S.planSel=S.planSel||{};
function refundRules(mode){
  if(mode==="used")return [["no","사용 시작 후 단순 변심 반품 불가","유심을 끼우면 사용 시작"],["ok","받은 그대로면 7일 안 반품",""],["ok","기기 결함은 7일 안 교환·환불",""]];
  return [["no",(mode==="carrier"?"개봉·개통":"개봉")+" 후 단순 변심 반품 불가","비닐을 뜯는 순간 중고가 돼요"],["ok","미개봉이면 7일 안 반품",""],["ok","불량은 개봉 후에도 7일 안 교환·환불",""]];
}
function finCalc(f,m){
  const dev=m?monthlyInstall(f.principal,m):0,devTotal=m?dev*m:f.principal;
  return {m,up:m?0:f.principal,dev,interest:devTotal-f.principal,mon:dev+f.planMonthly,
    total:devTotal+f.planFee*CMP_MONTHS-f.planDisc*f.discMon-(f.bundleDc||0)*CMP_MONTHS};
}
const MEMBER_DC=30000;
const memDc=()=>S.member?MEMBER_DC:0;
const selfPrice=s=>Math.max(0,s.price-memDc());
const kpF=d=>`${String(d.getFullYear()).slice(2)}년 ${d.getMonth()+1}월 ${d.getDate()}일 (${DOW[d.getDay()]})`;
const KEEP={days:183,months:6,alerts:[[30,"1개월 전"],[14,"2주 전"],[7,"1주 전"],[0,"당일"]]};
const DOW="일월화수목금토";
const kAddD=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x;};
const kAddM=(d,m)=>{const x=new Date(d);const day=x.getDate();x.setDate(1);x.setMonth(x.getMonth()+m);x.setDate(Math.min(day,new Date(x.getFullYear(),x.getMonth()+1,0).getDate()));return x;};
function keepDates(start,conM=24){return {start,cal:kAddM(start,KEEP.months),safe:kAddD(start,KEEP.days),con:kAddM(start,conM)};}
S.planSel = {};
window.CAT = { DATA, OFFICIAL, MARKET, COLORS, PLANS, CARRIERS, TIERS, EXTRA, MM_SUPPORT, MEMBER_DC, USED, BUNDLE_RULE, CAT_TABS, S,
  calcOptions, selfPlan, pickPlan, planFor, planLine, pubSub, catTabs, allModels, colorsOf, monthlyInstall, stock, keepDates, mmModels, mmUsed, mmModelOf, qosText, gbText,
  imgOf: function (md, ci) { var c = colorsOf(md)[ci || 0]; return c && c.img ? (c.img === "@" ? md.img : c.img) : md.img; } };
})();
