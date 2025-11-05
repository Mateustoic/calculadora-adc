if (!localStorage.getItem('loggedIn')) {
    window.location.href = 'index.html';
}

let disciplinaAtualId = null;

function logout() {
    localStorage.removeItem('loggedIn');
    window.location.href = 'index.html';
}

function getDisciplinas() {
    const disciplinas = localStorage.getItem('disciplinas');
    return disciplinas ? JSON.parse(disciplinas) : [];
}

function calcularDiasRestantes(disciplina) {
    const faltas = getFaltasByDisciplina(disciplina.id);
    const totalHorasFaltadas = faltas.reduce((acc, f) => acc + f.horasFaltadas, 0);
    const limiteHoras = (disciplina.cargaHoraria * disciplina.limitePercentual) / 100;
    const horasRestantes = limiteHoras - totalHorasFaltadas;
    return Math.floor(horasRestantes / disciplina.horasPorAula);
}

function getFaltasByDisciplina(disciplinaId) {
    const faltas = localStorage.getItem('faltas');
    const todasFaltas = faltas ? JSON.parse(faltas) : [];
    return todasFaltas.filter(f => f.disciplinaId === disciplinaId);
}

function getCorPorDias(dias) {
    if (dias <= 1) return { classe: 'red', texto: 'red' };
    if (dias <= 7) return { classe: 'orange', texto: 'orange' };
    return { classe: 'green', texto: 'green' };
}

function renderDisciplinas() {
    const disciplinas = getDisciplinas();
    const grid = document.getElementById('disciplinasGrid');
    
    if (disciplinas.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: #6b7280;">Nenhuma disciplina cadastrada. Clique no botão + para adicionar.</p>';
        return;
    }
    
    grid.innerHTML = disciplinas.map(disciplina => {
        const diasRestantes = calcularDiasRestantes(disciplina);
        const cores = getCorPorDias(diasRestantes);
        const texto = diasRestantes === 1 ? 'dia restante' : 'dias restantes';
        
        return `
            <div class="disciplina-card ${cores.classe}" onclick="mostrarFaltas(${disciplina.id})">
                <h3>${disciplina.nome}</h3>
                <p class="${cores.texto}">${diasRestantes} ${texto}</p>
            </div>
        `;
    }).join('');
}

function mostrarView(viewId) {
    document.querySelectorAll('.view').forEach(view => {
        view.style.display = 'none';
    });
    document.getElementById(viewId).style.display = 'block';
}

function voltarDashboard() {
    mostrarView('viewDisciplinas');
    renderDisciplinas();
    document.getElementById('disciplinaForm').reset();
    document.getElementById('resumo').innerHTML = '<p class="text-muted">Preencha os campos para ver o resumo</p>';
}

function mostrarConfigurar() {
    mostrarView('viewConfigurar');
}

function mostrarFaltas(disciplinaId) {
    disciplinaAtualId = disciplinaId;
    mostrarView('viewFaltas');
    atualizarInfoFaltas();
    atualizarGrafico();
    renderHistorico();
}

const form = document.getElementById('disciplinaForm');
const inputs = {
    nome: document.getElementById('nome'),
    cargaHoraria: document.getElementById('cargaHoraria'),
    limitePercentual: document.getElementById('limitePercentual'),
    horasPorAula: document.getElementById('horasPorAula'),
    dataInicio: document.getElementById('dataInicio'),
    feriados: document.getElementById('feriados')
};

function calcularResumo() {
    const cargaHoraria = parseInt(inputs.cargaHoraria.value) || 0;
    const limitePercentual = parseInt(inputs.limitePercentual.value) || 25;
    const horasPorAula = parseInt(inputs.horasPorAula.value) || 2;
    const dataInicio = inputs.dataInicio.value;
    const diasSemana = Array.from(document.querySelectorAll('input[name="diasSemana"]:checked'));
    
    if (!cargaHoraria || !dataInicio || diasSemana.length === 0) {
        document.getElementById('resumo').innerHTML = '<p class="text-muted">Preencha os campos para ver o resumo</p>';
        return;
    }
    
    const limiteHoras = (cargaHoraria * limitePercentual) / 100;
    const diasLimite = Math.floor(limiteHoras / horasPorAula);
    
    const inicio = new Date(dataInicio);
    const semanasNecessarias = Math.ceil(diasLimite / diasSemana.length);
    const diasTotais = semanasNecessarias * 7;
    
    const termino = new Date(inicio);
    termino.setDate(termino.getDate() + diasTotais);
    
    document.getElementById('resumo').innerHTML = `
        <p>Seu limite é de <span class="highlight">*${diasLimite} dias (${limiteHoras}h)</span></p>
        <p>Término estimado: <span class="highlight">${termino.toLocaleDateString('pt-BR')}</span></p>
    `;
}

Object.values(inputs).forEach(input => {
    input.addEventListener('input', calcularResumo);
});

document.querySelectorAll('input[name="diasSemana"]').forEach(checkbox => {
    checkbox.addEventListener('change', calcularResumo);
});

