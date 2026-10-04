/* WJ58 lab-grown booth map. No network requests, no storage, no cookies. */
(function(){
"use strict";
var L=window.WJ58_LAYOUT;
if(!L||!L.booths){return;}
var NS="http://www.w3.org/2000/svg";
function safeUrl(u){try{var x=new URL(u);return x.protocol==="https:"?x.href:null;}catch(e){return null;}}
var LAB={confirmed:1,listed:1,signal:1,check:1,service:1};
var TL={confirmed:"Confirmed seller",listed:"Listed by the show",signal:"Likely seller",check:"Worth asking",service:"Diamond grading lab",natural:"Natural diamonds only",simulant:"Sells diamond look-alikes (moissanite or zirconia), not lab-grown diamonds",none:"Checked: no sign of lab-grown diamonds"};
var ALIAS={"1-84":" (Evermore Diamonds)","3-1700":" (Spectrum Jewels)","5-2855":" (Diamantaire Exports)"};
var EXH=/^([1-6]-|HK|ITL|IP|EP|SIN|TH|BLV|BVL|SR)/i;
var svg=document.getElementById("map"),stage=document.getElementById("stage");
function mk(t,a,p){var e=document.createElementNS(NS,t);for(var k in a)e.setAttribute(k,a[k]);(p||svg).appendChild(e);return e;}
function pts(r){return r.map(function(p){return p[0]+","+p[1];}).join(" ");}
function cen(r){var x=0,y=0;r.forEach(function(p){x+=p[0];y+=p[1];});return[x/r.length,y/r.length];}
function bbox(r){var a=[1e9,1e9,-1e9,-1e9];r.forEach(function(p){a[0]=Math.min(a[0],p[0]);a[1]=Math.min(a[1],p[1]);a[2]=Math.max(a[2],p[0]);a[3]=Math.max(a[3],p[1]);});return a;}
var gR=mk("g",{}),gW=mk("g",{}),gB=mk("g",{}),gZ=mk("g",{}),gT=mk("g",{}),gH=mk("g",{});
L.routes.forEach(function(r){mk("polyline",{points:pts(r),class:"route"},gR);});
var zoneBox=null;
L.shapes.forEach(function(s){
 if(s.k==="zone"){mk("polygon",{points:pts(s.r),class:"zonep"},gZ);zoneBox=bbox(s.r);}
 else mk("polygon",{points:pts(s.r),class:s.k==="country"?"country":"wallp"},gW);
});
var booths=[],byCode={},you=null,hallPts={};
L.booths.forEach(function(b){
 if(/^Flag/i.test(b.c))return;
 if(/^58-qr/i.test(b.c)){if(b.c==="58-qr-sc14")you=cen(b.r);return;}
 var isExh=EXH.test(b.c);
 var cls="b"+(isExh?(b.t&&LAB[b.t]?" "+b.t:""):" fac");
 var el=mk("polygon",{points:pts(b.r),class:cls},gB);
 var o={c:b.c,n:(b.n||b.c)+(ALIAS[b.c]||""),t:isExh?b.t:"fac",z:b.z,h:b.h,cn:b.cn,no:b.no,s:b.s,el:el,box:bbox(b.r)};
 el.addEventListener("click",function(){if(!moved)openD(o);});
 booths.push(o);byCode[b.c.toUpperCase()]=o;
 if(isExh){
  var c=cen(b.r),w=o.box[2]-o.box[0],h=o.box[3]-o.box[1],lab=b.c.replace(/^([1-6])-/,""),fs=Math.min(1.7,Math.min(w,h)/2.4,(w*.88)/(lab.length*.6));
  var tx=mk("text",{x:c[0],y:c[1]+fs*.35,"text-anchor":"middle","font-size":fs,class:"code"+(b.t==="confirmed"?" on":"")},gT);
  tx.textContent=lab;
  if(b.h){(hallPts[b.h]=hallPts[b.h]||[]).push(c);}
 }
});
Object.keys(hallPts).forEach(function(h){var c=cen(hallPts[h]);var t=mk("text",{x:c[0],y:c[1],"text-anchor":"middle","font-size":5,class:"hall"},gH);t.textContent="HALL "+h;});
[["HK pavilion",/^HK-/],["Italy",/^ITL/],["India pavilion",/^IP-/],["Singapore",/^SIN-/],["Thailand",/^TH-/],["Emirati pavilion",/^EP-/]].forEach(function(p){
 var cs=booths.filter(function(b){return p[1].test(b.c);}).map(function(b){return[(b.box[0]+b.box[2])/2,(b.box[1]+b.box[3])/2];});
 if(cs.length){var c=cen(cs);var t=mk("text",{x:c[0],y:c[1]-4,"text-anchor":"middle","font-size":2.6,class:"hall"},gH);t.textContent=p[0].toUpperCase();}});
if(you){var g=mk("g",{class:"you"},gH);mk("circle",{cx:you[0],cy:you[1],r:1.6},g);var t=mk("text",{x:you[0]+2.4,y:you[1]+1,"font-size":3},g);t.textContent="Central Boulevard";}
// view
var full={x:-4,y:-4,w:L.w+8,h:L.h+8},vb={x:0,y:0,w:0,h:0};
var scaleBar=document.getElementById("scaleBar"),scaleTxt=document.getElementById("scaleTxt");
function updScale(){if(!scaleBar)return;var r=svg.getBoundingClientRect();if(!r.width)return;var mpp=Math.max(vb.w/r.width,vb.h/r.height);var steps=[2,5,10,20,25,50,100],m=steps[steps.length-1];for(var i=0;i<steps.length;i++){if(steps[i]/mpp>=48){m=steps[i];break;}}scaleBar.style.width=Math.round(m/mpp)+"px";scaleTxt.textContent=m+" m";}
function apply(){svg.setAttribute("viewBox",[vb.x,vb.y,vb.w,vb.h].join(" "));svg.classList.toggle("zoomed",vb.w<75);updScale();}
function setV(x,y,w,h){var r=stage.clientWidth/stage.clientHeight||1;if(w/h<r){var nw=h*r;x-=(nw-w)/2;w=nw;}else{var nh=w/r;y-=(nh-h)/2;h=nh;}vb={x:x,y:y,w:w,h:h};apply();}
function fit(b,pad){pad=pad||8;setV(b[0]-pad,b[1]-pad,b[2]-b[0]+pad*2,b[3]-b[1]+pad*2);}
function zoomAt(f,cx,cy){var nw=Math.max(12,Math.min(full.w*1.6,vb.w*f)),k=nw/vb.w;vb.x=cx-(cx-vb.x)*k;vb.y=cy-(cy-vb.y)*k;vb.w=nw;vb.h*=k;apply();}
function toSvg(ev){var r=svg.getBoundingClientRect(),s=Math.max(vb.w/r.width,vb.h/r.height);var ox=(r.width-vb.w/s)/2,oy=(r.height-vb.h/s)/2;return[vb.x+(ev.clientX-r.left-ox)*s,vb.y+(ev.clientY-r.top-oy)*s];}
var ptrs={},moved=false,last=null,pinch=null;
svg.addEventListener("pointerdown",function(e){ptrs[e.pointerId]=e;moved=false;last={x:e.clientX,y:e.clientY};svg.classList.add("drag");
 var ids=Object.keys(ptrs);if(ids.length===2){var a=ptrs[ids[0]],b=ptrs[ids[1]];pinch={d:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)};}});
svg.addEventListener("pointermove",function(e){if(!ptrs[e.pointerId])return;ptrs[e.pointerId]=e;var ids=Object.keys(ptrs);
 if(ids.length===2&&pinch){var a=ptrs[ids[0]],b=ptrs[ids[1]],d=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);if(d>0){var m=toSvg({clientX:(a.clientX+b.clientX)/2,clientY:(a.clientY+b.clientY)/2});zoomAt(pinch.d/d,m[0],m[1]);pinch.d=d;moved=true;}return;}
 var r=svg.getBoundingClientRect(),s=Math.max(vb.w/r.width,vb.h/r.height),dx=e.clientX-last.x,dy=e.clientY-last.y;
 if(Math.abs(dx)+Math.abs(dy)>3)moved=true;vb.x-=dx*s;vb.y-=dy*s;last={x:e.clientX,y:e.clientY};apply();});
