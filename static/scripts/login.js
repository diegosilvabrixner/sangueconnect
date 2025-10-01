document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.login-form');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.querySelector('#email').value.trim();
    const senha = document.querySelector('#senha').value.trim();

    if (!email || !senha) {
      alert('Preencha email e senha!');
      return;
    }

    try {
      const resposta = await fetch('/verificar_login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email, senha: senha })
      });

      const data = await resposta.json();

      if (resposta.ok && data.sucesso) {
        // Redireciona para home
        window.location.href = '/home';
      } else {
        alert(data.mensagem || 'Erro ao fazer login.');
      }
    } catch (erro) {
      console.error('Erro:', erro);
      alert('Erro ao tentar fazer login.');
    }
  });
});
