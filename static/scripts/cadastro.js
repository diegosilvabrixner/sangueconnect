document.addEventListener('DOMContentLoaded', () => {
    const formCadastro = document.getElementById('form-cadastro');
    if (!formCadastro) return; // Se não estiver na página de cadastro, para o script.

    const nomeInput = formCadastro.querySelector('[name="nome"]');
    const emailInput = formCadastro.querySelector('[name="email"]');
    const sexoSelect = formCadastro.querySelector('[name="sexo"]');
    const mensagemDiv = document.getElementById('mensagem-cadastro');

    // --- LÓGICA NOVA PARA SALVAR E CARREGAR ---

    // Função para salvar os dados no sessionStorage
    const salvarDados = () => {
        const dados = {
            nome: nomeInput.value,
            email: emailInput.value,
            sexo: sexoSelect.value,
        };
        // Convertemos o objeto para texto para poder salvar
        sessionStorage.setItem('dadosCadastro', JSON.stringify(dados));
    };

    // Função para carregar os dados do sessionStorage
    const carregarDados = () => {
        const dadosSalvos = sessionStorage.getItem('dadosCadastro');
        if (dadosSalvos) {
            const dados = JSON.parse(dadosSalvos);
            nomeInput.value = dados.nome || '';
            emailInput.value = dados.email || '';
            sexoSelect.value = dados.sexo || '';
        }
    };

    // Carrega os dados assim que a página é aberta
    carregarDados();

    // Adiciona "ouvintes" que salvam os dados sempre que o usuário digita algo
    nomeInput.addEventListener('input', salvarDados);
    emailInput.addEventListener('input', salvarDados);
    sexoSelect.addEventListener('change', salvarDados);


    // --- LÓGICA DE ENVIO DO FORMULÁRIO (JÁ EXISTENTE COM UMA MODIFICAÇÃO) ---

    formCadastro.addEventListener('submit', async (event) => {
        event.preventDefault();

        mensagemDiv.textContent = '';
        mensagemDiv.className = 'mensagem-cadastro';

        const senha = formCadastro.querySelector('[name="senha"]').value;
        const confirmarSenha = formCadastro.querySelector('[name="confirmar_senha"]').value;
        const aceitoTermos = formCadastro.querySelector('[name="aceito_termos"]').checked;

        if (senha !== confirmarSenha) {
            mensagemDiv.textContent = 'As senhas não coincidem!';
            mensagemDiv.classList.add('erro');
            return;
        }

        if (!aceitoTermos) {
            mensagemDiv.textContent = 'Você precisa aceitar os termos para se cadastrar.';
            mensagemDiv.classList.add('erro');
            return;
        }

        try {
            const response = await fetch('/cadastrar_usuario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome: nomeInput.value,
                    email: emailInput.value,
                    sexo: sexoSelect.value,
                    senha,
                    confirmar_senha: confirmarSenha,
                    aceito_termos: aceitoTermos
                })
            });

            const data = await response.json();

            if (data.sucesso) {
                // LIMPA OS DADOS SALVOS APÓS O SUCESSO
                sessionStorage.removeItem('dadosCadastro');

                mensagemDiv.textContent = 'Usuário cadastrado com sucesso!';
                mensagemDiv.classList.add('sucesso');

                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else {
                mensagemDiv.textContent = data.mensagem;
                mensagemDiv.classList.add('erro');
            }
        } catch (err) {
            console.error(err);
            mensagemDiv.textContent = 'Erro ao conectar com o servidor.';
            mensagemDiv.classList.add('erro');
        }
    });
});