function up(e){delete ptrs[e.pointerId];if(Object.keys(ptrs).length<2)pinch=null;var ids=Object.keys(ptrs);if(ids.length===1)last={x:ptrs[ids[0]].clientX,y:ptrs[ids[0]].clientY};else svg.classList.remove("drag");setTimeout(function(){moved=false;},0);}
svg.addEventListener("pointerup",up);svg.addEventListener("pointercancel",up);svg.addEventListener("pointerleave",function(e){if(e.pointerType==="mouse")up(e);});
svg.addEventListener("wheel",function(e){e.preventDefault();var m=toSvg(e);zoomAt(e.deltaY>0?1.2:1/1.2,m[0],m[1]);},{passive:false});
function zc(f){zoomAt(f,vb.x+vb.w/2,vb.y+vb.h/2);}
document.getElementById("zin").onclick=function(){zc(1/1.5);};document.getElementById("zout").onclick=function(){zc(1.5);};
document.getElementById("goZone").onclick=function(){if(zoneBox){fit(zoneBox,6);stage.scrollIntoView({block:"nearest",behavior:"smooth"});}};
document.getElementById("goAll").onclick=function(){setV(full.x,full.y,full.w,full.h);};
document.getElementById("goYou").onclick=function(){if(you)setV(you[0]-25,you[1]-25,50,50);};
var hit=null;
function show(o){if(hit)hit.el.classList.remove("hit");hit=o;o.el.classList.add("hit");var b=o.box,cx=(b[0]+b[2])/2,cy=(b[1]+b[3])/2;setV(cx-22,cy-22,44,44);stage.scrollIntoView({block:"center",behavior:"smooth"});}
// search
document.getElementById("q").addEventListener("input",function(){var q=this.value.trim().toLowerCase();
 booths.forEach(function(b){b.el.classList.toggle("dim",!!q&&(b.c+" "+b.n).toLowerCase().indexOf(q)===-1);});
 if(!q){if(hit)hit.el.classList.remove("hit");return;}
 var ex=byCode[q.toUpperCase()]||booths.find(function(b){return b.t!=="fac"&&(b.c+" "+b.n).toLowerCase().indexOf(q)!==-1;});
 if(ex&&q.length>=3){if(hit)hit.el.classList.remove("hit");hit=ex;ex.el.classList.add("hit");var b=ex.box;setV((b[0]+b[2])/2-30,(b[1]+b[3])/2-30,60,60);}});
