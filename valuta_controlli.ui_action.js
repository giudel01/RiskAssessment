// UI Action — "Valuta Controlli"
// Table: u_risk_assessment_custom
// Type: Form button | Client: true
// Show insert: true | Show update: true
// Order: 100

function onClickValutaControlli() {
    var sysId = g_form.getUniqueValue();
    var url = '/risk_assessment_eval_form.do?sys_id=' + sysId;
    window.open(url, '_blank');
}
