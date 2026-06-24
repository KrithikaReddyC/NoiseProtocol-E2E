/* Login / signup page logic */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- aurora beams (same as landing) --------------------------------------
  function buildBeams(count) {
    var container = document.getElementById('beams');
    if (!container) return;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < count; i++) {
      var riseDur = Math.random() * 2 + 4;
      var dropDur = Math.random() * 3 + 3;
      var beam = document.createElement('div');
      beam.className = 'light-beam';
      beam.style.left = (Math.random() * 100) + '%';
      beam.style.width = (Math.floor(Math.random() * 3) + 1) + 'px';
      beam.style.animationDelay = (Math.random() * 5) + 's';
      beam.style.animationDuration = riseDur + 's, ' + riseDur + 's, ' + dropDur + 's';
      frag.appendChild(beam);
    }
    container.appendChild(frag);
  }

  var els = {};
  var mode = 'login';

  function setMode(next) {
    mode = next;
    var isSignup = mode === 'signup';
    els.tabLogin.classList.toggle('active', !isSignup);
    els.tabSignup.classList.toggle('active', isSignup);
    els.emailField.hidden = !isSignup;
    els.title.textContent = isSignup ? 'Create your account' : 'Welcome back';
    els.sub.textContent = isSignup ? 'Set up your secure portal access.' : 'Sign in to your secure portal.';
    els.submitLabel.textContent = isSignup ? 'Create account' : 'Log in';
    els.password.setAttribute('autocomplete', isSignup ? 'new-password' : 'current-password');
    els.hint.innerHTML = isSignup
      ? 'Already have an account? <a id="switch-link">Log in</a>'
      : "Don't have an account? <a id=\"switch-link\">Sign up</a>";
    document.getElementById('switch-link').addEventListener('click', function () {
      setMode(isSignup ? 'login' : 'signup');
    });
    msg('', '');
  }

  function msg(text, kind) {
    els.msg.textContent = text;
    els.msg.className = 'auth-msg' + (kind ? ' ' + kind : '');
  }

  function submit(e) {
    e.preventDefault();
    var username = els.username.value.trim();
    var password = els.password.value;
    var email = els.email.value.trim();

    if (!username || !password) { msg('Please fill in all required fields.', 'error'); return; }

    var url = mode === 'signup' ? '/auth/signup' : '/auth/login';
    var payload = mode === 'signup'
      ? { username: username, password: password, email: email }
      : { username: username, password: password };

    els.submit.disabled = true;
    els.submitLabel.textContent = mode === 'signup' ? 'Creating...' : 'Signing in...';

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.success) {
          msg(mode === 'signup' ? 'Account created. Redirecting...' : 'Welcome. Redirecting...', 'ok');
          window.location.href = data.redirect || '/app';
        } else {
          msg(data.message || 'Something went wrong.', 'error');
          els.submit.disabled = false;
          els.submitLabel.textContent = mode === 'signup' ? 'Create account' : 'Log in';
        }
      })
      .catch(function () {
        msg('Network error. Please try again.', 'error');
        els.submit.disabled = false;
        els.submitLabel.textContent = mode === 'signup' ? 'Create account' : 'Log in';
      });
  }

  function start() {
    if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    buildBeams(reduceMotion ? 18 : 44);

    els = {
      tabLogin: document.getElementById('tab-login'),
      tabSignup: document.getElementById('tab-signup'),
      emailField: document.getElementById('email-field'),
      title: document.getElementById('auth-title'),
      sub: document.getElementById('auth-sub'),
      submit: document.getElementById('auth-submit'),
      submitLabel: document.getElementById('submit-label'),
      password: document.getElementById('password'),
      username: document.getElementById('username'),
      email: document.getElementById('email'),
      hint: document.getElementById('auth-hint'),
      msg: document.getElementById('auth-msg'),
      form: document.getElementById('auth-form')
    };

    els.tabLogin.addEventListener('click', function () { setMode('login'); });
    els.tabSignup.addEventListener('click', function () { setMode('signup'); });
    els.form.addEventListener('submit', submit);

    var initial = document.querySelector('.auth-card').getAttribute('data-mode') || 'login';
    setMode(initial);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
