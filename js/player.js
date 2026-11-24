/* Citim cetatea ca pe un argument · motorul cursului (HTML5, SCORM 2004)
   Urban Instances V3 · Cetatea citită · LEETUCATION SRL */
(function () {
  'use strict';
  var C = window.COURSE, VO = window.VO || {}, ALT = window.ALT || {}, CFG = window.CFG || {};
  var KEY = CFG.storageKey || 'UI3_CetateaCitita_FilosofiePolitica_v1';
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function mdt(s) { return esc(s).replace(/\*([^*]+)\*/g, '<span class="mk">$1</span>'); }
  function md(s) { return esc(s).replace(/\*([^*]+)\*/g, '<em class="ki">$1</em>'); }
  function plain(s) { return String(s || '').replace(/\*/g, ''); }
  function dc(c) { return (c === undefined || c === null) ? '' : ' data-c="' + c + '"'; }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- structura ---------- */
  var START = { id: '0.0', type: 'start' }, HUB = { id: '0.2', type: 'hub' };
  var ABOUT = C.about, FINAL = C.final, MODS = C.modules;
  var ALL = {}, CONTENT = [];
  function reg(s, m, i) { ALL[s.id] = { s: s, m: m, i: i }; }
  reg(START, -1, 0); reg(ABOUT, -1, 0); reg(HUB, -1, 0); reg(FINAL, -1, 0);
  MODS.forEach(function (M, mi) { M.screens.forEach(function (s, i) { reg(s, mi, i); CONTENT.push(s.id); }); });
  CONTENT.push(ABOUT.id); CONTENT.push(FINAL.id);
  var DARK = { start: 1, cover: 1, thesis: 1, media: 1, conclusion: 1, final: 1, triptych: 1, hub: 1 };

  /* ---------- stare și salvare ---------- */
  var st = { v: 1, vis: {}, ex: {}, q: {}, notes: [], done: {}, loc: null, narr: {} };
  var prefs = { cc: false, rate: 1, mute: false };
  function loadPrefs() { try { var p = JSON.parse(localStorage.getItem(KEY + '_prefs') || '{}'); for (var k in p) prefs[k] = p[k]; } catch (e) {} }
  function savePrefs() { try { localStorage.setItem(KEY + '_prefs', JSON.stringify(prefs)); } catch (e) {} }
  function load() {
    var raw = '';
    if (SCO.ok) raw = SCO.get('cmi.suspend_data');
    else { try { raw = localStorage.getItem(KEY) || ''; } catch (e) {} }   /* în LMS: doar datele din LMS (calculatoare comune) */
    if (raw) { try { var o = JSON.parse(raw); if (o && o.v === 1) st = Object.assign(st, o); } catch (e) {} }
  }
  var saveT = null;
  function save() {
    clearTimeout(saveT);
    saveT = setTimeout(saveNow, 300);
  }
  function saveNow() {
    var raw = JSON.stringify(st);
    if (raw.length > 60000) { st.notes = st.notes.slice(-20); raw = JSON.stringify(st); }
    if (!SCO.ok) { try { localStorage.setItem(KEY, raw); } catch (e) {} }
    if (SCO.ok) {
      SCO.set('cmi.suspend_data', raw);
      if (st.loc) SCO.set('cmi.location', st.loc);
      var seen = CONTENT.filter(function (id) { return st.vis[id]; }).length;
      SCO.set('cmi.progress_measure', (Math.round(seen / CONTENT.length * 100) / 100).toFixed(2));
      var sc = quizScore();
      if (sc.total > 0) {
        SCO.set('cmi.score.min', 0); SCO.set('cmi.score.max', sc.total); SCO.set('cmi.score.raw', sc.ok);
        SCO.set('cmi.score.scaled', (sc.ok / sc.total).toFixed(2));
      }
      if (allDone()) { SCO.set('cmi.completion_status', 'completed'); SCO.set('cmi.success_status', 'passed'); }
      SCO.commit();
    }
  }
  function quizScore() {
    var ok = 0, total = 0;
    for (var k in st.q) { var a = st.q[k] || []; a.forEach(function (x) { if (x !== null && x !== undefined) { total++; if (x === 1) ok++; } }); }
    return { ok: ok, total: total };
  }
  function modProgress(mi) {
    var sc = MODS[mi].screens, n = 0;
    sc.forEach(function (s) { if (st.vis[s.id]) n++; });
    return n / sc.length;
  }
  function allDone() { return st.done[0] && st.done[1] && st.done[2]; }

  /* ---------- elemente comune ---------- */
  function hdr(dark) {
    return '<div class="hdr"><img class="cp" src="media/brand/cp_logo_' + (dark ? 'alb' : 'negru') + '.png" alt="Finanțat de Municipiul Timișoara prin Centrul de Proiecte și Administrația pentru Sănătate și Educație">' +
      '<img class="sig" src="media/brand/semnatura_' + (dark ? 'alb' : 'cerneala') + '.png" alt="Urban Instances V3 · Cetatea citită"></div>';
  }
  function ftr(s) {
    var R = ALL[s.id];
    if (R.m < 0) return '';
    var M = MODS[R.m], n = M.screens.length;
    return '<div class="ftr"><span class="crumb">Modulul ' + M.num + ' · ' + esc(plain(M.title)) + (s.k ? ' · ' + esc(s.k.replace(/^\d+ · /, '')) : '') + '</span>' +
      '<span class="prog" aria-hidden="true"><i style="width:' + Math.round((R.i + 1) / n * 100) + '%"></i></span>' +
      '<span class="cnt-n"><b>' + String(R.i + 1).padStart(2, '0') + '</b> / ' + String(n).padStart(2, '0') + '</span></div>';
  }
  function kick(s) {
    if (!s.k) return '';
    var m = s.k.match(/^(\d+|Exercițiu|Concluzie|Verificare|Resurse|Teza modulului|Ce spun cercetările|Final)\s·\s?(.*)$/);
    if (m) return '<p class="kick"><span class="num">' + esc(m[1]) + '</span>' + esc(m[2]) + '</p>';
    return '<p class="kick">' + esc(s.k) + '</p>';
  }
  function title(s, cls) { return '<h1 class="t ' + (cls || '') + '" id="t-' + s.id.replace('.', '-') + '">' + mdt(s.t) + '</h1>'; }
  function img(name, mark, extra, kb, shade) {
    var alt = ALT[name] || '';
    var h = '<div class="ph' + (kb === false ? '' : ' kb') + (extra ? ' ' + extra : '') + '"><img src="media/img/' + name + '.webp" alt="' + esc(alt) + '"' + (alt ? '' : ' aria-hidden="true"') + '>' + (shade ? '<i class="shade" aria-hidden="true"></i>' : '');
    if (mark) {
      var c = mark.c === undefined ? 0 : mark.c;
      h += '<i class="imark" data-c="' + c + '" aria-hidden="true" style="left:' + mark.x + '%;top:' + mark.y + '%;width:' + mark.w + '%;height:' + mark.h + '%"></i>';
      var below = mark.y + mark.h < 86;
      h += '<span class="ilab" data-c="' + c + '" aria-hidden="true" style="' + (mark.x + mark.w > 62 ? 'right:' + (100 - mark.x - mark.w) + '%;' : 'left:' + mark.x + '%;') + (below ? 'top:calc(' + (mark.y + mark.h) + '% + 10px)' : 'bottom:calc(' + (100 - mark.y) + '% + 10px)') + '">' + esc(mark.l) + '</span>';
    }
    if (/^(m1_aristotel)$/.test(name)) h += '<span class="cred">Foto: Freepik</span>';
    return h + '</div>';
  }
  function vid(name, poster) {
    var alt = ALT[name] || '';
    return '<div class="ph vid"><video src="media/video/' + name + '.mp4" poster="media/video/' + name + '.webp" muted loop playsinline preload="metadata" aria-label="' + esc(alt) + '"></video>' +
      '<button class="vctl" type="button" aria-pressed="false">Oprește clipul</button></div>';
  }
  function notes(list) {
    if (!list || !list.length) return '';
    return '<ul class="notes">' + list.map(function (x) {
      return '<li class="note rv"' + dc(x.c) + '><span class="n">' + (x.n ? '<span>' + esc(x.n) + '</span>' : '') + '</span><div><div class="h">' + md(x.h) + '</div>' +
        (x.p ? '<div class="pp">' + md(x.p) + '</div>' : '') + (x.r ? '<div class="ref">' + esc(x.r) + '</div>' : '') + '</div></li>';
    }).join('') + '</ul>';
  }
  var ICON = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 4.5v15l13-7.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 4h4.5v16H6zM13.5 4H18v16h-4.5z"/></svg>',
    replay: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.4" d="M4 12a8 8 0 1 0 2.6-5.9M4 4v5h5"/></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.4" d="M4 6h16M4 12h16M4 18h10"/></svg>',
    book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" d="M4 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H4zM20 5h-6a3 3 0 0 0-3 3"/><path fill="none" stroke="currentColor" stroke-width="2.2" d="M20 5v13h-7"/></svg>',
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.6" d="M15 5l-7 7 7 7"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.6" d="M9 5l7 7-7 7"/></svg>',
    all: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.4" d="M4 6h16M4 12h16M4 18h16"/><path fill="currentColor" d="M2 5h2v2H2zM2 11h2v2H2zM2 17h2v2H2z"/></svg>',
    vol: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 9v6h4l5 4V5L7 9z"/><path fill="none" stroke="currentColor" stroke-width="2" d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12"/></svg>',
    mute: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 9v6h4l5 4V5L7 9z"/><path fill="none" stroke="currentColor" stroke-width="2.2" d="M16 9l5 6M21 9l-5 6"/></svg>',
    voice: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 9v6h4l5 4V5L7 9z"/><path fill="none" stroke="currentColor" stroke-width="2" d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>',
    cc: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path fill="none" stroke="currentColor" stroke-width="2" d="M10 10.2a2.5 2.5 0 1 0 0 3.6M17 10.2a2.5 2.5 0 1 0 0 3.6"/></svg>',
    ex: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" d="M4 12l5 5L20 6"/></svg>',
    full: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.4" d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    ws: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" d="M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h5"/></svg>',
    dl: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.4" d="M12 3v12M7 10l5 5 5-5M4 20h16"/></svg>',
    print: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" d="M7 8V3h10v5M7 17H4v-8h16v8h-3M7 14h10v7H7z"/></svg>',
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.4" d="M10 6l-6 6 6 6M4 12h16"/></svg>'
  };

  /* ---------- tipuri de ecran ---------- */
  var R = {};
  R.start = function (s) {
    var resume = st.loc && st.loc !== '0.0' && ALL[st.loc];
    return '<div class="bg ph kb"><img src="media/img/c_start.webp" alt="' + esc(ALT.c_start) + '"><i class="shade" aria-hidden="true"></i><i class="imark on" style="left:74.5%;top:24%;width:15%;height:13%" aria-hidden="true"></i>' +
      '<span class="ilab on" style="left:74.5%;top:calc(37% + 10px)" aria-hidden="true">citim cetatea</span></div>' + hdr(true) +
      '<div class="panel"><p class="eyebrow">Urban Instances V3 · Cetatea citită · un e-learning de filosofie politică</p>' +
      '<h1 class="t xl" id="t-0-0">Citim cetatea<br>ca pe <span class="mk">un argument.</span></h1>' +
      '<p class="subt">Trei lecturi de filosofie politică: natura umană, regimurile, ideologiile. Pentru liceu și pentru primul an de facultate.</p>' +
      '<div class="mods"><div><b>01</b>natura umană</div><div><b>02</b>regimurile</div><div><b>03</b>ideologiile</div></div>' +
      '<p class="by">Conținut: <b>' + esc(C.contentAuthor) + '</b> · E-learning: <b>Gelu-Emanuel Cebzan</b> · <b>LEETUCATION SRL</b></p>' +
      '<div class="acts">' + (resume ? '<button class="b pri" type="button" data-go="' + esc(st.loc) + '">Continuă de unde ai rămas</button><button class="b" type="button" data-go="0.1">Ia-o de la început</button>' :
        '<button class="b pri" type="button" data-go="0.1">Începe</button><button class="b" type="button" data-go="0.2">Mergi la module</button>') + '</div></div>' +
      '<p class="fund">' + esc(C.funding) + '</p>';
  };
  R.about = function (s) {
    var how = s.how.map(function (h) { return '<div class="h1 rv"' + dc(h.c) + '>' + (ICON[h.i] || ICON.ex) + '<span>' + esc(h.t) + '</span></div>'; }).join('');
    var mods = s.mods.map(function (x) { var M = MODS[x.m]; return '<div class="mod rv"' + dc(x.c) + '><span class="n"><span>' + M.num + '</span></span><div><div class="h">' + md(M.title) + '</div><div class="q">' + esc(M.q) + '</div></div></div>'; }).join('');
    var steps = s.steps.map(function (x, i) { return '<div class="s rv"' + dc(x.c) + '><span>0' + (i + 1) + '</span>' + esc(x.h) + '</div>'; }).join('');
    return hdr(false) + '<div class="cnt about">' + kick(s) + title(s, 'l') +
      '<div class="row"><div><p class="lead rv" data-c="0">Parte din <i>Urban Instances V3 · Cetatea citită</i>. Proiectul citește orașul ca pe un text.</p><p class="ref rv" data-c="0" style="margin:-6px 0 8px">Conținut: ' + esc(C.contentAuthor) + ' · E-learning: Gelu-Emanuel Cebzan, LEETUCATION SRL</p><div class="steps3">' + steps + '</div>' +
      '<p class="lead rv" data-c="2" style="font-size:28px">Aici citim cetatea în sensul ei cel mai vechi: <b>comunitatea politică</b>.</p><div class="how">' + how + '</div></div>' +
      '<div><div class="mods">' + mods + '</div><p class="ref rv" data-c="6" style="margin-top:18px">Ordinea e liberă; modulele formează un ciclu. ≈ 25 de minute fiecare.</p></div></div></div>' +
      '<p class="fund">' + esc(C.funding) + '</p>';
  };
  R.hub = function (s) {
    var cards = MODS.map(function (M, mi) {
      var p = modProgress(mi), done = st.done[mi];
      var lbl = done ? 'Reia' : (p > 0 ? 'Continuă' : 'Începe');
      return '<button class="mc' + (done ? ' done' : '') + '" type="button" data-mod="' + mi + '">' +
        '<span class="ph"><img src="media/img/' + M.cover + '.webp" alt=""></span><span class="tx"><span class="n"><span class="sr">Modulul </span>' + M.num + '</span><span class="h" style="display:block">' + md(M.title) + '</span>' +
        '<span class="s" style="display:block">' + esc(M.sub) + '</span><span class="q" style="display:block">' + esc(M.q) + '</span>' +
        '<span class="pr" style="display:block"><i style="width:' + Math.round(p * 100) + '%"></i></span><span class="st"><span>' + (done ? 'Parcurs ✓' : Math.round(p * 100) + '% parcurs') + ' · fișa ' + wsCount(M.id).n + '/' + wsCount(M.id).t + '</span><span class="go">' + lbl + '</span></span></span></button>';
    }).join('');
    var sc = quizScore();
    return hdr(true) + '<div class="cnt hub"><p class="kick"><span class="num">Cuprins</span>trei module, în orice ordine</p>' +
      '<h1 class="t l" id="t-0-2">Trei lecturi ale <span class="mk">cetății</span></h1><div class="mods">' + cards + '</div>' +
      '<div class="fin">' + (allDone() ? '<button class="b pri" type="button" data-go="9.0">Încheie cursul</button>' : '<button class="b" type="button" data-go="9.0">Încheierea cursului</button>') +
      '<button class="b" type="button" data-act="res">' + ICON.book + 'Resurse și bibliografie</button>' +
      '<span class="pp">' + (sc.total ? 'Verificări: ' + sc.ok + ' din ' + sc.total + ' răspunsuri corecte la prima încercare.' : 'Ai acces la verificări la finalul fiecărui modul.') + '</span></div></div>';
  };
  R.cover = function (s) {
    var M = MODS[ALL[s.id].m];
    var goals = (s.goals || []).map(function (g) { return '<li class="rv"' + dc(g.c) + '>' + esc(g.t) + '</li>'; }).join('');
    return '<div class="bg">' + img(s.img, s.mark, '', true, true) + '</div>' + hdr(true) +
      '<div class="panel"><p class="modn rv" data-c="0">Modulul ' + M.num + '<span>' + esc(M.sub) + '</span></p>' + title({ id: s.id, t: M.title }, 'xl') +
      '<p class="q rv" data-c="2">' + esc(M.q) + '</p>' +
      '<ul class="goals"><li class="gh rv"' + dc(s.goals && s.goals[0] ? s.goals[0].c : 3) + '>La finalul modulului:</li>' + goals + '</ul></div>' + ftr(s);
  };
  R.concept = function (s) {
    var L = kick(s) + title(s);
    if (s.lead) L += '<p class="lead rv"' + dc(s.lead.c) + '>' + md(s.lead.t) + '</p>';
    if (s.steps) {
      L += '<div class="steps">' + s.steps.map(function (x, i) { return (i ? '<span class="ar rv"' + dc(x.c) + '>→</span>' : '') + '<div class="st rv' + (i === s.steps.length - 1 ? ' last' : '') + '"' + dc(x.c) + '>' + esc(x.h) + (x.p ? '<small>' + esc(x.p) + '</small>' : '') + '</div>'; }).join('') + '</div>';
      if (s.stepsNote) L += '<p class="stepsnote rv"' + dc(s.stepsNote.c) + '>' + md(s.stepsNote.t) + '</p>';
    }
    L += notes(s.notes);
    if (s.stat) L += '<div class="stat rv"' + dc(s.stat.c) + '><span class="v mkv">' + esc(s.stat.v) + '</span><span class="l">' + esc(s.stat.l) + '<span class="ref" style="display:block">' + esc(s.stat.r) + '</span></span></div>';
    if (s.quote) L += '<blockquote class="qt rv"' + dc(s.quote.c) + '>' + esc(s.quote.t) + '<span class="ref">' + esc(s.quote.r) + '</span></blockquote>';
    if (s.limit) L += '<div class="limit rv"' + dc(s.limit.c) + '><div class="h">' + esc(s.limit.h) + '</div>' + s.limit.items.map(function (x) { return '<div class="li rv"' + dc(x.c) + '>' + esc(x.t) + '</div>'; }).join('') + '</div>';
    return hdr(false) + '<div class="cnt"><div class="concept' + (s.img ? '' : ' noimg') + '"><div class="col">' + L + '</div>' +
      (s.img ? '<div class="side">' + img(s.img, s.mark) + '</div>' : '') + '</div></div>' + ftr(s);
  };
  R.cards = function (s) {
    var cols = s.cols || 3;
    return hdr(false) + '<div class="cnt">' + kick(s) + title(s) + '<div class="cards c' + cols + '" style="grid-template-columns:repeat(' + cols + ',1fr)">' +
      s.cards.map(function (x) {
        return '<div class="card rv z"' + dc(x.c) + '>' + (x.img ? img(x.img, null, '', false) : '') + '<div class="n"><span>' + esc(x.n) + '</span></div><div class="h">' + md(x.h) + '</div><div class="pp">' + md(x.p) + '</div></div>';
      }).join('') + '</div></div>' + ftr(s);
  };
  function pcol(list, cls, lbl) {
    return '<div class="' + cls + '"><div class="colh"><span class="tag">' + lbl + '</span></div>' + (list || []).map(function (x) {
      return '<div class="it rv"' + dc(x.c) + '><div class="h">' + md(x.h) + '</div>' + (x.p ? '<div class="pp">' + md(x.p) + '</div>' : '') + (x.r ? '<div class="ref">' + esc(x.r) + '</div>' : '') + '</div>';
    }).join('') + '</div>';
  }
  R.procon = function (s) {
    var th = (s.thesis || []).map(function (x) { return '<span class="chip rv"' + dc(x.c) + '>' + md(x.t) + (x.r ? '<span class="ref">' + esc(x.r) + '</span>' : '') + '</span>'; }).join('');
    var media = s.video ? vid(s.video) : (s.img ? img(s.img) : '');
    var models = s.models ? '<div class="thesisrow">' + s.models.map(function (x) { return '<span class="chip rv"' + dc(x.c) + '><b>' + esc(x.h) + '</b> · ' + esc(x.p) + ' <span class="ref">' + esc(x.y) + '</span></span>'; }).join('') + '</div>' : '';
    return hdr(false) + '<div class="cnt fx-col">' + kick(s) + title(s) + (th ? '<div class="thesisrow">' + th + '</div>' : '') + models +
      '<div class="pc' + (media ? ' wimg' : '') + '">' + pcol(s.pro, 'pro', 'Pentru') + pcol(s.con, 'con', 'Contra') + (media ? '<div class="pcm">' + media + '</div>' : '') + '</div>' +
      (s.foot ? '<p class="foot rv"' + dc(s.foot.c) + '>' + md(s.foot.t) + '</p>' : '') + '</div>' + ftr(s);
  };
  R.table = function (s) {
    var head = '<thead><tr>' + s.head.map(function (h) { return '<th scope="col">' + esc(h) + '</th>'; }).join('') + '</tr></thead>';
    var rows = s.rows.map(function (r) { return '<tr class="rv' + (r.hl ? ' hl' : '') + '"' + dc(r.c) + '>' + r.cells.map(function (c, i) { return i === 0 ? '<th scope="row" style="text-align:left;font:700 25px/1.3 var(--sans);padding:16px 18px;border-bottom:1px solid var(--line-l)">' + esc(c) + '</th>' : '<td>' + md(c) + '</td>'; }).join('') + '</tr>'; }).join('');
    var lead = s.lead ? '<p class="lead rv"' + dc(s.lead.c) + '>' + md(s.lead.t) + '</p>' : '';
    var tbl = '<table class="tbl">' + head + '<tbody>' + rows + '</tbody></table>';
    var body = s.img ? '<div class="tlwrap"><div>' + lead + tbl + (s.note ? '<p class="tblnote rv"' + dc(s.note.c) + '>' + md(s.note.t) + '</p>' : '') + '</div><div style="margin-top:30px;height:600px">' + img(s.img) + '</div></div>'
      : lead + tbl + (s.note ? '<p class="tblnote rv"' + dc(s.note.c) + '>' + md(s.note.t) + '</p>' : '');
    return hdr(false) + '<div class="cnt">' + kick(s) + title(s) + body + '</div>' + ftr(s);
  };
  R.timeline = function (s) {
    var n = s.items.length;
    var tl = '<div class="tl" style="grid-template-columns:repeat(' + n + ',1fr)">' + s.items.map(function (x) {
      return '<div class="it rv"' + dc(x.c) + '><div class="y">' + esc(x.y) + '</div><div class="h">' + esc(x.h) + '</div><div class="pp">' + esc(x.p) + '</div></div>';
    }).join('') + '</div>';
    var note = s.note ? '<p class="tblnote rv"' + dc(s.note.c) + ' style="margin-top:40px">' + md(s.note.t) + '</p>' : '';
    var lead = '<p class="lead rv" data-c="0" style="font-size:28px">' + esc(s.n[0]) + '</p>';
    return hdr(false) + '<div class="cnt">' + kick(s) + title(s) + '<div class="tlwrap' + (s.img ? '' : ' noimg') + '"><div>' + lead + tl + note + '</div>' + (s.img ? '<div style="height:600px;margin-top:10px">' + img(s.img) + '</div>' : '') + '</div></div>' + ftr(s);
  };
  R.thesis = function (s) {
    return '<div class="bg ph kb"><img src="media/img/' + s.img + '.webp" alt="' + esc(ALT[s.img] || '') + '"><i class="shade" aria-hidden="true"></i></div>' + hdr(true) +
      '<div class="panel">' + kick(s) + '<p class="lead rv" data-c="0" style="color:var(--mute-d)">' + esc(s.n[0]) + '</p><p class="big rv"' + dc(s.big.c) + '>' + md(s.big.t) + '</p>' +
      '<p class="ref rv"' + dc(s.big.c) + ' style="margin-top:16px;font-size:22px">' + esc(s.r) + '</p><p class="sub rv"' + dc(s.sub.c) + '>' + md(s.sub.t) + '</p></div>' + ftr(s);
  };
  R.triptych = function (s) {
    var cols = s.cols.map(function (x) {
      return '<div class="c rv z"' + dc(x.c) + '>' + (x.img ? img(x.img, null, '', true).replace('<img ', '<img style="object-position:' + (x.pos || '50% 50%') + '" ') : '<div class="ph"></div>') + '<div class="tx"><div class="w"><span>' + esc(x.w) + '</span></div><div class="h">' + esc(x.h) + '</div><div class="pp">' + esc(x.p) + '</div></div></div>';
    }).join('');
    var dark = !!DARK[s.type];
    return hdr(true) + '<div class="cnt">' + kick(s) + title(s) + '<div class="trip">' + cols + '</div>' + (s.foot ? '<p class="foot rv"' + dc(s.foot.c) + ' style="color:var(--mute-d)">' + md(s.foot.t) + '</p>' : '') + '</div>' + ftr(s);
  };
  R.media = function (s) {
    return hdr(true) + '<div class="cnt">' + kick(s) + title(s) + '<div class="media"><div>' + vid(s.video) + '</div><div>' + notes(s.notes) + '</div></div></div>' + ftr(s);
  };
  R.stats = function (s) {
    var n = s.stats.length;
    var cards = s.stats.map(function (x) {
      return '<div class="sc rv"' + dc(x.c) + (x.bar ? ' style="--w:' + x.bar + '%"' : '') + '><div class="v"><span>' + esc(x.v) + '</span></div><div class="pp">' + esc(x.p) + '</div>' +
        (x.bar ? '<div class="bar" aria-hidden="true"><i></i></div>' : '') + '<div class="ref">' + esc(x.r) + '</div>' + (x.lim ? '<div class="lim">' + esc(x.lim) + '</div>' : '') + '</div>';
    }).join('');
    var lead = '<p class="lead rv" data-c="0" style="font-size:28px">' + esc(s.n[0]) + '</p>';
    var grid = '<div class="stats" style="grid-template-columns:repeat(' + Math.min(n, s.img ? 3 : 5) + ',1fr)">' + cards + '</div>';
    var foot = s.foot ? '<p class="foot rv"' + dc(s.foot.c) + ' style="font-size:40px;margin-top:34px">' + md(s.foot.t) + '</p>' : '';
    return hdr(false) + '<div class="cnt">' + kick(s) + title(s) + (s.img ? '<div class="tlwrap" style="grid-template-columns:1fr 440px"><div>' + lead + grid + foot + '</div><div style="height:700px">' + img(s.img) + '</div></div>' : lead + grid + foot) + '</div>' + ftr(s);
  };
  R.map = function (s) {
    var rows = s.rows3.map(function (r) { return '<div class="row rv"' + dc(r.c) + '><div class="rh">' + esc(r.h) + '</div>' + r.items.map(function (t) { return '<div class="cell">' + esc(t) + '</div>'; }).join('') + '</div>'; }).join('');
    return hdr(false) + '<div class="cnt">' + kick(s) + title(s) + '<p class="lead rv" data-c="0" style="font-size:28px">' + esc(s.n[0]) + '</p><div class="map3">' + rows + '</div></div>' + ftr(s);
  };
  R.conclusion = function (s) {
    var M = ALL[s.id].m >= 0 ? MODS[ALL[s.id].m] : null;
    var open = s.open ? '<div class="open">' + s.open.map(function (o) { return '<div class="o rv"' + dc(o.c) + '><div class="h">' + esc(o.h) + '</div><div class="pp">' + esc(o.p) + '</div></div>'; }).join('') + '</div>' : '';
    var nextBtn = '';
    if (s.next) {
      var mi = ALL[s.id].m, tgt = s.next.m.indexOf('01') >= 0 ? 0 : s.next.m.indexOf('03') >= 0 ? 2 : 1;
      nextBtn = '<div class="next rv"' + dc(s.next.c) + '><div class="m"><span>' + esc(s.next.m.replace('Înapoi la ', '')) + '</span> pornește de aici</div><div class="qq">' + esc(s.next.t) + '</div></div>';
    }
    return hdr(true) + '<div class="cnt concl">' + kick(s) + title(s, 'l') + '<div class="grid"><div>' + open +
      (s.work ? '<p class="work rv"' + dc(s.work.c) + '>' + md(s.work.t) + '</p>' : '') + '<p class="big rv"' + dc(s.big.c) + '>' + md(s.big.t) + '</p></div>' + nextBtn + '</div></div>' + ftr(s);
  };
  R.functions = function (s) {
    return hdr(false) + '<div class="cnt">' + kick(s) + title(s) + '<p class="lead rv"' + dc(s.lead.c) + '>' + md(s.lead.t) + '</p><div class="fx">' +
      s.fx.map(function (f) { return '<div class="f rv"' + dc(f.c) + '><div class="n"><span>' + f.n + '</span></div><div class="h">' + esc(f.h) + '</div><div class="pp">' + esc(f.p) + '</div><div class="e">' + esc(f.e) + '</div></div>'; }).join('') +
      '</div><p class="foot rv"' + dc(s.foot.c) + ' style="font-size:38px;margin-top:40px">' + md(s.foot.t) + '</p></div>' + ftr(s);
  };
  R.two = function (s) {
    return hdr(false) + '<div class="cnt">' + kick(s) + title(s) + '<div class="two"><div class="fact">' + vid(s.video) + '<p class="ft rv"' + dc(s.fact.c) + '>' + esc(s.fact.t) + '</p></div>' +
      '<div class="side sa rv"' + dc(s.a.c) + '><div class="h">' + esc(s.a.h) + '</div><div class="pp">' + esc(s.a.p) + '</div><div class="ref">' + esc(s.a.r) + '</div></div>' +
      '<div class="side sb rv"' + dc(s.b.c) + '><div class="h">' + esc(s.b.h) + '</div><div class="pp">' + esc(s.b.p) + '</div><div class="ref">' + esc(s.b.r) + '</div></div></div>' +
      '<p class="foot rv"' + dc(s.foot.c) + ' style="font-size:36px">' + md(s.foot.t) + '</p></div>' + ftr(s);
  };
  R.diagram = function (s) {
    var d = s.d, h = '';
    if (d === 'athens') {
      h = '<div class="ath"><div><div class="inst">' + s.inst.map(function (x) { return '<div class="ic rv"' + dc(x.c) + '><div class="h">' + esc(x.h) + '</div><div class="pp">' + esc(x.p) + '</div></div>'; }).join('') + '</div>' +
        '<div class="cz rv"' + dc(s.center.c) + '><div class="h">' + esc(s.center.h) + '</div><div class="pp">' + esc(s.center.p) + '</div><div class="ref" style="color:var(--ink);margin-top:8px">' + esc(s.center.r) + '</div></div>' +
        '<p class="id rv"' + dc(s.foot.c) + '><b>' + esc(s.foot.h) + '</b> · ' + esc(s.foot.p) + ' <span class="ref">(' + esc(s.foot.r) + ')</span></p></div><div style="height:780px">' + img(s.img) + '</div></div>';
    } else if (d === 'axes2') {
      h = '<div class="ax2"><div class="q2 rv"' + dc(s.q2[0].c) + '><span class="o">' + esc(s.q2[0].t) + '</span><span class="or">sau</span><span class="o">' + esc(s.q2[1].t) + '</span></div>' +
        axis(s.ax1, 'Prima axă: ce este libertatea?') + axis(s.ax2, 'A doua axă: individul și comunitatea') +
        '<div class="warn rv"' + dc(s.warn.c) + '>' + md(s.warn.t) + '</div></div>';
    } else if (d === 'stairs') {
      var W = 1728, bw = 330, step = (W - bw) / 4;
      h = '<p class="lead rv" data-c="1" style="font-size:28px">Fiecare regim cade prin <em class="ki">excesul</em> propriului principiu.</p><div class="stairs">' + s.steps.map(function (x, i) {
        return '<div class="s rv' + (i === 4 ? ' last' : '') + '"' + dc(x.c) + ' style="left:' + Math.round(i * step) + 'px;top:' + (i * 92) + 'px"><div class="h">' + esc(x.h) + '</div><div class="w">' + esc(x.w) + '</div><span class="pr">' + esc(x.p) + '</span><div class="x">↘ ' + esc(x.x) + '</div><div class="ref">' + esc(x.r) + '</div></div>';
      }).join('') + '</div>';
    } else if (d === 'axis') {
      h = '<div class="res3">' + s.res.map(function (r) { return '<div class="r rv"' + dc(r.c) + '><div class="n">' + r.n + '</div><div class="t">' + md(r.t) + '</div><div class="ref" style="margin-top:6px">' + esc(r.r) + '</div></div>'; }).join('') + '</div>' +
        '<div class="axisline"><div class="ut rv"' + dc(s.utopia.c) + '><div class="h">' + esc(s.utopia.h) + '</div><small>' + esc(s.utopia.p) + '</small></div>' +
        '<div class="line rv"' + dc(s.axisL.c) + '></div><span class="tick rv" ' + dc(s.axisL.c) + ' style="left:0"></span><span class="tick rv"' + dc(s.axisL.c) + ' style="right:0"></span>' +
        '<div class="mid rv"' + dc(s.axisM.c) + '>' + esc(s.axisM.h) + '</div>' +
        '<div class="end rv"' + dc(s.axisL.c) + ' style="left:0">' + esc(s.axisL.h) + '<small>' + esc(s.axisL.p) + '</small></div>' +
        '<div class="end r rv"' + dc(s.axisR.c) + '>' + esc(s.axisR.h) + '<small>' + esc(s.axisR.p) + '</small></div></div>';
    } else if (d === 'compass') {
      h = '<div class="compwrap"><div><p class="lead rv" data-c="0" style="font-size:28px">' + esc(s.n[0]) + '</p><div class="warn rv"' + dc(s.warn.c) + ' style="margin-top:30px">' + md(s.warn.t) + '</div></div>' +
        '<div style="padding:60px 160px 60px">' + compass(s, true) + '</div></div>';
    }
    var themeDark = s.d === 'axis';
    return hdr(themeDark) + '<div class="cnt">' + kick(s) + title(s) + '<div class="dgm">' + h + '</div></div>' + ftr(s);
  };
  function axis(a, hd) {
    return '<div class="axis rv"' + dc(a.c) + '><div class="h">' + esc(hd) + '</div><div class="ln"><div class="end">' + esc(a.a) + '<small>' + esc(a.ap) + '</small></div><div class="bar"></div><div class="end r' + (a.c2 !== undefined ? ' rv" data-c="' + a.c2 : '') + '">' + esc(a.b) + '<small>' + esc(a.bp) + '</small></div></div><div class="ref">' + esc(a.r) + '</div></div>';
  }
  function compass(s, labelsCue) {
    var x = s.axX, y = s.axY;
    return '<div class="compass" role="img" aria-label="Busola ideologiilor: axa orizontală de la ' + esc(x.a) + ' la ' + esc(x.b) + '; axa verticală de la ' + esc(y.a) + ' la ' + esc(y.b) + '">' +
      '<div class="q qtl"></div><div class="q qtr"></div><div class="q qbl"></div><div class="q qbr"></div><div class="vx rv"' + (labelsCue ? dc(x.c) : '') + '></div><div class="vy rv"' + (labelsCue ? dc(y.c) : '') + '></div>' +
      '<span class="lab lab-l rv"' + (labelsCue ? dc(x.c) : '') + '>' + esc(x.a) + '</span><span class="lab lab-r rv"' + (labelsCue ? dc(x.c) : '') + '>' + esc(x.b) + '</span>' +
      '<span class="lab lab-t rv"' + (labelsCue ? dc(y.c) : '') + '>' + esc(y.a) + '</span><span class="lab lab-b rv"' + (labelsCue ? dc(y.c) : '') + '>' + esc(y.b) + '</span></div>';
  }
  R.biblio = function (s) {
    var mi = ALL[s.id].m, B = C.bib[MODS[mi].id], tch = (CFG.bibSupl && CFG.bibSupl[MODS[mi].id]) || [];
    var lst = (tch.length ? '<div class="tch"><h2>Recomandate de profesor</h2><ol>' + tch.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ol></div>' : '') +
      B.map(function (sec) { return '<h2>' + esc(sec.h) + '</h2><ol>' + sec.items.map(function (t) { return '<li>' + mdItal(t) + '</li>'; }).join('') + '</ol>'; }).join('');
    return hdr(false) + '<div class="cnt">' + kick(s) + title(s) + '<div class="bib"><div class="lst" tabindex="0" aria-label="Bibliografia modulului">' + lst + '</div>' +
      '<div class="mine"><div class="h">Notițele mele de lectură</div><p class="pp">Spațiu pentru lecturile tale: o carte, un articol, o pagină. Rămân salvate pe acest dispozitiv sau în LMS.</p>' +
      '<form data-notes="' + MODS[mi].id + '"><label class="sr" for="nt-' + mi + '">Adaugă o lectură</label><input id="nt-' + mi + '" maxlength="300" placeholder="Autor, titlu, editură, an" autocomplete="off"><button class="b ink" type="submit">Adaugă</button></form>' +
      '<ul class="nlist"></ul><div class="acts"><button class="b" type="button" data-act="copybib" data-m="' + mi + '">Copiază bibliografia</button><button class="b" type="button" data-act="hub">Înapoi la module</button></div></div></div></div>' + ftr(s);
  };
  function mdItal(t) { return esc(t).replace(/\*([^*]+)\*/g, '<i>$1</i>'); }
  R.final = function (s) {
    var sc = quizScore();
    return hdr(true) + '<div class="cnt final"><div class="grid"><div>' + kick(s) +
      '<p class="big rv" data-c="0">Ai citit <span class="mk">cetatea</span>.</p>' +
      '<div class="res rv" data-c="0"><div><b>01</b>natura umană și comunitatea</div><div><b>02</b>regimurile politice</div><div><b>03</b>ideologiile politice</div></div>' +
      '<p class="q rv" data-c="1">Fiecare răspuns pornește de la o concepție despre om. Întrebarea rămâne deschisă: și a ta.</p>' +
      '<div class="credits rv" data-c="2"><b>Conținut: ' + esc(C.contentAuthor) + '</b> (fișele de studiu și fișele de lucru 1–3). <b>E-learning: Gelu-Emanuel Cebzan · LEETUCATION SRL</b>, în proiectul <i>Urban Instances V3 · Cetatea citită</i>.<br>' +
      'Vocea: clonată cu acordul vorbitorului, ElevenLabs v4 prin Magnific. Imagini și clipuri: generate cu IA în Magnific; bustul lui Aristotel: Freepik. Fonturi: Instrument Serif, Schibsted Grotesk.' +
      (sc.total ? '<br>Verificări: ' + sc.ok + ' din ' + sc.total + ' răspunsuri corecte la prima încercare.' : '') + '</div>' +
      '<div class="logos rv" data-c="3"><img src="media/brand/cp_logo_alb.png" alt="Finanțat de Municipiul Timișoara prin Centrul de Proiecte și Administrația pentru Sănătate și Educație"><img src="media/brand/semnatura_alb.png" alt="Urban Instances V3 · Cetatea citită" style="height:64px"></div>' +
      '<div style="display:flex;gap:14px;margin-top:30px"><button class="b pri" type="button" data-act="hub">Înapoi la module</button><button class="b" type="button" data-act="res">Resurse</button>' + (SCO.ok ? '<button class="b" type="button" data-act="exit">Ieși din curs</button>' : '') + '</div></div>' +
      '<div class="lt rv z" data-c="2"><span class="lg"><span class="flame" aria-hidden="true"></span><img src="media/brand/leetucation_v2.svg" alt="LEETUCATION"></span><div class="who"><b>Gelu-Emanuel Cebzan</b>LEETUCATION SRL · Timișoara</div></div></div></div>' +
      '<p class="fund">' + esc(C.funding) + '</p>';
  };

  /* ---------- exerciții ---------- */
  var EX = {};
  R.ex = function (s) { return hdr(false) + '<div class="cnt">' + kick(s) + title(s) + '<p class="ex inst rv" data-c="0">' + esc(s.n[0]) + (s.n[1] ? ' ' + esc(s.n[1]) : '') + '</p>' + EX[s.ex].html(s) + '</div>' + ftr(s); };
  function exState(s) { return st.ex[s.id] || (st.ex[s.id] = {}); }
  function live(root, txt, ok) { var f = $('.fb', root); if (!f) return; f.className = 'fb ' + (ok === true ? 'ok' : ok === false ? 'no' : ''); f.innerHTML = txt; }

  EX.sort = {
    html: function (s) {
      return '<div class="sortg"><div class="pool" role="group" aria-label="Afirmații">' + s.items.map(function (it, i) { return '<button class="tok" type="button" data-i="' + i + '" aria-pressed="false">' + esc(it.t) + '</button>'; }).join('') + '</div>' +
        '<div><div class="cols3">' + s.colsEx.map(function (c, j) { return '<button class="dz" type="button" data-j="' + j + '" aria-label="Pune afirmația la ' + esc(c) + '"><span class="dh">' + esc(c) + '<small></small></span><span class="pl"></span></button>'; }).join('') + '</div>' +
        '<div class="fb" role="status" aria-live="polite">Alege o afirmație din stânga.</div></div></div>';
    },
    init: function (root, s) {
      var E = exState(s); E.p = E.p || {}; E.miss = E.miss || {};
      var sel = null;
      function paint() {
        $$('.tok', root).forEach(function (b) { var i = +b.dataset.i; var placed = E.p[i] !== undefined; b.hidden = placed; b.setAttribute('aria-pressed', sel === i ? 'true' : 'false'); });
        $$('.dz', root).forEach(function (z) {
          var j = +z.dataset.j, items = [];
          for (var i in E.p) if (E.p[i] === j) items.push(s.items[i].t);
          $('.pl', z).innerHTML = items.map(function (t) { return '<span class="placed" style="display:block;margin-top:8px">' + esc(t) + '</span>'; }).join('');
          $('.dh small', z).textContent = items.length ? items.length + ' / 3' : '';
          z.classList.toggle('armed', sel !== null);
        });
        var n = Object.keys(E.p).length;
        if (n === s.items.length) live(root, '<b>Gata: ' + n + ' din ' + n + '.</b> ' + (Object.keys(E.miss).length ? 'Ai avut nevoie de a doua încercare la ' + Object.keys(E.miss).length + '.' : 'Totul corect din prima.') + ' Mergi mai departe cu Înainte.', true);
      }
      $$('.tok', root).forEach(function (b) { b.addEventListener('click', function () { sel = +b.dataset.i; paint(); live(root, 'Acum alege coloana pentru: „' + esc(s.items[sel].t) + '”'); var z = $('.dz', root); if (z) z.focus(); }); });
      $$('.dz', root).forEach(function (z) {
        z.addEventListener('click', function () {
          if (sel === null) { live(root, 'Alege întâi o afirmație din stânga.'); return; }
          var it = s.items[sel], j = +z.dataset.j;
          if (it.a === j) { E.p[sel] = j; live(root, '<b>Corect.</b> ' + esc(it.f), true); sel = null; }
          else if (!E.miss[sel]) { E.miss[sel] = 1; live(root, '<b>Nu chiar.</b> Recitește afirmația și mai încearcă o dată.', false); }
          else { E.p[sel] = it.a; live(root, '<b>Răspunsul: ' + esc(s.colsEx[it.a]) + '.</b> ' + esc(it.f), false); sel = null; }
          save(); paint();
          var nb = $('.tok:not([hidden])', root); if (nb && sel === null) nb.focus();
        });
      });
      paint();
    }
  };
  EX.dilemma = {
    html: function (s) {
      return '<div class="dil"><div class="scene rv" data-c="0">' + esc(s.scene) + '</div>' + s.items.map(function (it, i) {
        return '<div class="it rv" data-c="1" data-i="' + i + '"><div class="who">' + esc(it.who) + '</div><div class="say">' + esc(it.t) + '</div><div class="opts" role="group" aria-label="Viziunea lui ' + esc(it.who) + '">' +
          s.opts.map(function (o, j) { return '<button class="opt" type="button" data-j="' + j + '">' + esc(o) + '</button>'; }).join('') + '</div><div class="fbi" role="status" aria-live="polite"></div></div>';
      }).join('') + '</div>';
    },
    init: function (root, s) { choiceInit(root, s, '.dil .it'); }
  };
  EX.diagnose = {
    html: function (s) {
      return '<div class="diag">' + s.items.map(function (it, i) {
        return '<div class="it" data-i="' + i + '"><div class="nm">' + ['Alfa', 'Beta', 'Gama', 'Delta', 'Epsilon', 'Zeta'][i] + '</div><div class="t">' + esc(it.t) + '</div><div class="opts" role="group" aria-label="Regimul cetății ' + (i + 1) + '">' +
          it.o.map(function (o, j) { return '<button class="opt" type="button" data-j="' + j + '">' + esc(o) + '</button>'; }).join('') + '</div><div class="fbi" role="status" aria-live="polite"></div></div>';
      }).join('') + '</div>';
    },
    init: function (root, s) { choiceInit(root, s, '.diag .it'); }
  };
  function choiceInit(root, s, sel) {
    var E = exState(s); E.a = E.a || {};
    $$(sel, root).forEach(function (box) {
      var i = +box.dataset.i, it = s.items[i];
      function paint() {
        var a = E.a[i];
        $$('.opt', box).forEach(function (b) {
          var j = +b.dataset.j; b.classList.remove('right', 'wrong'); b.removeAttribute('aria-pressed');
          if (a && a.done) { if (j === it.a) b.classList.add('right'); else if (a.tried && a.tried.indexOf(j) >= 0) b.classList.add('wrong'); b.setAttribute('aria-disabled', 'true'); }
          else if (a && a.tried && a.tried.indexOf(j) >= 0) b.classList.add('wrong');
        });
        var f = $('.fbi', box);
        if (a && a.done) f.innerHTML = (a.first ? '<b>Corect.</b> ' : '<b>Răspunsul corect: ' + esc((it.o || s.opts)[it.a]) + '.</b> ') + esc(it.f);
        else if (a && a.tried && a.tried.length) f.innerHTML = '<b>Nu chiar.</b> Mai încearcă.';
      }
      $$('.opt', box).forEach(function (b) {
        b.addEventListener('click', function () {
          var a = E.a[i] || (E.a[i] = { tried: [] });
          if (a.done) return;
          var j = +b.dataset.j;
          if (j === it.a) { a.done = 1; a.first = a.tried.length === 0 ? 1 : 0; }
          else { if (a.tried.indexOf(j) < 0) a.tried.push(j); if (a.tried.length >= 2) a.done = 1; }
          save(); paint();
        });
      });
      paint();
    });
  }
  EX.sequence = {
    html: function (s) {
      return '<div class="seq"><div><ol aria-label="Ordinea regimurilor"></ol><div class="act"><button class="b ink" type="button" data-a="chk">Verifică</button><button class="b" type="button" data-a="show">Arată ordinea lui Platon</button></div></div>' +
        '<div><div class="fb" role="status" aria-live="polite">Mută regimurile cu săgețile ↑ ↓.</div><p class="p rv" data-c="1" style="margin-top:20px;color:var(--mute-l)">Indiciu: fiecare regim se naște din excesul celui dinainte. Începe cu regimul în care conduc filosofii.</p></div></div>';
    },
    init: function (root, s) {
      var E = exState(s); if (!E.o) E.o = s.shuffle.slice();
      var ol = $('ol', root);
      function paint(check) {
        ol.innerHTML = E.o.map(function (k, pos) {
          var it = s.items[k], cls = check ? (k === pos ? 'ok' : 'bad') : '';
          return '<li class="' + cls + '"><span class="ix">' + (pos + 1) + '</span><span class="nm">' + esc(it.t) + '<small>' + esc(it.p) + '</small></span><span class="mv"><button type="button" data-k="' + pos + '" data-d="-1" aria-label="Mută ' + esc(it.t) + ' mai sus"' + (pos === 0 ? ' disabled' : '') + '>↑</button><button type="button" data-k="' + pos + '" data-d="1" aria-label="Mută ' + esc(it.t) + ' mai jos"' + (pos === E.o.length - 1 ? ' disabled' : '') + '>↓</button></span></li>';
        }).join('');
        $$('.mv button', ol).forEach(function (b) {
          b.addEventListener('click', function () {
            var p = +b.dataset.k, d = +b.dataset.d, q = p + d; if (q < 0 || q >= E.o.length) return;
            var t = E.o[p]; E.o[p] = E.o[q]; E.o[q] = t; save(); paint(false);
            var nb = $$('.mv button', ol).filter(function (x) { return +x.dataset.k === q && +x.dataset.d === d; })[0] || $$('.mv button', ol).filter(function (x) { return +x.dataset.k === q; })[0];
            if (nb && !nb.disabled) nb.focus();
          });
        });
      }
      $('[data-a=chk]', root).addEventListener('click', function () {
        var ok = E.o.filter(function (k, p) { return k === p; }).length;
        E.tries = (E.tries || 0) + 1; save(); paint(true);
        if (ok === E.o.length) live(root, '<b>Corect: ordinea lui Platon.</b> ' + esc(s.f), true);
        else live(root, '<b>' + ok + ' din ' + E.o.length + ' la locul lor.</b> Cele marcate cu galben sunt corecte. Mută-le pe celelalte și verifică din nou.', false);
      });
      $('[data-a=show]', root).addEventListener('click', function () { E.o = [0, 1, 2, 3, 4]; save(); paint(true); live(root, '<b>Ordinea lui Platon.</b> ' + esc(s.f), true); });
      paint(false);
    }
  };
  EX.grid = {
    html: function (s) {
      var cells = '';
      cells += '<div></div>' + s.colsH.map(function (c) { return '<div class="hd">' + esc(c) + '</div>'; }).join('');
      s.rowsH.forEach(function (r, ri) { cells += '<div class="rh">' + esc(r) + '</div>' + s.colsH.map(function (c, ci) { return '<button class="cell" type="button" data-r="' + ri + '" data-c2="' + ci + '" data-lb="' + esc(r) + ', ' + esc(c) + '" aria-label="' + esc(r) + ', ' + esc(c) + ', liberă"></button>'; }).join(''); });
      return '<div class="gridx"><div><div class="tokrow">' + s.tokens.map(function (t, i) { return '<button class="tok" type="button" data-i="' + i + '" aria-pressed="false">' + esc(t.t) + '</button>'; }).join('') + '</div>' +
        '<div class="fb" role="status" aria-live="polite">Alege un regim.</div><p class="ref" style="margin-top:14px">' + esc(s.ref) + '</p></div><div><div class="gx">' + cells + '</div></div></div>';
    },
    init: function (root, s) {
      var E = exState(s); E.p = E.p || {}; E.miss = E.miss || {}; var sel = null;
      function paint() {
        $$('.tok', root).forEach(function (b) { var i = +b.dataset.i; b.hidden = E.p[i] !== undefined; b.setAttribute('aria-pressed', sel === i ? 'true' : 'false'); });
        $$('.cell', root).forEach(function (c) {
          var r = +c.dataset.r, k = +c.dataset.c2, found = null;
          for (var i in E.p) { var t = s.tokens[i]; if (t.r === r && t.col === k) found = t; }
          c.textContent = found ? found.t : ''; c.setAttribute('aria-label', c.dataset.lb + (found ? ': ' + found.t : ', liberă')); c.classList.toggle('filled', !!found); c.classList.toggle('dev', !!found && k === 1); c.classList.toggle('armed', sel !== null && !found);
        });
        if (Object.keys(E.p).length === s.tokens.length) live(root, '<b>Tabelul este complet.</b> ' + esc(s.f), true);
      }
      $$('.tok', root).forEach(function (b) { b.addEventListener('click', function () { sel = +b.dataset.i; paint(); live(root, 'Unde pui <b>' + esc(s.tokens[sel].t) + '</b>? Alege căsuța.'); }); });
      $$('.cell', root).forEach(function (c) {
        c.addEventListener('click', function () {
          if (sel === null) { live(root, 'Alege întâi un regim din stânga.'); return; }
          var t = s.tokens[sel], r = +c.dataset.r, k = +c.dataset.c2;
          if (t.r === r && t.col === k) { E.p[sel] = 1; live(root, '<b>Corect:</b> ' + esc(t.t) + ' — ' + esc(s.rowsH[r].toLowerCase()) + ', ' + (k ? 'formă deviată.' : 'formă dreaptă.'), true); sel = null; }
          else if (!E.miss[sel]) { E.miss[sel] = 1; live(root, '<b>Nu chiar.</b> Întreabă-te: câți conduc și în folosul cui?', false); }
          else { E.p[sel] = 1; live(root, '<b>' + esc(t.t) + '</b> stă la: ' + esc(s.rowsH[t.r]) + ', ' + (t.col ? 'forma deviată.' : 'forma dreaptă.'), false); sel = null; }
          save(); paint();
        });
      });
      paint();
    }
  };
  EX.compass = {
    html: function (s) {
      return '<div class="compwrap" style="grid-template-columns:600px 1fr"><div><div class="tokrow">' + s.tokens.map(function (t, i) { return '<button class="tok" type="button" data-i="' + i + '" aria-pressed="false">' + esc(t.t) + '</button>'; }).join('') + '</div>' +
        '<div class="fb" role="status" aria-live="polite">Alege o ideologie, apoi un cadran.</div></div>' +
        '<div style="padding:50px 170px 50px;position:relative">' + compass({ axX: s.axX, axY: s.axY }, false).replace(' role="img" aria-label="Busola', ' role="group" aria-label="Busola').replace(/<div class="q (qtl|qtr|qbl|qbr)"><\/div>/g, function (m, q) {
          var idx = { qtl: 0, qtr: 1, qbl: 2, qbr: 3 }[q];
          return '<button class="q ' + q + ' qb" type="button" data-q="' + idx + '" aria-label="Cadranul ' + s.quads[idx] + '"><span class="ql" style="display:flex;flex-wrap:wrap;gap:8px;padding:16px;align-content:flex-start;height:100%"></span></button>';
        }) + '</div></div>';
    },
    init: function (root, s) {
      $$('.rv', root).forEach(function (e) { e.classList.add('on'); });
      var E = exState(s); E.p = E.p || {}; var sel = null;
      function paint() {
        $$('.tok', root).forEach(function (b) { var i = +b.dataset.i; b.setAttribute('aria-pressed', sel === i ? 'true' : 'false'); b.classList.toggle('done', E.p[i] !== undefined); });
        $$('.qb', root).forEach(function (q) {
          var k = +q.dataset.q, h = '';
          for (var i in E.p) if (E.p[i] === k) h += '<span style="font:700 19px var(--sans);background:' + (s.tokens[i].ok.indexOf(k) >= 0 ? 'var(--marker)' : '#fff') + ';color:var(--ink);padding:6px 10px;border:2px solid var(--ink)">' + esc(s.tokens[i].t) + '</span>';
          $('.ql', q).innerHTML = h;
          var names = []; for (var j in E.p) if (E.p[j] === k) names.push(s.tokens[j].t);
          q.setAttribute('aria-label', 'Cadranul ' + s.quads[k] + (names.length ? ': ' + names.join(', ') : ''));
        });
      }
      $$('.tok', root).forEach(function (b) { b.addEventListener('click', function () { sel = +b.dataset.i; paint(); live(root, 'Unde așezi <b>' + esc(s.tokens[sel].t) + '</b>? Alege un cadran.'); }); });
      $$('.qb', root).forEach(function (q) {
        q.addEventListener('click', function () {
          if (sel === null) { live(root, 'Alege întâi o ideologie.'); return; }
          var t = s.tokens[sel], k = +q.dataset.q; E.p[sel] = k; save();
          live(root, (t.ok.indexOf(k) >= 0 ? '<b>Potrivit.</b> ' : '<b>Mai gândește-te.</b> ') + esc(t.f), t.ok.indexOf(k) >= 0);
          sel = null; paint();
        });
      });
      paint();
    }
  };
  EX.signs = {
    html: function (s) {
      return '<div class="signs">' + s.items.map(function (it, i) {
        return '<div class="it" data-i="' + i + '"><div class="t">' + esc(it.t) + '</div><div class="chips" role="group" aria-label="Semnele din declarația ' + (i + 1) + '">' +
          s.signs.map(function (g, j) { return '<button class="chipb" type="button" data-j="' + j + '" aria-pressed="false">' + (j + 1) + '. ' + esc(g) + '</button>'; }).join('') +
          '<button class="chk" type="button">Verifică</button></div><div class="fbi" role="status" aria-live="polite"></div></div>';
      }).join('') + '</div>';
    },
    init: function (root, s) {
      var E = exState(s); E.a = E.a || {};
      $$('.signs .it', root).forEach(function (box) {
        var i = +box.dataset.i, it = s.items[i], A = E.a[i] || (E.a[i] = { on: [] });
        function paint() {
          $$('.chipb', box).forEach(function (b) { var j = +b.dataset.j; b.setAttribute('aria-pressed', A.on.indexOf(j) >= 0 ? 'true' : 'false'); b.classList.toggle('must', !!A.chk && it.a.indexOf(j) >= 0); });
          var f = $('.fbi', box);
          if (A.chk) {
            var ok = A.on.length === it.a.length && A.on.every(function (j) { return it.a.indexOf(j) >= 0; });
            f.classList.add('on'); f.innerHTML = (ok ? '<b>Corect.</b> ' : '<b>Nu chiar.</b> Semnele marcate cu galben sunt cele care se potrivesc. ') + esc(it.f);
          }
        }
        $$('.chipb', box).forEach(function (b) { b.addEventListener('click', function () { var j = +b.dataset.j, k = A.on.indexOf(j); if (k >= 0) A.on.splice(k, 1); else A.on.push(j); A.chk = 0; save(); paint(); $('.fbi', box).classList.remove('on'); }); });
        $('.chk', box).addEventListener('click', function () { A.chk = 1; if (A.first === undefined) A.first = (A.on.length === it.a.length && A.on.every(function (j) { return it.a.indexOf(j) >= 0; })) ? 1 : 0; save(); paint(); });
        paint();
      });
    }
  };
  R.quiz = function (s) {
    return hdr(false) + '<div class="cnt">' + kick(s) + title(s) + '<div class="qz"><div class="qmain" aria-live="polite"></div><div class="side"><div class="h">Progres</div><div class="dots"></div><div class="sum"></div><p class="pp">Verificarea nu se notează. Explicația apare după fiecare răspuns; contează prima încercare.</p></div></div></div>' + ftr(s);
  };
  function quizInit(root, s) {
    var A = st.q[s.id] || (st.q[s.id] = s.qs.map(function () { return null; }));
    var cur = A.indexOf(null); if (cur < 0) cur = 0;
    var main = $('.qmain', root);
    function dots() {
      $('.dots', root).innerHTML = s.qs.map(function (q, i) { return '<i class="' + (A[i] === 1 ? 'ok' : A[i] === 0 ? 'no' : '') + (i === cur ? ' cur' : '') + '">' + (i + 1) + '</i>'; }).join('');
      var done = A.filter(function (x) { return x !== null; }).length, ok = A.filter(function (x) { return x === 1; }).length;
      $('.sum', root).textContent = done ? ok + ' din ' + done + ' corecte' : '0 din ' + s.qs.length;
    }
    function show(i) {
      cur = i; var q = s.qs[i];
      main.innerHTML = '<div class="qn"><span>Întrebarea ' + (i + 1) + ' din ' + s.qs.length + '</span></div><div class="qq">' + esc(q.q) + '</div><div class="ol" role="group" aria-label="Variante de răspuns">' +
        q.o.map(function (o, j) { return '<button class="opt" type="button" data-j="' + j + '">' + String.fromCharCode(97 + j) + ') ' + esc(o) + '</button>'; }).join('') + '</div><div class="fb" role="status"></div><div class="qnav" style="display:flex;gap:12px;margin-top:16px"></div>';
      var answered = A[i] !== null;
      function finish(j) {
        $$('.opt', main).forEach(function (b) { var k = +b.dataset.j; if (k === q.a) b.classList.add('right'); else if (k === j) b.classList.add('wrong'); b.setAttribute('aria-disabled', 'true'); });
        var f = $('.fb', main); f.className = 'fb ' + (j === q.a ? 'ok' : 'no'); f.innerHTML = (j === q.a ? '<b>Corect.</b> ' : '<b>Nu chiar. Răspunsul corect: ' + String.fromCharCode(97 + q.a) + '.</b> ') + esc(q.f);
        var nav = $('.qnav', main);
        nav.innerHTML = (i < s.qs.length - 1 ? '<button class="b ink" type="button" data-n="1">Întrebarea următoare</button>' : '<button class="b ink" type="button" data-n="end">Mergi mai departe</button>') + (i > 0 ? '<button class="b" type="button" data-n="-1">Înapoi</button>' : '');
        var nb = $('[data-n="1"],[data-n="end"]', nav);
        $$('button', nav).forEach(function (b) { b.addEventListener('click', function () { var n = b.dataset.n; if (n === 'end') { goNext(); } else show(cur + (+n)); }); });
        if (nb) nb.focus();
      }
      $$('.opt', main).forEach(function (b) { b.addEventListener('click', function () { if (A[i] !== null && A[i] !== undefined && b.getAttribute('aria-disabled')) return; var j = +b.dataset.j; if (A[i] === null) { A[i] = j === q.a ? 1 : 0; save(); } finish(j); dots(); }); });
      if (answered) finish(q.a);
      dots();
    }
    show(cur);
  }

  /* ---------- randare, navigare ---------- */
  var stageEl, scrEl, au, capEl, curId = null, cues = [], shown = -1, raf = 0, autoplayOk = true, firstVisit = false;
  function theme(s) { if (s.type === 'diagram' && s.d === 'axis') return 'dark'; return DARK[s.type] ? 'dark' : 'light'; }
  function go(id, opt) {
    opt = opt || {};
    if (!ALL[id]) id = '0.2';
    var s = ALL[id].s;
    stopAudio();
    var wasVisited = !!st.vis[id];
    firstVisit = !wasVisited;
    curId = id; st.loc = id; st.vis[id] = 1;
    var R0 = ALL[id];
    if (R0.m >= 0 && R0.i === MODS[R0.m].screens.length - 1) st.done[R0.m] = 1;
    save();
    var el = document.createElement('section');
    el.className = 'scr enter ' + theme(s) + ' ty-' + s.type;
    el.setAttribute('aria-labelledby', 't-' + id.replace('.', '-'));
    var html = (R[s.type] || R.concept)(s);
    el.innerHTML = html;
    $$('[data-c]', el).forEach(function (e) { if (!e.classList.contains('imark') && !e.classList.contains('ilab') && !e.classList.contains('rv')) e.classList.add('rv'); });
    stageEl.replaceChild(el, scrEl); scrEl = el;
    bindScreen(el, s);
    if (s.type === 'ex' && EX[s.ex] && EX[s.ex].init) EX[s.ex].init(el, s);
    if (s.type === 'quiz') quizInit(el, s);
    if (s.type === 'biblio') notesInit(el, s);
    if (s.type === 'ws') wsBind(el, ALL[id].m, null, false);
    setTimeout(function () { el.classList.add('shown'); }, 250);
    updateBar(s);
    var v = VO[id];
    if (v) {
      cues = v.cues; shown = -1;
      au.src = v.file; au.playbackRate = prefs.rate; au.muted = prefs.mute;
      if (firstVisit && !opt.noplay) { reveal(0); play(); }
      else { revealAll(); setPlayIcon(false); }
    } else { cues = []; revealAll(); setPlayIcon(false); }
    var h1 = $('h1', el); if (h1 && opt.focus !== false) { h1.setAttribute('tabindex', '-1'); try { h1.focus({ preventScroll: true }); } catch (e) {} }
    if (document.documentElement.classList.contains('m')) window.scrollTo(0, 0);
    $('#ctlbar .next').classList.remove('pulse');
    startVideos(el);
  }
  function bindScreen(el, s) {
    $$('[data-go]', el).forEach(function (b) { b.addEventListener('click', function () { userGesture(); go(b.dataset.go); }); });
    $$('[data-mod]', el).forEach(function (b) { b.addEventListener('click', function () { userGesture(); goModule(+b.dataset.mod); }); });
    $$('[data-act]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        var a = b.dataset.act;
        if (a === 'hub') go('0.2'); else if (a === 'res') openRes(); else if (a === 'copybib') copyBib(+b.dataset.m); else if (a === 'exit') exitCourse(); else if (a === 'ws') openWs();
      });
    });
  }
  function startVideos(el) {
    $$('video', el).forEach(function (v) {
      var btn = v.parentNode.querySelector('.vctl');
      if (reduce) { v.removeAttribute('autoplay'); if (btn) { btn.textContent = 'Pornește clipul'; btn.setAttribute('aria-pressed', 'true'); } }
      else { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      if (btn) btn.addEventListener('click', function () {
        if (v.paused) { v.play(); btn.textContent = 'Oprește clipul'; btn.setAttribute('aria-pressed', 'false'); }
        else { v.pause(); btn.textContent = 'Pornește clipul'; btn.setAttribute('aria-pressed', 'true'); }
      });
    });
  }
  function goModule(mi) {
    var sc = MODS[mi].screens, tgt = sc[0].id;
    if (!st.done[mi]) { for (var i = 0; i < sc.length; i++) { if (!st.vis[sc[i].id]) { tgt = i === 0 ? sc[0].id : sc[i].id; break; } } }
    go(tgt);
  }
  function nextId(id) {
    var R0 = ALL[id];
    if (id === '0.0') return '0.1';
    if (id === '0.1') return '0.2';
    if (id === '0.2') { for (var m = 0; m < 3; m++) if (!st.done[m]) return firstUnvisited(m); return '9.0'; }
    if (id === '9.0') return null;
    var sc = MODS[R0.m].screens;
    if (R0.i < sc.length - 1) return sc[R0.i + 1].id;
    return allDone() ? '9.0' : '0.2';
  }
  function firstUnvisited(m) { var sc = MODS[m].screens; for (var i = 0; i < sc.length; i++) if (!st.vis[sc[i].id]) return sc[i].id; return sc[0].id; }
  function prevId(id) {
    var R0 = ALL[id];
    if (id === '0.1') return '0.0';
    if (id === '0.2') return '0.1';
    if (id === '9.0') return '0.2';
    if (R0.m >= 0) return R0.i > 0 ? MODS[R0.m].screens[R0.i - 1].id : '0.2';
    return null;
  }
  function goNext() { userGesture(); var n = nextId(curId); if (n) go(n); }
  function goPrev() { userGesture(); var p = prevId(curId); if (p) go(p); }

  /* ---------- voce și cue-uri ---------- */
  function play() {
    if (!VO[curId]) return;
    var p = au.play();
    setPlayIcon(true);
    if (p && p.catch) p.catch(function () { autoplayOk = false; setPlayIcon(false); revealAll(); });
    loop();
  }
  function stopAudio() { try { au.pause(); } catch (e) {} cancelAnimationFrame(raf); }
  function loop() {
    cancelAnimationFrame(raf);
    var tick = function () {
      var t = au.currentTime;
      for (var i = shown + 1; i < cues.length; i++) { if (t + 0.18 >= cues[i]) reveal(i); else break; }
      updTime();
      if (!au.paused && !au.ended) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  function reveal(i) {
    for (var k = shown + 1; k <= i; k++) $$('[data-c="' + k + '"]', scrEl).forEach(function (e) { e.classList.add('on'); });
    $$('.cur', scrEl).forEach(function (e) { e.classList.remove('cur'); });
    $$('.card[data-c="' + i + '"]', scrEl).forEach(function (e) { e.classList.add('cur'); });
    shown = Math.max(shown, i);
    var s = ALL[curId].s;
    if (s.n && s.n[i] && prefs.cc && !au.paused) { capEl.textContent = s.n[i]; capEl.hidden = false; }
  }
  function revealAll() {
    $$('[data-c]', scrEl).forEach(function (e) { e.classList.add('on'); });
    $$('.cur', scrEl).forEach(function (e) { e.classList.remove('cur'); });
    shown = 999; capEl.hidden = true;
  }
  function setPlayIcon(on) { var b = $('#ctlbar .pp'); b.innerHTML = (on ? ICON.pause : ICON.play) + '<span class="sr">' + (on ? 'Pauză' : 'Pornește vocea') + '</span>'; b.setAttribute('aria-label', on ? 'Pauză' : 'Pornește vocea'); }
  function fmt(t) { t = Math.max(0, Math.round(t || 0)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); }
  function updTime() { var tm = $('#ctlbar .tm'); var v = VO[curId]; tm.textContent = v ? fmt(au.currentTime) + ' / ' + fmt(v.dur) : ''; }
  var gestured = false;
  function userGesture() { gestured = true; }

  /* ---------- bara de control ---------- */
  function buildBar() {
    var b = document.createElement('div'); b.className = 'ctl'; b.id = 'ctlbar'; b.setAttribute('role', 'toolbar'); b.setAttribute('aria-label', 'Comenzi');
    b.innerHTML = '<div class="grp"><button class="b" type="button" data-b="toc">' + ICON.menu + '<span class="lb">Cuprins</span></button><button class="b" type="button" data-b="res">' + ICON.book + '<span class="lb">Resurse</span></button><button class="b" type="button" data-b="ws">' + ICON.ws + '<span class="lb">Fișa</span></button></div>' +
      '<span class="sp"></span><div class="grp"><button class="b pp" type="button" data-b="pp" aria-label="Pornește vocea">' + ICON.play + '</button>' +
      '<button class="b" type="button" data-b="rep" aria-label="Reia vocea de la început">' + ICON.replay + '</button>' +
      '<button class="b" type="button" data-b="all" aria-label="Arată tot ecranul">' + ICON.all + '<span class="lb">Arată tot</span></button>' +
      '<span class="tm" aria-hidden="true"></span>' +
      '<button class="b" type="button" data-b="cc" aria-pressed="false" aria-label="Subtitrare">' + ICON.cc + '<span class="lb">Subtitrare</span></button>' +
      '<button class="b" type="button" data-b="rate" aria-label="Viteza vocii">1×</button>' +
      '<button class="b" type="button" data-b="mute" aria-pressed="false" aria-label="Fără sunet">' + ICON.vol + '</button>' +
      '<button class="b fs" type="button" data-b="fs" aria-pressed="false" aria-label="Ecran complet">' + ICON.full + '</button></div><span class="sp"></span>' +
      '<div class="grp"><button class="b prev" type="button" data-b="prev">' + ICON.prev + '<span class="lb">Înapoi</span></button><button class="b next" type="button" data-b="next"><span class="lb">Înainte</span>' + ICON.next + '</button></div>';
    var cv = $('.canvas'); cv.appendChild(b);
    b.addEventListener('click', function (e) {
      var t = e.target.closest('[data-b]'); if (!t) return; userGesture();
      var k = t.dataset.b;
      if (k === 'next') goNext();
      else if (k === 'prev') goPrev();
      else if (k === 'pp') { if (au.paused) { if (!VO[curId]) return; if (au.ended || au.currentTime >= (VO[curId].dur - 0.2)) { au.currentTime = 0; shown = -1; } play(); } else { au.pause(); setPlayIcon(false); capEl.hidden = true; } }
      else if (k === 'rep') { if (!VO[curId]) return; $$('[data-c]', scrEl).forEach(function (e) { e.classList.remove('on'); }); shown = -1; au.currentTime = 0; reveal(0); play(); }
      else if (k === 'all') { revealAll(); }
      else if (k === 'cc') { prefs.cc = !prefs.cc; savePrefs(); t.setAttribute('aria-pressed', prefs.cc); if (!prefs.cc) capEl.hidden = true; else if (!au.paused && shown >= 0 && shown < 999) reveal(shown); }
      else if (k === 'rate') { var r = [1, 1.25, 1.5, 0.85]; var i = r.indexOf(prefs.rate); prefs.rate = r[(i + 1) % r.length]; au.playbackRate = prefs.rate; t.textContent = String(prefs.rate).replace('.', ',') + '×'; t.setAttribute('aria-label', 'Viteza vocii ' + t.textContent); savePrefs(); }
      else if (k === 'mute') { prefs.mute = !prefs.mute; au.muted = prefs.mute; t.setAttribute('aria-pressed', prefs.mute); t.innerHTML = prefs.mute ? ICON.mute : ICON.vol; savePrefs(); }
      else if (k === 'toc') openToc();
      else if (k === 'res') openRes();
      else if (k === 'ws') openWs();
      else if (k === 'fs') toggleFs(t);
    });
    var cc = $('[data-b=cc]', b); cc.setAttribute('aria-pressed', prefs.cc);
    var rt = $('[data-b=rate]', b), rx = String(prefs.rate).replace('.', ',') + '×'; rt.textContent = rx; rt.setAttribute('aria-label', 'Viteza vocii ' + rx);
    var mu = $('[data-b=mute]', b); mu.setAttribute('aria-pressed', prefs.mute); mu.innerHTML = prefs.mute ? ICON.mute : ICON.vol;
    var fsb = $('[data-b=fs]', b); if (!document.fullscreenEnabled) fsb.hidden = true;
  }
  function toggleFs(btn) {
    try {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen().then(function () { btn.setAttribute('aria-pressed', 'true'); }).catch(function () {});
      else document.exitFullscreen().then(function () { btn.setAttribute('aria-pressed', 'false'); }).catch(function () {});
    } catch (e) {}
  }
  function updateBar(s) {
    var bar = $('#ctlbar'), p = prevId(curId), n = nextId(curId);
    $('[data-b=prev]', bar).disabled = !p;
    $('[data-b=next]', bar).disabled = !n;
    var lbl = $('[data-b=next] .lb', bar);
    lbl.textContent = (n === '0.2' && ALL[curId].m >= 0) ? 'La module' : (n === '9.0' ? 'Încheiere' : 'Înainte');
    var has = !!VO[curId];
    ['pp', 'rep', 'all', 'cc', 'rate'].forEach(function (k) { $('[data-b=' + k + ']', bar).disabled = !has; });
    updTime();
  }

  /* ---------- cuprins și resurse ---------- */
  var modal;
  function openModal(html, label) {
    modal.innerHTML = '<div class="pane" role="dialog" aria-modal="true" aria-label="' + esc(label) + '"><button class="b x" type="button" aria-label="Închide">✕</button>' + html + '</div>';
    modal.hidden = false;
    var last = document.activeElement;
    var close = function () { modal.hidden = true; modal.innerHTML = ''; if (last && last.focus) last.focus(); };
    $('.x', modal).addEventListener('click', close);
    modal.onclick = function (e) { if (e.target === modal) close(); };
    modal.onkeydown = function (e) {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') { var f = $$('button,input,textarea,a[href],[tabindex="0"]', modal).filter(function (x) { return !x.disabled && x.offsetParent !== null; }); if (!f.length) return; var a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
    };
    setTimeout(function () { $('.x', modal).focus(); }, 30);
    return close;
  }
  function openToc() {
    var h = '<h2>Cuprins</h2><p class="sub">Alege orice ecran. ✓ = vizitat.</p><div class="toc">' +
      '<div class="m"><ul><li><button type="button" data-id="0.1" class="' + (st.vis['0.1'] ? 'vis' : '') + (curId === '0.1' ? ' cur' : '') + '"><span class="i">00</span><span>Despre acest e-learning</span><span class="v"></span></button></li><li><button type="button" data-id="0.2" class="' + (curId === '0.2' ? 'cur' : '') + '"><span class="i">00</span><span>Cele trei module</span><span class="v"></span></button></li></ul></div>' +
      MODS.map(function (M) {
        return '<div class="m"><div class="mh"><span>' + M.num + '</span><em>' + esc(plain(M.title)) + '</em></div><ul>' + M.screens.map(function (s, i) {
          return '<li><button type="button" data-id="' + s.id + '" class="' + (st.vis[s.id] ? 'vis' : '') + (curId === s.id ? ' cur' : '') + '"><span class="i">' + String(i + 1).padStart(2, '0') + '</span><span>' + esc(tocTitle(s)) + '</span><span class="v"></span></button></li>';
        }).join('') + '</ul></div>';
      }).join('') + '<div class="m"><ul><li><button type="button" data-id="9.0" class="' + (st.vis['9.0'] ? 'vis' : '') + '"><span class="i">∎</span><span>Încheierea cursului</span><span class="v"></span></button></li></ul></div></div>';
    var close = openModal(h, 'Cuprins');
    $$('[data-id]', modal).forEach(function (b) { b.addEventListener('click', function () { close(); go(b.dataset.id); }); });
    var c = $('.cur', modal); if (c) c.scrollIntoView({ block: 'center' });
  }
  function tocTitle(s) { if (s.type === 'cover') return 'Coperta: ' + plain(MODS[ALL[s.id].m].title); return plain(s.t || s.k || s.id); }
  function bibHtml(mi) {
    var B = C.bib[MODS[mi].id], tch = (CFG.bibSupl && CFG.bibSupl[MODS[mi].id]) || [];
    return (tch.length ? '<h3>Recomandate de profesor</h3><ol>' + tch.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ol>' : '') +
      B.map(function (sec) { return '<h3>' + esc(sec.h) + '</h3><ol>' + sec.items.map(function (t) { return '<li>' + mdItal(t) + '</li>'; }).join('') + '</ol>'; }).join('');
  }
  function openRes() {
    var h = '<h2>Resurse</h2><p class="sub">Bibliografia fiecărui modul, notițele tale și creditele.</p><div class="tabs" role="tablist">' +
      MODS.map(function (M, i) { return '<button type="button" role="tab" data-t="' + i + '" aria-selected="' + (i === Math.max(0, ALL[curId].m) ? 'true' : 'false') + '">Modulul ' + M.num + '</button>'; }).join('') +
      '<button type="button" role="tab" data-t="n" aria-selected="false">Notițele mele</button><button type="button" role="tab" data-t="c" aria-selected="false">Despre</button></div><div class="res-body" role="tabpanel"></div>';
    openModal(h, 'Resurse');
    var body = $('.res-body', modal);
    function show(t) {
      $$('[role=tab]', modal).forEach(function (b) { b.setAttribute('aria-selected', b.dataset.t === String(t) ? 'true' : 'false'); });
      if (t === 'n') body.innerHTML = st.notes.length ? '<ol>' + st.notes.map(function (n) { return '<li>' + esc(n.t) + ' <span class="ref">(Modulul ' + esc(n.m.replace('m', '0')) + ')</span></li>'; }).join('') + '</ol>' : '<p>Nu ai adăugat încă lecturi. Le poți nota pe ecranul de bibliografie al fiecărui modul.</p>';
      else if (t === 'c') body.innerHTML = '<p><b>Citim cetatea ca pe un argument</b> · e-learning de filosofie politică în trei module, parte din proiectul <i>Urban Instances V3 · Cetatea citită</i>.</p><p>Conținut: <b>' + esc(C.contentAuthor) + '</b> (fișele de studiu și fișele de lucru 1–3). E-learning: <b>Gelu-Emanuel Cebzan · LEETUCATION SRL</b>.</p><p>Vocea: clonată cu acordul vorbitorului, ElevenLabs v4 prin Magnific. Imagini și clipuri: generate cu inteligență artificială în Magnific (ilustrații, nu documente istorice); bustul lui Aristotel: fotografie Freepik. Fonturi: Instrument Serif, Schibsted Grotesk.</p><p>' + esc(C.funding) + '</p><p>Versiunea ' + esc(CFG.version || '1.0') + '.</p>';
      else body.innerHTML = bibHtml(+t);
    }
    $$('[role=tab]', modal).forEach(function (b) { b.addEventListener('click', function () { show(b.dataset.t === 'n' || b.dataset.t === 'c' ? b.dataset.t : +b.dataset.t); }); });
    show(Math.max(0, ALL[curId].m));
  }
  function notesInit(el, s) {
    var f = $('form[data-notes]', el), list = $('.nlist', el), m = f.dataset.notes;
    function paint() {
      var mine = st.notes.filter(function (n) { return n.m === m; });
      list.innerHTML = mine.length ? mine.map(function (n) { return '<li><span>' + esc(n.t) + '</span><button type="button" data-k="' + st.notes.indexOf(n) + '" aria-label="Șterge: ' + esc(n.t) + '">✕</button></li>'; }).join('') : '<li style="border-left-color:var(--beton)"><span class="ref">Nicio lectură adăugată încă.</span></li>';
      $$('button[data-k]', list).forEach(function (b) { b.addEventListener('click', function () { st.notes.splice(+b.dataset.k, 1); save(); paint(); }); });
    }
    f.addEventListener('submit', function (e) { e.preventDefault(); var i = $('input', f), v = i.value.trim(); if (!v) return; st.notes.push({ m: m, t: v.slice(0, 300) }); i.value = ''; save(); paint(); toast('Lectura a fost adăugată.'); });
    paint();
  }
  function copyBib(mi) {
    var B = C.bib[MODS[mi].id], txt = 'Modulul ' + MODS[mi].num + ' · ' + plain(MODS[mi].title) + '\n\n' + B.map(function (sec) { return sec.h + '\n' + sec.items.map(function (t, i) { return (i + 1) + '. ' + t.replace(/\*/g, ''); }).join('\n'); }).join('\n\n');
    var mine = st.notes.filter(function (n) { return n.m === MODS[mi].id; });
    if (mine.length) txt += '\n\nNotițele mele\n' + mine.map(function (n, i) { return (i + 1) + '. ' + n.t; }).join('\n');
    var ok = function () { toast('Bibliografia a fost copiată.'); }, no = function () { toast('Copierea nu e permisă aici. Selectează textul din listă.'); };
    try { navigator.clipboard.writeText(txt).then(ok, no); } catch (e) { no(); }
  }
  var toastT;
  function toast(t) { var e = $('.toast'); e.textContent = t; e.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { e.hidden = true; }, 2600); }

  /* ---------- fișa de lucru ---------- */
  var WSD = C.ws || {};
  function wsMod(mi) { return MODS[mi].id; }
  function wsSt(mid) { st.ws = st.ws || {}; return (st.ws[mid] = st.ws[mid] || { a: {}, r: {}, k: 0 }); }
  function wsId() { st.wsid = st.wsid || { name: '', cls: '', date: '' }; return st.wsid; }
  function wsScreenId(mi) { var w = MODS[mi].screens.filter(function (s) { return s.type === 'ws'; })[0]; return w ? w.id : MODS[mi].screens[0].id; }
  function today() { var d = new Date(); return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + d.getFullYear(); }
  function wsStageCount(mid, k) {
    var S = wsSt(mid), W = WSD[mid], n = 0, t = 0;
    if (k < W.stages.length) W.stages[k].qs.forEach(function (q) { t++; if ((S.a[q.id] || '').trim()) n++; });
    else { W.fb.likert.forEach(function (x, i) { t++; if (S.r['l' + (i + 1)]) n++; }); W.fb.qs.forEach(function (q) { t++; if ((S.a[q.id] || '').trim()) n++; }); }
    return { n: n, t: t };
  }
  function wsCount(mid) { var n = 0, t = 0, W = WSD[mid]; for (var k = 0; k <= W.stages.length; k++) { var c = wsStageCount(mid, k); n += c.n; t += c.t; } return { n: n, t: t }; }
  function wsStageFor(mi, id) {
    var W = WSD[wsMod(mi)], idx = ALL[id] && ALL[id].m === mi ? ALL[id].i : 0;
    for (var k = 0; k < W.stages.length; k++) { var to = W.stages[k].to; if (!to || idx <= ALL[to].i) return k; }
    return W.stages.length - 1;
  }
  function seeTitle(id) { var s = ALL[id] && ALL[id].s; return s ? plain(s.t || s.k || id) : id; }
  function wsQ(q, S, pre, hint) {
    var id = pre + q.id;
    return '<div class="wq"><label for="' + id + '"><span class="wn">' + q.n + '</span><span class="wqt">' + esc(q.t) + (q.k ? ' <span class="wtag">' + esc(q.k) + '</span>' : '') + '</span></label>' +
      '<textarea id="' + id + '" data-q="' + q.id + '" rows="3" maxlength="1200" placeholder="Răspunsul tău">' + esc(S.a[q.id] || '') + '</textarea>' +
      (hint && q.see ? '<div class="wqh"><button class="whint" type="button" data-see="' + q.see + '">' + ICON.back + '<span>Revezi: ' + esc(seeTitle(q.see)) + '</span></button>' + (q.note ? '<span class="wnote">' + esc(q.note) + '</span>' : '') + '</div>' : '') + '</div>';
  }
  function wsPanel(mi, k, inModal) {
    var mid = wsMod(mi), W = WSD[mid], S = wsSt(mid), nst = W.stages.length, pre = (inModal ? 'wm-' : 'ws-') + mid + '-', h = '';
    if (k < nst) {
      h += '<h2 class="wsh">' + esc(W.stages[k].h) + '</h2>' + W.stages[k].qs.map(function (q) { return wsQ(q, S, pre, true); }).join('');
    } else {
      h += '<h2 class="wsh">' + esc(W.fb.h) + '</h2><p class="wsi">Alege o valoare: 1 = deloc, 5 = total.</p>';
      h += W.fb.likert.map(function (t, i) {
        var key = 'l' + (i + 1), v = S.r[key] || 0;
        return '<fieldset class="lk"><legend>' + esc(t) + '</legend><div class="lko">' + [1, 2, 3, 4, 5].map(function (n) {
          return '<label><input type="radio" name="' + pre + key + '" value="' + n + '" data-l="' + key + '"' + (v === n ? ' checked' : '') + '><span>' + n + '</span></label>';
        }).join('') + '</div></fieldset>';
      }).join('');
      h += W.fb.qs.map(function (q) { return wsQ(q, S, pre, false); }).join('');
    }
    h += '<div class="wsnx">' + (k > 0 ? '<button class="b" type="button" data-wk="' + (k - 1) + '">' + ICON.prev + 'Etapa anterioară</button>' : '<span></span>') +
      (k < nst ? '<button class="b ink" type="button" data-wk="' + (k + 1) + '">' + (k + 1 < nst ? 'Etapa următoare' : 'Feedback') + ICON.next + '</button>'
        : (inModal ? '<button class="b ink" type="button" data-wgo="1">Deschide fișa completă</button>' : '<button class="b ink" type="button" data-ws="docx">' + ICON.dl + 'Descarcă fișa</button>')) + '</div>';
    return h;
  }
  R.ws = function (s) {
    var mi = ALL[s.id].m, mid = wsMod(mi), W = WSD[mid], I = wsId(), nst = W.stages.length;
    var nav = W.stages.map(function (sg, k) { return { k: k, e: 'Etapa ' + (k + 1), h: sg.h.replace(/^Etapa \d · /, '') }; }).concat([{ k: nst, e: 'Feedback', h: 'cum ți s-a părut' }]);
    return hdr(false) + '<div class="cnt wsx">' + kick(s) + title(s) + '<div class="wsg"><aside class="wsl">' +
      '<p class="lead rv" data-c="0">' + esc(W.series) + ' · <b>' + esc(W.title) + '</b></p>' +
      '<p class="whow rv" data-c="1">' + esc(W.how) + '</p>' +
      '<div class="wsid rv" data-c="1"><label><span>Nume <small>(opțional)</small></span><input data-id="name" maxlength="80" autocomplete="off" value="' + esc(I.name) + '"></label>' +
      '<label><span>Clasa</span><input data-id="cls" maxlength="30" autocomplete="off" value="' + esc(I.cls) + '"></label><label><span>Data</span><input data-id="date" maxlength="20" autocomplete="off" value="' + esc(I.date || today()) + '"></label></div>' +
      '<nav class="wsnav rv" data-c="2" aria-label="Etapele fișei">' + nav.map(function (x) { return '<button type="button" data-wk="' + x.k + '"><span class="e">' + x.e + '</span><span class="c"></span><span class="t">' + esc(x.h) + '</span></button>'; }).join('') + '</nav>' +
      '<p class="wsst" role="status" aria-live="polite"></p>' +
      '<div class="wsact rv" data-c="3"><button class="b pri" type="button" data-ws="docx">' + ICON.dl + 'Descarcă fișa (.docx)</button><button class="b" type="button" data-ws="print">' + ICON.print + 'Tipărește sau PDF</button></div>' +
      '</aside><div class="wsp rv" data-c="1"></div></div></div>' + ftr(s);
  };
  var slT;
  function saveLocal() { if (SCO.ok) { clearTimeout(slT); slT = setTimeout(saveNow, 4000); return; } clearTimeout(slT); slT = setTimeout(function () { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }, 400); }
  function wsBind(root, mi, k, inModal, onNav) {
    var mid = wsMod(mi), S = wsSt(mid);
    var panel = inModal ? root : $('.wsp', root);
    function paintNav() {
      $$('.wsnav [data-wk]', root).forEach(function (b) {
        var kk = +b.dataset.wk, c = wsStageCount(mid, kk);
        $('.c', b).textContent = c.n + '/' + c.t; b.classList.toggle('full', c.n === c.t);
        if (kk === S.k) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
      var tc = wsCount(mid), sx = $('.wsst', root); if (sx) sx.textContent = tc.n + ' din ' + tc.t + ' completate · se salvează automat';
    }
    function show(kk, focus) {
      S.k = kk; panel.innerHTML = wsPanel(mi, kk, inModal); bindPanel(); paintNav(); save();
      panel.scrollTop = 0;
      if (focus) { var h = $('.wsh', panel); if (h) { h.setAttribute('tabindex', '-1'); try { h.focus({ preventScroll: true }); } catch (e) {} } }
    }
    function bindPanel() {
      $$('textarea', panel).forEach(function (ta) {
        ta.addEventListener('input', function () { S.a[ta.dataset.q] = ta.value; saveLocal(); paintNav(); });
        ta.addEventListener('change', function () { S.a[ta.dataset.q] = ta.value; save(); wsReport(mi, [ta.dataset.q]); });
      });
      $$('input[type=radio]', panel).forEach(function (r) { r.addEventListener('change', function () { S.r[r.dataset.l] = +r.value; save(); paintNav(); wsReport(mi, [r.dataset.l]); }); });
      $$('[data-wk]', panel).forEach(function (b) { b.addEventListener('click', function () { show(+b.dataset.wk, true); }); });
      $$('[data-see]', panel).forEach(function (b) { b.addEventListener('click', function () { if (onNav) onNav(); go(b.dataset.see, { noplay: true }); toast('Revii la fișă din butonul Fișa, din bara de jos.'); }); });
      $$('[data-ws]', panel).forEach(function (b) { b.addEventListener('click', function () { wsAct(mi, b.dataset.ws); }); });
      $$('[data-wgo]', panel).forEach(function (b) { b.addEventListener('click', function () { if (onNav) onNav(); go(wsScreenId(mi)); }); });
    }
    $$('.wsnav [data-wk]', root).forEach(function (b) { b.addEventListener('click', function () { show(+b.dataset.wk, true); }); });
    $$('.wsid input', root).forEach(function (i) {
      i.addEventListener('input', function () { wsId()[i.dataset.id] = i.value; saveLocal(); });
      i.addEventListener('change', function () { wsId()[i.dataset.id] = i.value; save(); });
    });
    $$('.wsact [data-ws]', root).forEach(function (b) { b.addEventListener('click', function () { wsAct(mi, b.dataset.ws); }); });
    show(k == null ? (S.k || 0) : k, false);
  }
  function openWs() {
    var mi = ALL[curId] ? ALL[curId].m : -1;
    if (mi < 0) {
      var h = '<h2>Fișele de lucru</h2><p class="sub">Câte una pentru fiecare modul. Se salvează automat.</p><div class="wsch">' + MODS.map(function (M, i) {
        var c = wsCount(M.id); return '<button type="button" class="b" data-wm="' + i + '"><span>Modulul ' + M.num + ' · ' + esc(WSD[M.id].title) + '</span><span class="ref">' + c.n + '/' + c.t + '</span></button>';
      }).join('') + '</div>';
      var close = openModal(h, 'Fișele de lucru');
      $$('[data-wm]', modal).forEach(function (b) { b.addEventListener('click', function () { close(); go(wsScreenId(+b.dataset.wm)); }); });
      return;
    }
    if (ALL[curId].s.type === 'ws') { var ta = $('.wsp textarea', scrEl); if (ta) ta.focus(); return; }
    if (!au.paused) { au.pause(); setPlayIcon(false); capEl.hidden = true; }
    var mid = wsMod(mi);
    var close2 = openModal('<h2>Fișa de lucru</h2><p class="sub">Modulul ' + MODS[mi].num + ' · ' + esc(WSD[mid].title) + ' · se salvează automat</p><div class="wsm"></div>', 'Fișa de lucru');
    wsBind($('.wsm', modal), mi, wsStageFor(mi, curId), true, close2);
  }
  function isoNow() { var d = new Date(), z = function (n) { return String(n).padStart(2, '0'); }; return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + 'T' + z(d.getHours()) + ':' + z(d.getMinutes()) + ':' + z(d.getSeconds()); }
  function wsItems(mid) {
    var W = WSD[mid], items = {};
    W.stages.forEach(function (sg) { sg.qs.forEach(function (q) { items[q.id] = { t: q.t }; }); });
    W.fb.qs.forEach(function (q) { items[q.id] = { t: q.t }; });
    W.fb.likert.forEach(function (t, i) { items['l' + (i + 1)] = { t: t, l: 1 }; });
    return items;
  }
  /* răspunsurile ajung în LMS ca cmi.interactions (long-fill-in; likert pentru feedback) */
  function wsReport(mi, keys) {
    if (!SCO.ok) return;
    var mid = wsMod(mi), S = wsSt(mid), items = wsItems(mid); st.wsIx = st.wsIx || {};
    var cnt = parseInt(SCO.get('cmi.interactions._count'), 10) || 0;
    (keys || Object.keys(items)).forEach(function (key) {
      var it = items[key]; if (!it) return;
      var val = it.l ? (S.r[key] ? String(S.r[key]) : '') : String(S.a[key] || '').trim();
      if (!val) return;
      var ik = mid + '_' + key, n = st.wsIx[ik];
      if (n === undefined || n >= cnt) {
        n = cnt; if (!SCO.set('cmi.interactions.' + n + '.id', 'fisa_' + ik)) return; cnt++; st.wsIx[ik] = n;
        SCO.set('cmi.interactions.' + n + '.type', it.l ? 'likert' : 'long-fill-in');
        SCO.set('cmi.interactions.' + n + '.description', ('Fișa ' + MODS[mi].num + ' · ' + it.t).slice(0, 250));
      }
      var pre = 'cmi.interactions.' + n + '.';
      SCO.set(pre + 'learner_response', it.l ? val : val.replace(/^\{/, '(').slice(0, 4000));
      SCO.set(pre + 'result', 'neutral');
      SCO.set(pre + 'timestamp', isoNow());
    });
    save();
  }
  function wsData(mi) {
    var mid = wsMod(mi), W = WSD[mid], S = wsSt(mid), I = wsId();
    function qa(q) { return { n: q.n, t: q.t, k: q.k || '', a: String(S.a[q.id] || '').trim() }; }
    return { mod: MODS[mi].num, series: W.series, title: W.title, how: W.how, name: (I.name || '').trim(), cls: (I.cls || '').trim(), date: (I.date || today()).trim(),
      stages: W.stages.map(function (sg) { return { h: sg.h, qs: sg.qs.map(qa) }; }),
      fb: { h: W.fb.h, likert: W.fb.likert.map(function (t, i) { return { t: t, v: S.r['l' + (i + 1)] || 0 }; }), qs: W.fb.qs.map(qa) } };
  }
  function slug(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 60); }
  function wsFile(D) { return 'Fisa_de_lucru_' + parseInt(D.mod, 10) + '_' + slug(D.title) + (D.name ? '_' + slug(D.name) : ''); }
  function download(blob, fn) {
    try { if (navigator.msSaveOrOpenBlob) { navigator.msSaveOrOpenBlob(blob, fn); return; } } catch (e) {}
    var u = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = u; a.download = fn; a.rel = 'noopener'; a.style.display = 'none'; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(u); a.remove(); }, 5000);
  }
  function wsAct(mi, a) {
    wsReport(mi);
    var mid = wsMod(mi); wsSt(mid).dl = isoNow(); saveNow();
    if (a === 'docx') wsDocx(mi); else wsPrint(mi);
  }
  function wsDocx(mi) {
    var D = wsData(mi), X = window.DOCX, A = window.DOCX_ASSETS || {}, body = '', imgs = [];
    function qa(q) {
      return X.p([X.run(q.n + '. ', { b: 1 }), X.run(q.t, { b: 1 }), q.k ? X.run('  (' + q.k + ')', { i: 1, color: '4A4D55', sz: 18 }) : ''], { keep: 1, before: 140, after: 60 }) +
        X.p(q.a ? X.run(q.a) : X.run('\n\n', { color: '8C8F96' }), { box: 1, after: 140 });
    }
    try {
      var cp = A.cp_logo_negru, sg = A.semnatura_cerneala;
      if (cp) imgs.push({ rid: 'rIdCp', b64: cp.b64 });
      if (sg) imgs.push({ rid: 'rIdSig', b64: sg.b64 });
      body += X.table([[X.cell(X.p(cp ? X.image('rIdCp', 6.0, [cp.w, cp.h], 'Finanțat de Municipiul Timișoara prin Centrul de Proiecte și Administrația pentru Sănătate și Educație') : '', { after: 0 }), 5200),
        X.cell(X.p(sg ? X.image('rIdSig', 4.2, [sg.w, sg.h], 'Urban Instances V3 · Cetatea citită') : '', { after: 0, align: 'right' }), 4552)]], [5200, 4552], { borders: 'none' });
      body += X.p(X.run(D.series, { i: 1, color: '4A4D55', sz: 19 }), { before: 160, after: 0 });
      body += X.p(X.run('Fișă de lucru: ' + D.title), { style: 'Title' });
      body += X.p(X.run('E-learning „' + plain(C.title) + '” · Modulul ' + D.mod + ' · ' + C.project, { color: '4A4D55', sz: 19 }), { after: 200 });
      body += X.table([[X.cell(X.p([X.run('Nume: ', { b: 1 }), X.run(D.name || '—')], { after: 0 }), 4400), X.cell(X.p([X.run('Clasa: ', { b: 1 }), X.run(D.cls || '—')], { after: 0 }), 2600),
        X.cell(X.p([X.run('Data: ', { b: 1 }), X.run(D.date)], { after: 0 }), 2752)]], [4400, 2600, 2752]);
      body += X.p([X.run('Cum lucrezi: ', { b: 1 }), X.run(D.how)], { fill: 'F1EEE7', before: 60, after: 160 });
      D.stages.forEach(function (s) { body += X.p(X.run(s.h), { style: 'Heading1' }); s.qs.forEach(function (q) { body += qa(q); }); });
      body += X.p(X.run(D.fb.h), { style: 'Heading1' });
      body += X.p(X.run('1 = deloc, 5 = total', { i: 1, color: '4A4D55', sz: 18 }), { after: 60 });
      body += X.table(D.fb.likert.map(function (L) {
        return [X.cell(X.p(X.run(L.t), { after: 0 }), 5252)].concat([1, 2, 3, 4, 5].map(function (n) {
          return X.cell(X.p(X.run(String(n), n === L.v ? { b: 1 } : { color: '8C8F96' }), { after: 0, align: 'center' }), 900, n === L.v ? { fill: 'E4EF3B' } : {});
        }));
      }), [5252, 900, 900, 900, 900, 900]);
      D.fb.qs.forEach(function (q) { body += qa(q); });
      body += X.p(X.run('Conținut: ' + C.contentAuthor + ' · E-learning: ' + C.author + ', ' + C.org + ' · ' + C.project, { sz: 17, color: '4A4D55' }), { rule: 1, before: 300, after: 40 });
      body += X.p(X.run(C.funding, { sz: 17, color: '4A4D55' }), { after: 40 });
      body += X.p(X.run('Completată în e-learning · ' + new Date().toLocaleString('ro-RO'), { sz: 17, color: '8C8F96' }), { after: 0 });
      download(X.build({ title: 'Fișă de lucru: ' + D.title, subject: C.project, creator: D.name || plain(C.title), body: body, images: imgs }), wsFile(D) + '.docx');
      toast('Fișa se descarcă. Dacă nu pornește, folosește Tipărește sau PDF.');
    } catch (e) { toast('Nu am putut crea fișierul aici. Folosește Tipărește sau PDF.'); }
  }
  function wsPrint(mi) {
    var D = wsData(mi), el = document.getElementById('printdoc');
    if (!el) { el = document.createElement('div'); el.id = 'printdoc'; document.body.appendChild(el); }
    function qa(q) { return '<div class="pq"><p class="pqt"><b>' + q.n + '. ' + esc(q.t) + '</b>' + (q.k ? ' <i>(' + esc(q.k) + ')</i>' : '') + '</p><div class="pa">' + (q.a ? esc(q.a).replace(/\n/g, '<br>') : '<span class="pe"></span>') + '</div></div>'; }
    el.innerHTML = '<header><img src="media/brand/cp_logo_negru.png" alt="Finanțat de Municipiul Timișoara prin Centrul de Proiecte și Administrația pentru Sănătate și Educație"><img src="media/brand/semnatura_cerneala.png" alt="Urban Instances V3 · Cetatea citită"></header>' +
      '<p class="ps">' + esc(D.series) + '</p><h1>Fișă de lucru: ' + esc(D.title) + '</h1><p class="pm">E-learning „' + esc(plain(C.title)) + '” · Modulul ' + D.mod + ' · ' + esc(C.project) + '</p>' +
      '<div class="pid"><span><b>Nume:</b> ' + esc(D.name || '—') + '</span><span><b>Clasa:</b> ' + esc(D.cls || '—') + '</span><span><b>Data:</b> ' + esc(D.date) + '</span></div>' +
      '<p class="phow"><b>Cum lucrezi:</b> ' + esc(D.how) + '</p>' +
      D.stages.map(function (s) { return '<h2>' + esc(s.h) + '</h2>' + s.qs.map(qa).join(''); }).join('') +
      '<h2>' + esc(D.fb.h) + '</h2><table class="plk"><caption>1 = deloc, 5 = total</caption>' + D.fb.likert.map(function (L) { return '<tr><th scope="row">' + esc(L.t) + '</th>' + [1, 2, 3, 4, 5].map(function (n) { return '<td' + (n === L.v ? ' class="on"' : '') + '>' + n + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>' +
      D.fb.qs.map(qa).join('') +
      '<footer><p>Conținut: ' + esc(C.contentAuthor) + ' · E-learning: ' + esc(C.author) + ', ' + esc(C.org) + ' · ' + esc(C.project) + '</p><p>' + esc(C.funding) + '</p></footer>';
    var root = document.documentElement;
    var off = function () { root.classList.remove('printing'); window.removeEventListener('afterprint', off); };
    var imgsP = $$('img', el).map(function (im) { return new Promise(function (r) { if (im.complete) r(); else { im.onload = im.onerror = r; } }); });
    Promise.race([Promise.all(imgsP), new Promise(function (r) { setTimeout(r, 1500); })]).then(function () {
      root.classList.add('printing'); window.addEventListener('afterprint', off);
      try { window.print(); } catch (e) { toast('Tipărirea nu e permisă aici. Folosește Descarcă fișa.'); }
      setTimeout(function () { if (!window.matchMedia('print').matches) off(); }, 1200);
    });
  }
  function exitCourse() {
    saveNow(); var was = SCO.ok; SCO.finish();
    openModal('<h2>Progresul e salvat</h2><p class="sub" style="font-size:24px;line-height:1.5;margin-top:24px">' + (was ? 'Datele tale au fost trimise platformei. Poți închide fereastra cursului.' : 'Progresul rămâne salvat în acest browser. Poți închide fereastra.') + '</p>', 'Ieșire din curs');
  }

  /* ---------- scalare și mod telefon ---------- */
  function fit() {
    var w = document.documentElement.clientWidth, h = document.documentElement.clientHeight;
    var s = Math.min(w / 1920, h / 1168);
    var root = document.documentElement;
    var phone = s < 0.5 && !(document.activeElement && document.activeElement.tagName === 'INPUT' && root.classList.contains('m'));
    if (document.activeElement && document.activeElement.tagName === 'INPUT') phone = root.classList.contains('m');
    root.classList.toggle('m', phone);
    var cv = $('.canvas');
    if (phone) {
      cv.style.transform = ''; cv.style.left = ''; cv.style.top = '';
      var z = Math.max(0.52, Math.min(0.9, w / 680));
      root.style.setProperty('--z', z);
    } else {
      cv.style.transform = 'scale(' + s + ')';
      cv.style.position = 'absolute';
      cv.style.left = Math.round((w - 1920 * s) / 2) + 'px'; cv.style.top = Math.round((h - 1168 * s) / 2) + 'px';
    }
  }

  /* ---------- pornire ---------- */
  function boot() {
    loadPrefs();
    SCO.init(); load();
    var app = $('.app');
    app.innerHTML = '<div class="canvas"><main class="stage" id="stage"><section class="scr"></section><div class="cap" hidden aria-hidden="true"></div>' +
      '<div class="intro" role="dialog" aria-label="Logo animat: Finanțat de Municipiul Timișoara prin Centrul de Proiecte"><video src="media/video/intro_cp.mp4" muted playsinline preload="auto" aria-hidden="true"></video><button class="b skip" type="button" style="color:var(--paper)">Sari peste</button></div>' +
      '<div class="modal" hidden></div><div class="toast" hidden role="status"></div></main></div>';
    stageEl = $('#stage'); scrEl = $('.scr', stageEl); capEl = $('.cap', stageEl); modal = $('.modal', stageEl);
    au = new Audio(); au.preload = 'auto';
    au.addEventListener('ended', function () { revealAll(); setPlayIcon(false); st.narr[curId] = 1; save(); var nb = $('#ctlbar .next'); if (!nb.disabled) nb.classList.add('pulse'); updTime(); });
    au.addEventListener('timeupdate', updTime);
    buildBar(); fit();
    window.addEventListener('resize', fit);
    if (SCO.ok) { var loc = SCO.get('cmi.location'); if (loc && ALL[loc]) st.loc = loc;
      var ln = SCO.get('cmi.learner_name'); if (ln && !wsId().name) { var pp = ln.split(','); wsId().name = pp.length === 2 ? (pp[1].trim() + ' ' + pp[0].trim()).trim() : ln; } }
    var intro = $('.intro', stageEl), v = $('video', intro);
    var done = false;
    function endIntro() { if (done) return; done = true; intro.hidden = true; try { v.pause(); } catch (e) {} go('0.0', { focus: true }); }
    $('.skip', intro).addEventListener('click', endIntro);
    v.addEventListener('ended', endIntro);
    v.addEventListener('error', endIntro);
    if (reduce || CFG.skipIntro) endIntro();
    else { var p = v.play(); if (p && p.catch) p.catch(function () { setTimeout(endIntro, 400); }); setTimeout(endIntro, 9000); }
    window.addEventListener('pagehide', function () { saveNow(); SCO.finish(); });
    window.addEventListener('beforeunload', function () { saveNow(); SCO.finish(); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) saveNow(); });
    window.__ui3 = { go: go, st: function () { return st; }, cur: function () { return curId; }, au: function () { return au; } };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
