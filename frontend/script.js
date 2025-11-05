const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    if (path.includes('index.html') || path === '/') {
        setupLoginPage();
    } else if (path.includes('dashboard.html')) {
        setupDashboardPage();
    }
});

function setupLoginPage() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        localStorage.setItem('loggedIn', 'true');
        window.location.href = 'dashboard.html';
    });

    const toggleFormLink = document.getElementById('toggleForm');
    toggleFormLink.addEventListener('click', function(e) {
        e.preventDefault();
        const button = loginForm.querySelector('.btn-primary');
        const emailInput = loginForm.querySelector('input[type="email"]');
        const isLogin = button.textContent === 'Entrar';

        button.textContent = isLogin ? 'Cadastrar' : 'Entrar';
        toggleFormLink.textContent = isLogin ? 'Já tem conta? Entrar' : 'Cadastrar-se';
        emailInput.focus();
    });
}

async function setupDashboardPage() {
    if (!localStorage.getItem('loggedIn')) {
        window.location.href = 'index.html';
        return;
    }

    let disciplinaAtualId = null;
    let disciplinasCache = [];
    let faltasCache = [];

    const views = {
        disciplinas: document.getElementById('viewDisciplinas'),
        configurar: document.getElementById('viewConfigurar'),
        faltas: document.getElementById('viewFaltas')
    };

    const form = document.getElementById('disciplinaForm');
    const inputs = {
        nome: document.getElementById('nome'),
        cargaHoraria: document.getElementById('cargaHoraria'),
        limitePercentual: document.getElementById('limitePercentual'),
        horasPorAula: document.getElementById('horasPorAula'),
        dataInicio: document.getElementById('dataInicio'),
        feriados: document.getElementById('feriados')
    };

    async function fetchDisciplinas() {
        try {
            const response = await fetch(`${API_URL}/disciplinas`);
            if (!response.ok) throw new Error('Erro ao buscar disciplinas');
            disciplinasCache = await response.json();
            return disciplinasCache;
        } catch (error) {
            console.error('Erro ao buscar disciplinas:', error);
            alert('Erro ao conectar com o servidor. Verifique se o backend está rodando em localhost:3000');
            return [];
        }
    }

    async function fetchFaltasByDisciplina(disciplinaId) {
        try {
            const response = await fetch(`${API_URL}/disciplinas/${disciplinaId}/faltas`);
            if (!response.ok) throw new Error('Erro ao buscar faltas');
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar faltas:', error);
            return [];
        }
    }

    async function createDisciplina(disciplina) {
        try {
            const response = await fetch(`${API_URL}/disciplinas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(disciplina)
            });
            if (!response.ok) throw new Error('Erro ao criar disciplina');
            return await response.json();
        } catch (error) {
            console.error('Erro ao criar disciplina:', error);
            alert('Erro ao salvar disciplina');
            return null;
        }
    }

    async function createFalta(falta) {
        try {
            const response = await fetch(`${API_URL}/faltas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(falta)
            });
            if (!response.ok) throw new Error('Erro ao criar falta');
            return await response.json();
        } catch (error) {
            console.error('Erro ao criar falta:', error);
            alert('Erro ao registrar falta');
            return null;
        }
    }

    async function deleteFalta(faltaId) {
        try {
            const response = await fetch(`${API_URL}/faltas/${faltaId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Erro ao excluir falta');
            return true;
        } catch (error) {
            console.error('Erro ao excluir falta:', error);
            alert('Erro ao excluir falta');
            return false;
        }
    }

    function logout() {
        localStorage.removeItem('loggedIn');
        window.location.href = 'index.html';
    }

    function getDisciplina(id) {
        return disciplinasCache.find(d => d.id === id);
    }

    function calcularDiasRestantes(disciplina, faltas) {
        const totalHorasFaltadas = faltas.reduce((acc, f) => acc + f.horasFaltadas, 0);
        const limiteHoras = (disciplina.cargaHoraria * disciplina.limitePercentual) / 100;
        const horasRestantes = limiteHoras - totalHorasFaltadas;
        return Math.floor(horasRestantes / disciplina.horasPorAula);
    }

    function getCorPorDias(dias) {
        if (dias <= 1) return { classe: 'red', texto: 'red' };
        if (dias <= 7) return { classe: 'orange', texto: 'orange' };
        return { classe: 'green', texto: 'green' };
    }

    async function renderDisciplinas() {
        const disciplinas = await fetchDisciplinas();
        const grid = document.getElementById('disciplinasGrid');
        if (!grid) return;

        if (disciplinas.length === 0) {
            grid.innerHTML = '<p style="text-align: center; color: #6b7280;">Nenhuma disciplina cadastrada. Clique no botão + para adicionar.</p>';
            return;
        }

        const cardsPromises = disciplinas.map(async disciplina => {
            const faltas = await fetchFaltasByDisciplina(disciplina.id);
            const diasRestantes = calcularDiasRestantes(disciplina, faltas);
            const totalFaltas = Math.floor(faltas.reduce((acc, f) => acc + f.horasFaltadas, 0) / disciplina.horasPorAula);
            const cores = getCorPorDias(diasRestantes);
            const textoDias = diasRestantes === 1 ? 'dia restante' : 'dias restantes';
            const textoFaltas = totalFaltas === 1 ? 'falta' : 'faltas';

            return `
                <div class="disciplina-card ${cores.classe}" onclick="window.mostrarFaltas(${disciplina.id})">
                    <h3>${disciplina.nome}</h3>
                    <p class="${cores.texto}">${diasRestantes} ${textoDias} (${totalFaltas} ${textoFaltas})</p>
                </div>
            `;
        });

        const cards = await Promise.all(cardsPromises);
        grid.innerHTML = cards.join('');
    }

    function mostrarView(viewId) {
        Object.values(views).forEach(view => view.style.display = 'none');
        views[viewId].style.display = 'block';
    }

    function voltarDashboard() {
        mostrarView('disciplinas');
        renderDisciplinas();
        if (form) form.reset();
        const resumo = document.getElementById('resumo');
        if (resumo) resumo.innerHTML = '<p class="text-muted">Preencha os campos para ver o resumo</p>';
    }

    function mostrarConfigurar() {
        mostrarView('configurar');
    }

    async function mostrarFaltas(id) {
        disciplinaAtualId = id;
        mostrarView('faltas');
        await atualizarInfoFaltas();
        await atualizarGrafico();
        await renderHistorico();
    }

    function calcularResumo() {
        const cargaHoraria = parseInt(inputs.cargaHoraria.value) || 0;
        const limitePercentual = parseInt(inputs.limitePercentual.value) || 25;
        const horasPorAula = parseInt(inputs.horasPorAula.value) || 2;
        const diasSemana = Array.from(document.querySelectorAll('input[name="diasSemana"]:checked'));

        const resumoEl = document.getElementById('resumo');
        if (!cargaHoraria || diasSemana.length === 0) {
            resumoEl.innerHTML = '<p class="text-muted">Preencha os campos para ver o resumo</p>';
            return;
        }

        const limiteHoras = (cargaHoraria * limitePercentual) / 100;
        const diasLimite = Math.floor(limiteHoras / horasPorAula);

        resumoEl.innerHTML = `<p>Seu limite é de <span class="highlight">*${diasLimite} dias (${limiteHoras}h)</span></p>`;
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        const diasSemana = Array.from(document.querySelectorAll('input[name="diasSemana"]:checked')).map(cb => cb.value);

        if (diasSemana.length === 0) {
            alert('Selecione pelo menos um dia da semana.');
            return;
        }

        const disciplina = {
            nome: inputs.nome.value,
            cargaHoraria: parseInt(inputs.cargaHoraria.value),
            limitePercentual: parseInt(inputs.limitePercentual.value),
            horasPorAula: parseInt(inputs.horasPorAula.value),
            dataInicio: inputs.dataInicio.value,
            diasSemana: diasSemana,
            feriados: inputs.feriados.value
        };

        const novaDisciplina = await createDisciplina(disciplina);
        if (novaDisciplina) {
            voltarDashboard();
        }
    }

    async function atualizarGrafico() {
        const disciplina = getDisciplina(disciplinaAtualId);
        if (!disciplina) return;

        const faltas = await fetchFaltasByDisciplina(disciplinaAtualId);
        const totalHorasFaltadas = faltas.reduce((acc, f) => acc + f.horasFaltadas, 0);
        const limiteHoras = (disciplina.cargaHoraria * disciplina.limitePercentual) / 100;
        const percentual = limiteHoras > 0 ? Math.min(100, (totalHorasFaltadas / limiteHoras) * 100) : 0;

        const circle = document.getElementById('progressCircle');
        const circumference = 2 * Math.PI * 110;
        const offset = circumference - (percentual / 100) * circumference;
        circle.style.strokeDashoffset = offset;
    }

    async function atualizarInfoFaltas() {
        const disciplina = getDisciplina(disciplinaAtualId);
        if (!disciplina) return;

        const faltas = await fetchFaltasByDisciplina(disciplinaAtualId);
        const totalHorasFaltadas = faltas.reduce((acc, f) => acc + f.horasFaltadas, 0);
        const limiteHoras = (disciplina.cargaHoraria * disciplina.limitePercentual) / 100;
        const horasRestantes = limiteHoras - totalHorasFaltadas;
        const diasRestantes = Math.floor(horasRestantes / disciplina.horasPorAula);

        document.getElementById('diasRestantes').textContent = `${diasRestantes} DIAS`;
        document.getElementById('faltasInfo').textContent = `Faltas atuais: ${totalHorasFaltadas}h de um total de ${limiteHoras}h (${disciplina.limitePercentual}%)`;

        const chartValue = document.querySelector('.chart-value');
        const cores = getCorPorDias(diasRestantes);
        chartValue.style.color = cores.texto === 'red' ? '#ef4444' : (cores.texto === 'orange' ? '#f97316' : '#1f2937');
    }

    async function renderHistorico() {
        const faltas = await fetchFaltasByDisciplina(disciplinaAtualId);
        const tbody = document.getElementById('historicoFaltas');
        const historicoSection = document.getElementById('historicoSection');
        const toggleHistoricoLink = document.getElementById('toggleHistorico');

        if (faltas.length === 0) {
            toggleHistoricoLink.style.display = 'none';
            historicoSection.style.display = 'none';
            tbody.innerHTML = '';
            return;
        }

        toggleHistoricoLink.style.display = 'block';
        tbody.innerHTML = faltas.sort((a, b) => new Date(b.data) - new Date(a.data)).map(falta => `
            <tr>
                <td>${new Date(falta.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                <td>${falta.horasFaltadas}h</td>
                <td>
                    <button onclick="window.excluirFalta(${falta.id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    function toggleHistorico() {
        const section = document.getElementById('historicoSection');
        const link = document.querySelector('.toggle-historico a');
        const isHidden = section.style.display === 'none';
        section.style.display = isHidden ? 'block' : 'none';
        link.textContent = isHidden ? 'Ocultar Histórico' : 'Ver Histórico de Faltas';
    }

    function abrirModalFalta() {
        document.getElementById('modalFalta').classList.add('active');
    }

    function fecharModalFalta() {
        document.getElementById('modalFalta').classList.remove('active');
        document.getElementById('faltaForm').reset();
    }

    async function excluirFalta(faltaId) {
        if (!confirm('Deseja realmente excluir esta falta?')) return;
        const sucesso = await deleteFalta(faltaId);
        if (sucesso) {
            await renderHistorico();
            await atualizarInfoFaltas();
            await atualizarGrafico();
        }
    }

    async function handleFaltaFormSubmit(e) {
        e.preventDefault();
        const falta = {
            disciplinaId: disciplinaAtualId,
            data: document.getElementById('dataFalta').value,
            horasFaltadas: parseInt(document.getElementById('horasFaltadas').value)
        };
        const novaFalta = await createFalta(falta);
        if (novaFalta) {
            fecharModalFalta();
            await renderHistorico();
            await atualizarInfoFaltas();
            await atualizarGrafico();
        }
    }

    Object.values(inputs).forEach(input => input.addEventListener('input', calcularResumo));
    document.querySelectorAll('input[name="diasSemana"]').forEach(cb => cb.addEventListener('change', calcularResumo));
    form.addEventListener('submit', handleFormSubmit);
    document.getElementById('faltaForm').addEventListener('submit', handleFaltaFormSubmit);

    window.onclick = (event) => {
        if (event.target === document.getElementById('modalFalta')) {
            fecharModalFalta();
        }
    };

    window.logout = logout;
    window.mostrarConfigurar = mostrarConfigurar;
    window.voltarDashboard = voltarDashboard;
    window.mostrarFaltas = mostrarFaltas;
    window.abrirModalFalta = abrirModalFalta;
    window.fecharModalFalta = fecharModalFalta;
    window.toggleHistorico = toggleHistorico;
    window.excluirFalta = excluirFalta;

    await renderDisciplinas();
}