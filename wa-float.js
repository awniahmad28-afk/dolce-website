/* Floating WhatsApp button (phones only): small gold circle in the corner.
   Appears once you scroll a little, hides while the footer (which has its own
   WhatsApp button) is on screen. Number comes from data-wa on the script tag.
   On computers, every phone number shown on the page opens a WhatsApp chat
   with that number instead (there is no phone to call from). */
(function(){
  var me = document.currentScript;
  var num = (me && me.getAttribute('data-wa')) || '9647509000200';
  var css = '.wa-float{position:fixed;right:16px;bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:150;width:52px;height:52px;border-radius:50%;' +
    'display:flex;align-items:center;justify-content:center;background:linear-gradient(145deg,#CFA874,#A6805A);color:#FFF;text-decoration:none;' +
    'box-shadow:0 8px 22px rgba(36,26,16,.28),inset 0 0 0 1px rgba(255,255,255,.25);opacity:0;transform:translateY(14px) scale(.9);pointer-events:none;' +
    'transition:opacity .45s ease,transform .45s cubic-bezier(.2,.7,.2,1);-webkit-tap-highlight-color:transparent;}' +
    '.wa-float.is-on{opacity:1;transform:none;pointer-events:auto;}' +
    '.wa-float svg{width:25px;height:25px;fill:currentColor;}' +
    '.wa-float:active{transform:scale(.94);}' +
    '[dir=rtl] .wa-float{right:auto;left:16px;}' +
    '[dir=rtl] a.wa-num{direction:ltr;unicode-bidi:isolate;}' +
    '@media (min-width:861px){.wa-float{display:none;}}' +
    '@media (prefers-reduced-motion:reduce){.wa-float{transition:none;}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var a = document.createElement('a');
  a.className = 'wa-float';
  a.href = 'https://wa.me/' + num;
  a.target = '_blank'; a.rel = 'noopener';
  a.setAttribute('aria-label', (window.DOLCE_T || {}).wa || 'Chat with us on WhatsApp');
  a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.15a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.21 8.21 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24s8.24 3.7 8.24 8.24-3.7 8.24-8.24 8.24zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z"/></svg>';
  document.body.appendChild(a);

  // computers: the numbers stay as they are, but open WhatsApp; "Call"
  // buttons (no number in them) are left alone
  if (window.matchMedia('(hover:hover) and (pointer:fine)').matches){
    document.querySelectorAll('a[href^="tel:"]:not(.cta-call)').forEach(function(t){
      if (t.textContent.replace(/\D/g, '').length < 9) return;
      t.href = 'https://wa.me/' + t.getAttribute('href').replace(/\D/g, '');
      t.target = '_blank'; t.rel = 'noopener';
      t.classList.add('wa-num');
    });
  }
  var feet = document.querySelectorAll('footer'), foot = feet[feet.length - 1];   // the page footer is the last one
  function update(){
    var r = foot && foot.getBoundingClientRect();
    var footerOn = !!r && r.top < window.innerHeight && r.bottom > 0;
    a.classList.toggle('is-on', window.scrollY > window.innerHeight * 0.5 && !footerOn);
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
})();
