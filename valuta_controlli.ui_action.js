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
    var url = 'risk_assessment_eval_form.do?sys_id=' + sysId;

    // Try ServiceNow native navigation first, fallback to link click
    if (typeof g_navigation !== 'undefined' && g_navigation.openSeparate) {
        g_navigation.openSeparate(url);
    } else {
        var link = document.createElement('a');
        link.href = '/' + url;
        link.target = '_blank';
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    return false;
}
