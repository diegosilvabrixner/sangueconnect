document.addEventListener('DOMContentLoaded', function() {
    // --- Elementos da página ---
    const btnAgendamentos = document.getElementById('btn-agendamentos');
    const btnHistorico = document.getElementById('btn-historico');
    const listaAgendamentos = document.getElementById('lista-agendamentos');
    const listaHistorico = document.getElementById('lista-historico');
    const mainContent = document.querySelector('.main-content');

    // --- Elementos da nossa nova janela (modal) ---
    const modal = document.getElementById('modal-confirmacao');
    const modalMensagem = document.getElementById('modal-mensagem');
    const btnModalConfirmar = document.getElementById('btn-modal-confirmar');
    const btnModalCancelar = document.getElementById('btn-modal-cancelar');

    // Variáveis para guardar a ação que precisa ser confirmada
    let acaoConfirmada = null;

    // --- LÓGICA PARA TROCA DE ABAS ---
    btnAgendamentos.addEventListener('click', () => {
        btnAgendamentos.classList.add('active');
        btnHistorico.classList.remove('active');
        listaAgendamentos.style.display = 'flex';
        listaHistorico.style.display = 'none';
    });

    btnHistorico.addEventListener('click', () => {
        btnHistorico.classList.add('active');
        btnAgendamentos.classList.remove('active');
        listaHistorico.style.display = 'flex';
        listaAgendamentos.style.display = 'none';
    });

    // --- FUNÇÕES PARA CONTROLAR A JANELA ---
    function mostrarModal(mensagem, callback) {
        modalMensagem.textContent = mensagem; // Define a mensagem
        acaoConfirmada = callback; // Guarda a função que deve ser executada se o usuário confirmar
        modal.style.display = 'flex'; // Mostra a janela
    }

    function esconderModal() {
        modal.style.display = 'none'; // Esconde a janela
        acaoConfirmada = null; // Limpa a ação guardada
    }

    // --- LÓGICA PARA OS BOTÕES DA JANELA ---
    btnModalCancelar.addEventListener('click', esconderModal);

    btnModalConfirmar.addEventListener('click', () => {
        if (acaoConfirmada) {
            acaoConfirmada(); // Executa a ação de exclusão
        }
        esconderModal(); // Esconde a janela após a ação
    });

    // --- LÓGICA PARA EXCLUSÃO ---
    mainContent.addEventListener('click', function(event) {
        if (event.target && event.target.classList.contains('btn-excluir')) {
            const itemParaExcluir = event.target.closest('.item-doacao');
            const id = itemParaExcluir.dataset.id;
            const tipo = itemParaExcluir.dataset.tipo;
            
            let url, mensagemConfirmacao;

            if (tipo === 'agendamento') {
                url = `/cancelar_agendamento/${id}`;
                mensagemConfirmacao = 'Você confirma o cancelamento do agendamento desta doação?';
            } else if (tipo === 'registro') {
                url = `/excluir_registro/${id}`;
                mensagemConfirmacao = 'Você confirma a exclusão deste registro?';
            } else {
                return;
            }

            // Ação que será executada se o usuário clicar em "Confirmar"
            const funcaoParaExecutar = () => {
                fetch(url, {
                    method: 'DELETE',
                })
                .then(response => response.json())
                .then(data => {
                    if (data.sucesso) {
                        alert(data.mensagem);
                        itemParaExcluir.remove();
                    } else {
                        alert('Erro: ' + data.mensagem);
                    }
                })
                .catch(error => {
                    console.error('Erro:', error);
                    alert('Não foi possível processar sua solicitação.');
                });
            };

            // Mostra a nossa nova janela personalizada
            mostrarModal(mensagemConfirmacao, funcaoParaExecutar);
        }
    });
});