// Configurazione del test. È l'unico file da toccare per riempire i buchi
// della schermata 07 (quando la segreteria dà i numeri) e per cambiare
// destinazioni. Qui NON ci sono chiavi segrete: la chiave del database è quella
// pubblica ("publishable"), che può scrivere solo nella tabella dei conteggi.
window.MX = {
  // Schermata 07 · le domande pratiche. null = buco vero: si vede come
  // "da confermare" e il lancio delle inserzioni resta fermo finché c'è.
  pratiche: {
    durata: null,     // es. "Circa 60 minuti." — dalla segreteria
    prezzo: null,     // es. "150 €. Comprende ..." — dalla segreteria
    sensazione: null  // parole del dott. Armenti
  },

  // Il contatto va su Active Campaign col modulo nativo "Funnel Mal di Testa
  // MedX" (id 1, lista 13). Le risposte al test NON escono mai, tranne il
  // campo "risposte" quando la persona spunta da sola "allega le mie risposte".
  active: {
    url: 'https://medxclinic.activehosted.com/proc.php',
    form: 1,
    campi: { privacy: 16, utm_source: 17, utm_medium: 18, utm_campaign: 19, utm_term: 20, utm_content: 21,
             porta: 29, whatsapp: 30, risposte: 31 }
  },

  // Conteggi anonimi dei passaggi (nessuna risposta, nessun dato personale).
  eventi: {
    url: 'https://cnvwpnmkvtnysubswnyw.supabase.co/rest/v1/funnel_eventi',
    key: 'sb_publishable_sup28sudXui-RMvTRjm3Vg_Re8wAQEs'
  },

  // Pixel Meta (dataset MedX già esistente). Riceve solo PageView, ViewContent
  // (test finito), Lead (dati lasciati) e Contact (bottone WhatsApp). null = spento.
  pixel: '1339633081554791',

  // Niente Calendly (Marco, 1 ottobre): chi vuole prenotare lascia il numero e lo
  // chiama la setter. WhatsApp commerciale di MedX Clinic, collegato a Chakra.
  whatsapp: '+39 352 026 9390',

  // Solo per la versione classica (/classica/), che tiene il giro con Calendly.
  calendly: 'https://calendly.com/medxclinic26/30min',

  telefono: '+39 352 029 4880'
};
