(() => {
"use strict";
const $=id=>document.getElementById(id);
const ids=["capital","contribution","yield","growth","years","goal"];
const defaults={capital:300000,contribution:1000,yield:3,growth:2,years:10,goal:2000,reinvest:true};
const presets={conservative:{yield:2.5,growth:0},base:{yield:3,growth:2},optimistic:{yield:4.5,growth:5}};
const money=n=>new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n);
const number=n=>new Intl.NumberFormat("es-ES",{maximumFractionDigits:2}).format(n);
function getState(){const s={};for(const id of ids)s[id]=Number($(id).value);s.reinvest=$("reinvest").checked;return s;}
function calculate(s){
 let capital=s.capital,cash=0;
 const rows=[{year:0,capital,monthly:capital*s.yield/1200}];
 for(let year=1;year<=s.years;year++){
   for(let month=0;month<12;month++){
     capital+=s.contribution;
     const div=capital*s.yield/1200;
     if(s.reinvest)capital+=div;else cash+=div;
     capital*=1+s.growth/1200;
     capital=Math.max(capital,0);
   }
   rows.push({year,capital,monthly:capital*s.yield/1200});
 }
 return {capital,cash,monthly:capital*s.yield/1200,paid:s.capital+s.contribution*s.years*12,rows};
}
function chart(rows){
 const svg=$("dividendChart"),ns="http://www.w3.org/2000/svg";
 svg.replaceChildren(); const W=800,H=320,L=79,R=22,T=23,B=45;
 const max=Math.max(100,...rows.map(r=>r.monthly))*1.12;
 const nice=Math.ceil(max/500)*500;
 const x=i=>L+i*(W-L-R)/(rows.length-1);
 const y=v=>T+(nice-v)/nice*(H-T-B);
 function node(tag,attrs={},txt){const el=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,String(v)));if(txt!==undefined)el.textContent=txt;svg.appendChild(el);return el;}
 for(let i=0;i<=4;i++){let val=nice*i/4,Y=y(val);node("line",{x1:L,y1:Y,x2:W-R,y2:Y,stroke:"#345049","stroke-dasharray":"4 6"});node("text",{x:L-10,y:Y+4,fill:"#9ab6ac","font-size":12,"text-anchor":"end"},money(val));}
 const ticks=Math.min(rows.length-1,6);
 for(let i=0;i<=ticks;i++){let idx=Math.round(i*(rows.length-1)/ticks);node("text",{x:x(idx),y:H-12,fill:"#93afa3","font-size":12,"text-anchor":"middle"},"Año "+rows[idx].year);}
 const line=rows.map((r,i)=>(i===0?"M":"L")+x(i).toFixed(2)+","+y(r.monthly).toFixed(2)).join(" ");
 const area=line+" L"+x(rows.length-1)+","+y(0)+" L"+x(0)+","+y(0)+" Z";
 const defs=document.createElementNS(ns,"defs");defs.innerHTML='<linearGradient id="chartAreaShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#45d899" stop-opacity=".3"/><stop offset="100%" stop-color="#45d899" stop-opacity=".012"/></linearGradient>';svg.appendChild(defs);
 node("path",{d:area,fill:"url(#chartAreaShade)"});
 node("path",{d:line,stroke:"#6fe3a4","stroke-width":3.5,fill:"none","stroke-linejoin":"round","stroke-linecap":"round"});
 rows.forEach((r,i)=>{let hit=node("circle",{cx:x(i),cy:y(r.monthly),r:12,fill:"transparent",tabindex:0,role:"img","aria-label":"Año "+r.year+": "+money(r.monthly)+" netos por mes"});const show=()=>{const tip=$("chartTooltip");tip.hidden=false;tip.textContent="Año "+r.year+" · "+money(r.monthly)+"/mes";tip.style.left=(x(i)/W*100)+"%";tip.style.top=(y(r.monthly)/H*100)+"%";};hit.addEventListener("mouseenter",show);hit.addEventListener("focus",show);hit.addEventListener("click",show);hit.addEventListener("mouseleave",()=>{$("chartTooltip").hidden=true});hit.addEventListener("blur",()=>{$("chartTooltip").hidden=true});});
}
function render(){
 const s=getState(),r=calculate(s);
 for(let id of ids){$(id+"Value").textContent=id==="capital"||id==="contribution"?money(s[id]):id==="years"?s[id]+" años":id==="goal"?money(s[id])+"/mes":number(s[id])+" %";const input=$(id);const perc=(s[id]-Number(input.min))/(Number(input.max)-Number(input.min))*100;input.style.background="linear-gradient(to right,#57d990 "+perc+"%,#39524e "+perc+"%)";input.style.borderRadius="20px";}
 $("monthlyIncome").textContent=money(r.monthly);$("finalCapital").textContent=money(r.capital);$("investedTotal").textContent=money(r.paid);$("cashReceived").textContent=money(r.cash);
 const pct=r.monthly/s.goal*100;
 $("progressPercent").textContent=number(pct)+" %";
 $("progressFill").style.width=Math.min(pct,100)+"%";
 $("progressTrack").setAttribute("aria-valuenow",Math.round(Math.min(100,pct)));
 $("progressMessage").textContent=pct>=100?"¡Objetivo alcanzado en este escenario! Superas la meta de "+money(s.goal)+"/mes.":"Te faltarían "+money(s.goal-r.monthly)+" netos al mes para alcanzar tu objetivo.";
 const tbody=$("yearlyTable");tbody.replaceChildren();r.rows.forEach(row=>{const tr=document.createElement("tr");for(const val of [row.year===0?"Inicial":"Año "+row.year,money(row.capital),money(row.monthly)]){const td=document.createElement("td");td.textContent=val;tr.appendChild(td);}tbody.appendChild(tr)});
 chart(r.rows);
}
function apply(values){for(const [id,v] of Object.entries(values)){if(id==="reinvest")$("reinvest").checked=v;else if($(id))$(id).value=v;}render();}
for(const id of ids)$(id).addEventListener("input",()=>{document.querySelectorAll(".preset").forEach(b=>b.classList.remove("active"));render()});
$("reinvest").addEventListener("change",render);
document.querySelectorAll(".preset").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll(".preset").forEach(b=>b.classList.toggle("active",b===btn));apply(presets[btn.dataset.preset]);}));
$("reset").addEventListener("click",()=>{apply(defaults);document.querySelectorAll(".preset").forEach(b=>b.classList.toggle("active",b.dataset.preset==="base"));});
$("simulatorForm").addEventListener("submit",e=>e.preventDefault());
render();
})();