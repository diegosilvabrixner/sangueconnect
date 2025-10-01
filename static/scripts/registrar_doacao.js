document.addEventListener('DOMContentLoaded', function() {
    // --- Selecionando os Elementos do HTML ---
    const formularioContainer = document.getElementById('formulario-container');
    const sucessoContainer = document.getElementById('sucesso-container');
    const localSelect = document.getElementById('local');
    const dataInput = document.getElementById('data');
    const confirmarBtn = document.getElementById('confirmar-btn');
    const errorMessage = document.getElementById('error-message');

    if (!formularioContainer || !sucessoContainer || !confirmarBtn) {
        console.error("Erro: Elementos essenciais do formulário ou da tela de sucesso não foram encontrados.");
        return;
    }

    const hoje = new Date().toISOString().split('T')[0];
    dataInput.setAttribute('max', hoje);

    confirmarBtn.addEventListener('click', function() {
        errorMessage.textContent = '';
        
        const local = localSelect.value;
        const data = dataInput.value;

        if (!local || !data) {
            errorMessage.textContent = 'Por favor, preencha todos os campos.';
            return;
        }

        if (data > hoje) {
            errorMessage.textContent = 'A data da doação não pode ser no futuro.';
            return;
        }
        
        confirmarBtn.disabled = true;
        confirmarBtn.textContent = 'Enviando...';

        const dadosDoacao = {
            local: local,
            data: data,
        };
        
        fetch('/salvar_doacao_registrada', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosDoacao),
        })
        .then(response => response.json())
        .then(result => {
            if (result.sucesso) {
                // --- AQUI É A MÁGICA ---
                // Esconde o formulário
                formularioContainer.style.display = 'none';
                // Mostra a mensagem de sucesso
                sucessoContainer.style.display = 'flex';
            } else {
                errorMessage.textContent = result.mensagem;
                // Reativa o botão se houver um erro
                confirmarBtn.disabled = false;
                confirmarBtn.textContent = 'Confirmar';
            }
        })
        .catch(error => {
            console.error('Erro na requisição:', error);
            errorMessage.textContent = 'Não foi possível conectar ao servidor.';
            // Reativa o botão em caso de falha de conexão
            confirmarBtn.disabled = false;
            confirmarBtn.textContent = 'Confirmar';
        });
    });
});