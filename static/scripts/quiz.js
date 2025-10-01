document.addEventListener('DOMContentLoaded', () => {
    const loadingState = document.getElementById('loading-state');
    const questionState = document.getElementById('question-state');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const checkButton = document.getElementById('check-button');
    const feedbackMessage = document.getElementById('feedback-message');
    const progressBar = document.getElementById('progress-bar');
    
    const apiKey = "AIzaSyCgT4bju6VlbtedWjsPjjutswAd1PGIZ7Q"; 

    let correctAnswer = '';
    let selectedAnswer = null;
    let score = 0;
    const questionsToWin = 5;
    let perguntasAnteriores = [];

    // --- LISTA DE TÓPICOS ATUALIZADA E EXPANDIDA ---
    const topicosQuiz = [
        'compatibilidade sanguínea e o sistema ABO',
        'o que significa o Fator Rh (positivo e negativo)',
        'qual tipo sanguíneo é considerado o "doador universal"',
        'qual tipo sanguíneo é considerado o "receptor universal"',
        'a idade mínima e máxima para ser um doador de sangue no Brasil',
        'o peso mínimo exigido para mulheres e homens doarem sangue',
        'o tempo de espera obrigatório após fazer uma tatuagem ou piercing',
        'quanto tempo esperar para doar sangue após uma gripe ou resfriado',
        'impedimentos definitivos para a doação, como Hepatite B/C ou HIV',
        'o volume de sangue (em ml) que é coletado em uma doação padrão',
        'quanto tempo, em média, dura o processo de coleta de sangue',
        'quantas vidas uma única doação de sangue pode ajudar a salvar',
        'os principais componentes do sangue que são separados após a doação (plasma, plaquetas, hemácias)',
        'a função das plaquetas no corpo humano e para quem elas são transfundidas',
        'a função do plasma e seus usos medicinais',
        'cuidados com a alimentação antes de doar sangue',
        'o que se deve fazer nas horas seguintes após a doação',
        'um mito comum sobre a doação de sangue (ex: doar sangue engorda, vicia ou enfraquece)',
        'o que é a doação por aférese e qual sua diferença para a doação total',
        'o intervalo de tempo entre doações de sangue para homens no Brasil',
        'o intervalo de tempo entre doações de sangue para mulheres no Brasil',
        'a importância de apresentar um documento oficial com foto no momento da doação',
        'condições de saúde que impedem a doação, como diabetes ou pressão alta',
        'o que acontece com o sangue doado após a coleta (testes e processamento)',
        'a frequência dos tipos sanguíneos mais comuns no Brasil (O+ e A+)',
        'a importância da doação de sangue de tipos raros, como os Rh negativo'
    ];

    async function fetchQuestion() {
        loadingState.style.display = 'block';
        questionState.style.display = 'none';
        checkButton.disabled = true;
        feedbackMessage.innerHTML = ''; 

        const topicoAleatorio = topicosQuiz[Math.floor(Math.random() * topicosQuiz.length)];

        let exclusaoPrompt = "";
        if (perguntasAnteriores.length > 0) {
            const perguntasFeitas = perguntasAnteriores.join('", "');
            exclusaoPrompt = ` Por favor, gere uma pergunta que seja DIFERENTE das seguintes: "${perguntasFeitas}".`;
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        
        const prompt = `Gere uma pergunta de múltipla escolha sobre doação de sangue no Brasil, focando especificamente no tópico: "${topicoAleatorio}". A pergunta deve ser interessante e educativa. Forneça 4 opções de resposta, onde apenas uma é correta. Retorne a resposta em formato JSON, seguindo exatamente esta estrutura: {"pergunta": "...", "opcoes": ["...", "...", "...", "..."], "resposta_correta": "..."}. Não inclua nenhuma outra formatação ou texto.${exclusaoPrompt}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { responseMimeType: "application/json" }
                })
            });

            if (!response.ok) throw new Error(`API Error: ${response.status}`);

            const result = await response.json();
            const jsonText = result.candidates[0].content.parts[0].text;
            const data = JSON.parse(jsonText);
            
            displayQuestion(data);
        } catch (error) {
            console.error("Erro ao buscar pergunta:", error);
            loadingState.innerHTML = '<p>Erro ao gerar pergunta. Verifique sua chave de API e a conexão.</p>';
        }
    }

    function displayQuestion(data) {
        perguntasAnteriores.push(data.pergunta);
        questionText.textContent = data.pergunta;
        correctAnswer = data.resposta_correta;
        optionsContainer.innerHTML = '';
        selectedAnswer = null;

        data.opcoes.forEach(optionText => {
            const button = document.createElement('button');
            button.className = 'option-button';
            button.textContent = optionText;
            button.disabled = false;
            button.addEventListener('click', () => selectOption(button));
            optionsContainer.appendChild(button);
        });

        loadingState.style.display = 'none';
        questionState.style.display = 'block';
    }

    function selectOption(button) {
        document.querySelectorAll('.option-button').forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
        selectedAnswer = button;
        checkButton.disabled = false;
    }

    checkButton.addEventListener('click', () => {
        if (!selectedAnswer) return;
        
        const isCorrect = selectedAnswer.textContent === correctAnswer;
        
        document.querySelectorAll('.option-button').forEach(btn => btn.disabled = true);
        checkButton.disabled = true;
        feedbackMessage.classList.remove('correct', 'incorrect');

        if (isCorrect) {
            selectedAnswer.classList.add('correct');
            feedbackMessage.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg> <span>Resposta Certa!</span>`;
            feedbackMessage.classList.add('correct');
            score++;
        } else {
            selectedAnswer.classList.add('incorrect');
            feedbackMessage.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg> <span>Incorreto!</span>`;
            feedbackMessage.classList.add('incorrect');
            document.querySelectorAll('.option-button').forEach(btn => {
                if (btn.textContent === correctAnswer) {
                    btn.classList.add('correct');
                }
            });
        }
        
        updateProgressBar();
        
        setTimeout(() => {
            if (score >= questionsToWin) {
                alert('Parabéns! Você completou o quiz!');
                window.location.href = '/home';
            } else {
                fetchQuestion();
            }
        }, 2500);
    });

    function updateProgressBar() {
        const progress = (score / questionsToWin) * 100;
        progressBar.style.width = `${progress}%`;
    }

    fetchQuestion();
});