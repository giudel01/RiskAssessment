// Processing Script — risk_assessment_eval_form
// Runs server-side on page load. Reads Risk Assessment record and associated M2M controls.

(function() {

    var sysIdParam = RP.getParameterValue('sys_id') || '';
    var raNumber = '';
    var raShortDesc = '';
    var raProbabilita = '';
    var raImpatto = '';
    var raRischioInerente = '';
    var raDataValutazione = '';
    var raNoteValutazione = '';
    var recordFound = false;
    var errorMessage = '';
    var m2mDataJSON = '[]';

    if (!sysIdParam) {
        errorMessage = 'Parametro sys_id mancante. Chiudere questa finestra e riprovare.';
    } else {
        // Query 1 — Read Risk Assessment record
        var gr = new GlideRecord('u_risk_assessment_custom');
        if (gr.get(sysIdParam)) {
            recordFound = true;
            raNumber = gr.getValue('number') || '';
            raShortDesc = gr.getValue('short_description') || '';
            raProbabilita = gr.getValue('u_probabilita_inerente231') || '';
            raImpatto = gr.getValue('u_impatto_inerente231') || '';
            raRischioInerente = gr.getValue('u_rischio_inerente') || '';
            raDataValutazione = gr.getValue('u_data_valutazione') || '';
            raNoteValutazione = gr.getValue('u_note_valutazione') || '';
        } else {
            errorMessage = 'Record Risk Assessment non trovato.';
        }

        // Query 2 — Read M2M records with join to sn_compliance_control
        if (recordFound) {
            var m2mArray = [];
            var m2m = new GlideRecord('u_m2m_u_risk_asmt_control');
            m2m.addQuery('u_risk_assessment_custom', sysIdParam);
            m2m.query();
            while (m2m.next()) {
                var controlNumber = '';
                var controlDesc = '';
                var controlRef = m2m.u_sn_compliance_control;
                if (controlRef) {
                    controlNumber = controlRef.number + '';
                    controlDesc = controlRef.short_description + '';
                }
                m2mArray.push({
                    m2mSysId: m2m.getUniqueValue(),
                    controlNumber: controlNumber,
                    controlDesc: controlDesc,
                    risultato: m2m.getValue('u_risultato') || ''
                });
            }
            m2mDataJSON = JSON.stringify(m2mArray);
        }
    }

    // Expose variables for Jelly / HTML template
    // These will be injected into the page via Jelly g: tags
    var data = {
        sysId: sysIdParam,
        number: raNumber,
        shortDescription: raShortDesc,
        probabilita: raProbabilita,
        impatto: raImpatto,
        rischioInerente: raRischioInerente,
        dataValutazione: raDataValutazione,
        noteValutazione: raNoteValutazione,
        recordFound: recordFound,
        errorMessage: errorMessage,
        m2mDataJSON: m2mDataJSON
    };

})();
