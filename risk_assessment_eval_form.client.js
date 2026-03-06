// Client Script — risk_assessment_eval_form
// Renders the entire form from g_pageData JSON injected by the single g2:evaluate block.
// No ES6 (no arrow functions, no let/const, no template literals).

(function() {

    // Utility: escape HTML
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Utility: get today as YYYY-MM-DD
    function getTodayStr() {
        var d = new Date();
        var yyyy = d.getFullYear();
        var mm = String(d.getMonth() + 1);
        if (mm.length < 2) mm = '0' + mm;
        var dd = String(d.getDate());
        if (dd.length < 2) dd = '0' + dd;
        return yyyy + '-' + mm + '-' + dd;
    }

    // Wait for DOM
    jQuery(document).ready(function($) {

        var data = window.g_pageData;

        // Fallback if g_pageData is undefined or not an object
        if (!data || typeof data !== 'object') {
            $('#errorContainer').html(
                '<div class="alert alert-danger">Errore nel caricamento dei dati dalla pagina. Verificare che il sys_id sia presente nell\'URL.</div>'
            );
            return;
        }

        // Set header number
        $('#headerNumber').text(data.number || '');

        // Show error message if present
        if (data.errorMessage) {
            $('#errorContainer').html(
                '<div class="alert alert-danger">' + escapeHtml(data.errorMessage) + '</div>'
            );
            return;
        }

        // If record not found, stop
        if (!data.recordFound) {
            $('#errorContainer').html(
                '<div class="alert alert-danger">Record non trovato.</div>'
            );
            return;
        }

        // =============================================
        // RENDER THE FULL FORM
        // =============================================
        var html = '';

        // Hidden fields
        html += '<input type="hidden" id="raSysId" value="' + escapeHtml(data.sysId) + '" />';
        html += '<input type="hidden" id="rischioInerenteHidden" value="' + escapeHtml(data.rischioInerente) + '" />';

        // SECTION A — Dati del Risk Assessment (read-only)
        html += '<div class="section-title">A &#8212; Dati del Risk Assessment</div>';
        html += '<div class="info-box">';
        html += '  <div class="info-row"><span class="info-label">Number:</span> <span class="info-value">' + escapeHtml(data.number) + '</span></div>';
        html += '  <div class="info-row"><span class="info-label">Short Description:</span> <span class="info-value">' + escapeHtml(data.shortDescription) + '</span></div>';
        html += '</div>';

        // SECTION B — Valutazione del Risk Assessment (editabile)
        html += '<div class="section-title">B &#8212; Valutazione del Risk Assessment</div>';

        // Row: probabilita, impatto, rischio
        html += '<div class="form-inline-row">';

        // Probabilita
        html += '<div class="form-group">';
        html += '  <label for="probabilita">Probabilit\u00e0 Inerente <span class="required-marker">*</span></label>';
        html += '  <select id="probabilita" name="probabilita">';
        html += '    <option value="">-- Seleziona --</option>';
        html += '    <option value="1"' + (data.probabilita === '1' ? ' selected="selected"' : '') + '>Bassa</option>';
        html += '    <option value="2"' + (data.probabilita === '2' ? ' selected="selected"' : '') + '>Media</option>';
        html += '    <option value="3"' + (data.probabilita === '3' ? ' selected="selected"' : '') + '>Alta</option>';
        html += '  </select>';
        html += '</div>';

        // Impatto
        html += '<div class="form-group">';
        html += '  <label for="impatto">Impatto Inerente <span class="required-marker">*</span></label>';
        html += '  <select id="impatto" name="impatto">';
        html += '    <option value="">-- Seleziona --</option>';
        html += '    <option value="1"' + (data.impatto === '1' ? ' selected="selected"' : '') + '>Basso</option>';
        html += '    <option value="2"' + (data.impatto === '2' ? ' selected="selected"' : '') + '>Medio</option>';
        html += '    <option value="3"' + (data.impatto === '3' ? ' selected="selected"' : '') + '>Alto</option>';
        html += '  </select>';
        html += '</div>';

        // Rischio Inerente (read-only)
        html += '<div class="form-group">';
        html += '  <label for="rischioInerente">Rischio Inerente</label>';
        html += '  <input type="text" id="rischioInerente" name="rischioInerente" readonly="readonly" value="' + escapeHtml(data.rischioInerente) + '" />';
        html += '</div>';

        html += '</div>'; // close form-inline-row

        // Row: data valutazione
        var dataValDefault = data.dataValutazione || getTodayStr();
        html += '<div class="form-inline-row">';
        html += '  <div class="form-group">';
        html += '    <label for="dataValutazione">Data Valutazione <span class="required-marker">*</span></label>';
        html += '    <input type="date" id="dataValutazione" name="dataValutazione" value="' + escapeHtml(dataValDefault) + '" />';
        html += '  </div>';
        html += '</div>';

        // Note valutazione
        html += '<div class="form-group">';
        html += '  <label for="noteValutazione">Note Valutazione</label>';
        html += '  <textarea id="noteValutazione" name="noteValutazione" maxlength="1000" placeholder="Max 1000 caratteri">' + escapeHtml(data.noteValutazione) + '</textarea>';
        html += '</div>';

        // SECTION C — Valutazione dei Controlli associati
        html += '<div class="section-title">C &#8212; Valutazione dei Controlli Associati</div>';
        html += '<div id="controlsContainer">';

        if (!data.m2mData || data.m2mData.length === 0) {
            html += '<div class="no-controls-msg">Nessun controllo associato a questo Risk Assessment.</div>';
        } else {
            html += '<div class="controls-table-wrapper">';
            html += '<table class="controls-table">';
            html += '<thead><tr>';
            html += '<th style="width:15%;">Numero Controllo</th>';
            html += '<th style="width:45%;">Descrizione</th>';
            html += '<th style="width:40%;">Risultato <span class="required-marker" style="color:#d32f2f;">*</span></th>';
            html += '</tr></thead>';
            html += '<tbody>';

            for (var i = 0; i < data.m2mData.length; i++) {
                var row = data.m2mData[i];
                var sid = escapeHtml(row.m2mSysId);
                var ris = row.risultato || '';

                html += '<tr>';
                html += '<td>' + escapeHtml(row.controlNumber) + '</td>';
                html += '<td>' + escapeHtml(row.controlDesc) + '</td>';
                html += '<td>';
                html += '<select class="m2m-risultato" data-m2m-sysid="' + sid + '" id="risultato_' + sid + '">';
                html += '<option value="">-- Seleziona --</option>';
                html += '<option value="conforme"' + (ris === 'conforme' ? ' selected="selected"' : '') + '>Conforme</option>';
                html += '<option value="parzialmente_conforme"' + (ris === 'parzialmente_conforme' ? ' selected="selected"' : '') + '>Parzialmente Conforme</option>';
                html += '<option value="non_conforme"' + (ris === 'non_conforme' ? ' selected="selected"' : '') + '>Non Conforme</option>';
                html += '<option value="non_applicabile"' + (ris === 'non_applicabile' ? ' selected="selected"' : '') + '>Non Applicabile</option>';
                html += '</select>';
                html += '</td>';
                html += '</tr>';
            }

            html += '</tbody></table></div>';
        }

        html += '</div>'; // close controlsContainer

        // Footer actions
        html += '<div class="footer-actions">';
        html += '  <button type="button" class="btn btn-secondary" id="btnAnnulla">Annulla</button>';
        html += '  <button type="button" class="btn btn-primary" id="btnSalva">Salva</button>';
        html += '</div>';

        // Inject all HTML
        $('#mainContent').html(html);

        // =============================================
        // DYNAMIC CALCULATION — u_rischio_inerente
        // =============================================

        $(document).on('change', '#probabilita, #impatto', function() {
            calcRischioInerente();
        });

        function calcRischioInerente() {
            var prob = parseInt($('#probabilita').val(), 10) || 0;
            var imp = parseInt($('#impatto').val(), 10) || 0;
            var rischio = '';

            if (prob > 0 && imp > 0) {
                rischio = prob * imp;
            }

            $('#rischioInerente').val(rischio);
            $('#rischioInerenteHidden').val(rischio);

            // Flash highlight
            if (rischio !== '') {
                var field = $('#rischioInerente');
                field.addClass('highlight-flash');
                setTimeout(function() {
                    field.removeClass('highlight-flash');
                }, 500);
            }
        }

        // =============================================
        // VALIDATION
        // =============================================

        function validateForm() {
            var errors = [];

            // Clear previous
            $('#errorContainer').empty();
            $('.field-error').removeClass('field-error');

            if (!$('#probabilita').val()) {
                errors.push('Il campo "Probabilit\u00e0 Inerente" \u00e8 obbligatorio.');
                $('#probabilita').addClass('field-error');
            }

            if (!$('#impatto').val()) {
                errors.push('Il campo "Impatto Inerente" \u00e8 obbligatorio.');
                $('#impatto').addClass('field-error');
            }

            if (!$('#dataValutazione').val()) {
                errors.push('Il campo "Data Valutazione" \u00e8 obbligatorio.');
                $('#dataValutazione').addClass('field-error');
            }

            // M2M risultato
            if (data.m2mData && data.m2mData.length > 0) {
                var missingControls = [];
                $('.m2m-risultato').each(function() {
                    if (!$(this).val()) {
                        $(this).addClass('field-error');
                        var sysId = $(this).data('m2m-sysid');
                        for (var j = 0; j < data.m2mData.length; j++) {
                            if (data.m2mData[j].m2mSysId === sysId) {
                                missingControls.push(data.m2mData[j].controlNumber);
                                break;
                            }
                        }
                    }
                });
                if (missingControls.length > 0) {
                    errors.push('Il campo "Risultato" \u00e8 obbligatorio per i seguenti controlli: ' + missingControls.join(', '));
                }
            }

            if (errors.length > 0) {
                var errorHtml = '<div class="alert alert-danger"><strong>Errori di validazione:</strong><ul>';
                for (var k = 0; k < errors.length; k++) {
                    errorHtml += '<li>' + errors[k] + '</li>';
                }
                errorHtml += '</ul></div>';
                $('#errorContainer').html(errorHtml);
                $('html, body').animate({ scrollTop: 0 }, 300);
                return false;
            }

            return true;
        }

        // =============================================
        // SAVE — GlideAjax
        // =============================================

        $(document).on('click', '#btnSalva', function() {
            if (!validateForm()) {
                return;
            }
            saveEvaluation();
        });

        function saveEvaluation() {
            $('#btnSalva').prop('disabled', true);
            $('#savingOverlay').show();

            var m2mResults = [];
            $('.m2m-risultato').each(function() {
                m2mResults.push({
                    m2mSysId: $(this).data('m2m-sysid'),
                    risultato: $(this).val()
                });
            });

            var ga = new GlideAjax('SaveRiskEvaluation');
            ga.addParam('sysparm_name', 'saveEvaluation');
            ga.addParam('sysparm_sys_id', data.sysId);
            ga.addParam('sysparm_probabilita', $('#probabilita').val());
            ga.addParam('sysparm_impatto', $('#impatto').val());
            ga.addParam('sysparm_rischio', $('#rischioInerenteHidden').val());
            ga.addParam('sysparm_data_valutazione', $('#dataValutazione').val());
            ga.addParam('sysparm_note_valutazione', $('#noteValutazione').val());
            ga.addParam('sysparm_m2m_results', JSON.stringify(m2mResults));

            ga.getXMLAnswer(function(response) {
                $('#savingOverlay').hide();
                $('#btnSalva').prop('disabled', false);

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
                        $('#errorContainer').html(
                            '<div class="alert alert-danger"><strong>Errore:</strong> ' + escapeHtml(result.message) + '</div>'
                        );
                        $('html, body').animate({ scrollTop: 0 }, 300);
                    }
                } catch (e) {
                    $('#errorContainer').html(
                        '<div class="alert alert-danger"><strong>Errore di rete.</strong> Riprovare.</div>'
                    );
                    $('html, body').animate({ scrollTop: 0 }, 300);
                }
            });
        }

        // =============================================
        // CANCEL BUTTON
        // =============================================

        $(document).on('click', '#btnAnnulla', function() {
            window.close();
        });

    });

})();
