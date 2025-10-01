# Sangue Connect 🩸

Status do Projeto: Em Desenvolvimento

Uma aplicação web dedicada a simplificar e incentivar o processo de doação de sangue, conectando doadores a campanhas e centros de coleta de forma fácil e intuitiva. Seja um herói, doe sangue!

## 📋 Sobre o Projeto

Sangue Connect nasceu da necessidade de criar uma ponte digital entre doadores de sangue e a constante demanda por hemocentros e hospitais. A plataforma centraliza informações, permite o gerenciamento de doações e engaja a comunidade através de campanhas, transformando o ato de doar sangue em uma experiência mais organizada, acessível e gratificante.

O objetivo é fornecer ao usuário uma ferramenta completa para acompanhar sua jornada como doador, desde o agendamento da primeira doação até o controle do histórico e o cálculo automático de quando ele estará apto a doar novamente.

## ✨ Principais Funcionalidades

👤 Autenticação de Usuários: Sistema completo de cadastro e login.

📅 Agendamento de Doações: Permite que os usuários agendem suas doações em locais e horários específicos.

📝 Registro de Histórico: Usuários podem registrar doações já realizadas para manter seu histórico sempre atualizado.

🩸 Cálculo de Próxima Doação: O sistema calcula e exibe automaticamente a data em que o usuário estará apto para doar novamente, com base no sexo e na última doação.

🏆 Campanhas de Doação: Funcionalidade para criar e participar de campanhas de doação, incentivando o engajamento comunitário.

🗺️ Mapa de Locais: Encontre os pontos de coleta mais próximos (funcionalidade implícita).

✏️ Gerenciamento de Perfil: O usuário pode visualizar e editar suas informações pessoais.

📱 Design Responsivo: Interface adaptada para uma experiência de uso agradável tanto em desktops quanto em dispositivos móveis.

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído com as seguintes tecnologias:

    Back-end:

        Python 3

        Flask

    Front-end:

        HTML5

        CSS3

        JavaScript (ES6)

    Banco de Dados:

        SQLite 3

    Templating:

        Jinja2

## 🚀 Como Executar o Projeto Localmente

Siga os passos abaixo para rodar o Sangue Connect na sua máquina.

Pré-requisitos

    Python 3.8 ou superior

    pip (gerenciador de pacotes do Python)

Passos

    Clone o repositório (substitua SEU-USUARIO):
    Bash

git clone [https://github.com/SEU-USUARIO/sangue-connect.git](https://github.com/SEU-USUARIO/sangue-connect.git)

Navegue até o diretório do projeto:
Bash

cd sangue-connect

Crie e ative um ambiente virtual (recomendado):
Bash

### Para Windows
python -m venv venv
.\venv\Scripts\activate

### Para macOS/Linux
python3 -m venv venv
source venv/bin/activate

Instale as dependências necessárias:
Bash

pip install Flask

Execute a aplicação:
Bash

    python app.py

    Abra no seu navegador:
    Acesse http://127.0.0.1:5000 e comece a usar a aplicação!

## 🤝 Como Contribuir

Contribuições são o que tornam a comunidade de código aberto um lugar incrível para aprender, inspirar e criar. Qualquer contribuição que você fizer será muito bem-vinda.

    Faça um Fork do projeto.

    Crie uma Branch para sua feature (git checkout -b feature/AmazingFeature).

    Faça o Commit de suas mudanças (git commit -m 'Add some AmazingFeature').

    Faça o Push para a Branch (git push origin feature/AmazingFeature).

    Abra um Pull Request.

## 📜 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 👨‍💻 Autor

    Diego da Silva

    Link do Projeto: https://github.com/diegosilvabrixner/sangue-connect