// 🔴 COLE SUA URL DO APPS SCRIPT AQUI
const URL_API = 'https://script.google.com/macros/s/AKfycbxzSC8wajsJXFWRotOE0VB3lI25Ng8pn6EmgVg3QfQDmZpegKPkM0Bj3e3yct4Y2Wbd/exec';

let abaAtiva = 'solicitacoes';

/* ---------- UTIL ---------- */
function formatarData(d) {
  if (!d) return '-';
  return `- ${d}`;
}

function badgeStatus(status) {
  if (status === 'Concluído')
    return '<span class="px-2 py-1 text-xs rounded bg-green-100 text-green-700">🟢 Concluído</span>';
  if (status === 'Em andamento')
    return '<span class="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700">🟡 Em andamento</span>';
  return '<span class="px-2 py-1 text-xs rounded bg-red-100 text-red-700">🔴 Pendente</span>';
}

/* ---------- NAVEGAÇÃO ---------- */
function mudarAba(aba) {
  abaAtiva = aba;

  document.getElementById('tituloPagina').innerText =
    aba === 'solicitacoes' ? 'SOLICITAÇÕES' :
    aba === 'avaliacao' ? 'AVALIAÇÃO DO FORNECEDOR' :
    'DASHBOARD';

  document.querySelectorAll('.btn-aba')
    .forEach(b => b.classList.remove('bg-white/10'));
  document.getElementById(`btn-${aba}`).classList.add('bg-white/10');

  if (aba === 'solicitacoes') carregarSolicitacoes();
  else document.getElementById('corpoTabela').innerHTML = `
    <tr><td colspan="6" class="p-4 text-center">Em construção 🚧</td></tr>
  `;
}

/* ---------- AGRUPAR ---------- */
function agruparPorId(dados) {
  const grupos = {};
  dados.forEach(d => {
    if (!grupos[d.IDENTIFICADOR]) grupos[d.IDENTIFICADOR] = [];
    grupos[d.IDENTIFICADOR].push(d);
  });
  return grupos;
}

/* ---------- CARREGAR ---------- */
function carregarSolicitacoes() {
  fetch(`${URL_API}?aba=DB_SOLICITACOES`)
    .then(r => r.json())
    .then(dados => renderizar(dados));
}

/* ---------- RENDER ---------- */
function renderizar(dados) {
  const corpo = document.getElementById('corpoTabela');
  corpo.innerHTML = '';

  if (!dados.length) {
    corpo.innerHTML = `
      <tr>
        <td colspan="6" class="p-4 text-center text-gray-400">
          Nenhuma solicitação
        </td>
      </tr>`;
    return;
  }

  const grupos = agruparPorId(dados);

  Object.keys(grupos).forEach(id => {
    const itens = grupos[id];
    const p = itens[0];

    corpo.innerHTML += `
      <tr class="bg-slate-100 font-semibold cursor-pointer"
          onclick="toggleGrupo('${id}', this)">
        <td class="p-3 flex items-center gap-2">
          <span class="icon">➕</span> ${id}
        </td>
        <td class="p-3">${itens.length}</td>
        <td class="p-3">${formatarData(p["DATA DA SOLICITACAO"])}</td>
        <td class="p-3">${badgeStatus(p.STATUS)}</td>
        <td class="p-3">
          <select class="border rounded px-2 py-1 text-xs"
            onchange="atualizarComprador('${id}', this.value)">
            <option>${p.COMPRADOR || 'Selecionar'}</option>
            <option>Flávio</option>
            <option>Patrícia</option>
            <option>Leonardo</option>
            <option>Pedro</option>
          </select>
        </td>
        <td class="p-3">
          <button onclick="event.stopPropagation(); concluir('${id}')"
            class="bg-green-600 text-white px-3 py-1 rounded text-xs">
            Concluir
          </button>
        </td>
      </tr>
    `;

    itens.forEach(i => {
      corpo.innerHTML += `
        <tr class="expand grupo-${id}">
          <td class="p-3 pl-10">• ${i.ITEM}</td>
          <td class="p-3">${i.QUANTIDADE}</td>
          <td class="p-3">${i["CENTRO DE CUSTO"]}</td>
          <td class="p-3" colspan="3">${i.OBSERVACAO || '-'}</td>
        </tr>
      `;
    });
  });
}

/* ---------- EXPANDIR ---------- */
function toggleGrupo(id, row) {
  const linhas = document.querySelectorAll(`.grupo-${id}`);
  const icon = row.querySelector('.icon');
  const aberto = linhas[0].classList.contains('show');

  linhas.forEach(l => l.classList.toggle('show'));
  icon.textContent = aberto ? '➕' : '➖';
}

/* ---------- AÇÕES ---------- */
function atualizarComprador(id, comprador) {
  fetch(URL_API, {
    method: 'POST',
    body: JSON.stringify({
      action: 'ATUALIZAR_COMPRADOR',
      id, comprador
    })
  });
}

function concluir(id) {
  if (!confirm(`Concluir solicitação ${id}?`)) return;

  fetch(URL_API, {
    method: 'POST',
    body: JSON.stringify({
      action: 'CONCLUIR',
      id
    })
  })
  .then(() => carregarSolicitacoes());
}

/* ---------- INIT ---------- */
document.addEventListener('DOMContentLoaded', carregarSolicitacoes);