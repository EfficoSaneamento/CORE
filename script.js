// CONFIGURAÇÃO DA API (Substitua pela sua URL do Google Apps Script)
const API_URL = "https://script.google.com/macros/s/AKfycbxRiZBsoNCP3v8m55L341MXUnjbMH4VkpwsdxWMpCeiNMEeWZBFB-l5PfUgDPyAX9jH/exec";

// ESTADO GLOBAL DO SCRIPT
let abaAtiva = 'banco';
let dadosBanco = [];
let dadosLicitacao = [];
let dadosSolicitacao = [];
let excelTemporario = [];

// 1. GERENCIAMENTO DE ABAS
async function mudarAba(aba) {
    abaAtiva = aba;
    
    // Atualiza Visual do Menu
    document.querySelectorAll('nav button').forEach(btn => {
        btn.classList.remove('bg-white/10');
        btn.classList.add('hover:bg-white/5');
    });
    document.getElementById(`btn-${aba}`).classList.add('bg-white/10');

    // Atualiza Títulos
    const titulos = {
        banco: "BANCO DE PREÇOS",
        licitacao: "LICITAÇÕES",
        solicitacao: "SOLICITAÇÕES TOTVS"
    };
    document.getElementById('tituloPagina').innerText = titulos[aba];
    
    // Limpa a busca ao trocar de aba
    document.getElementById('inputBusca').value = "";
    
    // Carrega os dados específicos
    await carregarDados();
}

// 2. CARREGAMENTO DE DADOS (Independente)
async function carregarDados() {
    const corpo = document.getElementById('corpoTabela');
    corpo.innerHTML = '<tr><td colspan="12" class="p-10 text-center"><div class="loader"></div></td></tr>';
    
    const targetAba = abaAtiva === 'solicitacao' ? 'DB_SOLICITACOES' : 
                     (abaAtiva === 'banco' ? 'DB_ITENS' : 'DB_LICITACOES');

    try {
        const response = await fetch(`${API_URL}?aba=${targetAba}`);
        const dados = await response.json();

        // Salva no cache específico para não anular o outro
        if (abaAtiva === 'banco') dadosBanco = dados;
        else if (abaAtiva === 'licitacao') dadosLicitacao = dados;
        else dadosSolicitacao = dados;

        renderizarTabela(dados);
    } catch (error) {
        corpo.innerHTML = '<tr><td colspan="12" class="p-10 text-center text-red-500">Erro ao conectar com a base de dados.</td></tr>';
    }
}

// 3. RENDERIZAÇÃO (Trata cada aba com suas colunas)
function renderizarTabela(dados) {
    const corpo = document.getElementById('corpoTabela');
    document.getElementById('contadorRegistros').innerText = dados.length;
    
    if (dados.length === 0) {
        corpo.innerHTML = '<tr><td colspan="12" class="p-10 text-center">Nenhum registro encontrado.</td></tr>';
        return;
    }

    corpo.innerHTML = dados.slice().reverse().map(item => `
        <tr class="border-b hover:bg-slate-50 transition">
            <td class="px-4 py-3">${item.DATA_CRIACAO || item.DATA_ENVIO || '-'}</td>
            <td class="px-4 py-3 font-bold">${item.CODCOTACAO || '-'}</td>
            <td class="px-4 py-3">${item.COD_REDUZIDO_CCUSTO || '-'}</td>
            <td class="px-4 py-3">${item.DESCRICAO_CC || '-'}</td>
            <td class="px-4 py-3">${item.ID_ITEM || '-'}</td>
            <td class="px-4 py-3 font-medium">${item.PRODUTO || '-'}</td>
            <td class="px-4 py-3">${item.QUANTIDADE || '0'}</td>
            <td class="px-4 py-3">${item.UNIDADE || '-'}</td>
            <td class="px-4 py-3">R$ ${Number(item.PRECO_UNITARIO || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
            <td class="px-4 py-3 font-bold text-effico-green">R$ ${Number(item.VALOR_TOTAL || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
            <td class="px-4 py-3">${item.FORNECEDOR || '-'}</td>
            <td class="px-4 py-3 text-[10px]">${item.COMPRADOR || '-'}</td>
        </tr>
    `).join('');
}

// 4. PESQUISA (Filtra apenas a aba atual)
document.getElementById('inputBusca').addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase();
    const dadosParaFiltrar = abaAtiva === 'banco' ? dadosBanco : 
                             (abaAtiva === 'licitacao' ? dadosLicitacao : dadosSolicitacao);
    
    const filtrados = dadosParaFiltrar.filter(item => 
        Object.values(item).some(val => String(val).toLowerCase().includes(termo))
    );
    
    renderizarTabela(filtrados);
});

// 5. IMPORTAÇÃO E LIMPEZA (Lógica TOTVS RM)
async function importarDados(input) {
    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
        
        // Remove cabeçalho e envia para o processamento
        processarLote(rows.slice(1));
    };
    reader.readAsArrayBuffer(file);
}

async function processarLote(linhas) {
    document.getElementById('statusConexao').innerText = "Processando Lote...";
    const target = abaAtiva === 'banco' ? 'DB_ITENS' : 'DB_LICITACOES';

    for (let row of linhas) {
        if (!row[0]) continue; // Pula linhas vazias

        // Limpeza de Caracteres e Formatação RM
        const payload = {
            TABELA_DESTINO: target,
            DATA_CRIACAO: String(row[3] || ""),
            CODCOTACAO: String(row[2] || ""),
            COD_REDUZIDO_CCUSTO: String(row[4] || ""),
            DESCRICAO_CC: String(row[5] || ""),
            ID_ITEM: String(row[0] || ""),
            PRODUTO: String(row[7] || ""),
            QUANTIDADE: row[8],
            UNIDADE: row[9],
            PRECO_UNITARIO: limparMoeda(row[10]),
            VALOR_TOTAL: limparMoeda(row[11]),
            FORNECEDOR: String(row[12] || ""),
            COMPRADOR: String(row[13] || "")
        };

        await fetch(API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
    }

    document.getElementById('statusConexao').innerText = "Sincronizado";
    alert("Importação concluída com sucesso!");
    carregarDados();
}

// Auxiliar para limpar "R$" e pontos do Excel
function limparMoeda(valor) {
    if (!valor) return 0;
    if (typeof valor === 'number') return valor;
    return parseFloat(valor.replace("R$", "").replace(/\./g, "").replace(",", ".").trim()) || 0;
}

// Inicialização
window.onload = carregarDados;