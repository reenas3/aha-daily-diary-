if(!self.define){let e,i={};const s=(s,n)=>(s=new URL(s+".js",n).href,i[s]||new Promise((i=>{if("document"in self){const e=document.createElement("script");e.src=s,e.onload=i,document.head.appendChild(e)}else e=s,importScripts(s),i()})).then((()=>{let e=i[s];if(!e)throw new Error(`Module ${s} didn’t register its module`);return e})));self.define=(n,r)=>{const o=e||("document"in self?document.currentScript.src:"")||location.href;if(i[o])return;let t={};const c=e=>s(e,o),d={module:{uri:o},exports:t,require:c};i[o]=Promise.all(n.map((e=>d[e]||c(e)))).then((e=>(r(...e),t)))}}define(["./workbox-1ea6f077"],(function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"assets/index-BYDpsQWD.css",revision:null},{url:"index.html",revision:"0f192ecde2fc38902b32242b3234be91"},{url:"registerSW.js",revision:"84e5bf6c2eb94e2325b096a409253159"},{url:"icons/pwa-192x192.png",revision:"de63b1e1baf6e8842a11000623ee8d81"},{url:"icons/pwa-512x512.png",revision:"7fecd9b4f113738d407a0e856ba0dd1d"},{url:"manifest.webmanifest",revision:"d6c27747f4a33fe890308d70b1cd4043"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html"))),e.registerRoute(/^https:\/\/firestore\.googleapis\.com\/.*/i,new e.NetworkFirst({cacheName:"firebase-cache",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:10,maxAgeSeconds:604800})]}),"GET")}));
