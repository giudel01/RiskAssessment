// ========================================================
// Client Script — risk_assessment_eval_form
// Da inserire nel tab "Client script" della UI Page.
// Vanilla JS, no jQuery, no ES6.
// Carica dati via GlideAjax, renderizza il form, gestisce save.
// ========================================================

function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function getTodayStr() {
    var d = new Date();
    var yyyy = d.getFullYear();
    var mm = String(d.getMonth() + 1);
    if (mm.length < 2) mm = '0' + mm;
    var dd = String(d.getDate());
    if (dd.length < 2) dd = '0' + dd;
    return yyyy + '-' + mm + '-' + dd;
}

function byId(id) { return document.getElementById(id); }

function getUrlParam(name) {
    var search = window.location.search || '';
    if (search.indexOf('?') === 0) search = search.substring(1);
    var parts = search.split('&');
    for (var i = 0; i < parts.length; i++) {
        var pair = parts[i].split('=');
        if (decodeURIComponent(pair[0]) === name) {
            return decodeURIComponent(pair[1] || '');
        }
    }
    return '';
}

// ---- MAIN INIT (runs when DOM is ready) ----
addLoadEvent(function() {

    var sysId = getUrlParam('sys_id');
    if (!sysId) {
        byId('mainContent').innerHTML = '';
        byId('errorContainer').innerHTML =
            '<div class="alert alert-danger">Parametro sys_id mancante. Chiudere questa finestra e riprovare.</div>';
        return;
    }

    // Load data via GlideAjax
    var ga = new GlideAjax('SaveRiskEvaluation');
    ga.addParam('sysparm_name', 'getEvaluationData');
    ga.addParam('sysparm_sys_id', sysId);
    ga.getXMLAnswer(function(response) {
        var data;
        try {
            data = JSON.parse(response);
        } catch (e) {
            byId('mainContent').innerHTML = '';
            byId('errorContainer').innerHTML =
                '<div class="alert alert-danger">Errore nel parsing della risposta dal server.</div>';
            return;
        }
        renderPage(data);
    });
});

