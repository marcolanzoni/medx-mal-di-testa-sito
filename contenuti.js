// I testi del test. Vengono dalla v4 («MedX — Il test v4», 20 agosto 2026) e
// dal prototipo cliccabile che la implementa (Funnel Mal di Testa/prototipo.html).
// Regole che questo file deve rispettare (v4, pagina 04):
//   1. ogni scheda parla dell'ARGOMENTO, in terza persona, mai della persona;
//   2. verbi che descrivono il tema, mai verbi che deducono (indicare, rivelare…);
//   3. una risposta apre una scheda: nessuna risposta ne guarda un'altra;
//   4. si mostra sempre tutto, nello stesso ordine, a chiunque;
//   5. nessuna raccomandazione su misura.
// Il codice non legge MAI il contenuto delle risposte per decidere qualcosa.
window.TESTO = {
  domande: [
    { eti: 'Quando', q: 'A che momento della giornata senti più spesso il mal di testa?',
      sotto: 'Non c’è una risposta giusta.',
      o: [
        ['Al mattino, appena sveglio', 'Il mal di testa del mattino', 'I muscoli che chiudono la mandibola — il <b>massetere</b> e il <b>temporale</b> — lavorano anche durante il sonno. Quando la contrazione notturna è intensa, il dolore può essere già presente prima di alzarsi.'],
        ['A metà mattina o nel pomeriggio', 'Il dolore che arriva durante il giorno', 'Un dolore che compare dopo alcune ore di attività si osserva spesso insieme a postura mantenuta a lungo, sforzo visivo e tensione accumulata. È un quadro diverso da quello che comincia nel sonno.'],
        ['La sera, dopo una giornata intensa', 'Il dolore di fine giornata', 'Alla sera pesa la somma delle ore: posizione della testa, schermi, carico dei muscoli del collo e delle spalle. Il momento in cui compare è una delle prime cose che si chiedono in visita.'],
        ['Non ha un orario preciso', 'Quando non c’è un orario', 'Un dolore senza schema orario non esclude niente: vuol dire che il tempo, da solo, non basta a orientare. Si guardano allora la sede e i movimenti che lo cambiano.']
      ] },
    { eti: 'Dove', q: 'Dove senti di solito il dolore o la tensione?',
      sotto: 'Puoi sceglierne fino a due.', max: 2,
      o: [
        ['Alle tempie', 'Le tempie', 'Il muscolo <b>temporale</b> è un ventaglio che occupa la tempia e scende verso la mandibola. È uno dei muscoli della masticazione, e la sua tensione si sente proprio in quella zona.'],
        ['Alla nuca o al collo', 'La nuca e il collo', 'I muscoli <b>suboccipitali</b> collegano la base del cranio alle prime vertebre. Possono lavorare insieme ai muscoli della masticazione, oppure per conto loro.'],
        ['Dietro gli occhi', 'Dietro gli occhi', 'Il dolore riferito dietro l’occhio è descritto sia in quadri muscolari sia in altri tipi di cefalea. Da solo non orienta: conta insieme a cos’altro c’è.'],
        ['Alla mascella o alle guance', 'La mascella e le guance', 'Il <b>massetere</b> è il muscolo che chiude la mandibola, e si trova esattamente lì. In rapporto alla sua dimensione è fra i più potenti del corpo.'],
        ['Diffuso, difficile da dire', 'Quando è diffuso', 'Un dolore che non si riesce a localizzare è un’informazione, non un’assenza di informazione: sposta le domande successive su cosa lo fa cambiare.']
      ] },
    { eti: 'Aprendo la bocca', q: 'La mattina, quando apri la bocca del tutto, cosa succede?',
      sotto: 'Prova adesso, se vuoi.',
      o: [
        ['Niente di particolare', 'Quando l’apertura è libera', 'Un’apertura completa e senza rumori è un elemento in meno da considerare. In visita si annota esattamente come si annota la sua presenza.'],
        ['Sento un clic o uno scrocchio', 'Il clic', 'Il rumore all’apertura viene dall’articolazione fra mandibola e cranio, dove il condilo e il disco si muovono l’uno sull’altro. È comune, e da solo non indica una gravità.'],
        ['Faccio fatica ad aprirla del tutto', 'La fatica ad aprire', 'La limitazione dell’apertura è una delle poche cose di questo campo che si <b>misura in millimetri</b>. Per questo si guarda per prima.'],
        ['Sento dolore o tensione alle guance', 'Il dolore aprendo', 'Aprire la bocca allunga i muscoli che la chiudono. Quando è quel movimento a far male, l’attenzione si sposta sui muscoli più che sull’articolazione.']
      ] },
    { eti: 'Di notte', q: 'Hai mai stretto i denti di notte, o qualcuno ha sentito digrignare?',
      sotto: 'Non serve saperlo con certezza.',
      o: [
        ['Sì, me l’hanno detto', 'Chi dorme accanto', 'Il digrignamento notturno viene notato quasi sempre da qualcun altro. È il modo più frequente in cui una persona lo scopre.'],
        ['Sì, me ne sono accorto da solo', 'Accorgersene da soli', 'Ci si accorge dalla mandibola indolenzita al risveglio, o dai denti che sembrano consumarsi. Sono osservazioni indirette, e valgono come tali.'],
        ['Non lo so', 'La maggior parte non lo sa', 'L’attività notturna dei muscoli masticatori avviene durante il sonno, quindi non se ne ha memoria. È la ragione per cui esistono modi di misurarla invece di chiederla.'],
        ['No, per quanto ne so', 'Quando non risulta', 'Che nessuno l’abbia notato non chiude la domanda: molte persone dormono sole. Resta un elemento fra gli altri.']
      ] },
    { eti: 'Già valutato', q: 'Hai già fatto una valutazione medica per questo dolore?',
      sotto: '',
      o: [
        ['Sì, più di una — senza una risposta chiara', 'Quando le valutazioni non convergono', 'Un percorso lungo senza una spiegazione stabile è frequente in questo campo: le cause muscolari si guardano con strumenti diversi da quelli usati per escludere le altre.'],
        ['Sì, una volta — farmaci o fisioterapia', 'Farmaci e fisioterapia', 'Sono trattamenti efficaci su molte cause di cefalea. Quando il dolore torna sempre uguale, in visita si chiede cosa è cambiato durante il trattamento e cosa no.'],
        ['Solo dal medico di base', 'Il primo passaggio', 'Il medico di base è il punto giusto da cui partire, ed è quello che indirizza verso gli accertamenti che servono a escludere.'],
        ['Non ancora', 'Quando non è stato ancora valutato', 'Una prima valutazione serve soprattutto a escludere. Le cause muscolari si guardano dopo, e con strumenti loro.']
      ] },
    { eti: 'Quanto pesa', q: 'Quanto ti pesa sulla giornata?',
      sotto: '',
      o: [
        ['Molto — cambia quello che riesco a fare', 'Quando cambia la giornata', 'L’impatto sulla vita quotidiana non è un dato clinico, ma è quello che si registra per capire da dove conviene cominciare.'],
        ['Abbastanza — ma vado avanti lo stesso', 'Quando si va avanti lo stesso', 'È la risposta più frequente. Un dolore compatibile con la giornata viene spesso rimandato per anni, e questo cambia anche il modo in cui viene raccontato.'],
        ['Poco — è fastidioso ma non mi blocca', 'Quando non blocca', 'Anche un fastidio lieve si annota: è il metro su cui si misurerà ogni cambiamento successivo.'],
        ['Cambia molto da giorno a giorno', 'Quando varia', 'La variabilità è essa stessa un dato. Si guarda cosa cambia nei giorni buoni: sonno, carico, posizione.']
      ] },
    { eti: 'Peggiora o migliora', q: 'C’è un momento in cui peggiora o migliora?',
      sotto: '',
      o: [
        ['Peggiora quando mastico o mangio', 'La masticazione', 'Masticare è esattamente il movimento che compiono il massetere e il temporale. Un dolore che aumenta con quel movimento porta l’attenzione su quei muscoli.'],
        ['Peggiora sotto stress', 'Lo stress', 'Lo stress alza il tono muscolare di base in tutto il corpo, compresi i muscoli della testa e della mandibola. Non è una causa unica: è un amplificatore.'],
        ['Migliora con il riposo', 'Il riposo', 'Il dolore di origine muscolare tende a rispondere alla riduzione del carico. La risposta al riposo è una delle cose che si chiedono per distinguere.'],
        ['Non ho notato uno schema', 'Nessuno schema', 'Quando non emerge uno schema, l’osservazione diretta e la misurazione diventano più utili delle domande. È il punto in cui un questionario esaurisce quello che può fare.']
      ] }
  ],

  // Schermata 06 · il criterio. Cinque righe fisse, uguali per chiunque.
  // La pagina NON le confronta con le risposte e NON conta niente.
  criteri: [
    ['Il dolore c’è già prima di alzarsi', 'Comincia durante il sonno, non dopo.'],
    ['Si concentra a tempie, occhi o nuca', 'Sono le zone dove i muscoli del cranio e della mandibola si riferiscono più spesso.'],
    ['La mandibola al mattino è rigida', 'È uno dei segni più affidabili di contrazione notturna.'],
    ['I farmaci danno sollievo, ma il dolore torna', 'Non vuol dire che non funzionino: vuol dire che il meccanismo resta.'],
    ['Le cause neurologiche sono già state escluse', 'Una risonanza normale è una buona notizia, non una risposta.']
  ],

  // Schermata 03 · il perimetro. Testo fisso, nessuna casella.
  perimetro: [
    'Comparso <b>all’improvviso e molto forte</b>, mai avuto prima',
    'Con <b>febbre</b> o collo rigido',
    'Dopo un <b>colpo alla testa</b>',
    'Con la <b>vista che cambia</b>, o formicolii, o parole che non escono',
    'Che <b>peggiora settimana dopo settimana</b>'
  ]
};
