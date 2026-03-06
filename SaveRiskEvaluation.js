var SaveRiskEvaluation = Class.create();
SaveRiskEvaluation.prototype = Object.extendsObject(AbstractAjaxProcessor, {

    getEvaluationData: function() {
        var output = {
            sysId: '',
            number: '',
            shortDescription: '',
            probabilita: '',
            impatto: '',
            rischioInerente: '',
            dataValutazione: '',
            noteValutazione: '',
            recordFound: false,
            errorMessage: '',
            m2mData: []
        };

        try {
            var sysId = this.getParameter('sysparm_sys_id');
            if (!sysId) {
                output.errorMessage = 'Parametro sys_id mancante.';
                return JSON.stringify(output);
            }

            output.sysId = sysId + '';
            var gr = new GlideRecord('u_risk_assessment_custom');
            if (!gr.get(sysId)) {
                output.errorMessage = 'Record Risk Assessment non trovato.';
                return JSON.stringify(output);
            }

            output.recordFound = true;
            output.number = gr.getValue('number') || '';
            output.shortDescription = gr.getValue('short_description') || '';
            output.probabilita = gr.getValue('u_probabilita_inerente231') || '';
            output.impatto = gr.getValue('u_impatto_inerente231') || '';
            output.rischioInerente = gr.getValue('u_rischio_inerente') || '';
            output.dataValutazione = gr.getValue('u_data_valutazione') || '';
            output.noteValutazione = gr.getValue('u_note_valutazione') || '';

            var m2m = new GlideRecord('u_m2m_u_risk_asmt_control');
            m2m.addQuery('u_risk_assessment_custom', sysId);
            m2m.query();
            while (m2m.next()) {
                var cNum = '';
                var cDesc = '';
                if (m2m.u_sn_compliance_control) {
                    cNum = m2m.u_sn_compliance_control.number + '';
                    cDesc = m2m.u_sn_compliance_control.short_description + '';
                }
                output.m2mData.push({
                    m2mSysId: m2m.getUniqueValue() + '',
                    controlNumber: cNum,
                    controlDesc: cDesc,
                    risultato: m2m.getValue('u_risultato') || ''
                });
            }
        } catch (e) {
            output.errorMessage = 'Errore server: ' + e.message;
        }

        return JSON.stringify(output);
    },

    saveEvaluation: function() {
        var result = {};

        try {
            var sysId = this.getParameter('sysparm_sys_id');
            var probabilita = this.getParameter('sysparm_probabilita');
            var impatto = this.getParameter('sysparm_impatto');
            var rischio = this.getParameter('sysparm_rischio');
            var dataValutazione = this.getParameter('sysparm_data_valutazione');
            var noteValutazione = this.getParameter('sysparm_note_valutazione');
            var m2mResultsStr = this.getParameter('sysparm_m2m_results');

            // Validate required parameters
            if (!sysId) {
                result.success = false;
                result.message = 'Parametro sys_id mancante.';
                return JSON.stringify(result);
            }

            // Update the Risk Assessment record
            var gr = new GlideRecord('u_risk_assessment_custom');
            if (!gr.get(sysId)) {
                result.success = false;
                result.message = 'Record Risk Assessment non trovato.';
                return JSON.stringify(result);
            }

            gr.setValue('u_probabilita_inerente231', probabilita);
            gr.setValue('u_impatto_inerente231', impatto);
            gr.setValue('u_rischio_inerente', rischio);
            gr.setValue('u_data_valutazione', dataValutazione);
            gr.setValue('u_note_valutazione', noteValutazione);
            gr.update();

            // Update M2M records
            if (m2mResultsStr) {
                var m2mResults = JSON.parse(m2mResultsStr);
                for (var i = 0; i < m2mResults.length; i++) {
                    var item = m2mResults[i];
                    var m2m = new GlideRecord('u_m2m_u_risk_asmt_control');
                    if (m2m.get(item.m2mSysId)) {
                        m2m.setValue('u_risultato', item.risultato);
                        m2m.update();
                    }
                }
            }

            result.success = true;
            result.message = 'Valutazione salvata con successo.';

        } catch (e) {
            result.success = false;
            result.message = 'Errore durante il salvataggio: ' + e.message;
        }

        return JSON.stringify(result);
    },

    type: 'SaveRiskEvaluation'
});