function renderPage(data) {

    byId('headerNumber').textContent = data.number || '';

    if (data.errorMessage) {
        byId('mainContent').innerHTML = '';
        byId('errorContainer').innerHTML =
            '<div class="alert alert-danger">' + escapeHtml(data.errorMessage) + '</div>';
        return;
    }

    if (!data.recordFound) {
        byId('mainContent').innerHTML = '';
        byId('errorContainer').innerHTML =
            '<div class="alert alert-danger">Record non trovato.</div>';
        return;
    }

    var html = '';

    html += '<input type="hidden" id="raSysId" value="' + escapeHtml(data.sysId) + '" />';
    html += '<input type="hidden" id="rischioInerenteHidden" value="' + escapeHtml(data.rischioInerente) + '" />';

    // SECTION A — read-only
    html += '<div class="section-title">A — Dati del Risk Assessment</div>';
    html += '<div class="info-box">';
    html += '<div class="info-row"><span class="info-label">Number:</span> <span class="info-value">' + escapeHtml(data.number) + '</span></div>';
    html += '<div class="info-row"><span class="info-label">Short Description:</span> <span class="info-value">' + escapeHtml(data.shortDescription) + '</span></div>';
    html += '</div>';

    // SECTION B — editable
    html += '<div class="section-title">B — Valutazione del Risk Assessment</div>';
    html += '<div class="form-inline-row">';

    html += '<div class="form-group">';
    html += '<label for="probabilita">Probabilit\u00e0 Inerente <span class="required-marker">*</span></label>';
    html += '<select id="probabilita">';
    html += '<option value="">-- Seleziona --</option>';
    html += '<option value="1"' + (data.probabilita === '1' ? ' selected' : '') + '>Bassa</option>';
    html += '<option value="2"' + (data.probabilita === '2' ? ' selected' : '') + '>Media</option>';
    html += '<option value="3"' + (data.probabilita === '3' ? ' selected' : '') + '>Alta</option>';
    html += '</select></div>';

    html += '<div class="form-group">';
    html += '<label for="impatto">Impatto Inerente <span class="required-marker">*</span></label>';
    html += '<select id="impatto">';
    html += '<option value="">-- Seleziona --</option>';
    html += '<option value="1"' + (data.impatto === '1' ? ' selected' : '') + '>Basso</option>';
    html += '<option value="2"' + (data.impatto === '2' ? ' selected' : '') + '>Medio</option>';
    html += '<option value="3"' + (data.impatto === '3' ? ' selected' : '') + '>Alto</option>';
    html += '</select></div>';

    html += '<div class="form-group">';
    html += '<label for="rischioInerente">Rischio Inerente</label>';
    html += '<input type="text" id="rischioInerente" readonly value="' + escapeHtml(data.rischioInerente) + '" />';
    html += '</div>';
    html += '</div>';

    var dataValDefault = data.dataValutazione || getTodayStr();
    html += '<div class="form-inline-row"><div class="form-group">';
    html += '<label for="dataValutazione">Data Valutazione <span class="required-marker">*</span></label>';
    html += '<input type="date" id="dataValutazione" value="' + escapeHtml(dataValDefault) + '" />';
    html += '</div></div>';

    html += '<div class="form-group">';
    html += '<label for="noteValutazione">Note Valutazione</label>';
    html += '<textarea id="noteValutazione" maxlength="1000" placeholder="Max 1000 caratteri">' + escapeHtml(data.noteValutazione) + '</textarea>';
    html += '</div>';

    // SECTION C — controlli
    html += '<div class="section-title">C — Valutazione dei Controlli Associati</div>';

    if (!data.m2mData || data.m2mData.length === 0) {
        html += '<div class="no-controls-msg">Nessun controllo associato a questo Risk Assessment.</div>';
    } else {
        html += '<div class="controls-table-wrapper"><table class="controls-table"><thead><tr>';
        html += '<th style="width:15%;">Numero Controllo</th>';
        html += '<th style="width:45%;">Descrizione</th>';
        html += '<th style="width:40%;">Risultato <span style="color:#d32f2f;">*</span></th>';
        html += '</tr></thead><tbody>';

        for (var i = 0; i < data.m2mData.length; i++) {
            var row = data.m2mData[i];
            var sid = escapeHtml(row.m2mSysId);
            var ris = row.risultato || '';
            html += '<tr>';
            html += '<td>' + escapeHtml(row.controlNumber) + '</td>';
            html += '<td>' + escapeHtml(row.controlDesc) + '</td>';
            html += '<td><select class="m2m-risultato" data-m2m-sysid="' + sid + '">';
            html += '<option value="">-- Seleziona --</option>';
            html += '<option value="conforme"' + (ris === 'conforme' ? ' selected' : '') + '>Conforme</option>';
            html += '<option value="parzialmente_conforme"' + (ris === 'parzialmente_conforme' ? ' selected' : '') + '>Parzialmente Conforme</option>';
            html += '<option value="non_conforme"' + (ris === 'non_conforme' ? ' selected' : '') + '>Non Conforme</option>';
            html += '<option value="non_applicabile"' + (ris === 'non_applicabile' ? ' selected' : '') + '>Non Applicabile</option>';
            html += '</select></td></tr>';
        }

        html += '</tbody></table></div>';
    }

    html += '<div class="footer-actions">';
    html += '<button type="button" class="btn btn-secondary" id="btnAnnulla">Annulla</button>';
    html += '<button type="button" class="btn btn-primary" id="btnSalva">Salva</button>';
    html += '</div>';

    byId('mainContent').innerHTML = html;

    // Event listeners
    byId('probabilita').addEventListener('change', calcRischio);
    byId('impatto').addEventListener('change', calcRischio);
    byId('btnSalva').addEventListener('click', function() {
        if (validateForm(data)) saveEvaluation(data);
    });
    byId('btnAnnulla').addEventListener('click', function() { window.close(); });
}

function calcRischio() {
    var prob = parseInt(byId('probabilita').value, 10) || 0;
    var imp = parseInt(byId('impatto').value, 10) || 0;
    var rischio = '';
    if (prob > 0 && imp > 0) rischio = prob * imp;
    byId('rischioInerente').value = rischio;
    byId('rischioInerenteHidden').value = rischio;
    if (rischio !== '') {
        var f = byId('rischioInerente');
        f.classList.add('highlight-flash');
        setTimeout(function() { f.classList.remove('highlight-flash'); }, 500);
    }
}

