import React, { useState, useRef, useEffect, useCallback } from "react";
import { getBrand, useBrandLogo, useOwnerLogo, drawBothLogos } from "./brands.js";
import { useImageCache, roundRect, drawFit } from "./canvasKit.js";
const vib = (ms = 40) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };

const W = 1080, H = 1080;

function uid() { return "b" + Date.now() + Math.random().toString(36).slice(2, 5); }
function lighten(hex, a) {
  try { const n = parseInt(hex.replace("#", ""), 16); return `rgb(${Math.min(255, (n >> 16) + a)},${Math.min(255, ((n >> 8) & 0xff) + a)},${Math.min(255, (n & 0xff) + a)})`; } catch { return hex; }
}

const BG_OPTIONS = [
  { id: "white_blue", label: "⬜ सफ़ेद-नीला (Mega March)", top: "#e8f4fd", main: "#fff", accent: "#1565c0" },
  { id: "white_red",  label: "⬜ सफ़ेद-लाल (Classic)",    top: "#fff5f5", main: "#fff", accent: "#E4002B" },
  { id: "dark_red",   label: "⚫ काला-लाल (Premium)",     top: "#1a0a00", main: "#141414", accent: "#E4002B" },
  { id: "gold_dark",  label: "🥇 गोल्ड-काला (Luxury)",    top: "#2a1800", main: "#1a0f00", accent: "#FFD600" },
  { id: "fest_gold",  label: "🪔 फेस्टिवल (पीला)",        top: "#FFD600", main: "#fff", accent: "#E4002B" },
  { id: "blue_dark",  label: "🔵 नीला-काला (Modern)",     top: "#0a1628", main: "#0d1f3c", accent: "#4fc3f7" },
];

const PRICE_BOX_STYLES = [
  { id: "red_white",  label: "🔴 लाल-सफ़ेद",  bg: "#E4002B", text: "#fff",    cash_bg: "#fff",    cash_text: "#E4002B" },
  { id: "white_red",  label: "⬜ सफ़ेद-लाल",   bg: "#fff",    text: "#141414", cash_bg: "#E4002B", cash_text: "#fff"    },
  { id: "gold_dark",  label: "🥇 गोल्ड-काला",  bg: "#FFD600", text: "#141414", cash_bg: "#141414", cash_text: "#FFD600" },
  { id: "blue_white", label: "🔵 नीला-सफ़ेद",  bg: "#1565c0", text: "#fff",    cash_bg: "#fff",    cash_text: "#1565c0" },
  { id: "dark_gold",  label: "⚫ काला-गोल्ड",  bg: "#141414", text: "#FFD600", cash_bg: "#FFD600", cash_text: "#141414" },
];

const HEADER_STYLES = [
  { id: "oval_white", label: "⬜ Oval (Mega March style)" },
  { id: "red_banner", label: "🔴 Red Banner" },
  { id: "gold_ribbon",label: "🥇 Gold Ribbon" },
  { id: "dark_slant", label: "⚫ Dark Slant" },
];

const ADDR_STYLES = [
  { id: "red_black",   bg1: "#E4002B", bg2: "#141414", label: "🔴 लाल+काला" },
  { id: "gold_dark",   bg1: "#8B6914", bg2: "#141414", label: "🥇 गोल्ड+काला" },
  { id: "blue_white",  bg1: "#1565c0", bg2: "#fff",    label: "🔵 नीला+सफ़ेद" },
  { id: "dark_red",    bg1: "#141414", bg2: "#E4002B", label: "⚫ काला+लाल" },
];

const DEFAULT_BIKES = [
  { id: uid(), name: "Shine 100", img: null, exPrice: "₹56,900/-*", cashback: "₹10,000*", cashLabel: "Instant Cashback", enabled: true },
  { id: uid(), name: "SP 160",    img: null, exPrice: "₹1,19,351/-*", cashback: "₹7,000*", cashLabel: "Instant Cashback", enabled: true },
  { id: uid(), name: "Activa 110",img: null, exPrice: "₹78,173/-*", cashback: "₹7,000*", cashLabel: "Instant Cashback", enabled: true },
  { id: uid(), name: "Activa 125",img: null, exPrice: "₹84,790/-*", cashback: "₹7,000*", cashLabel: "Instant Cashback", enabled: false },
];

