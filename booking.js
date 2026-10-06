(function(){
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('nav.mainnav');
  if (toggle && nav) {
    toggle.addEventListener('click', function(){
      nav.classList.toggle('open');
    });
    nav.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ nav.classList.remove('open'); });
    });
  }
})();

(function(){
  document.querySelectorAll('.copy-email-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var email = btn.dataset.email;
      var done = function(){
        var orig = btn.innerHTML;
        btn.textContent = (window.DOLCE_T || {}).copied || '✓ Copied';
        btn.classList.add('copied');
        setTimeout(function(){ btn.innerHTML = orig; btn.classList.remove('copied'); }, 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(done);
      } else {
        var ta = document.createElement('textarea');
        ta.value = email;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        done();
      }
    });
  });
})();

// App Store / Google Play buttons: the app isn't out yet, so they open a
// "Dolce+ - Coming soon" popup over a faded, blurred page.
(function(){
  var badges = document.querySelectorAll('.app-badge, .foot-app-badge');
  if (!badges.length) return;
  var modal = null, lastFocus = null;
  function build(){
    modal = document.createElement('div');
    modal.className = 'app-soon';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    var t = window.DOLCE_T || {};
    modal.setAttribute('aria-label', t.appLabel || 'Dolce+ app, coming soon');
    modal.innerHTML = '<button type="button" class="app-soon-x" aria-label="' + (t.close || 'Close') + '">&times;</button>' +
      '<div class="app-soon-card"><img src="dolce-plus-logo.png" alt="Dolce+"><p>' + (t.soon || 'Coming soon') + '</p></div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', close);
  }
  function open(e){
    if (e) e.preventDefault();
    if (!modal) build();
    lastFocus = document.activeElement;
    void modal.offsetWidth;            // let the fade-in run on first open
    modal.classList.add('is-open');
    document.documentElement.classList.add('app-soon-lock');
    modal.querySelector('.app-soon-x').focus();
  }
  function close(){
    if (!modal || !modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    document.documentElement.classList.remove('app-soon-lock');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  badges.forEach(function(b){
    if (b.tagName !== 'A' && b.tagName !== 'BUTTON'){
      b.setAttribute('role', 'button');
      b.setAttribute('tabindex', '0');
    }
    b.removeAttribute('aria-disabled');
    b.removeAttribute('title');
    b.addEventListener('click', open);
    b.addEventListener('keydown', function(e){
      if (e.key === 'Enter' || e.key === ' ') open(e);
    });
  });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') close(); });
})();

// Computers: a phone number in the treatment FAQs opens a WhatsApp chat
// (there is no phone to call from); phones keep the normal call link.
(function(){
  if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  document.querySelectorAll('.dx-faq a.tel-link[href^="tel:"]').forEach(function(a){
    a.href = 'https://wa.me/' + a.getAttribute('href').replace(/\D/g, '');
    a.target = '_blank';
    a.rel = 'noopener';
  });
})();
