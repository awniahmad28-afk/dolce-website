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

(function(){
  var form = document.getElementById('bookingForm');
  if (!form) return;
  var success = document.getElementById('bookingSuccess');
  form.addEventListener('submit', async function(e){
    e.preventDefault();
    var data = {
      name: form.name.value, phone: form.phone.value, date: form.date.value,
      treatment: form.treatment.value, notes: form.notes.value, submittedAt: new Date().toISOString()
    };
    var saved = false;
    try {
      if (window.claude) {
        var db = await claude.use('db');
        await db.doc('bookings/' + Date.now()).set(data);
        saved = true;
      }
    } catch(err){}
    if (!saved) {
      var body = 'Name: ' + data.name + '%0APhone: ' + data.phone + '%0ADate: ' + data.date + '%0ATreatment: ' + data.treatment + '%0ANotes: ' + data.notes;
      window.location.href = 'mailto:Dolce.erbil@gmail.com?subject=Consultation request&body=' + body;
    }
    form.style.display = 'none';
    success.classList.add('show');
  });
})();