const inp  = "w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-yellow-500 mt-1";
const selt = "w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white outline-none mt-1";

export default function MultibikeEditor({ apiBase, token, brandId, onSent }) {
  const cvRef = useRef(null);
  // ✅ तस्वीरों का cache — render का अंतहीन चक्कर यहीं रुकता है
  const imgCache = useImageCache();
  const cropRef = useRef(null);

  const [bg,           setBg]         = useState("white_blue");
  const [headerStyle,  setHeaderStyle] = useState("oval_white");
  const [priceBoxStyle,setPriceBoxStyle]=useState("red_white");
  const [addrSt,       setAddrSt]     = useState("red_black");

  // Header content
  const [headline1,  setHeadline1]  = useState("Mega March");
  const [headline2,  setHeadline2]  = useState("15 Days Offer");
  const [subline,    setSubline]    = useState("साल के सबसे सस्ते दिन");

  // Bottom strip
  const [bottomLeft,  setBottomLeft]  = useState("अधिक जानकारी के लिए मिस्ड कॉल करें 7230032200");
  const [bottomRight1,setBottomRight1]= useState("Scratch & Win* for Assured Gift");
  const [bottomRight2,setBottomRight2]= useState("Exchange Bonus worth ₹2000/-*");
  const [showBottom,  setShowBottom]  = useState(true);

  // Address
  const [showAddr,  setShowAddr]  = useState(true);
  // ⚠️ brand-aware (पहले हमेशा VP Honda छपता था)
  const B0 = getBrand(brandId);
  const [dealer,    setDealer]    = useState(B0.name);
  const [dealerSub, setDealerSub] = useState(B0.address);
  const [phone,     setPhone]     = useState(B0.phone);
  const [touched,   setTouched]   = useState(false);
  useEffect(() => {
    if (touched) return;
    const b = getBrand(brandId);
    setDealer(b.name); setDealerSub(b.address); setPhone(b.phone);
  }, [brandId, touched]);
  const [logoRef, logoTick] = useBrandLogo(apiBase, brandId);
  // बाएँ मालिक का logo, दाएँ brand/कंपनी का logo — तीनों brands पर
  const [ownerRef, ownerTick] = useOwnerLogo(apiBase);

  // Bikes
  const [bikes,   setBikes]   = useState(DEFAULT_BIKES);
  const [selBike, setSelBike] = useState(null);
  const [cropSrc, setCropSrc] = useState(null);
  const [cropFor, setCropFor] = useState(null);
  const [cropBox, setCropBox] = useState({ x: .05, y: .05, w: .9, h: .9 });

  const [caption, setCaption] = useState("🔥 VP Honda में Mega Offer! सीमित समय के लिए। #VPHonda #Bhopal");
  const [note,    setNote]    = useState("");
  const [busy,    setBusy]    = useState(false);

  const activeBikes = bikes.filter(b => b.enabled);

  // ── Render ────────────────────────────────────────────────────
  const render = useCallback(() => {
    const cv = cvRef.current; if (!cv) return;
    const ctx = cv.getContext("2d");
    ctx.clearRect(0, 0, W, H);
    const bgObj = BG_OPTIONS.find(b => b.id === bg) || BG_OPTIONS[0];
    const pbObj = PRICE_BOX_STYLES.find(p => p.id === priceBoxStyle) || PRICE_BOX_STYLES[0];
    const adObj = ADDR_STYLES.find(a => a.id === addrSt) || ADDR_STYLES[0];
    const isDark = bg === "dark_red" || bg === "gold_dark" || bg === "blue_dark";

    // Background
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, bgObj.top); g.addColorStop(.45, bgObj.main); g.addColorStop(1, bgObj.main);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // Decorative top border line
    ctx.fillStyle = bgObj.accent; ctx.fillRect(0, 0, W, 8);
    ctx.fillStyle = isDark ? "#333" : "#eee"; ctx.fillRect(0, 8, W, 4);

    // ── HEADER ──────────────────────────────────────────────────
    const hY = 20, hH = H * .28;
    if (headerStyle === "oval_white") {
      // White oval (Mega March style)
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.ellipse(W / 2, hY + hH * .48, W * .46, hH * .46, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = bgObj.accent; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(W / 2, hY + hH * .48, W * .46, hH * .46, 0, 0, Math.PI * 2); ctx.stroke();
      // Decorative slants
      ctx.fillStyle = bgObj.accent;
      ctx.save(); ctx.translate(W*.18, hY+hH*.25); ctx.rotate(-.15);
      ctx.fillRect(0, 0, W*.04, hH*.35); ctx.restore();
      ctx.save(); ctx.translate(W*.78, hY+hH*.25); ctx.rotate(.15);
      ctx.fillRect(0, 0, W*.04, hH*.35); ctx.restore();
      // Headline 1 (black bold)
      ctx.textAlign = "center"; ctx.fillStyle = isDark?"#fff":"#141414";
      ctx.font = `900 ${W*.065}px "Arial Black",Arial`;
      ctx.fillText(headline1, W/2, hY + hH*.32);
      // Headline 2 (red ribbon)
      const r2w = W*.68, r2h = hH*.28, r2x = (W-r2w)/2, r2y = hY + hH*.36;
      const rg = ctx.createLinearGradient(r2x, r2y, r2x+r2w, r2y+r2h);
      rg.addColorStop(0, "#C62828"); rg.addColorStop(1, "#8B0000");
      ctx.fillStyle = rg; ctx.beginPath(); roundRect(ctx, r2x, r2y, r2w, r2h, 8); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = `900 ${W*.068}px "Arial Black",Arial`;
      ctx.fillText(headline2, W/2, r2y + r2h*.72);
      // Subline
      ctx.fillStyle = isDark?"#aaa":"#555"; ctx.font = `600 ${W*.032}px Arial`;
      ctx.fillText(subline, W/2, hY + hH*.88);
    } else if (headerStyle === "red_banner") {
      const r2h = hH*.38, r2y = hY + hH*.08;
      ctx.fillStyle = "#C62828"; ctx.fillRect(0, r2y, W, r2h);
      ctx.fillStyle = "#fff"; ctx.font = `900 ${W*.075}px "Arial Black",Arial`; ctx.textAlign="center";
      ctx.fillText(headline1, W/2, r2y + r2h*.42);
      ctx.fillText(headline2, W/2, r2y + r2h*.85);
      ctx.fillStyle=isDark?"#FFD600":"#333"; ctx.font=`600 ${W*.032}px Arial`;
      ctx.fillText(subline, W/2, hY+hH*.82);
    } else if (headerStyle === "gold_ribbon") {
      const rw = W*.8, rh = hH*.55, rx = (W-rw)/2, ry = hY+hH*.1;
      const rg2 = ctx.createLinearGradient(rx,ry,rx+rw,ry+rh);
      rg2.addColorStop(0,"#FFD600"); rg2.addColorStop(1,"#8B6914");
      ctx.fillStyle=rg2; ctx.beginPath(); roundRect(ctx, rx,ry,rw,rh,14); ctx.fill();
      ctx.strokeStyle="#fff"; ctx.lineWidth=3; ctx.beginPath(); roundRect(ctx, rx+5,ry+5,rw-10,rh-10,10); ctx.stroke();
      ctx.fillStyle="#141414"; ctx.textAlign="center"; ctx.font=`900 ${W*.065}px "Arial Black",Arial`;
      ctx.fillText(headline1, W/2, ry+rh*.38);
      ctx.fillText(headline2, W/2, ry+rh*.78);
      ctx.fillStyle=isDark?"#fff":"#555"; ctx.font=`600 ${W*.032}px Arial`;
      ctx.fillText(subline, W/2, hY+hH*.88);
    } else {
      // dark_slant
      ctx.fillStyle="#141414"; ctx.beginPath();
      ctx.moveTo(0,hY); ctx.lineTo(W,hY); ctx.lineTo(W,hY+hH*.6); ctx.lineTo(0,hY+hH*.75); ctx.closePath(); ctx.fill();
      ctx.fillStyle="#FFD600"; ctx.textAlign="center"; ctx.font=`900 ${W*.07}px "Arial Black",Arial`;
      ctx.fillText(headline1, W/2, hY+hH*.32);
      ctx.fillStyle="#E4002B"; ctx.font=`900 ${W*.065}px "Arial Black",Arial`;
      ctx.fillText(headline2, W/2, hY+hH*.58);
      ctx.fillStyle="#aaa"; ctx.font=`500 ${W*.03}px Arial`;
      ctx.fillText(subline, W/2, hY+hH*.82);
    }

    // ── BIKES ───────────────────────────────────────────────────
    const n = activeBikes.length;
    const bkY = H*.29, bkH = H*.38;
    const bkW = n > 0 ? Math.floor((W-20) / n) : W;
    const priceH = H*.13, priceY = H*.67;
    const cashH = H*.09, cashY = H*.79;

    activeBikes.forEach((bk, i) => {
      const bx = 10 + i * bkW;
      const bw = bkW - 10;

      // Bike image
      if (bk.img) {
        // ✅ cache से — पहले हर render पर हर गाड़ी दोबारा decode होती थी
        const im = imgCache.get(bk.img);
        if (im) drawFit(ctx, im, bx, bkY, bw, bkH);
      } else {
        ctx.save(); ctx.globalAlpha = .08; ctx.fillStyle = bgObj.accent;
        ctx.fillRect(bx+5, bkY+10, bw-10, bkH-20); ctx.restore();
        ctx.textAlign="center"; ctx.fillStyle=isDark?"#FFD600":"#aaa";
        ctx.font=`${Math.min(40,bkW*.12)}px Arial`; ctx.fillText("🏍️",bx+bw/2,bkY+bkH*.45);
        ctx.font=`${Math.min(20,bkW*.07)}px Arial`; ctx.fillText(bk.name,bx+bw/2,bkY+bkH*.58);
      }

      // Bike name label (below image)
      ctx.textAlign="center"; ctx.fillStyle=isDark?"#FFD600":"#222";
      ctx.font=`700 ${Math.min(28,bkW*.09)}px "Arial Black",Arial`;
      ctx.fillText(bk.name, bx+bw/2, bkY+bkH+32);

      // Ex-Showroom label
      ctx.fillStyle=isDark?"#aaa":"#666"; ctx.font=`500 ${Math.min(20,bkW*.07)}px Arial`;
      ctx.fillText("Ex-Showroom", bx+bw/2, priceY-8);

      // Price box (3D)
      const pw=bw-14, ph=priceH;
      const px2=bx+7, py2=priceY;
      // Shadow
      ctx.fillStyle=isDark?"#000":"#ccc"; ctx.beginPath(); roundRect(ctx, px2+4,py2+5,pw,ph,8); ctx.fill();
      // Box
      const pgg=ctx.createLinearGradient(px2,py2,px2,py2+ph);
      pgg.addColorStop(0,lighten(pbObj.bg,20)); pgg.addColorStop(1,pbObj.bg);
      ctx.fillStyle=pgg; ctx.beginPath(); roundRect(ctx, px2,py2,pw,ph,8); ctx.fill();
      ctx.fillStyle="rgba(255,255,255,.18)"; ctx.beginPath(); roundRect(ctx, px2+3,py2+3,pw-6,ph*.45,[8,8,0,0]); ctx.fill();
      ctx.strokeStyle=pbObj.bg===pbObj.text?"#fff":lighten(pbObj.bg,50); ctx.lineWidth=2;
      ctx.beginPath(); roundRect(ctx, px2,py2,pw,ph,8); ctx.stroke();
      ctx.textAlign="center"; ctx.fillStyle=pbObj.text;
      ctx.font=`900 ${Math.min(34,pw*.13)}px "Arial Black",Arial`;
      ctx.fillText(bk.exPrice, px2+pw/2, py2+ph*.68);

      // Cashback box
      const cw=bw-14, ch=cashH;
      const cx2=bx+7, cy2=cashY;
      ctx.fillStyle=isDark?"#000":"#ccc"; ctx.beginPath(); roundRect(ctx, cx2+3,cy2+4,cw,ch,16); ctx.fill();
      const cgg=ctx.createLinearGradient(cx2,cy2,cx2,cy2+ch);
      cgg.addColorStop(0,lighten(pbObj.cash_bg,20)); cgg.addColorStop(1,pbObj.cash_bg);
      ctx.fillStyle=cgg; ctx.beginPath(); roundRect(ctx, cx2,cy2,cw,ch,16); ctx.fill();
      ctx.fillStyle="rgba(255,255,255,.2)"; ctx.beginPath(); roundRect(ctx, cx2+3,cy2+3,cw-6,ch*.45,[16,16,0,0]); ctx.fill();
      ctx.strokeStyle=lighten(pbObj.cash_bg,40); ctx.lineWidth=2;
      ctx.beginPath(); roundRect(ctx, cx2,cy2,cw,ch,16); ctx.stroke();
      ctx.textAlign="center"; ctx.fillStyle=pbObj.cash_text;
      ctx.font=`600 ${Math.min(20,cw*.08)}px Arial`; ctx.fillText(bk.cashLabel, cx2+cw/2, cy2+ch*.38);
      ctx.font=`900 ${Math.min(28,cw*.1)}px "Arial Black",Arial`; ctx.fillText(bk.cashback, cx2+cw/2, cy2+ch*.78);

      // Divider between bikes
      if(i < n-1) { ctx.strokeStyle=isDark?"#333":"#ddd"; ctx.lineWidth=2; ctx.setLineDash([6,4]);
        ctx.beginPath(); ctx.moveTo(bx+bkW-5,bkY); ctx.lineTo(bx+bkW-5,cashY+cashH+10); ctx.stroke(); ctx.setLineDash([]); }
    });

    // ── BOTTOM STRIP ─────────────────────────────────────────────
    if(showBottom){
      const btY=H*.895, btH=H*.06;
      ctx.fillStyle=bgObj.accent; ctx.fillRect(0,btY,W*.5,btH);
      ctx.fillStyle=isDark?"#222":"#f5f5f5"; ctx.fillRect(W*.5,btY,W*.5,btH);
      ctx.textAlign="left"; ctx.fillStyle="#fff";
      ctx.font=`500 ${H*.017}px Arial`; ctx.fillText(bottomLeft, 16, btY+btH*.62);
      ctx.fillStyle=bgObj.accent; ctx.textAlign="right";
      ctx.font=`600 ${H*.017}px Arial`; ctx.fillText(bottomRight1, W-14, btY+btH*.38);
      ctx.font=`600 ${H*.017}px Arial`; ctx.fillText(bottomRight2, W-14, btY+btH*.78);
    }

    // ── ADDRESS BAR ──────────────────────────────────────────────
    if(showAddr){
      const ay=H*.955, ah=H*.045;
      ctx.fillStyle=adObj.bg1; ctx.fillRect(0,ay,W*.6,ah);
      ctx.fillStyle=adObj.bg2; ctx.fillRect(W*.6,ay,W*.4,ah);
      ctx.textAlign="left"; ctx.fillStyle="#fff";
      ctx.font=`900 ${ah*.55}px "Arial Black",Arial`; ctx.fillText(dealer,20,ay+ah*.72);
      ctx.font=`${ah*.38}px Arial`; ctx.fillStyle="rgba(255,255,255,.85)"; ctx.fillText(dealerSub,20+ctx.measureText(dealer+" ").width*1.5,ay+ah*.72);
      ctx.fillStyle="#FFD600"; ctx.textAlign="right";
      ctx.font=`900 ${ah*.55}px "Arial Black",Arial`; ctx.fillText(phone,W-16,ay+ah*.72);
    }

    // ── LOGO (crossOrigin-safe) ──────────────────────────────────
    drawBothLogos(ctx, ownerRef, logoRef, brandId, W, 10, 90);

  }, [bg,headerStyle,priceBoxStyle,addrSt,headline1,headline2,subline,activeBikes,showBottom,bottomLeft,bottomRight1,bottomRight2,showAddr,dealer,dealerSub,phone,brandId,apiBase,logoTick, ownerTick, imgCache.tick]);

  useEffect(()=>{ render(); },[render]);

  // ── Crop ─────────────────────────────────────────────────────
  function onBikeFile(id,e){
    const f=e.target.files?.[0]; if(!f) return;
    const r=new FileReader(); r.onload=()=>{setCropSrc(r.result);setCropFor(id);setCropBox({x:.05,y:.05,w:.9,h:.9});}; r.readAsDataURL(f); e.target.value="";
  }
  function confirmCrop(){
    const t=new Image(); t.onload=()=>{
      const iw=t.naturalWidth,ih=t.naturalHeight;
      const cx=Math.round(cropBox.x*iw),cy=Math.round(cropBox.y*ih),cw=Math.max(1,Math.round(cropBox.w*iw)),ch=Math.max(1,Math.round(cropBox.h*ih));
      const c=document.createElement("canvas"); c.width=cw; c.height=ch;
      c.getContext("2d").drawImage(t,cx,cy,cw,ch,0,0,cw,ch);
      const data=c.toDataURL("image/png");
      setBikes(prev=>prev.map(b=>b.id===cropFor?{...b,img:data}:b));
      setCropSrc(null); setCropFor(null);
    }; t.src=cropSrc;
  }

  function updBike(id,ch){ setBikes(prev=>prev.map(b=>b.id===id?{...b,...ch}:b)); }
  function addBike(){ if(bikes.length>=4) return; setBikes(prev=>[...prev,{id:uid(),name:"नई Bike",img:null,exPrice:"₹00,000/-*",cashback:"₹5,000*",cashLabel:"Instant Cashback",enabled:true}]); }

  function dlPNG(){ vib(30); cvRef.current.toBlob(b=>{const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download="multibike.jpg";a.click();URL.revokeObjectURL(u);},"image/jpeg",.9); }

  async function submit(){
    vib(60); setBusy(true); setNote("भेज रहे हैं…");
    try{
      const b64=cvRef.current.toDataURL("image/jpeg",.88);
      const res=await fetch(apiBase+"/api/mega-offer/submit",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},body:JSON.stringify({brand:brandId,text:caption,imageData:b64,type:"vigyapan"})});
      if(!res.ok) throw new Error((await res.json()).error||"Error");
      setNote("✅ Review में भेज दिया!"); vib([30,30,60]); setTimeout(()=>{setNote("");if(onSent)onSent();},3000);
    }catch(e){setNote("❌ "+e.message);} setBusy(false);
  }

  return (
    <div className="space-y-3 pb-10">

      {/* Crop */}
      {cropSrc&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-4 w-full max-w-sm space-y-3">
            <p className="text-sm font-bold text-white text-center">📐 Bike Crop</p>
            <div className="relative rounded-xl overflow-hidden border border-neutral-700" style={{aspectRatio:"1/1"}}>
              <img ref={cropRef} src={cropSrc} style={{width:"100%",height:"100%",objectFit:"contain"}}/>
              <div style={{position:"absolute",left:`${cropBox.x*100}%`,top:`${cropBox.y*100}%`,width:`${cropBox.w*100}%`,height:`${cropBox.h*100}%`,border:"2px solid #FFD600",boxShadow:"0 0 0 2000px rgba(0,0,0,.6)",pointerEvents:"none"}}/>
            </div>
            {[["Left","x"],["Top","y"],["W","w"],["H","h"]].map(([l,k])=>(
              <label key={k} className="text-xs text-neutral-300 block">{l}: {Math.round(cropBox[k]*100)}%
                <input type="range" min=".02" max=".98" step=".01" value={cropBox[k]} className="w-full accent-yellow-400" onChange={e=>setCropBox(b=>({...b,[k]:parseFloat(e.target.value)}))}/>
              </label>
            ))}
            <div className="flex gap-2">
              <button type="button" onClick={()=>{setCropSrc(null);setCropFor(null);}} className="flex-1 py-2.5 rounded-xl border border-neutral-600 text-sm text-neutral-300">रद्द</button>
              <button type="button" onClick={()=>{vib(30);confirmCrop();}} className="flex-1 py-2.5 rounded-xl font-bold text-black text-sm" style={{background:"#FFD600"}}>✅ Crop</button>
            </div>
            <button type="button" onClick={()=>{setBikes(prev=>prev.map(b=>b.id===cropFor?{...b,img:cropSrc}:b));setCropSrc(null);}} className="w-full py-2 rounded-xl border border-neutral-700 text-xs text-neutral-400">बिना crop के</button>
          </div>
        </div>
      )}

      {/* ── STICKY PREVIEW ── */}
      <div className="sticky top-0 z-30 bg-neutral-950 pb-2 pt-1">
        <div className="rounded-2xl overflow-hidden border border-neutral-700">
          <canvas ref={cvRef} width={W} height={H} className="w-full"/>
        </div>
        <div className="grid grid-cols-3 gap-1.5 mt-1.5">
          <button type="button" onClick={dlPNG} className="py-2.5 rounded-xl border border-neutral-700 text-xs text-neutral-300">⬇ PNG</button>
          <span className="py-2.5 text-center text-xs text-neutral-500">{activeBikes.length} Bikes Active</span>
          <button type="button" onClick={submit} disabled={busy} className="py-2.5 rounded-xl text-xs font-bold text-black" style={{background:"#FFD600"}}>{busy?"भेज रहे हैं…":"📤 Review"}</button>
        </div>
        {note&&<div className={`mt-1 rounded-xl px-3 py-2 text-xs font-semibold ${note.startsWith("✅")?"bg-emerald-900/60 text-emerald-300":"bg-red-900/60 text-red-300"}`}>{note}</div>}
      </div>

      {/* ── HEADER ── */}
      <details className="bg-neutral-900 rounded-2xl border border-neutral-800" open>
        <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer list-none flex justify-between">✍️ Header <span className="text-neutral-500">▼</span></summary>
        <div className="px-4 pb-4 space-y-2">
          <select value={headerStyle} onChange={e=>setHeaderStyle(e.target.value)} className={selt}>
            {HEADER_STYLES.map(h=><option key={h.id} value={h.id}>{h.label}</option>)}
          </select>
          <input value={headline1} onChange={e=>setHeadline1(e.target.value)} className={inp} placeholder="Mega March"/>
          <input value={headline2} onChange={e=>setHeadline2(e.target.value)} className={inp} placeholder="15 Days Offer"/>
          <input value={subline}   onChange={e=>setSubline(e.target.value)}   className={inp} placeholder="साल के सबसे सस्ते दिन"/>
        </div>
      </details>

      {/* ── DESIGN ── */}
      <details className="bg-neutral-900 rounded-2xl border border-neutral-800">
        <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer list-none flex justify-between">🎨 Design <span className="text-neutral-500">▼</span></summary>
        <div className="px-4 pb-4 space-y-2">
          <p className="text-xs text-neutral-400">Background</p>
          <select value={bg} onChange={e=>setBg(e.target.value)} className={selt}>{BG_OPTIONS.map(b=><option key={b.id} value={b.id}>{b.label}</option>)}</select>
          <p className="text-xs text-neutral-400">Price Box Style</p>
          <select value={priceBoxStyle} onChange={e=>setPriceBoxStyle(e.target.value)} className={selt}>{PRICE_BOX_STYLES.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select>
        </div>
      </details>

      {/* ── BIKES ── */}
      <details className="bg-neutral-900 rounded-2xl border border-neutral-800" open>
        <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer list-none flex justify-between">🏍️ Bikes ({activeBikes.length}/{bikes.length}) <span className="text-neutral-500">▼</span></summary>
        <div className="px-4 pb-4 space-y-3">
          {bikes.map((bk,i)=>(
            <div key={bk.id} className={`border rounded-2xl p-3 space-y-2 ${bk.id===selBike?"border-yellow-500":"border-neutral-700"}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-300">Bike {i+1}</span>
                <div className="flex gap-2">
                  <button type="button" onClick={()=>updBike(bk.id,{enabled:!bk.enabled})}
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${bk.enabled?"bg-emerald-700 text-white":"bg-neutral-700 text-neutral-400"}`}>
                    {bk.enabled?"ON":"OFF"}
                  </button>
                  {bikes.length>1&&<button type="button" onClick={()=>{setBikes(prev=>prev.filter(b=>b.id!==bk.id));}} className="text-red-400 text-xs">✕</button>}
                </div>
              </div>
              {bk.enabled&&<>
                <input value={bk.name} onChange={e=>updBike(bk.id,{name:e.target.value})} className={inp} placeholder="Bike Name (Shine 100)"/>
                <div className="grid grid-cols-2 gap-2">
                  <input value={bk.exPrice} onChange={e=>updBike(bk.id,{exPrice:e.target.value})} className={inp} placeholder="₹56,900/-*"/>
                  <input value={bk.cashback} onChange={e=>updBike(bk.id,{cashback:e.target.value})} className={inp} placeholder="₹10,000*"/>
                </div>
                <input value={bk.cashLabel} onChange={e=>updBike(bk.id,{cashLabel:e.target.value})} className={inp} placeholder="Instant Cashback"/>
                {bk.img
                  ? <div className="relative">
                      <img src={bk.img} alt="" className="w-full h-24 object-contain rounded-xl border border-neutral-700 bg-neutral-800"/>
                      <button type="button" onClick={()=>updBike(bk.id,{img:null})} className="absolute top-1 right-1 bg-red-700 text-white text-xs px-2 py-0.5 rounded-full">✕</button>
                    </div>
                  : <label className="block border-2 border-dashed border-neutral-600 rounded-xl p-3 text-center cursor-pointer hover:border-yellow-400">
                      <span className="text-xs text-neutral-400">📸 Bike Photo Upload करें</span>
                      <input type="file" accept="image/*" className="hidden" onChange={e=>onBikeFile(bk.id,e)}/>
                    </label>}
              </>}
            </div>
          ))}
          {bikes.length<4&&<button type="button" onClick={addBike} className="w-full py-2.5 rounded-xl border border-dashed border-neutral-600 text-xs text-neutral-400 hover:border-yellow-400">➕ Bike जोड़ें (max 4)</button>}
        </div>
      </details>

      {/* ── BOTTOM STRIP ── */}
      <details className="bg-neutral-900 rounded-2xl border border-neutral-800">
        <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer list-none flex justify-between">📢 Bottom Strip <span className="text-neutral-500">▼</span></summary>
        <div className="px-4 pb-4 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-neutral-400">Show</span>
            <button type="button" onClick={()=>setShowBottom(!showBottom)} className={`px-3 py-1 rounded-full text-xs font-bold ${showBottom?"bg-emerald-700 text-white":"bg-neutral-700 text-neutral-400"}`}>{showBottom?"ON":"OFF"}</button>
          </div>
          {showBottom&&<>
            <input value={bottomLeft} onChange={e=>setBottomLeft(e.target.value)} className={inp} placeholder="Left text / missed call"/>
            <input value={bottomRight1} onChange={e=>setBottomRight1(e.target.value)} className={inp} placeholder="Right line 1"/>
            <input value={bottomRight2} onChange={e=>setBottomRight2(e.target.value)} className={inp} placeholder="Right line 2"/>
          </>}
        </div>
      </details>

      {/* ── ADDRESS BAR ── */}
      <details className="bg-neutral-900 rounded-2xl border border-neutral-800">
        <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer list-none flex justify-between">🏬 Address Bar <span className="text-neutral-500">▼</span></summary>
        <div className="px-4 pb-4 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-neutral-400">Show</span>
            <button type="button" onClick={()=>setShowAddr(!showAddr)} className={`px-3 py-1 rounded-full text-xs font-bold ${showAddr?"bg-emerald-700 text-white":"bg-neutral-700 text-neutral-400"}`}>{showAddr?"ON":"OFF"}</button>
          </div>
          {showAddr&&<>
            <select value={addrSt} onChange={e=>setAddrSt(e.target.value)} className={selt}>{ADDR_STYLES.map(a=><option key={a.id} value={a.id}>{a.label}</option>)}</select>
            <input value={dealer} onChange={e=>{setTouched(true); setDealer(e.target.value);}} className={inp} placeholder={B0.name}/>
            <input value={dealerSub} onChange={e=>setDealerSub(e.target.value)} className={inp} placeholder="पता..."/>
            <input value={phone} onChange={e=>setPhone(e.target.value)} className={inp} placeholder="फ़ोन"/>
          </>}
        </div>
      </details>

      {/* ── CAPTION ── */}
      <details className="bg-neutral-900 rounded-2xl border border-neutral-800">
        <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer list-none flex justify-between">✍️ Caption <span className="text-neutral-500">▼</span></summary>
        <div className="px-4 pb-4"><textarea value={caption} onChange={e=>setCaption(e.target.value)} rows={3} className={inp+" resize-none"}/></div>
      </details>

      <button type="button" onClick={submit} disabled={busy} className="w-full rounded-2xl py-4 font-bold text-black text-base disabled:opacity-50" style={{background:"#FFD600"}}>
        {busy?"भेज रहे हैं…":"📤 Review में भेजें"}
      </button>
    </div>
  );
}
