// main.js - Funções globais para o projeto Sangue-Connect

document.addEventListener("DOMContentLoaded", () => {
    console.log("Sangue-Connect carregado ✅");

    // Exemplo: aplicar automaticamente o foco no primeiro campo de formulário
    const firstInput = document.querySelector("input");
    if (firstInput) {
        firstInput.focus();
    }

    // Exemplo: dark mode toggle
    const darkModeBtn = document.getElementById("dark-mode-toggle");
    if (darkModeBtn) {
        darkModeBtn.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");
            localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
        });

        // Mantém preferência salva
        if (localStorage.getItem("darkMode") === "true") {
            document.body.classList.add("dark-mode");
        }
    }

    // Exemplo: mensagens automáticas que somem depois de 3s
    const mensagens = document.querySelectorAll(".mensagem-temporaria");
    mensagens.forEach(msg => {
        setTimeout(() => {
            msg.style.opacity = "0";
            setTimeout(() => msg.remove(), 500); // remove depois da transição
        }, 3000);
    });
});
