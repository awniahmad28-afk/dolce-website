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
        btn.textContent = '✓ Copied';
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
