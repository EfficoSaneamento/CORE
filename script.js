const API_URL = "https://script.google.com/macros/s/AKfycbxYeYJCmJRDyn0wI0or4CjupMEqInFwJF8QgLG0_cRe1rGm2LXpQ1d8CcaiGZd6iKm9VQ/exec"; // Atualize após o Deploy

let abaAtiva = 'banco';
let dadosCache = [];

async function mudarAba(aba) {
    abaAtiva = aba;
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('bg-white/10'));
    document.getElementById(`btn-${aba}`).classList.add('bg-white/10');
    document.getElementById('tituloPagina').innerText = aba.toUpperCase();
    await carregarDados();
}

async function carregarDados() {
    const corpo = document.getElementById('corpoTabela');
    corpo.innerHTML = '<tr><td colspan="12" class="text-center p-10"><div class="loader"></div></td></tr>';
    
    const target = abaAtiva === 'solicitacao' ? 'DB_SOLICITACOES' : (abaAtiva === 'banco' ? 'DB_ITENS' : 'DB_LICITACOES');
    
    try {
        const res = await fetch(`${API_URL}?aba=${target}`);
        dadosCache = await res.json();
        renderizar(dadosCache);
    } catch (e) {
        corpo.innerHTML = '<tr><td colspan="12" class="text-center p-10 text-red-500 font-bold">Erro ao carregar dados.</td></tr>';
    }
}

function renderizar(dados) {
    const corpo = document.getElementById('corpoTabela');
    document.getElementById('contadorRegistros').innerText = dados.length;
    corpo.innerHTML = dados.slice().reverse().map(item => `
        <tr class="border-b hover:bg-slate-50">
            <td class="px-4 py-2">${item.DATA_CRIACAO || item.DATA_ENVIO || '-'}</td>
            <td class="px-4 py-2 font-bold">${item.CODCOTACAO || '-'}</td>
            <td class="px-4 py-2">${item.COD_REDUZIDO_CCUSTO || '-'}</td>
            <td class="px-4 py-2 truncate max-w-[200px]">${item.DESCRICAO_CC || '-'}</td>
            <td class="px-4 py-2">${item.ID_ITEM || '-'}</td>
            <td class="px-4 py-2 font-medium">${item.PRODUTO || '-'}</td>
            <td class="px-4 py-2">${item.QUANTIDADE || '-'}</td>
            <td class="px-4 py-2">${item.UNIDADE || '-'}</td>
            <td class="px-4 py-2">R$ ${Number(item.PRECO_UNITARIO || 0).toLocaleString('pt-BR')}</td>
            <td class="px-4 py-2 font-bold text-green-700">R$ ${Number(item.VALOR_TOTAL || 0).toLocaleString('pt-BR')}</td>
            <td class="px-4 py-2 text-[10px]">${item.FORNECEDOR || '-'}</td>
            <td class="px-4 py-2 text-[10px]">${item.COMPRADOR || '-'}</td>
        </tr>
    `).join('');
}

async function importarDados(input) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
        const wb = XLSX.read(new Uint8Array(e.target.result), {type: 'array'});
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header: 1});
        await processarLote(rows.slice(1));
    };
    reader.readAsArrayBuffer(file);
}

async function processarLote(linhas) {
    const target = abaAtiva === 'banco' ? 'DB_ITENS' : 'DB_LICITACOES';
    for (let row of linhas) {
        if (!row[0]) continue;
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
        await fetch(API_URL, {method: 'POST', mode: 'no-cors', body: JSON.stringify(payload)});
    }
    alert("Importação realizada!");
    carregarDados();
}

function limparMoeda(v) {
    if (!v) return 0;
    return parseFloat(String(v).replace("R$", "").replace(/\./g, "").replace(",", ".").trim()) || 0;
}

document.getElementById('inputBusca').addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase();
    const f = dadosCache.filter(i => Object.values(i).some(v => String(v).toLowerCase().includes(termo)));
    renderizar(f);
});

window.onload = carregarDados;