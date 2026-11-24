/* SCORM 2004 3rd Edition: găsește API_1484_11, cu rezervă pe localStorage în afara LMS-ului. */
(function () {
  'use strict';
  var api = null, inited = false, t0 = Date.now();
  function find(w) {
    var n = 0;
    while (w && n < 12) {
      try { if (w.API_1484_11) return w.API_1484_11; } catch (e) { return null; }
      if (w.parent === w) break;
      w = w.parent; n++;
    }
    return null;
  }
  try { api = find(window); if (!api && window.opener) api = find(window.opener); } catch (e) { api = null; }
  function iso(ms) {
    var s = Math.max(0, Math.round(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return 'PT' + h + 'H' + m + 'M' + x + 'S';
  }
  var SCO = {
    ok: false,
    init: function () {
      if (!api) return false;
      try { inited = String(api.Initialize('')) === 'true'; } catch (e) { inited = false; }
      SCO.ok = inited;
      if (inited) {
        var cs = SCO.get('cmi.completion_status');
        if (cs === 'not attempted' || cs === 'unknown' || cs === '') SCO.set('cmi.completion_status', 'incomplete');
      }
      return inited;
    },
    get: function (k) { if (!SCO.ok) return ''; try { return String(api.GetValue(k)); } catch (e) { return ''; } },
    set: function (k, v) { if (!SCO.ok) return false; try { return String(api.SetValue(k, String(v))) === 'true'; } catch (e) { return false; } },
    commit: function () { if (!SCO.ok) return; try { api.Commit(''); } catch (e) {} },
    finish: function () {
      if (!SCO.ok) return;
      SCO.set('cmi.session_time', iso(Date.now() - t0));
      if (SCO.get('cmi.completion_status') !== 'completed') SCO.set('cmi.exit', 'suspend');
      else SCO.set('cmi.exit', 'suspend');
      SCO.set('adl.nav.request', 'suspendAll');
      SCO.commit();
      try { api.Terminate(''); } catch (e) {}
      SCO.ok = false;
    }
  };
  window.SCO = SCO;
})();
