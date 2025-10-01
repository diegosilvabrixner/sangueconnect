document.addEventListener('DOMContentLoaded', function() {
    // --- Selecionando os Elementos do HTML ---
    const formularioContainer = document.getElementById('formulario-container');
    const sucessoContainer = document.getElementById('sucesso-container');
    const localSelect = document.getElementById('local');
    const dataInput = document.getElementById('data');
    const horaSelect = document.getElementById('hora');
    const confirmarBtn = document.getElementById('confirmar-btn');
    const errorMessage = document.getElementById('error-message');

    if (!localSelect || !dataInput || !horaSelect || !confirmarBtn) {
        console.error("Um ou mais elementos do formulário não foram encontrados.");
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const localDoMapa = urlParams.get('local');

    if (localDoMapa) {
        const nomeLocalDecodificado = decodeURIComponent(localDoMapa);

        let optionExists = false;
        for (let i = 0; i < localSelect.options.length; i++) {
            if (localSelect.options[i].value === nomeLocalDecodificado) {
                optionExists = true;
                break;
            }
        }

        if (!optionExists) {
            const newOption = new Option(nomeLocalDecodificado, nomeLocalDecodificado, true, true);
            localSelect.add(newOption);
        }
        
        localSelect.value = nomeLocalDecodificado;
    }

    const hoje = new Date();
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    const amanhaFormatado = amanha.toISOString().split('T')[0];
    dataInput.setAttribute('min', amanhaFormatado);

    dataInput.addEventListener('input', function() {
        const dataSelecionadaStr = dataInput.value;
        if (!dataSelecionadaStr) return;
        
        const dataSelecionada = new Date(dataSelecionadaStr + 'T00:00:00');
        
        if (dataSelecionada.getDay() === 0) {
            alert('Não é possível agendar doações aos domingos. Por favor, escolha outra data.');
            dataInput.value = '';
        } else {
            errorMessage.textContent = '';
        }
    });

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
        
        const local = localSelect.value;
        const data = dataInput.value;
        const hora = horaSelect.value;

        if (!local || !data || !hora) {
            errorMessage.textContent = 'Por favor, preencha todos os campos.';
            return;
        }

        if (data < amanhaFormatado) {
             errorMessage.textContent = 'A data não pode ser anterior a amanhã.';
             return;
        }

        confirmarBtn.disabled = true;
        confirmarBtn.textContent = 'Enviando...';

        const dadosAgendamento = { local, data, hora };
        
        fetch('/salvar_agendamento', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosAgendamento),
        })
        .then(response => response.json())
        .then(result => {
            if (result.sucesso) {
                formularioContainer.style.display = 'none';
                sucessoContainer.style.display = 'flex';
            } else {
                errorMessage.textContent = result.mensagem;
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            errorMessage.textContent = 'Não foi possível conectar ao servidor.';
        })
        .finally(() => {
            confirmarBtn.disabled = false;
            confirmarBtn.textContent = 'Confirmar Doação';
        });
    });
});