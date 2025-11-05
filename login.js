document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    localStorage.setItem('loggedIn', 'true');
    window.location.href = 'dashboard.html';
});

document.getElementById('toggleForm').addEventListener('click', function(e) {
    e.preventDefault();
    const button = document.querySelector('.btn-primary');
    const link = document.getElementById('toggleForm');
    
    if (button.textContent === 'Entrar') {
        button.textContent = 'Cadastrar';
        link.textContent = 'Já tem conta? Entrar';
    } else {
        button.textContent = 'Entrar';
        link.textContent = 'Cadastrar-se';
    }
});