// dialog
var dlg=document.getElementById("dlg");
function openD(o){document.getElementById("dBooth").textContent=o.t==="fac"?"Facility":"Booth "+o.c;document.getElementById("dName").textContent=o.n;
 document.getElementById("dMeta").textContent=[o.h?"Hall "+o.h:"",o.cn,o.z?"Official Lab-Grown Zone":""].filter(Boolean).join(" · ");
 var w=o.t==="fac"?"":(o.t?TL[o.t]+". "+(o.no||""):"Not checked in detail. Its show profile does not mention lab-grown diamonds.");
 document.getElementById("dWhy").textContent=w;var s=document.getElementById("dSrc");s.textContent="";
 var su=safeUrl(o.s);if(su){var a=document.createElement("a");a.href=su;a.target="_blank";a.rel="noopener noreferrer";a.textContent="Source";s.appendChild(a);}
 if(typeof dlg.showModal==="function")dlg.showModal();else dlg.setAttribute("open","");}
document.getElementById("dClose").onclick=function(){dlg.close();};dlg.addEventListener("click",function(e){if(e.target===dlg)dlg.close();});
// tally
var cnt={confirmed:0,listed:0,signal:0,check:0};booths.forEach(function(b){if(cnt[b.t]!==undefined)cnt[b.t]++;});
var T=document.getElementById("tally");[["confirmed","Confirmed sellers"],["listed","Listed by the show"],["signal","Likely sellers"],["check","Worth asking"]].forEach(function(p){var s=document.createElement("span");var i=document.createElement("i");i.className="sw "+p[0];var bb=document.createElement("b");bb.textContent=String(cnt[p[0]]);s.appendChild(i);s.appendChild(bb);s.appendChild(document.createTextNode(p[1]));T.appendChild(s);});
// list
var filt="all",out=document.getElementById("out");
var ORDER=[["5","Hall 5"],["3","Hall 3"],["1","Hall 1"],["2","Hall 2"],["4","Hall 4"],["6","Hall 6"],["X","Pavilions and boulevard"]];
var rank={confirmed:0,listed:1,signal:2,check:3,service:4};
function renderList(){out.textContent="";ORDER.forEach(function(g){
 var list=booths.filter(function(b){if(!LAB[b.t])return false;if(filt!=="all"&&b.t!==filt)return false;var h=/^[1-6]-/.test(b.c)?b.c[0]:"X";return h===g[0];})
  .sort(function(a,b){return(rank[a.t]-rank[b.t])||a.c.localeCompare(b.c,"en",{numeric:true});});
 if(!list.length)return;var sec=document.createElement("section");sec.className="sec";var h=document.createElement("h3");h.textContent=g[1];var sm=document.createElement("small");sm.textContent=list.length+(list.length===1?" booth":" booths");h.appendChild(sm);sec.appendChild(h);
 var w=document.createElement("div");w.className="cards";list.forEach(function(b){var c=document.createElement("article");c.className="card "+b.t;
  var bn=document.createElement("div");bn.className="bn";bn.textContent=b.c;var mid=document.createElement("div");var nm=document.createElement("div");nm.className="nm";nm.textContent=b.n;var tg=document.createElement("div");tg.className="tag";tg.textContent=TL[b.t]+(b.cn?", "+b.cn:"")+(b.z?" · Lab-Grown Zone":"");mid.appendChild(nm);mid.appendChild(tg);
  var go=document.createElement("button");go.type="button";go.className="btn go";go.textContent="Show on map";go.onclick=function(){show(b);};
  c.appendChild(bn);c.appendChild(mid);c.appendChild(go);if(b.no){var p=document.createElement("p");p.className="why";p.textContent=b.no;c.appendChild(p);}
  var bu=safeUrl(b.s);if(bu){var s=document.createElement("p");s.className="src";var a=document.createElement("a");a.href=bu;a.target="_blank";a.rel="noopener noreferrer";a.textContent=b.s.replace(/^https?:\/\/(www\.)?/,"").slice(0,60);s.appendChild(document.createTextNode("Source: "));s.appendChild(a);c.appendChild(s);}
  w.appendChild(c);});sec.appendChild(w);out.appendChild(sec);});}
document.querySelectorAll(".seg button").forEach(function(b){b.onclick=function(){filt=b.dataset.f;document.querySelectorAll(".seg button").forEach(function(x){x.setAttribute("aria-pressed",x===b);});renderList();};});
renderList();
function init(){if(zoneBox){var b=zoneBox;setV(b[0]-30,b[1]-25,b[2]-b[0]+60,b[3]-b[1]+60);}else setV(full.x,full.y,full.w,full.h);}
init();window.addEventListener("resize",function(){setV(vb.x,vb.y,vb.w,vb.h);});
})();

// Load the 3D diamond after the page is ready, unless the visitor saves data.
(function(){var c=navigator.connection;if(c&&c.saveData)return;function go(){var s=document.createElement("script");s.src="assets/gem3d.js";s.async=true;document.head.appendChild(s);}
if(document.readyState==="complete")setTimeout(go,300);else window.addEventListener("load",function(){setTimeout(go,300);});})();
