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
