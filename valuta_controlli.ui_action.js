// UI Action — "Valuta Controlli"
// Table: u_risk_assessment_custom
// Type: Form button | Client: true
// Show insert: true | Show update: true
// Order: 100
//
// ============================================================
// IMPORTANTE — Configurazione UI Action in ServiceNow:
//
//   Campo "Onclick":   onClickValutaControlli()
//
//   Questo campo e' OBBLIGATORIO per le UI Action client-side.
//   Senza di esso il pulsante appare ma il click non fa nulla.
//   Nel form della UI Action, compilare il campo "Onclick" con:
//
//       onClickValutaControlli()
//
// ============================================================

function onClickValutaControlli() {
    var sysId = g_form.getUniqueValue();
    if (!sysId || sysId === '-1') {
        alert('Salvare il record prima di procedere con la valutazione.');
        return false;
    }
    var url = '/risk_assessment_eval_form.do?sys_id=' + sysId;
    window.open(url, '_blank');
    return false;
}
