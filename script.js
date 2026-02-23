// 🔴 COLE SUA URL DO APPS SCRIPT AQUI
const URL_API = 'https://script.google.com/macros/s/AKfycbxzSC8wajsJXFWRotOE0VB3lI25Ng8pn6EmgVg3QfQDmZpegKPkM0Bj3e3yct4Y2Wbd/exec';
let dadosOriginais = [];

fetch(`${URL_API}?aba=DB_SOLICITACOES`)
  .then(r => r.json())
  .then(dados => {
    dadosOriginais = dados;
    popularCompradores(dados);
    renderizar(dados);
  });

function formatarData(d) {
  if (!d) return '-';
  const dt = new Date(d);
  return dt.toLocaleDateString('pt-BR');
}

function agruparPorId(dados) {
  return dados.reduce((acc, item) => {
    acc[item.IDENTIFICADOR] = acc[item.IDENTIFICADOR] || [];
    acc[item.IDENTIFICADOR].push(item);
    return acc;
  }, {});
}

function renderizar(dados) {
  const corpo = document.getElementById('corpoTabela');
  corpo.innerHTML = '';
  const grupos = agruparPorId(dados);

  Object.keys(grupos).forEach(id => {
    const itens = grupos[id];
    const p = itens[0];

    corpo.innerHTML += `
      <tr class="linha-pai" onclick="toggle('${id}', this)">
        <td class="p-3"><span class="icon">➕</span>${id}</td>
        <td>${formatarData(p.DATA)}</td>
        <td>${formatarData(p.DATA_LIMITE)}</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>${p.SOLICITANTE}</td>
        <td>${badge(p.STATUS)}</td>
        <td>
          <select onchange="definirComprador('${id}', this.value)">
            <option>${p.COMPRADOR || 'Selecionar'}</option>
            <option>João</option>
            <option>Maria</option>
            <option>Carlos</option>
          </select>
        </td>
        <td>${formatarData(p.DATA_FINALIZACAO)}</td>
        <td>
          <button class="bg-green-600 text-white px-2 py-1 rounded text-xs"
            onclick="event.stopPropagation(); concluir('${id}')">
            Concluir
          </button>
        </td>
      </tr>
    `;

    itens.forEach(i => {
      corpo.innerHTML += `
        <tr class="linha-filho grupo-${id}">
          <td></td><td></td><td></td>
          <td>${i.CENTRO_CUSTO}</td>
          <td>${i.ITEM}</td>
          <td>${i.OBSERVACAO || '-'}</td>
          <td>${i.QTD}</td>
          <td></td><td></td><td></td><td></td><td></td>
        </tr>
      `;
    });
  });
}

function toggle(id, row) {
  const filhos = document.querySelectorAll(`.grupo-${id}`);
  const icon = row.querySelector('.icon');
  const aberto = icon.textContent === '➖';

  filhos.forEach(f => f.classList.toggle('show'));
  icon.textContent = aberto ? '➕' : '➖';
}

function badge(s) {
  return s === 'Em andamento'
    ? `<span class="bg-yellow-200 px-2 rounded text-xs">🟡 Em andamento</span>`
    : `<span class="bg-red-200 px-2 rounded text-xs">🔴 Pendente</span>`;
}

function concluir(id) {
  fetch(URL_API, {
    method: 'POST',
    body: JSON.stringify({ action: 'CONCLUIR', id })
  }).then(() => location.reload());
}

function definirComprador(id, comprador) {
  fetch(URL_API, {
    method: 'POST',
    body: JSON.stringify({ action: 'COMPRADOR', id, comprador })
  });
}

function popularCompradores(dados) {
  const select = document.getElementById('filtroComprador');
  [...new Set(dados.map(d => d.COMPRADOR).filter(Boolean))]
    .forEach(c => select.innerHTML += `<option>${c}</option>`);
}

function aplicarFiltros() {
  const c = filtroComprador.value;
  const s = filtroStatus.value;

  renderizar(dadosOriginais.filter(d =>
    (!c || d.COMPRADOR === c) &&
    (!s || d.STATUS === s)
  ));
}