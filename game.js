(function () {
  var TOTAL = 180;
  function normalize(s) {
    return s.toLowerCase().replace(/ñ/g, "\u0001").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\u0001/g, "ñ").replace(/[^a-zñ0-9 ]+/g, " ").replace(/^\s*(el|la|los|las|un|una)\s+/, "")
      .replace(/\s+/g, " ").trim();
  }
  function lev(a, b) {
    var d = []; for (var j = 0; j <= b.length; j++) d[j] = j;
    for (var i = 1; i <= a.length; i++) { var prev = d[0]; d[0] = i;
      for (j = 1; j <= b.length; j++) { var t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = t; } }
    return d[b.length];
  }
  function isCorrect(input, q) {
    var n = normalize(input); if (!n) return false;
    return q.a.some(function (ans) { var t = normalize(ans); return t === n || (t.length > 5 && lev(t, n) <= 1); });
  }
  function rank(s) {
    if (s >= 26) return ["Portador de la Sabiduría de los Istari", "Ni Gandalf recordaría tantos detalles. Eres leyenda de la Tierra Media."];
    if (s >= 21) return ["Señor de los Eldar", "Tu memoria es tan antigua como la de Elrond. Muy pocos llegan tan lejos."];
    if (s >= 15) return ["Capitán de Gondor", "Gran dominio del saber de las seis películas. Minas Tirith te honra."];
    if (s >= 9) return ["Montaraz del Norte", "Conoces los caminos, pero aún quedan sendas ocultas por explorar."];
    return ["Hobbit de la Comarca", "Aún te queda mucho viaje por delante. ¡Vuelve a ver las películas y regresa!"];
  }
  var used = {}, rosco = [], states = [], cur = 0, time = TOTAL, timer = null, buttons = [];
  var $ = function (id) { return document.getElementById(id); };
  function show(id) { ["intro", "play", "end"].forEach(function (s) { $(s).classList.toggle("hidden", s !== id); }); }
  function build() {
    return LETTERS.map(function (l) {
      var all = QUESTIONS.filter(function (q) { return q.letter === l; });
      var fresh = all.filter(function (q) { return !used[q.id]; });
      var pool = fresh.length ? fresh : all;
      return pool[Math.floor(Math.random() * pool.length)];
    });
  }
  function start() {
    rosco = build(); used = {}; rosco.forEach(function (q) { used[q.id] = true; });
    states = rosco.map(function () { return "pending"; }); cur = 0; time = TOTAL;
    var box = $("rosco"); buttons.forEach(function (b) { b.remove(); }); buttons = [];
    rosco.forEach(function (q, i) {
      var a = (i / rosco.length) * Math.PI * 2 - Math.PI / 2, b = document.createElement("button");
      b.className = "letter"; b.textContent = q.letter; b.setAttribute("aria-label", "Letra " + q.letter);
      b.style.left = 50 + 44 * Math.cos(a) + "%"; b.style.top = 50 + 44 * Math.sin(a) + "%";
      b.onclick = function () { if (states[i] === "pending") { cur = i; setFlash("", ""); render(); } };
      box.appendChild(b); buttons.push(b);
    });
    setFlash("", ""); show("play"); render();
    clearInterval(timer);
    timer = setInterval(function () { time--; render(); if (time <= 0) finish(); }, 1000);
  }
  function setFlash(text, kind) { var f = $("flash"); f.textContent = text; f.className = "flash " + kind; }
  function count(s) { return states.filter(function (x) { return x === s; }).length; }
  function render() {
    buttons.forEach(function (b, i) { b.dataset.state = i === cur && states[i] === "pending" ? "current" : states[i]; b.disabled = states[i] !== "pending"; });
    var q = rosco[cur]; $("qLetter").textContent = q.letter;
    $("qMode").textContent = (q.mode === "E" ? "EMPIEZA POR " : "CONTIENE LA ") + q.letter;
    $("qText").textContent = q.q;
    $("time").textContent = Math.max(time, 0); $("time").classList.toggle("low", time <= 20);
    $("cOk").textContent = "✓ " + count("ok"); $("cFail").textContent = "✗ " + count("fail"); $("cPend").textContent = "◌ " + count("pending");
    $("answer").focus();
  }
  function next() {
    for (var k = 1; k <= states.length; k++) { var i = (cur + k) % states.length; if (states[i] === "pending") return i; }
    return -1;
  }
  function resolve(st, text) {
    states[cur] = st; setFlash(text, st); $("answer").value = "";
    var n = next(); if (n === -1) { render(); clearInterval(timer); setTimeout(finish, 900); } else { cur = n; render(); }
  }
  function finish() {
    clearInterval(timer); var ok = count("ok"), r = rank(ok), el = TOTAL - Math.max(time, 0);
    $("score").textContent = ok; $("rank").textContent = r[0]; $("msg").textContent = r[1];
    $("sOk").textContent = ok; $("sFail").textContent = count("fail"); $("sPend").textContent = count("pending");
    $("sTime").textContent = Math.floor(el / 60) + ":" + String(el % 60).padStart(2, "0");
    var ul = $("solutions"); ul.innerHTML = "";
    rosco.forEach(function (q, i) {
      var li = document.createElement("li"), b = document.createElement("b");
      b.className = states[i] === "ok" ? "c-ok" : states[i] === "fail" ? "c-fail" : "c-pend"; b.textContent = q.letter;
      li.appendChild(b); li.appendChild(document.createTextNode(q.a[0])); ul.appendChild(li);
    });
    show("end");
  }
  $("form").onsubmit = function (e) {
    e.preventDefault(); var v = $("answer").value, q = rosco[cur]; if (!v.trim()) return;
    if (isCorrect(v, q)) resolve("ok", "¡Correcto! " + q.a[0]); else resolve("fail", "Incorrecto. La respuesta era: " + q.a[0]);
  };
  $("passBtn").onclick = function () { setFlash("Pasapalabra en la " + rosco[cur].letter, ""); $("answer").value = ""; var n = next(); if (n !== -1) cur = n; render(); };
  $("giveBtn").onclick = function () { resolve("fail", "Te rindes. La respuesta era: " + rosco[cur].a[0]); };
  $("startBtn").onclick = start; $("againBtn").onclick = start;
})();
