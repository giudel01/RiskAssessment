// Client Script — risk_assessment_eval_form
// Handles: initialization, dynamic calculation, validation, GlideAjax save, M2M table rendering.

(function() {

    // Wait for DOM ready
    jQuery(document).ready(function($) {

        // --- Guard: if record not found, stop ---
        if (g_ra_record_found !== 'true') {
            return;
        }

        // =============================================
        // INITIALIZATION
        // =============================================

        // Pre-select probabilita dropdown
        if (g_ra_probabilita) {
            $('#probabilita').val(g_ra_probabilita);
        }

        // Pre-select impatto dropdown
        if (g_ra_impatto) {
            $('#impatto').val(g_ra_impatto);
        }

        // Set data valutazione — default to today if empty
        if (g_ra_data_valutazione) {
            $('#dataValutazione').val(g_ra_data_valutazione);
        } else {
            var today = new Date();
            var yyyy = today.getFullYear();
            var mm = String(today.getMonth() + 1);
            if (mm.length < 2) mm = '0' + mm;
            var dd = String(today.getDate());
            if (dd.length < 2) dd = '0' + dd;
            $('#dataValutazione').val(yyyy + '-' + mm + '-' + dd);
        }

        // Calculate initial rischio inerente
        calcRischioInerente();

        // =============================================
        // RENDER M2M CONTROLS TABLE (Section C)
        // =============================================
        renderControlsTable();

        function renderControlsTable() {
            var container = $('#controlsContainer');
            container.empty();

            if (!m2mData || m2mData.length === 0) {
                container.html('<div class="no-controls-msg">Nessun controllo associato a questo Risk Assessment.</div>');
                return;
            }

            var html = '<div class="controls-table-wrapper">';
            html += '<table class="controls-table">';
            html += '<thead><tr>';
            html += '<th style="width:15%;">Numero Controllo</th>';
            html += '<th style="width:45%;">Descrizione</th>';
            html += '<th style="width:40%;">Risultato <span class="required-marker" style="color:#d32f2f;">*</span></th>';
            html += '</tr></thead>';
            html += '<tbody>';

            for (var i = 0; i < m2mData.length; i++) {
                var row = m2mData[i];
                var sysId = escapeHtml(row.m2mSysId);
                var num = escapeHtml(row.controlNumber);
                var desc = escapeHtml(row.controlDesc);
                var ris = row.risultato || '';

                html += '<tr>';
                html += '<td>' + num + '</td>';
                html += '<td>' + desc + '</td>';
                html += '<td>';
                html += '<select class="m2m-risultato" data-m2m-sysid="' + sysId + '" id="risultato_' + sysId + '">';
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
            container.html(html);
        }

        // =============================================
        // DYNAMIC CALCULATION — u_rischio_inerente
        // =============================================

        $('#probabilita, #impatto').on('change', function() {
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

            // Flash highlight effect
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

            // Clear previous errors
            $('#errorContainer').empty();
            $('.field-error').removeClass('field-error');

            // Check probabilita
            if (!$('#probabilita').val()) {
                errors.push('Il campo "Probabilit\u00e0 Inerente" \u00e8 obbligatorio.');
                $('#probabilita').addClass('field-error');
            }

            // Check impatto
            if (!$('#impatto').val()) {
                errors.push('Il campo "Impatto Inerente" \u00e8 obbligatorio.');
                $('#impatto').addClass('field-error');
            }

            // Check data valutazione
            if (!$('#dataValutazione').val()) {
                errors.push('Il campo "Data Valutazione" \u00e8 obbligatorio.');
                $('#dataValutazione').addClass('field-error');
            }

            // Check M2M risultato fields (only if M2M rows exist)
            if (m2mData && m2mData.length > 0) {
                var missingControls = [];
                $('.m2m-risultato').each(function() {
                    if (!$(this).val()) {
                        $(this).addClass('field-error');
                        var sysId = $(this).data('m2m-sysid');
                        // Find the control number for this row
                        for (var i = 0; i < m2mData.length; i++) {
                            if (m2mData[i].m2mSysId === sysId) {
                                missingControls.push(m2mData[i].controlNumber);
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
                for (var i = 0; i < errors.length; i++) {
                    errorHtml += '<li>' + errors[i] + '</li>';
                }
                errorHtml += '</ul></div>';
                $('#errorContainer').html(errorHtml);

                // Scroll to top to show errors
                $('html, body').animate({ scrollTop: 0 }, 300);
                return false;
            }

            return true;
        }

        // =============================================
        // SAVE — GlideAjax
        // =============================================

        $('#btnSalva').on('click', function() {
            if (!validateForm()) {
                return;
            }
            saveEvaluation();
        });

        function saveEvaluation() {
            // Disable save button and show overlay
            $('#btnSalva').prop('disabled', true);
            $('#savingOverlay').show();

            // Collect M2M results
            var m2mResults = [];
            $('.m2m-risultato').each(function() {
                m2mResults.push({
                    m2mSysId: $(this).data('m2m-sysid'),
                    risultato: $(this).val()
                });
            });

            // Build GlideAjax call
            var ga = new GlideAjax('SaveRiskEvaluation');
            ga.addParam('sysparm_name', 'saveEvaluation');
            ga.addParam('sysparm_sys_id', g_ra_sys_id);
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
                        // Redirect back to the record
                        var returnUrl = 'nav_to.do?uri=u_risk_assessment_custom.do'
                            + '?sys_id=' + encodeURIComponent(g_ra_sys_id)
                            + '%26sysparm_view=default'
                            + '%26sysparm_message=' + encodeURIComponent('Valutazione salvata con successo');

                        if (window.opener) {
                            window.opener.location.href = returnUrl;
                            window.close();
                        } else {
                            window.location.href = returnUrl;
                        }
                    } else {
                        // Show error message in form
                        $('#errorContainer').html(
                            '<div class="alert alert-danger">' +
                            '<strong>Errore:</strong> ' + escapeHtml(result.message) +
                            '</div>'
                        );
                        $('html, body').animate({ scrollTop: 0 }, 300);
                    }
                } catch (e) {
                    $('#errorContainer').html(
                        '<div class="alert alert-danger">' +
                        '<strong>Errore di rete.</strong> Riprovare.' +
                        '</div>'
                    );
                    $('html, body').animate({ scrollTop: 0 }, 300);
                }
            });
        }

        // =============================================
        // CANCEL BUTTON
        // =============================================

        $('#btnAnnulla').on('click', function() {
            window.close();
        });

        // =============================================
        // UTILITY FUNCTIONS
        // =============================================

        function escapeHtml(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

    });

})();
