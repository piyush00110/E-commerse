(()=>{var e={};e.id=649,e.ids=[649],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},8521:(e,t,i)=>{"use strict";i.r(t),i.d(t,{GlobalError:()=>o.a,__next_app__:()=>g,originalPathname:()=>c,pages:()=>p,routeModule:()=>x,tree:()=>d}),i(790),i(2207),i(5866),i(93);var r=i(3191),n=i(8716),a=i(7922),o=i.n(a),s=i(5231),l={};for(let e in s)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>s[e]);i.d(t,l);let d=["",{children:["(seller)",{children:["seller",{children:["orders",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(i.bind(i,790)),"D:\\E commerse\\frontend\\src\\app\\(seller)\\seller\\orders\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(i.bind(i,2207)),"D:\\E commerse\\frontend\\src\\app\\(seller)\\layout.tsx"],"not-found":[()=>Promise.resolve().then(i.t.bind(i,5866,23)),"next/dist/client/components/not-found-error"]}]},{layout:[()=>Promise.resolve().then(i.bind(i,93)),"D:\\E commerse\\frontend\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(i.t.bind(i,5866,23)),"next/dist/client/components/not-found-error"]}],p=["D:\\E commerse\\frontend\\src\\app\\(seller)\\seller\\orders\\page.tsx"],c="/(seller)/seller/orders/page",g={require:i,loadChunk:()=>Promise.resolve()},x=new r.AppPageRouteModule({definition:{kind:n.x.APP_PAGE,page:"/(seller)/seller/orders/page",pathname:"/seller/orders",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},240:(e,t,i)=>{Promise.resolve().then(i.bind(i,8729))},9558:(e,t,i)=>{Promise.resolve().then(i.bind(i,2971))},8729:(e,t,i)=>{"use strict";i.r(t),i.d(t,{default:()=>l});var r=i(326),n=i(7577),a=i(5823);let o=[{to:"/seller",label:"Dashboard",icon:"\uD83D\uDCCA"},{to:"/seller/products",label:"Products",icon:"\uD83D\uDCE6"},{to:"/seller/orders",label:"Orders",icon:"\uD83D\uDCE8"}],s=()=>{let[e,t]=(0,n.useState)(null),[i,s]=(0,n.useState)(!1),l=(0,a.TH)(),d=(0,a.s0)(),p=(0,n.useRef)(null);(0,n.useEffect)(()=>{try{let e=localStorage.getItem("user");e&&t(JSON.parse(e))}catch{}},[]),(0,n.useEffect)(()=>{let e=e=>{p.current&&!p.current.contains(e.target)&&s(!1)};return document.addEventListener("mousedown",e),()=>document.removeEventListener("mousedown",e)},[]);let c=e=>"/seller"===e?"/seller"===l.pathname:l.pathname.startsWith(e);return r.jsx("nav",{style:{background:"var(--tertiary)",color:"var(--text-white)",position:"sticky",top:0,zIndex:1e3,boxShadow:"0 2px 12px rgba(0,0,0,0.15)"},children:(0,r.jsxs)("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",maxWidth:1440,margin:"0 auto",padding:"0 24px",height:56},children:[(0,r.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:32},children:[(0,r.jsxs)(a.rU,{to:"/",style:{fontSize:20,fontWeight:700,color:"var(--secondary)",whiteSpace:"nowrap",textDecoration:"none",display:"flex",alignItems:"baseline",gap:6},children:["Shop",r.jsx("span",{style:{color:"var(--text-light)",fontWeight:300},children:"Smart"}),r.jsx("span",{style:{fontSize:9,color:"var(--tertiary)",fontWeight:800,background:"rgba(255,255,255,0.15)",padding:"2px 6px",borderRadius:4,letterSpacing:1,textTransform:"uppercase"},children:"SELLER"})]}),r.jsx("div",{style:{display:"flex",gap:4},children:o.map(e=>(0,r.jsxs)(a.rU,{to:e.to,style:{color:c(e.to)?"var(--secondary)":"var(--text-light)",fontSize:13,fontWeight:c(e.to)?700:500,textDecoration:"none",padding:"8px 14px",borderRadius:8,background:c(e.to)?"rgba(255,255,255,0.12)":"transparent",transition:"all 0.2s",display:"flex",alignItems:"center",gap:6},children:[r.jsx("span",{style:{fontSize:14},children:e.icon}),e.label]},e.to))}),(0,r.jsxs)(a.rU,{to:"/manage",style:{color:c("/manage")?"var(--secondary)":"var(--text-light)",fontSize:13,fontWeight:c("/manage")?700:500,textDecoration:"none",padding:"8px 14px",borderRadius:8,background:c("/manage")?"rgba(255,255,255,0.12)":"transparent",transition:"all 0.2s",display:"flex",alignItems:"center",gap:6},children:[r.jsx("span",{style:{fontSize:14},children:"⚙"}),"Manage"]})]}),(0,r.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:12},children:[(0,r.jsxs)("button",{onClick:()=>d("/"),style:{padding:"6px 14px",background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",color:"var(--text-light)",whiteSpace:"nowrap",transition:"all 0.2s"},onMouseEnter:e=>e.currentTarget.style.background="rgba(255,255,255,0.18)",onMouseLeave:e=>e.currentTarget.style.background="rgba(255,255,255,0.1)",children:["\uD83D\uDC64"," Buyer Mode"]}),(0,r.jsxs)("div",{ref:p,style:{position:"relative"},children:[(0,r.jsxs)("button",{onClick:()=>s(!i),style:{display:"flex",alignItems:"center",gap:8,padding:"6px 12px",background:i?"rgba(255,255,255,0.15)":"transparent",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,cursor:"pointer",transition:"all 0.2s",color:"var(--text-light)"},onMouseEnter:e=>e.currentTarget.style.background="rgba(255,255,255,0.12)",onMouseLeave:e=>{i||(e.currentTarget.style.background="transparent")},children:[r.jsx("div",{style:{width:28,height:28,borderRadius:"50%",background:"var(--secondary)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"var(--primary)"},children:(e?.name||"S")[0].toUpperCase()}),r.jsx("span",{style:{fontSize:13,fontWeight:500,maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},children:e?.name||"Seller"}),r.jsx("span",{style:{fontSize:10,transition:"transform 0.2s",transform:i?"rotate(180deg)":""},children:"▼"})]}),i&&(0,r.jsxs)("div",{style:{position:"absolute",top:"100%",right:0,marginTop:8,width:200,background:"var(--bg-card)",border:"1px solid var(--border-light)",borderRadius:10,boxShadow:"0 8px 32px rgba(0,0,0,0.12)",padding:6,animation:"fadeSlideUp 0.15s ease",zIndex:1001},children:[(0,r.jsxs)("div",{style:{padding:"10px 12px",borderBottom:"1px solid var(--border-light)",marginBottom:4},children:[r.jsx("div",{style:{fontSize:13,fontWeight:700,color:"var(--text)"},children:e?.name||"Seller"}),r.jsx("div",{style:{fontSize:11,color:"var(--text-secondary)",marginTop:2},children:e?.email||""})]}),(0,r.jsxs)(a.rU,{to:"/manage",onClick:()=>s(!1),style:{display:"block",padding:"8px 12px",fontSize:13,fontWeight:500,color:"var(--text)",textDecoration:"none",borderRadius:6,transition:"background 0.15s"},children:["⚙"," Settings"]}),(0,r.jsxs)("button",{onClick:()=>{localStorage.removeItem("user"),t(null),s(!1),d("/login")},style:{display:"block",width:"100%",padding:"8px 12px",fontSize:13,fontWeight:600,color:"var(--error)",background:"none",border:"none",textAlign:"left",cursor:"pointer",borderRadius:6,transition:"background 0.15s"},onMouseEnter:e=>e.currentTarget.style.background="var(--error-light)",onMouseLeave:e=>e.currentTarget.style.background="transparent",children:["\uD83D\uDEAA"," Logout"]})]})]})]})]})})};function l({children:e}){return(0,r.jsxs)(r.Fragment,{children:[r.jsx(s,{}),r.jsx("main",{children:e})]})}},2971:(e,t,i)=>{"use strict";i.r(t),i.d(t,{default:()=>s});var r=i(326),n=i(7577),a=i(6856);let o=()=>{let[e,t]=(0,n.useState)([]),[i,o]=(0,n.useState)(!0),[s,l]=(0,n.useState)("all"),[d,p]=(0,n.useState)(!1),[c,g]=(0,n.useState)(null),[x,h]=(0,n.useState)({companyName:"ShopSmart Seller",companyAddress:"",companyPhone:"",companyEmail:"",notes:"",includeTaxDetails:!0,includeShippingDetails:!0,paperSize:"a4"});(0,n.useEffect)(()=>{(async()=>{try{let e=await a.X3.getAll();t(e.data.data)}catch(e){console.error("Failed to load orders",e)}finally{o(!1)}})()},[]);let v=async(i,r)=>{try{await a.X3.updateStatus(i,{status:r,isDelivered:"delivered"===r}),t(e.map(e=>e._id===i?{...e,status:r,isDelivered:"delivered"===r,deliveredAt:"delivered"===r?new Date().toISOString():e.deliveredAt}:e))}catch(e){console.error("Failed to update order",e)}},m=e.filter(e=>"all"===s||("pending"===s?!e.isPaid&&"pending"===e.status:"paid"===s?e.isPaid&&!e.isDelivered:"delivered"!==s||e.isDelivered)),u=e=>{g(e||null),p(!0)},f=(e,t)=>{if(0===e.length)return"";let i=e.reduce((e,t)=>e+t.items.reduce((e,t)=>e+t.price*t.quantity,0),0),r=e.reduce((e,t)=>e+(t.taxPrice||0),0);e.reduce((e,t)=>e+(t.shippingPrice||0),0);let n=e.reduce((e,t)=>e+t.totalPrice,0),a=e=>{let t={pending:{bg:"#FFF8E1",fg:"#F57F17"},processing:{bg:"#E3F2FD",fg:"#1565C0"},shipped:{bg:"#E8F5E9",fg:"#2E7D32"},delivered:{bg:"#E0F2F1",fg:"#00695C"},cancelled:{bg:"#FFEBEE",fg:"#C62828"}};return t[e]||t.pending},o=e=>({credit_card:"Credit / Debit Card",paypal:"PayPal",upi:"UPI",cod:"Cash on Delivery"})[e]||e;return`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Invoice - ${x.companyName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
      font-size: 13px; color: #1a1a2e; background: #fff;
      padding: 0; line-height: 1.5;
    }

    .invoice-wrapper { max-width: 800px; margin: 0 auto; padding: 40px; }

    /* === HEADER === */
    .inv-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding-bottom: 24px; margin-bottom: 28px;
      border-bottom: 3px solid #1a1a2e;
    }
    .inv-brand h1 {
      font-size: 28px; font-weight: 800; color: #1a1a2e;
      letter-spacing: -0.5px; margin-bottom: 6px;
    }
    .inv-brand-tag {
      display: inline-block; background: #ff9900; color: #fff;
      font-size: 9px; font-weight: 700; letter-spacing: 1.5px;
      text-transform: uppercase; padding: 3px 10px; border-radius: 3px;
      margin-bottom: 10px;
    }
    .inv-brand p { font-size: 11px; color: #666; line-height: 1.7; }
    .inv-doc { text-align: right; }
    .inv-doc-badge {
      display: inline-block; background: #1a1a2e; color: #fff;
      font-size: 11px; font-weight: 700; letter-spacing: 2px;
      text-transform: uppercase; padding: 6px 16px; border-radius: 4px;
      margin-bottom: 10px;
    }
    .inv-doc-date { font-size: 12px; color: #666; margin-bottom: 4px; }
    .inv-doc-id { font-size: 14px; font-weight: 700; color: #1a1a2e; font-family: 'Courier New', monospace; }

    /* === ORDER META GRID === */
    .inv-meta {
      display: grid; grid-template-columns: 1fr 1fr 1fr 1fr;
      gap: 0; margin-bottom: 28px;
      border: 1px solid var(--border); border-radius: 8px; overflow: hidden;
    }
    .inv-meta-cell {
      padding: 14px 16px; border-right: 1px solid #e0e0e0;
    }
    .inv-meta-cell:last-child { border-right: none; }
    .inv-meta-label { font-size: 10px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
    .inv-meta-value { font-size: 13px; font-weight: 600; color: #1a1a2e; }
    .inv-meta-value.mono { font-family: 'Courier New', monospace; font-size: 12px; }

    /* === CUSTOMER + SHIPPING GRID === */
    .inv-info-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 20px; margin-bottom: 28px;
    }
    .inv-info-card {
      background: var(--surface-container-low); border: 1px solid var(--border-light);
      border-radius: 8px; padding: 18px 20px;
    }
    .inv-info-card h3 {
      font-size: 10px; font-weight: 700; color: #999;
      text-transform: uppercase; letter-spacing: 1.2px;
      margin-bottom: 12px; padding-bottom: 8px;
      border-bottom: 1px solid #e0e3ea;
    }
    .inv-info-card p { font-size: 12px; color: #444; line-height: 1.8; }
    .inv-info-card .name { font-weight: 700; color: #1a1a2e; font-size: 13px; }
    .inv-info-card .email { color: #1565C0; font-size: 11px; }

    /* === ITEMS TABLE === */
    .inv-items-section { margin-bottom: 28px; }
    .inv-items-title {
      font-size: 10px; font-weight: 700; color: #999;
      text-transform: uppercase; letter-spacing: 1.2px;
      margin-bottom: 12px;
    }
    .inv-table {
      width: 100%; border-collapse: collapse;
      border: 1px solid var(--border); border-radius: 8px; overflow: hidden;
    }
    .inv-table thead th {
      background: #1a1a2e; color: #fff;
      padding: 12px 16px; font-size: 11px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.5px;
      text-align: left;
    }
    .inv-table thead th:nth-child(1) { width: 5%; text-align: center; }
    .inv-table thead th:nth-child(2) { width: 45%; }
    .inv-table thead th:nth-child(3) { width: 10%; text-align: center; }
    .inv-table thead th:nth-child(4) { width: 20%; text-align: right; }
    .inv-table thead th:nth-child(5) { width: 20%; text-align: right; }
    .inv-table tbody td {
      padding: 12px 16px; font-size: 12px; color: #333;
      border-bottom: 1px solid #f0f0f0;
    }
    .inv-table tbody tr:nth-child(even) { background: #fafbfd; }
    .inv-table tbody tr:hover { background: #f0f4ff; }
    .inv-table .num { text-align: center; font-weight: 600; color: #666; }
    .inv-table .right { text-align: right; font-family: 'Courier New', monospace; font-weight: 600; }
    .inv-table .item-name { font-weight: 600; color: #1a1a2e; }
    .inv-table .item-idx {
      display: inline-flex; align-items: center; justify-content: center;
      width: 22px; height: 22px; border-radius: 50%;
      background: #f0f4ff; color: #1565C0;
      font-size: 10px; font-weight: 700;
    }
    .inv-table tfoot td {
      padding: 10px 16px; font-size: 12px;
      border-bottom: none;
    }

    /* === TOTALS === */
    .inv-bottom {
      display: flex; justify-content: space-between; align-items: flex-start;
      gap: 30px;
    }
    .inv-notes {
      flex: 1; background: #f8f9fc; border: 1px solid #e8eaf0;
      border-radius: 8px; padding: 16px 20px;
    }
    .inv-notes h4 {
      font-size: 10px; font-weight: 700; color: #999;
      text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 8px;
    }
    .inv-notes p { font-size: 11px; color: #666; line-height: 1.6; }

    .inv-totals { min-width: 280px; }
    .inv-totals-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 0; font-size: 12px; color: #555;
    }
    .inv-totals-row .label { font-weight: 500; }
    .inv-totals-row .value { font-family: 'Courier New', monospace; font-weight: 600; }
    .inv-totals-row.free .value { color: #2E7D32; font-weight: 700; }
    .inv-totals-divider { border-top: 2px solid #1a1a2e; margin: 4px 0; }
    .inv-totals-total {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 0 0; font-size: 18px; font-weight: 800; color: #1a1a2e;
    }
    .inv-totals-total .value { font-family: 'Courier New', monospace; color: #ff9900; }

    /* === PAYMENT BADGE === */
    .inv-payment-badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 5px 12px; border-radius: 6px;
      font-size: 11px; font-weight: 600;
      border: 1px solid #e0e0e0;
    }

    /* === FOOTER === */
    .inv-footer {
      margin-top: 36px; padding-top: 20px;
      border-top: 2px solid #e8eaf0;
      display: flex; justify-content: space-between; align-items: flex-end;
    }
    .inv-footer-left { font-size: 10px; color: #aaa; line-height: 1.8; }
    .inv-footer-right { text-align: right; }
    .inv-footer-thank {
      font-size: 14px; font-weight: 700; color: #1a1a2e;
      margin-bottom: 2px;
    }
    .inv-footer-tagline { font-size: 10px; color: #999; }

    ${"print"===t?"@media print { body { padding: 16px !important; } .no-print { display: none !important; } }":""}
  </style>
</head>
<body>
  <div class="invoice-wrapper">

    <!-- HEADER -->
    <div class="inv-header">
      <div class="inv-brand">
        <div class="inv-brand-tag">ShopSmart</div>
        <h1>${x.companyName}</h1>
        ${x.companyAddress?`<p>${x.companyAddress}</p>`:""}
        ${x.companyPhone||x.companyEmail?`<p>${x.companyPhone?`Tel: ${x.companyPhone}`:""}${x.companyPhone&&x.companyEmail?" &middot; ":""}${x.companyEmail?`Email: ${x.companyEmail}`:""}</p>`:""}
      </div>
      <div class="inv-doc">
        <div class="inv-doc-badge">Invoice</div>
        <div class="inv-doc-date">${new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
        ${c?`<div class="inv-doc-id">#${c.slice(-8).toUpperCase()}</div>`:`<div class="inv-doc-id">${e.length} Order${e.length>1?"s":""}</div>`}
      </div>
    </div>

    ${e.map((e,t)=>{let i=e.items.reduce((e,t)=>e+t.price*t.quantity,0),r=a(e.status||"pending");return`
    <div style="page-break-inside: avoid; ${t>0?"margin-top: 36px; padding-top: 24px; border-top: 2px dashed #e0e0e0;":""}">

      ${c?"":`<div style="font-size: 11px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 16px;">Order #${e._id?.slice(-8).toUpperCase()??"N/A"} &middot; ${new Date(e.createdAt).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"})}</div>`}

      <!-- META -->
      <div class="inv-meta">
        <div class="inv-meta-cell">
          <div class="inv-meta-label">Order ID</div>
          <div class="inv-meta-value mono">#${e._id?.slice(-8).toUpperCase()??"N/A"}</div>
        </div>
        <div class="inv-meta-cell">
          <div class="inv-meta-label">Date Placed</div>
          <div class="inv-meta-value">${new Date(e.createdAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
        </div>
        <div class="inv-meta-cell">
          <div class="inv-meta-label">Status</div>
          <div class="inv-meta-value">
            <span class="inv-payment-badge" style="background: ${r.bg}; color: ${r.fg}; border-color: ${r.fg}22;">
              ${(e.status||"pending").toUpperCase()}
            </span>
          </div>
        </div>
        <div class="inv-meta-cell">
          <div class="inv-meta-label">Payment</div>
          <div class="inv-meta-value" style="font-size: 11px;">${o(e.paymentMethod||"N/A")}</div>
        </div>
      </div>

      <!-- CUSTOMER + SHIPPING -->
      <div class="inv-info-grid">
        <div class="inv-info-card">
          <h3>Customer</h3>
          <p class="name">${e.user?.name||"N/A"}</p>
          ${e.user?.email?`<p class="email">${e.user.email}</p>`:""}
        </div>
        <div class="inv-info-card">
          <h3>Shipping Address</h3>
          <p>${e.shippingAddress?.street||"N/A"}</p>
          <p>${e.shippingAddress?.city||""}${e.shippingAddress?.city&&e.shippingAddress?.state?", ":""}${e.shippingAddress?.state||""} ${e.shippingAddress?.zip||""}</p>
          ${e.shippingAddress?.phone?`<p style="margin-top: 4px;">Tel: ${e.shippingAddress.phone}</p>`:""}
        </div>
      </div>

      <!-- ITEMS -->
      <div class="inv-items-section">
        <div class="inv-items-title">Items Ordered (${e.items.length})</div>
        <table class="inv-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Product</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${e.items.map((e,t)=>`
            <tr>
              <td class="num"><span class="item-idx">${t+1}</span></td>
              <td class="item-name">${e.name}</td>
              <td class="num">${e.quantity}</td>
              <td class="right">$${e.price.toFixed(2)}</td>
              <td class="right" style="font-weight: 700;">$${(e.price*e.quantity).toFixed(2)}</td>
            </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <!-- BOTTOM: NOTES + TOTALS -->
      <div class="inv-bottom">
        <div class="inv-notes">
          <h4>Notes</h4>
          <p>${x.notes||"Thank you for shopping with ShopSmart. This invoice serves as your official order receipt."}</p>
        </div>
        <div class="inv-totals">
          <div class="inv-totals-row">
            <span class="label">Subtotal</span>
            <span class="value">$${i.toFixed(2)}</span>
          </div>
          ${x.includeShippingDetails?`
          <div class="inv-totals-row ${0===e.shippingPrice?"free":""}">
            <span class="label">Shipping</span>
            <span class="value">${0===e.shippingPrice?"FREE":"$"+(e.shippingPrice||0).toFixed(2)}</span>
          </div>
          `:""}
          ${x.includeTaxDetails?`
          <div class="inv-totals-row">
            <span class="label">Tax (8%)</span>
            <span class="value">$${(e.taxPrice||0).toFixed(2)}</span>
          </div>
          `:""}
          <div class="inv-totals-divider"></div>
          <div class="inv-totals-total">
            <span>Total</span>
            <span class="value">$${e.totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

    </div>`}).join("")}

    ${!c&&e.length>1?`
    <!-- BULK SUMMARY -->
    <div style="margin-top: 32px; padding: 20px; background: #1a1a2e; border-radius: 8px; color: #fff;">
      <div style="font-size: 10px; font-weight: 700; color: #ff9900; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 14px;">Bulk Summary &mdash; ${e.length} Orders</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; text-align: center;">
        <div><div style="font-size: 10px; color: #aaa; margin-bottom: 2px;">ORDERS</div><div style="font-size: 18px; font-weight: 700;">${e.length}</div></div>
        <div><div style="font-size: 10px; color: #aaa; margin-bottom: 2px;">ITEMS TOTAL</div><div style="font-size: 18px; font-weight: 700;">$${i.toFixed(2)}</div></div>
        <div><div style="font-size: 10px; color: #aaa; margin-bottom: 2px;">TAX TOTAL</div><div style="font-size: 18px; font-weight: 700;">$${r.toFixed(2)}</div></div>
        <div><div style="font-size: 10px; color: #aaa; margin-bottom: 2px;">GRAND TOTAL</div><div style="font-size: 18px; font-weight: 700; color: #ff9900;">$${n.toFixed(2)}</div></div>
      </div>
    </div>
    `:""}

    <!-- FOOTER -->
    <div class="inv-footer">
      <div class="inv-footer-left">
        <p>Generated on ${new Date().toLocaleString("en-US")}</p>
        <p>${x.companyName} &middot; ShopSmart Marketplace</p>
      </div>
      <div class="inv-footer-right">
        <div class="inv-footer-thank">Thank You!</div>
        <div class="inv-footer-tagline">We appreciate your business.</div>
      </div>
    </div>

  </div>
</body>
</html>`};return i?r.jsx("div",{className:"spinner"}):(0,r.jsxs)("div",{className:"seller-orders-page",children:[(0,r.jsxs)("div",{className:"seller-orders-header",children:[(0,r.jsxs)("div",{children:[r.jsx("h1",{children:"Orders"}),(0,r.jsxs)("p",{children:[e.length," total orders"]})]}),r.jsx("div",{style:{display:"flex",gap:8},children:(0,r.jsxs)("button",{onClick:()=>u(),style:{padding:"10px 20px",background:"var(--tertiary-dim)",color:"var(--text-white)",border:"none",borderRadius:8,fontWeight:600,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:6},children:[r.jsx("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"white",children:r.jsx("path",{d:"M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"})}),"Export PDF"]})})]}),d&&r.jsx("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"},onClick:()=>p(!1),children:(0,r.jsxs)("div",{style:{background:"var(--bg-card)",borderRadius:16,padding:32,maxWidth:500,width:"90%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"},onClick:e=>e.stopPropagation(),children:[(0,r.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24},children:[r.jsx("h2",{style:{fontSize:20,fontWeight:700},children:"PDF Order Report"}),r.jsx("button",{onClick:()=>p(!1),style:{background:"none",border:"none",fontSize:24,cursor:"pointer",color:"var(--text)"},children:"✕"})]}),c&&(0,r.jsxs)("div",{style:{background:"var(--secondary-container)",borderRadius:8,padding:12,marginBottom:16,fontSize:13},children:["Generating PDF for Order #",c.slice(-8).toUpperCase()]}),(0,r.jsxs)("div",{style:{display:"flex",flexDirection:"column",gap:16},children:[(0,r.jsxs)("div",{children:[r.jsx("label",{style:{display:"block",fontWeight:600,marginBottom:6,fontSize:13},children:"Company Name"}),r.jsx("input",{type:"text",value:x.companyName,onChange:e=>h({...x,companyName:e.target.value}),style:{width:"100%",padding:"10px 12px",border:"1px solid var(--border)",borderRadius:8,fontSize:14}})]}),(0,r.jsxs)("div",{children:[r.jsx("label",{style:{display:"block",fontWeight:600,marginBottom:6,fontSize:13},children:"Company Address"}),r.jsx("input",{type:"text",value:x.companyAddress,onChange:e=>h({...x,companyAddress:e.target.value}),placeholder:"123 Business St, City, State 12345",style:{width:"100%",padding:"10px 12px",border:"1px solid var(--border)",borderRadius:8,fontSize:14}})]}),(0,r.jsxs)("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12},children:[(0,r.jsxs)("div",{children:[r.jsx("label",{style:{display:"block",fontWeight:600,marginBottom:6,fontSize:13},children:"Phone"}),r.jsx("input",{type:"tel",value:x.companyPhone,onChange:e=>h({...x,companyPhone:e.target.value}),placeholder:"+1 (555) 000-0000",style:{width:"100%",padding:"10px 12px",border:"1px solid var(--border)",borderRadius:8,fontSize:14}})]}),(0,r.jsxs)("div",{children:[r.jsx("label",{style:{display:"block",fontWeight:600,marginBottom:6,fontSize:13},children:"Email"}),r.jsx("input",{type:"email",value:x.companyEmail,onChange:e=>h({...x,companyEmail:e.target.value}),placeholder:"seller@example.com",style:{width:"100%",padding:"10px 12px",border:"1px solid var(--border)",borderRadius:8,fontSize:14}})]})]}),(0,r.jsxs)("div",{children:[r.jsx("label",{style:{display:"block",fontWeight:600,marginBottom:6,fontSize:13},children:"Notes (optional)"}),r.jsx("textarea",{value:x.notes,onChange:e=>h({...x,notes:e.target.value}),placeholder:"Thank you for your purchase!",rows:3,style:{width:"100%",padding:"10px 12px",border:"1px solid var(--border)",borderRadius:8,fontSize:14,resize:"vertical"}})]}),(0,r.jsxs)("div",{style:{display:"flex",flexDirection:"column",gap:8},children:[(0,r.jsxs)("label",{style:{display:"flex",alignItems:"center",gap:8,fontSize:13,cursor:"pointer"},children:[r.jsx("input",{type:"checkbox",checked:x.includeTaxDetails,onChange:e=>h({...x,includeTaxDetails:e.target.checked})}),"Include tax details"]}),(0,r.jsxs)("label",{style:{display:"flex",alignItems:"center",gap:8,fontSize:13,cursor:"pointer"},children:[r.jsx("input",{type:"checkbox",checked:x.includeShippingDetails,onChange:e=>h({...x,includeShippingDetails:e.target.checked})}),"Include shipping details"]})]}),(0,r.jsxs)("div",{children:[r.jsx("label",{style:{display:"block",fontWeight:600,marginBottom:6,fontSize:13},children:"Paper Size"}),(0,r.jsxs)("select",{value:x.paperSize,onChange:e=>h({...x,paperSize:e.target.value}),style:{width:"100%",padding:"10px 12px",border:"1px solid var(--border)",borderRadius:8,fontSize:14},children:[r.jsx("option",{value:"a4",children:"A4"}),r.jsx("option",{value:"letter",children:"Letter"})]})]}),(0,r.jsxs)("div",{style:{display:"flex",gap:12,marginTop:8},children:[r.jsx("button",{onClick:()=>{let t=f(c?e.filter(e=>e._id===c):m,"print");if(!t)return;let i=window.open("","_blank");i&&(i.document.write(t),i.document.close(),i.focus(),setTimeout(()=>i.print(),500))},style:{flex:1,padding:"12px 20px",background:"var(--tertiary-dim)",color:"var(--text-white)",border:"none",borderRadius:8,fontWeight:600,fontSize:14,cursor:"pointer"},children:"Print / Preview"}),r.jsx("button",{onClick:()=>{let t=f(c?e.filter(e=>e._id===c):m,"download");if(!t)return;let i=new Blob([t],{type:"text/html"}),r=URL.createObjectURL(i),n=document.createElement("a");n.href=r,n.download=c?`invoice-${c.slice(-8).toUpperCase()}.html`:`invoices-report-${new Date().toISOString().slice(0,10)}.html`,document.body.appendChild(n),n.click(),document.body.removeChild(n),URL.revokeObjectURL(r)},style:{flex:1,padding:"12px 20px",background:"var(--success)",color:"var(--text-white)",border:"none",borderRadius:8,fontWeight:600,fontSize:14,cursor:"pointer"},children:"Download File"})]})]})]})}),r.jsx("div",{className:"seller-orders-tabs",children:["all","pending","paid","delivered"].map(t=>(0,r.jsxs)("button",{onClick:()=>l(t),className:`seller-orders-tab ${s===t?"active":""}`,children:["paid"===t?"Processing":t,"all"===t?` (${e.length})`:""]},t))}),0===m.length?(0,r.jsxs)("div",{className:"seller-orders-empty",children:[r.jsx("div",{className:"seller-orders-empty-icon",children:"\uD83D\uDCED"}),r.jsx("h2",{children:"No orders found"}),r.jsx("p",{children:"Orders will appear here when customers make purchases."})]}):r.jsx("div",{className:"seller-orders-list",children:m.map(e=>(0,r.jsxs)("div",{className:"seller-orders-card",children:[(0,r.jsxs)("div",{className:"seller-orders-card-top",children:[(0,r.jsxs)("div",{children:[(0,r.jsxs)("div",{className:"seller-orders-id",children:["Order #",e._id?.slice(-8).toUpperCase()??"N/A"]}),r.jsx("div",{className:"seller-orders-date",children:new Date(e.createdAt).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"})})]}),(0,r.jsxs)("div",{className:"seller-orders-actions",children:[r.jsx("span",{className:`seller-orders-badge ${e.isDelivered?"delivered":e.isPaid?"paid":"pending"}`,children:e.isDelivered?"Delivered":e.isPaid?"Processing":"Pending"}),(0,r.jsxs)("select",{className:"seller-orders-select",value:e.status||"pending",onChange:t=>v(e._id,t.target.value),children:[r.jsx("option",{value:"pending",children:"Pending"}),r.jsx("option",{value:"processing",children:"Processing"}),r.jsx("option",{value:"shipped",children:"Shipped"}),r.jsx("option",{value:"delivered",children:"Delivered"}),r.jsx("option",{value:"cancelled",children:"Cancelled"})]}),(0,r.jsxs)("button",{onClick:()=>u(e._id),style:{padding:"6px 12px",background:"var(--surface-container)",border:"1px solid var(--border)",borderRadius:6,fontSize:12,cursor:"pointer",color:"var(--text)",display:"flex",alignItems:"center",gap:4},children:[r.jsx("svg",{width:"12",height:"12",viewBox:"0 0 24 24",fill:"currentColor",children:r.jsx("path",{d:"M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"})}),"PDF"]})]})]}),r.jsx("div",{className:"seller-orders-items",children:e.items?.map((e,t)=>r.jsxs("div",{className:"seller-orders-item",children:[r.jsx("img",{src:e.image,alt:"",className:"seller-orders-item-img"}),r.jsxs("div",{className:"seller-orders-item-info",children:[r.jsx("div",{className:"seller-orders-item-name",children:e.name}),r.jsxs("div",{className:"seller-orders-item-qty",children:["Qty: ",e.quantity," x $",e.price.toFixed(2)]})]}),r.jsxs("div",{className:"seller-orders-item-total",children:["$",(e.price*e.quantity).toFixed(2)]})]},t))}),(0,r.jsxs)("div",{className:"seller-orders-card-footer",children:[(0,r.jsxs)("div",{className:"seller-orders-address",children:[e.shippingAddress?.city,", ",e.shippingAddress?.state,r.jsx("span",{className:"seller-orders-payment",children:e.paymentMethod?.replace("_"," ")})]}),(0,r.jsxs)("div",{className:"seller-orders-total-price",children:["$",e.totalPrice?.toFixed(2)]})]})]},e._id))})]})};function s(){return r.jsx(o,{})}},2207:(e,t,i)=>{"use strict";i.r(t),i.d(t,{default:()=>r});let r=(0,i(8570).createProxy)(String.raw`D:\E commerse\frontend\src\app\(seller)\layout.tsx#default`)},790:(e,t,i)=>{"use strict";i.r(t),i.d(t,{default:()=>r});let r=(0,i(8570).createProxy)(String.raw`D:\E commerse\frontend\src\app\(seller)\seller\orders\page.tsx#default`)}};var t=require("../../../../webpack-runtime.js");t.C(e);var i=e=>t(t.s=e),r=t.X(0,[819,995,709],()=>i(8521));module.exports=r})();