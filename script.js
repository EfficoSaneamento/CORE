const URL_API = 'https://script.google.com/macros/s/AKfycbxYPCkapwMfMno0VUPz5lo-a6_Ud16YOFyil4JJSApz0fZ4g22Fw7bd9V64CZFpQ4zY/exec';

let dadosCache = [];

/* ================= UTIL ================= */

function formatarData(data) {
  if (!data) return '-';
  const d = new Date(data);
  return d.toLocaleDateString('pt-BR');
}

function badgeStatus(status) {
  const map = {
    'Em andamento': 'bg-yellow-100 text-yellow-800',
    'Em atraso': 'bg-red-100 text-red-700',
    'Concluído': 'bg-green-100 text-green-700',
    'Recebido com atraso': 'bg-orange-100 text-orange-700'
  };
  return `<span class="px-2 py-1 rounded text-xs ${map[status] || 'bg-gray-100'}">${status}</span>`;
}

/* ================= CARREGAR ================= */

function carregarSolicitacoes() {
  fetch(`${URL_API}?aba=DB_SOLICITACOES`)
    .then(r => r.json())
    .then(dados => {
      dadosCache = dados;
      renderizarAgrupado(dados);
    });
}

/* ================= AGRUPAMENTO ================= */

function renderizarAgrupado(dados) {
  const corpo = document.getElementById('corpoTabela');
  corpo.innerHTML = '';

  const grupos = {};
  dados.forEach(d => {
    if (!grupos[d.IDENTIFICADOR]) grupos[d.IDENTIFICADOR] = [];
    grupos[d.IDENTIFICADOR].push(d);
  });

  Object.keys(grupos).forEach(id => {
    const itens = grupos[id];
    const base = itens[0];

    corpo.innerHTML += `
      <tr class="bg-slate-50">
        <td class="p-3 cursor-pointer" onclick="toggle('${id}')">➕ ${id}</td>
        <td>${itens.length} itens</td>
        <td>${formatarData(base['DATA DA SOLICITAÇÃO'])}</td>
        <td>${badgeStatus(base.STATUS_CALCULADO)}</td>
        <td>
          <select id="comprador-${id}" class="border rounded px-2 py-1">
            <option value="">Selecionar</option>
            <option>Flávio</option>
            <option>Patrícia</option>
            <option>Leonardo</option>
            <option>Pedro</option>
          </select>
        </td>
        <td>
          <button onclick="concluir('${id}')" class="bg-green-600 text-white px-3 py-1 rounded">
            Concluir
          </button>
        </td>
      </tr>
    `;

    itens.forEach(i => {
      corpo.innerHTML += `
        <tr class="hidden grupo-${id}">
          <td></td>
          <td colspan="2">${i.ITEM}</td>
          <td>${i.QUANTIDADE}</td>
          <td colspan="2">${i.OBSERVAÇÃO || '-'}</td>
        </tr>
      `;
    });
  });
}

/* ================= AÇÕES ================= */

function toggle(id) {
  document.querySelectorAll(`.grupo-${id}`)
    .forEach(l => l.classList.toggle('hidden'));
}

function concluir(id) {
  const comprador = document.getElementById(`comprador-${id}`).value;
  if (!comprador) {
    alert('Selecione um comprador');
    return;
  }

  fetch(URL_API, {
    method: 'POST',
    body: JSON.stringify({
      action: 'CONCLUIR',
      id,
      comprador
    })
  })
    .then(r => r.json())
    .then(() => carregarSolicitacoes());
}

/* ================= INIT ================= */

document.addEventListener('DOMContentLoaded', carregarSolicitacoes);