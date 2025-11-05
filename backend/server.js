const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

let db = {
    disciplinas: [],
    faltas: []
};

let nextDisciplinaId = 1;
let nextFaltaId = 1;

app.get('/disciplinas', (req, res) => {
    res.json(db.disciplinas);
});

app.get('/disciplinas/:id', (req, res) => {
    const disciplina = db.disciplinas.find(d => d.id === parseInt(req.params.id));
    if (disciplina) {
        res.json(disciplina);
    } else {
        res.status(404).send('Disciplina não encontrada');
    }
});

app.post('/disciplinas', (req, res) => {
    const novaDisciplina = { ...req.body, id: nextDisciplinaId++ };
    db.disciplinas.push(novaDisciplina);
    res.status(201).json(novaDisciplina);
});

app.get('/disciplinas/:disciplinaId/faltas', (req, res) => {
    const disciplinaId = parseInt(req.params.disciplinaId);
    const faltasDaDisciplina = db.faltas.filter(f => f.disciplinaId === disciplinaId);
    res.json(faltasDaDisciplina);
});

app.post('/faltas', (req, res) => {
    const novaFalta = { ...req.body, id: nextFaltaId++ };
    db.faltas.push(novaFalta);
    res.status(201).json(novaFalta);
});

app.delete('/faltas/:id', (req, res) => {
    const faltaId = parseInt(req.params.id);
    const initialLength = db.faltas.length;
    db.faltas = db.faltas.filter(f => f.id !== faltaId);
    if (db.faltas.length < initialLength) {
        res.status(204).send();
    } else {
        res.status(404).send('Falta não encontrada');
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
