document.addEventListener('DOMContentLoaded', function() {
    const formularioContainer = document.getElementById('formulario-container');
    const sucessoContainer = document.getElementById('sucesso-container');
    const dataInput = document.getElementById('data');
    const horaSelect = document.getElementById('hora');
    const confirmarBtn = document.getElementById('confirmar-btn');
    const localInput = document.getElementById('local');
    const errorMessage = document.getElementById('error-message');

    if (!formularioContainer) return;

    const campanhaId = formularioContainer.dataset.campanhaId;
    const dataInicio = formularioContainer.dataset.inicioCampanha;
    const dataFim = formularioContainer.dataset.fimCampanha;

    dataInput.setAttribute('min', dataInicio);
    dataInput.setAttribute('max', dataFim);

    function popularHorarios() {
        horaSelect.innerHTML = '<option value="" disabled selected>Selecione a hora</option>';
        for (let i = 8; i <= 13; i++) {
            const horaCheia = i.toString().padStart(2, '0') + ':00';
            const optionCheia = new Option(horaCheia, horaCheia);
            horaSelect.add(optionCheia);
            if (i < 13) {
                const meiaHora = i.toString().padStart(2, '0') + ':30';
                const optionMeia = new Option(meiaHora, meiaHora);
                horaSelect.add(optionMeia);
            }
        }
    }
    popularHorarios();

    confirmarBtn.addEventListener('click', function() {
        errorMessage.textContent = '';
        const local = localInput.value;
        const data = dataInput.value;
        const hora = horaSelect.value;

        if (!data || !hora) {
            errorMessage.textContent = 'Por favor, preencha data e hora.';
            return;
        }

        confirmarBtn.disabled = true;
        confirmarBtn.textContent = 'Enviando...';

        fetch(`/salvar_participacao/${campanhaId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ local, data, hora })
        })
        .then(response => response.json())
        .then(result => {
            if (result.sucesso) {
                formularioContainer.style.display = 'none';
                sucessoContainer.style.display = 'flex';
            } else {
                errorMessage.textContent = result.mensagem;
                confirmarBtn.disabled = false;
                confirmarBtn.textContent = 'Confirmar Participação';
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            errorMessage.textContent = 'Erro de conexão.';
            confirmarBtn.disabled = false;
            confirmarBtn.textContent = 'Confirmar Participação';
        });
    });
});