form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const diasSemana = Array.from(document.querySelectorAll('input[name="diasSemana"]:checked'))
        .map(cb => cb.value);
    
    if (diasSemana.length === 0) {
        alert('Selecione pelo menos um dia da semana');
        return;
    }
    
    const disciplina = {
        id: Date.now(),
        nome: inputs.nome.value,
        cargaHoraria: parseInt(inputs.cargaHoraria.value),
        limitePercentual: parseInt(inputs.limitePercentual.value),
        horasPorAula: parseInt(inputs.horasPorAula.value),
        dataInicio: inputs.dataInicio.value,
        diasSemana: diasSemana,
        feriados: inputs.feriados.value
    };
    
    const disciplinas = JSON.parse(localStorage.getItem('disciplinas') || '[]');
    disciplinas.push(disciplina);
    localStorage.setItem('disciplinas', JSON.stringify(disciplinas));
    
    voltarDashboard();
});

function getDisciplina(disciplinaId) {
    const disciplinas = JSON.parse(localStorage.getItem('disciplinas') || '[]');
    return disciplinas.find(d => d.id === disciplinaId);
}

function getFaltas() {
    const faltas = JSON.parse(localStorage.getItem('faltas') || '[]');
    return faltas.filter(f => f.disciplinaId === disciplinaAtualId);
}

function calcularDiasRestantesFaltas() {
    const disciplina = getDisciplina(disciplinaAtualId);
    if (!disciplina) return 0;
    
    const faltas = getFaltas();
    const totalHorasFaltadas = faltas.reduce((acc, f) => acc + f.horasFaltadas, 0);
    const limiteHoras = (disciplina.cargaHoraria * disciplina.limitePercentual) / 100;
    const horasRestantes = limiteHoras - totalHorasFaltadas;
    
    return Math.floor(horasRestantes / disciplina.horasPorAula);
}

function calcularPercentualUsado() {
    const disciplina = getDisciplina(disciplinaAtualId);
    if (!disciplina) return 0;
    
    const faltas = getFaltas();
    const totalHorasFaltadas = faltas.reduce((acc, f) => acc + f.horasFaltadas, 0);
    const limiteHoras = (disciplina.cargaHoraria * disciplina.limitePercentual) / 100;
    
    return Math.min(100, (totalHorasFaltadas / limiteHoras) * 100);
}

function atualizarGrafico() {
    const percentual = calcularPercentualUsado();
    const circle = document.getElementById('progressCircle');
    const circumference = 2 * Math.PI * 110;
    const offset = circumference - (percentual / 100) * circumference;
    
    circle.style.strokeDashoffset = offset;
}

function atualizarInfoFaltas() {
    const disciplina = getDisciplina(disciplinaAtualId);
    const faltas = getFaltas();
    const diasRestantes = calcularDiasRestantesFaltas();
    
    const totalHorasFaltadas = faltas.reduce((acc, f) => acc + f.horasFaltadas, 0);
    const limiteHoras = (disciplina.cargaHoraria * disciplina.limitePercentual) / 100;
    
    document.getElementById('diasRestantes').textContent = `${diasRestantes} DIAS`;
    document.getElementById('faltasInfo').textContent = 
        `Faltas atuais: ${totalHorasFaltadas}h de um total de ${limiteHoras}h (${disciplina.limitePercentual}%)`;
    
    const chartValue = document.querySelector('.chart-value');
    if (diasRestantes <= 1) {
        chartValue.style.color = '#ef4444';
    } else if (diasRestantes <= 7) {
        chartValue.style.color = '#f97316';
    } else {
        chartValue.style.color = '#1f2937';
    }
}

function renderHistorico() {
    const faltas = getFaltas();
    const tbody = document.getElementById('historicoFaltas');
    
    if (faltas.length === 0) {
        document.getElementById('toggleHistorico').style.display = 'none';
        document.getElementById('historicoSection').style.display = 'none';
        return;
    }
    
    document.getElementById('toggleHistorico').style.display = 'block';
    
    tbody.innerHTML = faltas.map(falta => `
        <tr>
            <td>${new Date(falta.data).toLocaleDateString('pt-BR')}</td>
            <td>${falta.horasFaltadas}h</td>
            <td>
                <button onclick="excluirFalta(${falta.id})">
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
    
    if (section.style.display === 'none') {
        section.style.display = 'block';
        link.textContent = 'Ocultar Histórico';
    } else {
        section.style.display = 'none';
        link.textContent = 'Ver Histórico de Faltas';
    }
}

function abrirModalFalta() {
    document.getElementById('modalFalta').classList.add('active');
}

function fecharModalFalta() {
    document.getElementById('modalFalta').classList.remove('active');
    document.getElementById('faltaForm').reset();
}

function excluirFalta(faltaId) {
    if (!confirm('Deseja realmente excluir esta falta?')) return;
    
    const faltas = JSON.parse(localStorage.getItem('faltas') || '[]');
    const novasFaltas = faltas.filter(f => f.id !== faltaId);
    localStorage.setItem('faltas', JSON.stringify(novasFaltas));
    
    renderHistorico();
    atualizarInfoFaltas();
    atualizarGrafico();
}

document.getElementById('faltaForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const falta = {
        id: Date.now(),
        disciplinaId: disciplinaAtualId,
        data: document.getElementById('dataFalta').value,
        horasFaltadas: parseInt(document.getElementById('horasFaltadas').value)
    };
    
    const faltas = JSON.parse(localStorage.getItem('faltas') || '[]');
    faltas.push(falta);
    localStorage.setItem('faltas', JSON.stringify(faltas));
    
    fecharModalFalta();
    renderHistorico();
    atualizarInfoFaltas();
    atualizarGrafico();
});

window.onclick = function(event) {
    const modal = document.getElementById('modalFalta');
    if (event.target === modal) {
        fecharModalFalta();
    }
}

renderDisciplinas();
