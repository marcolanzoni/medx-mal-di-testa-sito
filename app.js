/* MedX · Il test del mal di testa (Concept B, v4) — VERSIONE NUOVA («MedX Journal»).
 * Stessa logica, stessi testi e stesso collegamento ad Active della versione
 * in /site; cambia solo la regia delle schermate (revisione grafica 1 ottobre).
 * I conteggi escono col nome funnel «mal-di-testa-nuova», per confrontarle.
 *
 * Quello che questo codice NON fa, per scelta (v4, pagine 03-04):
 *  - non legge le risposte per decidere niente: nessun punteggio, nessun
 *    profilo, nessun ordine diverso, nessun finale diverso;
 *  - non manda le risposte da nessuna parte. Restano nel telefono
 *    (localStorage) e se ne vanno solo se la persona spunta da sola
 *    «allega le mie risposte» prima di prenotare;
 *  - non carica niente di esterno finché la persona non lo chiede.
 *    Il pixel Meta parte SOLO dopo «Accetto» nel banner (vedi «pixel Meta»)
 *    e riceve solo quattro passaggi senza dettagli.
 */
(function () {
  'use strict';
  var C = window.MX, T = window.TESTO, D = T.domande, N = D.length;
  var CHIAVE = 'medx-mal-di-testa-nuova-v1', SCADENZA = 30 * 24 * 3600 * 1000;
  var PASSI = ['apertura', 'perimetro', 'domanda', 'sblocca', 'riepilogo', 'criterio', 'pratiche', 'porte', 'dati', 'prenotato', 'grazie'];

  var $corpo = document.getElementById('corpo'), $piede = document.getElementById('piede'),
      $indietro = document.getElementById('indietro'), $avanz = document.getElementById('avanz'),
      $barra = document.getElementById('barra'), $barraBox = document.getElementById('barraBox'),
      $avSx = document.getElementById('avanzSx'), $avDx = document.getElementById('avanzDx');

  /* ---------- stato sul telefono ---------- */
  function nuovo() { return { v: 1, passo: 'apertura', i: 0, r: {}, t: Date.now() }; }
  var S = nuovo();
  try {
    var salvato = JSON.parse(localStorage.getItem(CHIAVE) || 'null');
    if (salvato && salvato.v === 1 && Date.now() - salvato.t < SCADENZA && PASSI.indexOf(salvato.passo) >= 0) S = salvato;
    else localStorage.removeItem(CHIAVE);
  } catch (e) {}
  // le pagine di conferma non si riaprono al ritorno: si torna alle tre porte
  if (S.passo === 'prenotato' || S.passo === 'grazie' || S.passo === 'dati') S.passo = 'porte';
  // il riepilogo si vede dopo aver lasciato il contatto (Marco, 2 ottobre)
  function chiuso(p) { return !S.ok && (p === 'riepilogo' || p === 'criterio'); }
  function salva() { S.t = Date.now(); try { localStorage.setItem(CHIAVE, JSON.stringify(S)); } catch (e) {} }
  function risposta(i) { var r = S.r[i]; return Array.isArray(r) ? r : (r === undefined ? [] : [r]); }

  /* ---------- provenienza della campagna (solo UTM, mai fbclid) ---------- */
  var UTM = {};
  (function () {
    var q = new URLSearchParams(location.search), chiavi = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'], trovate = false;
    chiavi.forEach(function (k) { var v = q.get(k); if (v) { UTM[k] = v.slice(0, 120); trovate = true; } });
    try {
      if (trovate) sessionStorage.setItem('mx-utm', JSON.stringify(UTM));
      else UTM = JSON.parse(sessionStorage.getItem('mx-utm') || '{}');
    } catch (e) {}
    // il clic dall'inserzione (fbclid) si tiene in memoria e diventa il cookie
    // che il pixel Meta legge SOLO se la persona accetta (formato di Meta:
    // fb.1.<ms>.<fbclid>); intanto l'indirizzo torna pulito
    var fbclid = q.get('fbclid');
    if (fbclid) try { sessionStorage.setItem('mx-fbclid', fbclid.slice(0, 500) + '|' + Date.now()); } catch (e) {}
    if (location.search) history.replaceState(null, '', location.pathname);
  })();

  /* ---------- conteggi anonimi (prima parte) ----------
   * Si manda solo il NOME del passaggio e, per le domande, il NUMERO della
   * domanda. Mai la risposta. L'id di sessione vive solo in memoria. */
  var SESS = (Math.random().toString(36).slice(2) + Date.now().toString(36)).slice(0, 20);
  var MOBILE = matchMedia('(max-width: 800px)').matches ? 'mobile' : 'desktop';
  var gia = {};
  function ev(nome, passo, unaVolta) {
    var k = nome + ':' + (passo || '');
    if (unaVolta && gia[k]) return; gia[k] = 1;
    px(nome);
    if (!C.eventi || !C.eventi.key || C.eventi.key.indexOf('__') === 0) return;
    var riga = { funnel: 'mal-di-testa-nuova', evento: nome, sessione: SESS, dispositivo: MOBILE };
    if (passo) riga.passo = passo;
    for (var u in UTM) riga[u] = UTM[u];
    try {
      fetch(C.eventi.url, { method: 'POST', keepalive: true, headers: { apikey: C.eventi.key, Authorization: 'Bearer ' + C.eventi.key, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(riga) }).catch(function () {});
    } catch (e) {}
  }
  window.__mxEventi = function () { return Object.keys(gia); }; // per il collaudo

  /* ---------- pixel Meta ----------
   * Deciso da Marco il 1 ottobre. Eventi standard, senza parametri:
   * PageView, ViewContent a test finito, Lead quando lascia i dati
   * (una volta sola), Contact sul bottone WhatsApp. Mai una risposta.
   * Check legale 1 ottobre: niente parte (né script, né cookie _fbc, né fbq)
   * finché la persona non tocca «Accetto» nel banner. La scelta resta nel
   * telefono (localStorage). Con «Rifiuto» il test funziona uguale. */
  var PIXEL = { completato: 'ViewContent', lead_riepilogo: 'Lead', lead_domande: 'Lead', prenotazione_iniziata: 'Lead', cta_whatsapp: 'Contact' };
  var CONSENSO = 'mx-consenso-pixel', pxAcceso = false, pxFatti = {}, pxAttesa = [];
  function sceltaPixel() { try { return localStorage.getItem(CONSENSO); } catch (e) { return null; } }
  function accendiPixel() {
    if (pxAcceso || !C.pixel || sceltaPixel() !== 'si') return;
    pxAcceso = true;
    try {
      var fb = (sessionStorage.getItem('mx-fbclid') || '').split('|');
      if (fb[0]) document.cookie = '_fbc=fb.1.' + (fb[1] || Date.now()) + '.' + encodeURIComponent(fb[0]) + ';path=/;max-age=7776000;SameSite=Lax';
    } catch (e) {}
    (function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', C.pixel);
    window.fbq('track', 'PageView');
    // i passaggi fatti prima del sì (per esempio il test finito) partono adesso, una volta sola
    pxAttesa.forEach(function (std) { if (!pxFatti[std]) { pxFatti[std] = 1; window.fbq('track', std); } }); pxAttesa = [];
  }
  function spegniPixel() {
    if (window.fbq) try { window.fbq('consent', 'revoke'); } catch (e) {}
    ['_fbc', '_fbp'].forEach(function (c) { try { document.cookie = c + '=;path=/;max-age=0'; document.cookie = c + '=;path=/;domain=.' + location.hostname.split('.').slice(-2).join('.') + ';max-age=0'; } catch (e) {} });
  }
  function px(nome) {
    var std = PIXEL[nome]; if (!std || !C.pixel || pxFatti[std]) return;
    if (!pxAcceso) { if (sceltaPixel() === null && pxAttesa.indexOf(std) < 0) pxAttesa.push(std); return; }
    pxFatti[std] = 1; window.fbq('track', std);
  }

  /* ---------- banner cookie ----------
   * Due bottoni con lo stesso peso. Compare finché non si sceglie; si riapre
   * dal link «Preferenze cookie» nel piè di pagina. */
  var $banner = null;
  function banner(mostra) {
    if (!C.pixel) return;
    if (!$banner) {
      $banner = document.createElement('div');
      $banner.className = 'consenso'; $banner.setAttribute('role', 'region'); $banner.setAttribute('aria-label', 'Cookie');
      $banner.innerHTML = '<div class="consenso-in"><p>Usiamo un cookie di Meta per sapere se le nostre inserzioni funzionano. <b>Non riceve mai le tue risposte.</b> Il test funziona uguale anche se rifiuti. <a href="informativa.html#cookie">Cookie e privacy</a></p>' +
        '<div class="consenso-bott"><button type="button" class="btn vuoto" data-azione="cookie-no">Rifiuto</button><button type="button" class="btn vuoto" data-azione="cookie-si">Accetto</button></div></div>';
      document.body.appendChild($banner);
    }
    $banner.hidden = !mostra;
    document.body.classList.toggle('con-banner', !!mostra);
  }
  function scegliCookie(si) {
    var prima = sceltaPixel();
    try { localStorage.setItem(CONSENSO, si ? 'si' : 'no'); } catch (e) {}
    banner(false);
    if (si) accendiPixel(); else { pxAttesa = []; if (prima === 'si' || pxAcceso) spegniPixel(); }
  }
  if (C.pixel) { if (sceltaPixel() === 'si') accendiPixel(); }

  /* ---------- navigazione ---------- */
  function vai(passo, i, sostituisci) {
    S.passo = passo; if (i !== undefined) S.i = i; salva();
    var n = (history.state && history.state.n) || 0;
    var st = { passo: S.passo, i: S.i, n: sostituisci ? n : n + 1 };
    if (sostituisci) history.replaceState(st, ''); else history.pushState(st, '');
    render(true);
  }
  window.addEventListener('popstate', function (e) {
    var st = e.state;
    if (st && PASSI.indexOf(st.passo) >= 0) { S.passo = st.passo; S.i = st.i || 0; salva(); render(true); }
  });
  // se la pagina è stata riaperta a metà non c'è storia: si torna al passo logico prima
  function precedente() {
    var p = S.passo;
    if (p === 'domanda') return S.i > 0 ? ['domanda', S.i - 1] : ['perimetro'];
    var prima = { perimetro: 'apertura', sblocca: 'domanda', riepilogo: 'domanda', criterio: 'riepilogo', pratiche: 'criterio', porte: 'pratiche', dati: 'porte', prenotato: 'porte', grazie: 'porte' }[p] || 'apertura';
    return prima === 'domanda' ? ['domanda', N - 1] : [prima];
  }
  function indietro() {
    if (history.state && history.state.n > 0) history.back();
    else { var pr = precedente(); vai(pr[0], pr[1], true); }
  }
  $indietro.addEventListener('click', indietro);

  /* ---------- utilità ---------- */
  function h(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var NUMERI = ['', 'una', 'due', 'tre', 'quattro', 'cinque'];
  var FRECCIA = ' <span class="freccia" aria-hidden="true">→</span>';
  // Piè di pagina: lo stesso di medxclinic.it (l'unico approvato), su ogni schermata,
  // più le due righe proprie del test. Check legale 1 ottobre.
  function firma() {
    return '<footer class="firma no-stampa"><div class="fine">' +
      '<p>Questionario orientativo. Non è una diagnosi e non sostituisce la visita medica.</p>' +
      '<p class="firma-medici">Dott. Andrea Armenti &amp; Dott.ssa Beatrice Nardi</p>' +
      '<p>Dott. Andrea Armenti Membro AICPE – Associazione Italiana Chirurgia Plastica ed Estetica e AITEB (associazione italiana terapia estetica botulino)</p>' +
      '<p>Le informazioni presenti su questo sito non sostituiscono in alcun modo il consulto medico. Ogni trattamento è personalizzato sulla base della valutazione clinica. I risultati possono variare da persona a persona.</p>' +
      '<p>MedX Clinic · Corso Francia 221, Roma</p>' +
      '<p>Copyright © 2026 | Via delle albicocche 25 – 00071, Pomezia, Italia – P.iva: IT18236221000</p>' +
      '<p class="firma-link"><a href="informativa.html">Informativa privacy</a><a href="informativa.html#cookie">Cookie policy</a>' +
      (C.pixel ? '<button type="button" class="link" data-azione="cookie">Preferenze cookie</button>' : '') +
      '<button type="button" class="link" data-azione="ricomincia">Cancella le risposte da questo telefono</button></p>' +
      '</div></footer>';
  }


  /* ---------- le schermate ---------- */
  var V = {};

  V.apertura = function () {
    var ripresa = Object.keys(S.r).length > 0;
    // Primo schermo: un volto vero, un messaggio, un'azione. Il resto sotto la piega.
    return {
      corpo:
        // Primo schermo: il video vero della clinica (elettromiografia), titolo, un'azione.
        '<section class="eroe"><video src="img/sensori.mp4" poster="img/sensori.jpg" autoplay muted loop playsinline preload="auto" aria-hidden="true"></video><div class="velo"></div>' +
        '<div class="eroe-in">' +
        '<h1 tabindex="-1">Da dove cominceresti a raccontare il tuo mal di testa?</h1>' +
        '<p class="lead">Il dott. Armenti parte da queste sette domande. Puoi farle anche tu, in due minuti. Dopo ognuna trovi <b>cosa c’entra quella cosa col mal di testa</b>.</p>' +
        '<button class="btn" type="button" data-azione="comincia">' + (ripresa ? 'Riprendi da dove eri' : 'Comincia') + FRECCIA + '</button>' +
        (ripresa ? '<button class="btn vuoto" type="button" data-azione="ricomincia">Ricomincia da capo</button>' : '<div class="quanto"><span>7 domande</span><span>2 minuti</span><span>niente dati per iniziare</span></div>') +
        '<i class="giu" aria-hidden="true"></i></div></section>' +
        // La pagina lunga (1 ottobre): spiega prima del test, solo con testi già approvati
        // (schede delle domande, apertura v4) e materiale vero della clinica.
        '<div class="lunga">' +
        // 1 · i muscoli
        '<section class="sez"><div class="occhiello">Il mal di testa del mattino</div>' +
        // la tavola di Marco (1 ott): i due muscoli si accendono uno dopo l'altro, linee giuste ridisegnate qui
        '<figure class="tavola2 svela-tavola" aria-label="Tavola anatomica: il muscolo temporale e il massetere">' +
        '<div class="t2-quadro"><img class="t2-base" src="img/tavola-muscoli.jpg" alt="" width="1100" height="997" loading="lazy">' +
        '<img class="t2-m t2-temp" src="img/tavola-temporale.webp" alt="" loading="lazy"><img class="t2-m t2-mass" src="img/tavola-massetere.webp" alt="" loading="lazy"></div>' +
        '<svg viewBox="0 0 1544 1400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
        '<path class="tratto" d="M405 96 L790 470"/><circle class="punto" cx="790" cy="470" r="11"/><circle class="anello" cx="790" cy="470" r="11"/><text x="40" y="108">TEMPORALE</text>' +
        '<path class="tratto due" d="M405 1300 L640 1010"/><circle class="punto due" cx="640" cy="1010" r="11"/><circle class="anello due" cx="640" cy="1010" r="11"/><text class="due" x="40" y="1328">MASSETERE</text>' +
        '</svg></figure>' +
        '<p class="sez-testo">I muscoli che chiudono la mandibola — il <b>massetere</b> e il <b>temporale</b> — lavorano anche durante il sonno. Quando la contrazione notturna è intensa, il dolore può essere già presente prima di alzarsi.</p>' +
        '<h3 class="sez-tit">Le tempie</h3><p class="sez-testo">Il muscolo <b>temporale</b> è un ventaglio che occupa la tempia e scende verso la mandibola. È uno dei muscoli della masticazione, e la sua tensione si sente proprio in quella zona.</p>' +
        '<h3 class="sez-tit">La mascella e le guance</h3><p class="sez-testo">Il <b>massetere</b> è il muscolo che chiude la mandibola, e si trova esattamente lì. In rapporto alla sua dimensione è fra i più potenti del corpo.</p></section>' +
        // 2 · si misura
        '<section class="sez"><div class="occhiello">La maggior parte non lo sa</div>' +
        '<p class="sez-testo">L’attività notturna dei muscoli masticatori avviene durante il sonno, quindi non se ne ha memoria. È la ragione per cui esistono modi di misurarla invece di chiederla.</p>' +
        '<figure class="clip eco"><video data-src="img/eco.mp4" poster="img/eco.jpg" muted loop playsinline preload="none" aria-hidden="true"></video><figcaption>Ecografia del massetere · MedX Clinic</figcaption></figure>' +
        '<figure class="clip"><video data-src="img/mappa.mp4" poster="img/mappa.jpg" muted loop playsinline preload="none" aria-hidden="true"></video><figcaption>L’analisi elettromiografica · MedX Clinic</figcaption></figure></section>' +
        // 3 · il dottore te lo spiega (parte solo se la persona lo tocca)
        '<section class="sez"><div class="occhiello">Il dott. Andrea Armenti, in un minuto</div>' +
        '<figure class="reel"><button type="button" class="reel-copertina" data-azione="reel" aria-label="Guarda il video del dott. Armenti, un minuto"><img src="img/dottore.jpg" alt="" loading="lazy"><span class="play" aria-hidden="true"></span><span class="reel-eti">Guarda · 1 minuto</span></button></figure></section>' +
        // 4 · cosa ricevi
        '<section class="sez"><h2 class="sez-h2">Cosa ricevi alla fine</h2>' +
        '<p class="sez-testo">Le tue risposte in ordine, e accanto <b>le cinque cose che si guardano in clinica</b> per capire se un mal di testa nasce dai muscoli.</p>' +
        '<p class="sez-testo">Il confronto lo fai tu: <b>noi non ti diciamo cosa hai</b>, quello si fa guardando una persona, non uno schermo.</p>' +
        '<ul class="elenco"><li><b>7 domande in 2 minuti</b>, e finisce in una volta sola</li><li><b>Niente dati per iniziare</b></li><li><b>Le risposte restano sul tuo telefono</b> finché non decidi tu</li></ul>' +
        '<button class="btn" type="button" data-azione="comincia" style="margin-top:22px">' + (ripresa ? 'Riprendi da dove eri' : 'Comincia') + FRECCIA + '</button></section>' +
        // 5 · il dottore e la clinica
        '<section class="sez"><div class="medico"><img src="assets/armenti.jpg" alt="Il dott. Andrea Armenti" width="64" height="64" loading="lazy">' +
        '<div><h3>Dott. Andrea Armenti</h3><p class="piccolo grigio" style="margin-top:2px">Specialista in Chirurgia Plastica, Ricostruttiva ed Estetica · Dottorato di ricerca in Chirurgia Rigenerativa, Università di Tor Vergata</p></div></div>' +
        '<figure class="ambiente" style="margin-top:22px"><img src="img/clinica.jpg" alt="La reception di MedX Clinic in Corso Francia" width="1086" height="900" loading="lazy"></figure>' +
        '<p class="nota-foto">MedX Clinic · Corso Francia 221, Roma</p></section>' +
        '<p class="piccolo grigio" style="margin-top:30px">Se preferisci saltare le domande e vedere <b>come funziona una valutazione</b> — quanto dura, quanto costa, cosa si sente — <button type="button" class="link" data-azione="salta">la pagina è qui</button>.</p>' +
        '</div>' +
        firma(),
      piede: ''
    };
  };

  V.perimetro = function () {
    return {
      corpo:
        '<div class="croce" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 4v16M4 12h16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></div>' +
        '<div class="occhiello">Prima di cominciare</div>' +
        '<h2 tabindex="-1">Quando queste domande non sono la strada giusta</h2>' +
        '<p class="lead">Ci sono situazioni in cui un mal di testa va guardato da un medico <b>e basta</b>, senza passare da qui.</p>' +
        '<ul class="perimetro">' + T.perimetro.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' +
        '<p class="nota-ambra"><b>Se riconosci una di queste cose, parlane col tuo medico.</b> Non è una cosa che si valuta con delle domande su un telefono.</p>' +
        firma(),
      piede: '<button class="btn" type="button" data-azione="domande">Ho letto, vai alle domande' + FRECCIA + '</button><div class="sotto-btn">Questa schermata la vedono tutti, sempre</div>'
    };
  };

  // La tavola anatomica: una sola, sotto la prima domanda, per chiunque risponda.
  // Dipende dal NUMERO della domanda, mai dalla risposta data.
  function tavola() {
    return '<figure class="tavola" aria-label="Tavola anatomica: il muscolo temporale e il massetere">' +
      '<img src="img/anatomia.jpg" alt="" width="700" height="806" loading="lazy">' +
      '<svg viewBox="0 0 400 360" aria-hidden="true">' +
      '<circle class="punto" cx="196" cy="77" r="3.5"/><path class="tratto" d="M196 77 L46 40"/><text x="12" y="31">TEMPORALE</text>' +
      '<circle class="punto due" cx="160" cy="241" r="3.5"/><path class="tratto due" d="M160 241 L92 290"/><text class="due" x="12" y="302">MASSETERE</text>' +
      '</svg><figcaption>Tavola illustrata</figcaption></figure>';
  }

  // Domanda 2 («Dove»): si risponde anche toccando la testa. Le zone sono le
  // stesse risposte della lista (stesso data-k), che resta sotto per chi preferisce.
  function mappaTesta(scelte) {
    var Z = [[0, 335, 215, 105, 'TEMPIE', 300, 175], [1, 505, 455, 90, 'NUCA', 478, 415], [2, 205, 315, 70, 'OCCHI', 110, 275], [3, 290, 470, 90, 'MASCELLA', 215, 575]];
    return '<figure class="testa-tocca"><img src="img/anatomia.jpg" alt="" width="700" height="806">' +
      '<svg viewBox="0 0 700 806" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' +
      Z.map(function (z) {
        return '<g class="zona" data-azione="scegli" data-k="' + z[0] + '" data-on="' + (scelte.indexOf(z[0]) >= 0) + '">' +
          '<circle class="alone" cx="' + z[1] + '" cy="' + z[2] + '" r="' + z[3] + '"/><circle class="onda" cx="' + z[1] + '" cy="' + z[2] + '" r="18"/>' +
          '<circle class="punto" cx="' + z[1] + '" cy="' + z[2] + '" r="15"/><text x="' + z[5] + '" y="' + z[6] + '">' + z[4] + '</text></g>';
      }).join('') + '</svg><figcaption>Tocca la testa, o scegli qui sotto</figcaption></figure>';
  }

  // Un video vero della clinica sotto alcune domande: dipende dal NUMERO della domanda, mai dalla risposta.
  var CLIP = { 4: ['mappa', 'L’analisi elettromiografica · MedX Clinic'], 2: ['calibra', 'La misurazione dei muscoli · MedX Clinic'], 3: ['eco', 'Ecografia del massetere · MedX Clinic'] };
  V.domanda = function () {
    var i = Math.min(Math.max(S.i, 0), N - 1), d = D[i], scelte = risposta(i), multi = (d.max || 1) > 1;
    var s = '<div class="domanda"><h2 tabindex="-1" id="dq">' + h(d.q) + '</h2>';
    if (d.sotto) s += '<p class="sotto">' + h(d.sotto) + '</p>';
    if (i === 1) s += mappaTesta(scelte);
    s += '<div class="opzioni" role="' + (multi ? 'group' : 'radiogroup') + '" aria-labelledby="dq">';
    d.o.forEach(function (o, k) {
      var on = scelte.indexOf(k) >= 0;
      s += '<button type="button" class="opz' + (multi ? ' multi' : '') + '" role="' + (multi ? 'checkbox' : 'radio') + '" aria-checked="' + on + '" data-azione="scegli" data-k="' + k + '"><span class="cx" aria-hidden="true"></span><span>' + h(o[0]) + '</span></button>';
    });
    s += '</div></div><div aria-live="polite">';
    if (scelte.length) {
      // una risposta, una scheda: la scheda parla dell'argomento, non della persona
      if (i === 0) s += tavola();
      else if (CLIP[i]) s += '<figure class="clip ' + CLIP[i][0] + '"><video src="img/' + CLIP[i][0] + '.mp4" poster="img/' + CLIP[i][0] + '.jpg" autoplay muted loop playsinline aria-hidden="true"></video><figcaption>' + CLIP[i][1] + '</figcaption></figure>';
      scelte.forEach(function (k) {
        s += '<div class="scheda"><div class="occhiello">Cosa c’entra</div><h3>' + h(d.o[k][1]) + '</h3><p>' + d.o[k][2] + '</p></div>';
      });
      var altre = d.o.map(function (o, k) { return k; }).filter(function (k) { return scelte.indexOf(k) < 0; });
      s += '<div class="biblio" id="biblio"><div class="biblio-tit">Leggi anche le altre ' + NUMERI[altre.length] + '</div><div class="scaffale">' +
        altre.map(function (k) { return '<button type="button" class="dorso" data-azione="altra" data-k="' + k + '" aria-expanded="false" aria-controls="pag' + k + '">' + h(d.o[k][1]) + '</button>'; }).join('') + '</div>' +
        altre.map(function (k) { return '<div class="pagina-biblio" id="pag' + k + '" hidden><p>' + d.o[k][2] + '</p></div>'; }).join('') + '</div>';
    }
    s += '</div>' + firma();
    return {
      corpo: s,
      piede: '<button class="btn" type="button" data-azione="avanti"' + (scelte.length ? '' : ' disabled') + '>' + (i < N - 1 ? 'Avanti' : 'Vedi il riepilogo') + FRECCIA + '</button>',
      avanz: i
    };
  };

  V.sblocca = function () {
    ev('sblocca', null, true);
    return {
      corpo:
        '<div class="occhiello">Il tuo riepilogo è pronto</div>' +
        '<h2 tabindex="-1">Compila e ricevi il riepilogo</h2>' +
        '<p class="sotto">Lo vedi subito qui, appena premi il pulsante.</p>' +
        '<form id="formSblocca" novalidate>' + campiContatto('s', true) +
        '<p class="nota-dati">Ti scrive solo la segreteria di MedX Clinic.</p>' +
        '<div class="avviso" id="sAvviso" hidden role="alert"></div>' +
        '<button class="btn" type="submit" id="sInvia">Ricevi il riepilogo' + FRECCIA + '</button></form>' +
        firma(),
      piede: ''
    };
  };

  function righeRiepilogo() {
    return '<ul class="righe">' + D.map(function (d, i) {
      var sc = risposta(i);
      return '<li><span class="lab">' + h(d.eti) + '</span><b>' + (sc.length ? sc.map(function (k) { return h(d.o[k][0]); }).join(' · ') : '—') + '</b></li>';
    }).join('') + '</ul>';
  }
  function righeCriterio(svela) {
    return '<ol class="cinque">' + T.criteri.map(function (c, k) {
      return '<li' + (svela ? ' class="svela"' : '') + '><span class="n" aria-hidden="true">0' + (k + 1) + '</span><b>' + h(c[0]) + '</b><span class="sec">' + h(c[1]) + '</span></li>';
    }).join('') + '</ol>';
  }
  function oggi() {
    try { return new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return ''; }
  }

  V.riepilogo = function () {
    ev('completato', null, true);
    return {
      corpo:
        '<div class="occhiello no-stampa">Finito · 1 di 2</div>' +
        '<article class="documento"><div class="doc-testa"><img src="assets/logo-medx.png" alt="MedX Clinic" width="84" height="14"><span>' + h(oggi()) + '</span></div>' +
        '<h2 class="doc-tit" tabindex="-1">Ecco cosa hai risposto</h2><p class="doc-sotto">Parole tue, rimesse in fila.</p>' +
        righeRiepilogo() +
        '<div class="solo-stampa"><h2 class="doc-tit">Le cinque cose che si guardano</h2><ul class="righe">' + T.criteri.map(function (c, k) { return '<li><span class="lab">0' + (k + 1) + '</span><b>' + h(c[0]) + '</b></li>'; }).join('') + '</ul></div>' +
        '<p class="doc-piede">MedX Clinic · Corso Francia 221, Roma · Questionario orientativo, non è una diagnosi.</p></article>' +
        '<p class="porta-con-te"><b>Portale con te.</b> Sono le cose che un medico ti chiede nei primi cinque minuti: averle già in ordine fa risparmiare la parte noiosa.</p>' +
        '<p class="no-stampa" style="margin-top:6px"><button type="button" class="link" data-azione="stampa">Salva o stampa questa pagina</button></p>' +
        firma(),
      piede: '<button class="btn" type="button" data-azione="vai" data-passo="criterio">Vedi cosa si guarda' + FRECCIA + '</button>'
    };
  };

  V.criterio = function () {
    ev('criterio', null, true);
    return {
      corpo:
        '<div class="criterio"><div class="occhiello">Finito · 2 di 2</div><h2 tabindex="-1">Le cinque cose che si guardano</h2>' +
        '<p class="lead">Non esiste un test fai-da-te per il mal di testa muscolare. Esistono cinque caratteristiche che, <b>quando ci sono insieme</b>, dicono che vale la pena guardare i muscoli.</p>' +
        righeCriterio(true) +
        '<p class="confronto svela"><b>Il confronto lo fai tu.</b> Se ti ritrovi in tre o più, hai una domanda precisa da fare a chi ti visiterà. Se non ti ritrovi in nessuna, <b>è un’informazione anche quella</b>.</p>' +
        '<p class="no-stampa" style="margin-top:18px"><button type="button" class="link" data-azione="vai" data-passo="riepilogo">Rivedi le tue risposte</button></p></div>' +
        firma(),
      piede: '<button class="btn" type="button" data-azione="vai" data-passo="pratiche">Come funziona una valutazione' + FRECCIA + '</button>'
    };
  };

  V.pratiche = function () {
    ev('pratiche', null, true);
    var P = C.pratiche || {};
    function voce(dom, risp, aperta) { return '<details' + (aperta ? ' open' : '') + '><summary>' + dom + '</summary><div class="risposta">' + risp + '</div></details>'; }
    function val(v, et) { return v ? h(v) : '<span class="buco">' + et + '</span>'; }
    return {
      corpo:
        '<div class="occhiello">Prima che tu lo chieda</div><h2 tabindex="-1">Come funziona una valutazione</h2>' +
        '<figure class="ambiente"><img src="img/clinica.jpg" alt="La reception di MedX Clinic in Corso Francia" width="1086" height="900" loading="lazy"></figure>' +
        '<p class="nota-foto">La reception di MedX Clinic, Corso Francia 221</p>' +
        '<div class="fisarmonica">' +
        voce('Quanto dura?', val(P.durata, 'Da confermare dalla segreteria'), true) +
        voce('Quanto costa, e cosa comprende?', val(P.prezzo, 'Da confermare dalla segreteria')) +
        voce('Cosa si sente durante la misurazione?', val(P.sensazione, 'Da confermare dal dottore')) +
        voce('Dove siete?', 'MedX Clinic, Corso Francia 221, Roma.') +
        voce('Devo portare qualcosa?', 'Se hai referti o esami già fatti sono utili. Non servono per iniziare.') +
        voce('E se poi non voglio fare niente?', 'Esci con una lettura di quello che c’è. Cosa farne lo decidi tu, e non c’è nessun impegno preso.') +
        '</div>' + firma(),
      piede: '<button class="btn" type="button" data-azione="vai" data-passo="porte">Avanti' + FRECCIA + '</button>'
    };
  };

  // unica = una spunta sola che vale per privacy, WhatsApp e risposte (Marco, 2 ottobre: meno spunte, più contatti)
  function campiContatto(pre, unica) {
    var spunte = unica
      ? '<label class="spunta"><input type="checkbox" id="' + pre + 'Privacy"><span>Ho letto l’<a href="informativa.html" target="_blank" rel="noopener">informativa privacy</a> e acconsento a essere ricontattato da MedX Clinic, anche su WhatsApp, e a inviare le mie risposte al test.</span></label>' +
        '<div class="errore" id="' + pre + 'PrivacyE"></div>'
      : '<label class="spunta"><input type="checkbox" id="' + pre + 'Privacy"><span>Ho letto l’<a href="informativa.html" target="_blank" rel="noopener">informativa privacy</a> e acconsento al trattamento dei miei dati per essere ricontattato.</span></label>' +
        '<div class="errore" id="' + pre + 'PrivacyE"></div>' +
        '<label class="spunta"><input type="checkbox" id="' + pre + 'Wa"><span>Acconsento a essere ricontattato anche su WhatsApp dalla segreteria di MedX Clinic. <span class="grigio">(Facoltativo)</span></span></label>';
    return '<div class="campo"><label for="' + pre + 'Nome">Nome</label><input id="' + pre + 'Nome" name="nome" autocomplete="name" required maxlength="80"><div class="errore" id="' + pre + 'NomeE"></div></div>' +
      '<div class="campo"><label for="' + pre + 'Email">Email</label><input id="' + pre + 'Email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="120"><div class="errore" id="' + pre + 'EmailE"></div></div>' +
      '<div class="campo"><label for="' + pre + 'Tel">Telefono</label><input id="' + pre + 'Tel" name="tel" type="tel" autocomplete="tel" inputmode="tel" required maxlength="20"><div class="errore" id="' + pre + 'TelE"></div></div>' +
      spunte;
  }

  // il modulo della seconda porta resta chiuso finché la persona non sceglie quella porta
  var domandeAperte = false;
  V.porte = function () {
    ev('porte', null, true);
    return {
      corpo:
        '<h2 tabindex="-1">Cosa vuoi fare adesso</h2>' +
        '<p class="sotto">Tre strade. Nessuna è obbligata per vedere quello che hai già visto.</p>' +
        '<section class="porta-uno"><h3>Prenoto la valutazione</h3><p>Lasci nome e numero e ti chiamiamo noi per fissare giorno e ora. Se vuoi, puoi allegare le tue risposte: il medico le ha già in visita.</p>' +
        '<button class="btn" type="button" data-azione="prenota">Lascio il mio numero' + FRECCIA + '</button>' +
        (C.whatsapp ? '<p class="o-wa">oppure</p>' + bottoneWhatsApp('vuoto scuro') : '') + '</section>' +
        '<section class="porta-due"><h3>Ho prima delle domande</h3><p class="piccolo">Lasci nome, mail e numero. Ti scrive la segreteria — non il dottore, e non per venderti niente.</p>' +
        (domandeAperte
          ? '<form id="formDomande" novalidate>' + campiContatto('d') +
            '<p class="nota-dati">Nessun dato sulla salute viene raccolto in questo modulo: le tue risposte restano sul telefono.</p>' +
            '<div class="avviso" id="dAvviso" hidden role="alert"></div>' +
            '<button class="btn vuoto" type="submit" id="dInvia">Fatemi sapere</button></form>'
          : '<button class="btn vuoto" type="button" data-azione="apri-domande" aria-expanded="false">Scrivo le mie domande</button>') +
        '</section>' +
        '<section class="porta-tre"><p><b>Oppure niente.</b> Il riepilogo è già tuo, salvalo e chiudi. Va benissimo così.</p>' +
        '<button type="button" class="link" data-azione="stampa-niente">Salva o stampa il riepilogo</button></section>' +
        firma(),
      piede: ''
    };
  };

  function bottoneWhatsApp(cls) {
    if (!C.whatsapp) return '';
    var n = C.whatsapp.replace(/[^\d]/g, ''), testo = encodeURIComponent('Ciao, vorrei fissare una valutazione da MedX Clinic.');
    return '<a class="btn ' + (cls || 'vuoto') + '" href="https://wa.me/' + n + '?text=' + testo + '" target="_blank" rel="noopener" data-azione="whatsapp">Scrivici su WhatsApp</a>';
  }

  V.dati = function () {
    return {
      corpo:
        '<h2 tabindex="-1">A chi telefoniamo?</h2>' +
        '<p class="sotto">Ti chiamiamo noi per fissare giorno e ora della valutazione. Il numero serve solo a questo.</p>' +
        '<form id="formPrenota" novalidate>' + campiContatto('p') +
        '<label class="spunta"><input type="checkbox" id="pAllega"><span>Acconsento a inviare le mie sette risposte, che riguardano la mia salute, perché il medico le abbia già in visita. <span class="grigio">(Facoltativo. Se non spunti, restano solo sul tuo telefono.)</span></span></label>' +
        '<div class="avviso" id="pAvviso" hidden role="alert"></div>' +
        '<button class="btn" type="submit" id="pInvia">Chiamatemi' + FRECCIA + '</button></form>' +
        firma(),
      piede: ''
    };
  };

  V.prenotato = function () {
    return {
      corpo:
        '<div class="occhiello">Ricevuto</div><h2 tabindex="-1">Ti chiamiamo noi</h2>' +
        '<p class="lead">MedX Clinic ti telefona nelle prossime ore per fissare con te giorno e ora della valutazione. Se preferisci, scrivici tu su WhatsApp.</p>' +
        '<div style="margin-top:20px">' + bottoneWhatsApp() + '</div>' +
        '<div class="quel-giorno"><h3>Cosa succede quel giorno</h3><p class="piccolo">Ti accoglie la segreteria, poi entri dal dottore. La prima parte è fatta di domande — quelle a cui hai già risposto. Poi si guarda e si misura.</p></div>' +
        '<p style="margin-top:16px"><button type="button" class="link" data-azione="stampa-niente">Salva o stampa il tuo riepilogo</button></p>' + firma(),
      piede: ''
    };
  };

  V.grazie = function () {
    return {
      corpo:
        '<div class="occhiello">Ricevuto</div><h2 tabindex="-1">Ti scrive la segreteria</h2>' +
        '<p class="lead">La segreteria di MedX Clinic ti risponde nelle prossime ore. Non il dottore, e non per venderti niente: per rispondere alle tue domande su come funziona.</p>' +
        '<p class="piccolo grigio" style="margin-top:12px">Se preferisci chiamare tu: <a href="tel:' + C.telefono.replace(/\s/g, '') + '">' + h(C.telefono) + '</a>.</p>' +
        '<div style="margin-top:18px">' + bottoneWhatsApp() + '</div>' +
        '<p style="margin-top:16px"><button type="button" class="link" data-azione="stampa-niente">Salva o stampa il tuo riepilogo</button></p>' + firma(),
      piede: ''
    };
  };

  /* ---------- disegno ---------- */
  function render(anima) {
    if (chiuso(S.passo)) S.passo = 'sblocca';
    var v = (V[S.passo] || V.apertura)();
    $corpo.innerHTML = v.corpo; $piede.innerHTML = v.piede || '';
    document.body.setAttribute('data-passo', S.passo);
    $indietro.hidden = S.passo === 'apertura';
    if (v.avanz !== undefined) {
      var fatte = v.avanz + (risposta(v.avanz).length ? 1 : 0);
      $avanz.hidden = false; $avSx.textContent = 'Domanda ' + (v.avanz + 1) + ' di ' + N;
      $avDx.textContent = v.avanz < 3 ? 'circa 2 minuti' : (v.avanz < 5 ? 'circa 1 minuto' : 'quasi finito');
      $barra.style.width = (fatte / N * 100) + '%'; $barraBox.setAttribute('aria-valuenow', fatte);
    } else $avanz.hidden = true;
    if (anima) {
      $corpo.classList.remove('entra'); void $corpo.offsetWidth; $corpo.classList.add('entra');
      window.scrollTo(0, 0);
      var t = $corpo.querySelector('h1,h2'); if (t) t.focus({ preventScroll: true });
    }
    svela();
    if (S.passo === 'dati' || S.passo === 'porte' || S.passo === 'sblocca') precompila();
  }

  // le cinque cose entrano allo scorrere, una volta sola (niente conteggi automatici)
  var osserva = null;
  function svela() {
    var tv = $corpo.querySelectorAll('.svela-tavola');
    if (tv.length && window.IntersectionObserver) { var ot = new IntersectionObserver(function (v) { v.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('via'); ot.unobserve(x.target); } }); }, { rootMargin: '0px 0px -20% 0px' }); tv.forEach(function (x) { ot.observe(x); }); }
    else tv.forEach(function (x) { x.classList.add('via'); });
    // i video lontani dal primo schermo si caricano solo quando ci si arriva
    var vd = $corpo.querySelectorAll('video[data-src]');
    if (vd.length && window.IntersectionObserver) { var ov = new IntersectionObserver(function (v) { v.forEach(function (x) { if (x.isIntersecting) { var e = x.target; e.src = e.getAttribute('data-src'); e.removeAttribute('data-src'); var pr = e.play(); if (pr && pr.catch) pr.catch(function () {}); ov.unobserve(e); } }); }, { rootMargin: '200px 0px' }); vd.forEach(function (x) { ov.observe(x); }); }
    var el = $corpo.querySelectorAll('.svela'); if (!el.length) return;
    if (!window.IntersectionObserver || matchMedia('(prefers-reduced-motion: reduce)').matches) { el.forEach(function (x) { x.classList.add('visto'); }); return; }
    if (osserva) osserva.disconnect();
    osserva = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) { if (v.isIntersecting) { v.target.classList.add('visto'); osserva.unobserve(v.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    el.forEach(function (x) { osserva.observe(x); });
  }

  /* ---------- azioni ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-azione]'); if (!b) return;
    var a = b.getAttribute('data-azione');
    if (a === 'comincia') { ev('inizio', null, true); if (Object.keys(S.r).length) { vai(S.passo === 'apertura' ? 'domanda' : S.passo, S.passo === 'apertura' ? primaVuota() : S.i); } else vai('perimetro'); }
    else if (a === 'ricomincia') { S = nuovo(); try { localStorage.removeItem(CHIAVE); } catch (x) {} vai('apertura', 0, true); }
    else if (a === 'salta') { ev('inizio', null, true); vai('pratiche'); }
    else if (a === 'domande') { ev('domande_iniziate', null, true); vai('domanda', 0); }
    else if (a === 'scegli') scegli(+b.getAttribute('data-k'));
    else if (a === 'altra') {
      // biblioteca: un argomento aperto alla volta
      var aperta = b.getAttribute('aria-expanded') === 'true';
      $corpo.querySelectorAll('.dorso').forEach(function (x) { x.setAttribute('aria-expanded', 'false'); });
      $corpo.querySelectorAll('.pagina-biblio').forEach(function (x) { x.hidden = true; });
      if (!aperta) { b.setAttribute('aria-expanded', 'true'); var pg = document.getElementById('pag' + b.getAttribute('data-k')); pg.hidden = false; if (pg.scrollIntoView) setTimeout(function () { pg.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 30); }
    }
    else if (a === 'apri-domande') { domandeAperte = true; render(false); precompila(); var n0 = document.getElementById('dNome'); if (n0) { n0.scrollIntoView({ behavior: 'smooth', block: 'center' }); n0.focus({ preventScroll: true }); } }
    else if (a === 'avanti') { if (!risposta(S.i).length) return; ev('domanda', S.i + 1, true); if (S.i < N - 1) vai('domanda', S.i + 1); else vai(S.ok ? 'riepilogo' : 'sblocca'); }
    else if (a === 'vai') { var dest = b.getAttribute('data-passo'); vai(chiuso(dest) ? 'sblocca' : dest); }
    else if (a === 'prenota') { ev('cta_prenota', null, true); vai('dati'); }
    else if (a === 'whatsapp') ev('cta_whatsapp', null, true);
    else if (a === 'reel') { var fg = b.parentNode; fg.innerHTML = '<video src="img/reel-dottore.mp4" controls autoplay playsinline></video>'; }
    else if (a === 'stampa') { ev('stampa'); window.print(); }
    else if (a === 'cookie-si') scegliCookie(true);
    else if (a === 'cookie-no') scegliCookie(false);
    else if (a === 'cookie') banner(true);
    else if (a === 'stampa-niente') { ev('cta_niente', null, true); ev('stampa'); stampaRiepilogo(); }
  });
  function primaVuota() { for (var i = 0; i < N; i++) if (!risposta(i).length) return i; return N - 1; }

  function scegli(k) {
    var d = D[S.i], max = d.max || 1, sc = risposta(S.i).slice();
    if (max === 1) sc = [k];
    else { var p = sc.indexOf(k); if (p >= 0) sc.splice(p, 1); else { sc.push(k); if (sc.length > max) sc.shift(); } }
    S.r[S.i] = sc; salva(); render(false);
    // la scheda e «leggi anche le altre» devono stare sopra il pulsante fisso
    var alt = $corpo.querySelector('.tavola, .scheda');
    if (alt && alt.scrollIntoView) setTimeout(function () { alt.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 40);
  }

  // stampa: il riepilogo col criterio, anche dalle porte
  function stampaRiepilogo() {
    var torna = S.passo; S.passo = 'riepilogo'; render(false);
    setTimeout(function () { window.print(); S.passo = torna; render(false); }, 60);
  }

  /* ---------- moduli ---------- */
  var ultimoContatto = null;
  function precompila() {
    if (!ultimoContatto) return;
    ['d', 'p', 's'].forEach(function (p) {
      var n = document.getElementById(p + 'Nome'); if (n && !n.value) { n.value = ultimoContatto.nome; document.getElementById(p + 'Email').value = ultimoContatto.email; document.getElementById(p + 'Tel').value = ultimoContatto.tel; }
    });
  }
  function valida(p) {
    var ok = true, $ = function (id) { return document.getElementById(p + id); };
    function err(id, msg) { $(id + 'E').textContent = msg; var inp = $(id); if (inp && inp.tagName === 'INPUT' && inp.type !== 'checkbox') inp.setAttribute('aria-invalid', msg ? 'true' : 'false'); if (msg && ok) { ok = false; inp.focus(); } }
    var nome = $('Nome').value.trim(), email = $('Email').value.trim().toLowerCase(), tel = $('Tel').value.replace(/[\s.\-()\/]/g, '');
    // Active accetta il telefono solo col prefisso internazionale: senza, scarta il contatto in silenzio
    if (/^00\d/.test(tel)) tel = '+' + tel.slice(2); else if (/^\d/.test(tel)) tel = '+39' + tel;
    err('Nome', nome.length < 2 ? 'Scrivi il tuo nome.' : '');
    err('Email', /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email) ? '' : 'Controlla l’indirizzo email.');
    err('Tel', /^\+\d{9,15}$/.test(tel) ? '' : 'Scrivi un numero di telefono valido.');
    err('Privacy', $('Privacy').checked ? '' : 'Per poterti ricontattare serve la spunta sull’informativa.');
    // nel modulo a spunta unica (senza la casella WhatsApp) la spunta vale anche per WhatsApp
    return ok ? { nome: nome, email: email, tel: tel, wa: $('Wa') ? $('Wa').checked : true } : null;
  }

  // Invio ad Active Campaign col modulo nativo. Una richiesta "semplice"
  // (form-urlencoded, no-cors): nessuna chiave nel sito, dati nel corpo e mai
  // nell'indirizzo. Active risponde senza farsi leggere: se la rete regge, è arrivato.
  function mandaActive(c, porta, allega) {
    var A = C.active, f = A.campi, q = new URLSearchParams(), ora = new Date().toISOString().slice(0, 16).replace('T', ' ');
    q.set('u', A.form); q.set('f', A.form); q.set('s', ''); q.set('c', '0'); q.set('m', '0'); q.set('act', 'sub'); q.set('v', '2'); q.set('or', SESS);
    q.set('fullname', c.nome); q.set('email', c.email); q.set('phone', c.tel);
    q.set('field[' + f.porta + ']', porta);
    q.set('field[' + f.privacy + ']', 'Sì · test mal di testa · ' + ora);
    if (c.wa) q.set('field[' + f.whatsapp + ']', 'Sì · ' + ora);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(function (k) { if (UTM[k]) q.set('field[' + f[k] + ']', UTM[k]); });
    if (allega) q.set('field[' + f.risposte + ']', D.map(function (d, i) { var sc = risposta(i); return d.eti + ': ' + (sc.length ? sc.map(function (k) { return d.o[k][0]; }).join(' · ') : '—'); }).join('\n'));
    var ctrl = window.AbortController ? new AbortController() : null, timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);
    return fetch(A.url, { method: 'POST', mode: 'no-cors', body: q, signal: ctrl ? ctrl.signal : undefined, credentials: 'omit', referrerPolicy: 'strict-origin' })
      .then(function () { clearTimeout(timer); }, function (e) { clearTimeout(timer); throw e; });
  }

  function gestisciModulo(e, p, porta) {
    e.preventDefault();
    var bott = document.getElementById(p + 'Invia'), avv = document.getElementById(p + 'Avviso');
    if (bott.disabled) return; // doppio tocco
    var c = valida(p); if (!c) return;
    // modulo del riepilogo: la spunta unica comprende l'invio delle risposte
    var spAllega = document.getElementById(p + 'Allega'), allega = p === 's' || !!(spAllega && spAllega.checked);
    bott.disabled = true; var testo = bott.textContent; bott.textContent = 'Invio in corso…'; avv.hidden = true;
    mandaActive(c, porta, allega).then(function () {
      ultimoContatto = c;
      if (porta === 'riepilogo') { S.ok = 1; salva(); ev('lead_riepilogo', null, true); vai('riepilogo', undefined, true); }
      else if (porta === 'domande') { ev('lead_domande', null, true); vai('grazie'); }
      else { ev('prenotazione_iniziata', null, true); vai('prenotato'); }
    }, function () {
      ev('errore_invio');
      bott.disabled = false; bott.textContent = testo; avv.hidden = false;
      avv.innerHTML = 'Non siamo riusciti a inviare. Controlla la connessione e riprova, oppure chiama la segreteria al <a href="tel:' + C.telefono.replace(/\s/g, '') + '">' + h(C.telefono) + '</a>.';
    });
  }
  document.addEventListener('submit', function (e) {
    if (e.target.id === 'formDomande') { ev('cta_domande', null, true); gestisciModulo(e, 'd', 'domande'); }
    if (e.target.id === 'formPrenota') gestisciModulo(e, 'p', 'prenotazione');
    if (e.target.id === 'formSblocca') gestisciModulo(e, 's', 'riepilogo');
  });

  /* ---------- partenza ---------- */
  history.replaceState({ passo: S.passo, i: S.i, n: 0 }, '');
  ev('landing', null, true);
  render(false);
  if (C.pixel && sceltaPixel() === null) banner(true);
})();
