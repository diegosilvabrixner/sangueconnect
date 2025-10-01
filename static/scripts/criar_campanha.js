document.addEventListener('DOMContentLoaded', () => {
    const cepInput = document.getElementById('cep');
    const cidadeInput = document.getElementById('cidade');
    const bairroInput = document.getElementById('bairro');
    const dataInicioInput = document.getElementById('data_inicio');
    const dataFimInput = document.getElementById('data_fim');
    const form = document.getElementById('form-criar-campanha');
    const mensagemDiv = document.getElementById('mensagem-campanha');

    const hoje = new Date();
    hoje.setDate(hoje.getDate() + 1);
    const dataMinima = hoje.toISOString().split('T')[0];
    dataInicioInput.setAttribute('min', dataMinima);

    dataInicioInput.addEventListener('change', () => {
        dataFimInput.value = '';
        dataFimInput.setAttribute('min', dataInicioInput.value);
    });

    cepInput.addEventListener('blur', async () => {
        let cep = cepInput.value.replace(/\D/g, '');
        if (cep.length === 8) {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            if (response.ok) {
                const data = await response.json();
                if (!data.erro) {
                    cidadeInput.value = data.localidade;
                    bairroInput.value = data.bairro;
                } else {
                    alert('CEP não encontrado.');
                }
            }
        }
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const dados = Object.fromEntries(formData.entries());
        
        const response = await fetch('/salvar_campanha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        const result = await response.json();

        mensagemDiv.textContent = result.mensagem;
        if(result.sucesso) {
            mensagemDiv.className = 'mensagem-feedback sucesso';
            setTimeout(() => { window.location.href = '/home'; }, 2000);
        } else {
            mensagemDiv.className = 'mensagem-feedback erro';
        }
    });
});