document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos do formulário e de feedback ---
    const formEditar = document.getElementById('form-editar');
    const mensagemDiv = document.getElementById('mensagem-edicao');
    const formularioContainer = document.getElementById('formulario-container');
    const sucessoContainer = document.getElementById('sucesso-container');

    // --- Elementos da nossa nova janela (modal) ---
    const modal = document.getElementById('modal-confirmacao');
    const modalMensagem = document.getElementById('modal-mensagem');
    const btnModalConfirmar = document.getElementById('btn-modal-confirmar');
    const btnModalCancelar = document.getElementById('btn-modal-cancelar');

    if (!formEditar || !modal) return;

    // Variável para guardar a ação que precisa ser confirmada
    let acaoConfirmada = null;

    // --- Funções para controlar a janela ---
    function mostrarModal(mensagem, callback) {
        modalMensagem.textContent = mensagem; // Define a mensagem
        acaoConfirmada = callback; // Guarda a função que deve ser executada se o usuário confirmar
        modal.style.display = 'flex'; // Mostra a janela
    }

    function esconderModal() {
        modal.style.display = 'none'; // Esconde a janela
        acaoConfirmada = null; // Limpa a ação guardada
    }

    // --- Lógica para os botões da janela ---
    btnModalCancelar.addEventListener('click', esconderModal);

    btnModalConfirmar.addEventListener('click', () => {
        if (acaoConfirmada) {
            acaoConfirmada(); // Executa a ação de salvar
        }
        esconderModal(); // Esconde a janela após a ação
    });


    // --- Lógica do formulário principal ---
    formEditar.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Ação que será executada se o usuário clicar em "Confirmar" no modal
        const funcaoParaSalvar = () => {
            mensagemDiv.textContent = '';
            mensagemDiv.className = 'mensagem-cadastro';

            const nome = formEditar.querySelector('[name="nome"]').value;
            const email = formEditar.querySelector('[name="email"]').value;
            const sexo = formEditar.querySelector('[name="sexo"]').value;
            
            const saveButton = formEditar.querySelector('.btn-salvar');
            saveButton.disabled = true;
            saveButton.textContent = 'Salvando...';

            fetch('/atualizar_conta', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email, sexo })
            })
            .then(response => response.json())
            .then(data => {
                if (data.sucesso) {
                    formularioContainer.style.display = 'none';
                    sucessoContainer.style.display = 'flex';
                } else {
                    mensagemDiv.textContent = data.mensagem;
                    mensagemDiv.classList.add('erro');
                    saveButton.disabled = false;
                    saveButton.textContent = 'Salvar Alterações';
                }
            })
            .catch(err => {
                console.error(err);
                mensagemDiv.textContent = 'Erro ao conectar com o servidor.';
                mensagemDiv.classList.add('erro');
                saveButton.disabled = false;
                saveButton.textContent = 'Salvar Alterações';
            });
        };

        mostrarModal('Deseja realmente salvar as alterações?', funcaoParaSalvar);
    });
});