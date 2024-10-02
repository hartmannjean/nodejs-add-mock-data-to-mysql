const express = require('express');
const mysql = require('mysql2/promise');
const moment = require('moment');

const app = express();
const port = process.env.PORT || 3001;

// Configuração da conexão com o banco de dados
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'mes_app',
};

// Função para gerar um número aleatório dentro de um intervalo
function randomNumber(min, max) {
    return Math.random() * (max - min) + min;
}

// Função para gerar dados mockados
function generateMockData() {
    const maquinas = ['Máquina 1', 'Máquina 2', 'Máquina 3', 'Máquina 4', 'Máquina 5'];
    const operadores = ['Operador 1', 'Operador 2', 'Operador 3', 'Operador 4', 'Operador 5'];

    const data_hora = moment().format('YYYY-MM-DD HH:mm:ss');
    const maquina = maquinas[Math.floor(Math.random() * maquinas.length)];
    const operador = operadores[Math.floor(Math.random() * operadores.length)];
    const tempo_planejado_producao = 200;
    const tempo_parada_nao_planejada = Math.floor(randomNumber(50, 60));
    const tempo_operacao_real = tempo_planejado_producao - tempo_parada_nao_planejada;
    const tempo_ciclo_ideal = 1;
    const tempo_ciclo_real = randomNumber(0.50, 1);
    const quantidade_total_produzida = Math.floor(tempo_operacao_real / tempo_ciclo_real);
    const quantidade_refugos = Math.floor(randomNumber(15, 20));
    const quantidade_unidades_boas = quantidade_total_produzida - quantidade_refugos;

    const disponibilidade = tempo_operacao_real / tempo_planejado_producao;
    const desempenho = (quantidade_total_produzida * tempo_ciclo_ideal) / tempo_operacao_real;
    const qualidade = quantidade_unidades_boas / quantidade_total_produzida;
    const oee = disponibilidade * desempenho * qualidade;

    return {
        data_hora,
        maquina,
        operador,
        tempo_planejado_producao,
        tempo_parada_nao_planejada,
        tempo_operacao_real,
        tempo_ciclo_ideal,
        tempo_ciclo_real,
        quantidade_total_produzida,
        quantidade_unidades_boas,
        quantidade_refugos,
        disponibilidade,
        desempenho,
        qualidade,
        oee
    };
}

// Função para inserir dados no banco
async function insertMockData() {
    const connection = await mysql.createConnection(dbConfig);

    try {
        const mockData = generateMockData();
        const query = `INSERT INTO indicadores_oee 
                       (data_hora, maquina, operador, tempo_planejado_producao, 
                        tempo_parada_nao_planejada, tempo_operacao_real, tempo_ciclo_ideal, 
                        tempo_ciclo_real, quantidade_total_produzida, quantidade_unidades_boas, 
                        quantidade_refugos, disponibilidade, desempenho, qualidade, oee) 
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        await connection.execute(query, [
            mockData.data_hora, mockData.maquina, mockData.operador,
            mockData.tempo_planejado_producao, mockData.tempo_parada_nao_planejada,
            mockData.tempo_operacao_real, mockData.tempo_ciclo_ideal,
            mockData.tempo_ciclo_real, mockData.quantidade_total_produzida,
            mockData.quantidade_unidades_boas, mockData.quantidade_refugos,
            mockData.disponibilidade, mockData.desempenho, mockData.qualidade, mockData.oee
        ]);

        console.log('Dados mockados inseridos com sucesso!');
    } catch (error) {
        console.error('Erro ao inserir dados mockados:', error);
    } finally {
        await connection.end();
    }
}

let insertInterval;

// Rota para iniciar a geração de dados mockados
app.post('/start', (req, res) => {
    if (!insertInterval) {
        insertInterval = setInterval(insertMockData, 1000); //10 segundos
        insertMockData();
        res.json({ message: 'Geração de dados mockados iniciada. Inserindo a cada 10 segundos.' });
    } else {
        res.json({ message: 'A geração de dados já está em andamento.' });
    }
});

// Rota para parar a geração de dados mockados
app.post('/stop', (req, res) => {
    if (insertInterval) {
        clearInterval(insertInterval);
        insertInterval = null;
        res.json({ message: 'Geração de dados mockados interrompida.' });
    } else {
        res.json({ message: 'A geração de dados não está em andamento.' });
    }
});

// Rota para verificar o status do serviço
app.get('/status', (req, res) => {
    res.json({
        status: 'online',
        dataGenerationActive: !!insertInterval,
        insertionInterval: '10 segundos'
    });
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Microserviço de geração de dados mockados rodando na porta ${port}`);
});