function validateForm(data) {
    var errors = [];
    byId('errorContainer').innerHTML = '';
    var prev = document.querySelectorAll('.field-error');
    for (var e = 0; e < prev.length; e++) prev[e].classList.remove('field-error');

    if (!byId('probabilita').value) {
        errors.push('Il campo "Probabilit\u00e0 Inerente" \u00e8 obbligatorio.');
        byId('probabilita').classList.add('field-error');
    }
    if (!byId('impatto').value) {
        errors.push('Il campo "Impatto Inerente" \u00e8 obbligatorio.');
        byId('impatto').classList.add('field-error');
    }
    if (!byId('dataValutazione').value) {
        errors.push('Il campo "Data Valutazione" \u00e8 obbligatorio.');
        byId('dataValutazione').classList.add('field-error');
    }

    if (data.m2mData && data.m2mData.length > 0) {
        var selects = document.querySelectorAll('.m2m-risultato');
        var missing = [];
        for (var s = 0; s < selects.length; s++) {
            if (!selects[s].value) {
                selects[s].classList.add('field-error');
                var sid = selects[s].getAttribute('data-m2m-sysid');
                for (var j = 0; j < data.m2mData.length; j++) {
                    if (data.m2mData[j].m2mSysId === sid) {
                        missing.push(data.m2mData[j].controlNumber);
                        break;
                    }
                }
            }
        }
        if (missing.length > 0) {
            errors.push('Il campo "Risultato" \u00e8 obbligatorio per: ' + missing.join(', '));
        }
    }

    if (errors.length > 0) {
        var h = '<div class="alert alert-danger"><strong>Errori di validazione:</strong><ul>';
        for (var k = 0; k < errors.length; k++) h += '<li>' + errors[k] + '</li>';
        h += '</ul></div>';
        byId('errorContainer').innerHTML = h;
        window.scrollTo(0, 0);
        return false;
    }
    return true;
}

function saveEvaluation(data) {
    byId('btnSalva').disabled = true;
    byId('savingOverlay').style.display = 'block';

    var m2mResults = [];
    var selects = document.querySelectorAll('.m2m-risultato');
    for (var s = 0; s < selects.length; s++) {
        m2mResults.push({
            m2mSysId: selects[s].getAttribute('data-m2m-sysid'),
            risultato: selects[s].value
        });
    }

    var ga = new GlideAjax('SaveRiskEvaluation');
    ga.addParam('sysparm_name', 'saveEvaluation');
    ga.addParam('sysparm_sys_id', data.sysId);
    ga.addParam('sysparm_probabilita', byId('probabilita').value);
    ga.addParam('sysparm_impatto', byId('impatto').value);
    ga.addParam('sysparm_rischio', byId('rischioInerenteHidden').value);
    ga.addParam('sysparm_data_valutazione', byId('dataValutazione').value);
    ga.addParam('sysparm_note_valutazione', byId('noteValutazione').value);
    ga.addParam('sysparm_m2m_results', JSON.stringify(m2mResults));

    ga.getXMLAnswer(function(response) {
        byId('savingOverlay').style.display = 'none';
        byId('btnSalva').disabled = false;
        try {
            var result = JSON.parse(response);
            if (result.success) {
                var returnUrl = 'nav_to.do?uri=u_risk_assessment_custom.do'
                    + '?sys_id=' + encodeURIComponent(data.sysId)
                    + '%26sysparm_view=default'
                    + '%26sysparm_message=' + encodeURIComponent('Valutazione salvata con successo');
                if (window.opener) {
                    window.opener.location.href = returnUrl;
                    window.close();
                } else {
                    window.location.href = returnUrl;
                }
            } else {
                byId('errorContainer').innerHTML =
                    '<div class="alert alert-danger"><strong>Errore:</strong> ' + escapeHtml(result.message) + '</div>';
                window.scrollTo(0, 0);
            }
        } catch (ex) {
            byId('errorContainer').innerHTML =
                '<div class="alert alert-danger"><strong>Errore di rete.</strong> Riprovare.</div>';
            window.scrollTo(0, 0);
        }
    });
}
