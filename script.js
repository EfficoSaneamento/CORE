const URL_API = 'https://script.google.com/macros/s/AKfycbxzSC8wajsJXFWRotOE0VB3lI25Ng8pn6EmgVg3QfQDmZpegKPkM0Bj3e3yct4Y2Wbd/exec';

const COMPRADORES = ['Flávio', 'Patrícia', 'Leonardo', 'Pedro'];

function carregarSolicitacoes() {
  fetch(URL_API)
    .then(r => r.json())
    .then(renderizarSolicitacoes);
}

function renderizarSolicitacoes(dados) {
  const corpo = document.getElementById('corpoTabela');
  corpo.innerHTML = '';

  if (!dados.length) {
    corpo.innerHTML = `
      <tr>
        <td colspan="12" class="p-4 text-center text-gray-400">
          Nenhuma solicitação ativa
        </td>
      </tr>`;
    return;
  }

  dados.forEach(d => {
    corpo.innerHTML += `
      <tr class="border-t hover:bg-slate-50">
        <td class="p-2">${d.IDENTIFICADOR}</td>
        <td class="p-2">${d.DATA_DA_SOLICITACAO}</td>
        <td class="p-2">${d.DATA_LIMITE}</td>
        <td class="p-2">${d.CENTRO_DE_CUSTO}</td>
        <td class="p-2">${d.ITEM}</td>
        <td class="p-2">${d.OBSERVACAO || '-'}</td>
        <td class="p-2">${d.QUANTIDADE}</td>
        <td class="p-2">${d.SOLICITANTE}</td>
        <td class="p-2">${farol(d.STATUS)}</td>
        <td class="p-2">
          ${selectComprador(d)}
        </td>
        <td class="p-2">
          <button onclick="concluir('${d.IDENTIFICADOR}')"
            class="bg-green-600 text-white px-3 py-1 rounded text-xs">
            Concluir
          </button>
        </td>
      </tr>
    `;
  });
}

/* ---------- FAROL ---------- */
function farol(status) {
  if (status === 'EM ANDAMENTO')
    return '🟡 Em andamento';
  if (status === 'CONCLUÍDO')
    return '🟢 Concluído';
  return '🔴 Pendente';
}

/* ---------- SELECT COMPRADOR ---------- */
function selectComprador(d) {
  return `
    <select onchange="salvarComprador('${d.IDENTIFICADOR}', this.value)"
      class="border rounded px-2 py-1 text-sm">
      <option value="">Selecionar</option>
      ${COMPRADORES.map(c =>
        `<option ${d.COMPRADOR === c ? 'selected' : ''}>${c}</option>`
      ).join('')}
    </select>
  `;
}

function salvarComprador(id, comprador) {
  fetch(URL_API, {
    method: 'POST',
    body: JSON.stringify({ id, comprador })
  });
}

/* ---------- CONCLUIR ---------- */
function concluir(id) {
  if (!confirm('Deseja concluir esta solicitação?')) return;

  fetch(URL_API, {
    method: 'POST',
    body: JSON.stringify({ action: 'CONCLUIR', id })
  })
  .then(() => carregarSolicitacoes());
}

document.addEventListener('DOMContentLoaded', carregarSolicitacoes);