const URL_API = 'https://script.google.com/macros/s/AKfycbxzSC8wajsJXFWRotOE0VB3lI25Ng8pn6EmgVg3QfQDmZpegKPkM0Bj3e3yct4Y2Wbd/exec';
let dadosOriginais = [];

/* ---------- INIT ---------- */
fetch(`${URL_API}?aba=DB_SOLICITACOES`)
  .then(r => r.json())
  .then(dados => {
    dadosOriginais = dados;
    renderizarTabela(dados);
  });

/* ---------- UTIL ---------- */
function formatarData(data) {
  if (!data) return '-';
  const d = new Date(data);
  return d.toLocaleDateString('pt-BR');
}

function agruparPorIdentificador(dados) {
  return dados.reduce((acc, item) => {
    const id = item["Identificador"];
    if (!acc[id]) acc[id] = [];
    acc[id].push(item);
    return acc;
  }, {});
}

/* ---------- RENDER ---------- */
function renderizarTabela(dados) {
  const corpo = document.getElementById('corpoTabela');
  corpo.innerHTML = '';

  const grupos = agruparPorIdentificador(dados);

  Object.keys(grupos).forEach(id => {
    const itens = grupos[id];
    const base = itens[0];

    // LINHA PAI
    corpo.innerHTML += `
      <tr class="bg-slate-100 cursor-pointer" onclick="toggleGrupo('${id}', this)">
        <td class="p-2 font-bold">
          <span class="toggle-icon">➕</span> ${id}
        </td>
        <td>${itens.length} itens</td>
        <td>${formatarData(base["Data da Solicitação"])}</td>
        <td>${base["Status"]}</td>
        <td>
          <select onchange="definirComprador('${id}', this.value)">
            <option>${base["Comprador"] || 'Selecionar'}</option>
            <option>João</option>
            <option>Maria</option>
            <option>Carlos</option>
          </select>
        </td>
        <td>
          <button class="bg-green-600 text-white px-2 py-1 rounded text-xs"
            onclick="event.stopPropagation(); concluir('${id}')">
            Concluir
          </button>
        </td>
      </tr>
    `;

    // LINHAS FILHAS (ITENS)
    itens.forEach(item => {
      corpo.innerHTML += `
        <tr class="hidden grupo-${id} bg-white border-t">
          <td></td>
          <td>${item["Item"]}</td>
          <td>${formatarData(item["Data Limite"])}</td>
          <td>${item["Centro de Custo"]}</td>
          <td>${item["Observação"] || '-'}</td>
          <td>${item["Quantidade"]}</td>
        </tr>
      `;
    });
  });
}

/* ---------- EXPAND ---------- */
function toggleGrupo(id, linha) {
  const filhos = document.querySelectorAll(`.grupo-${id}`);
  const icon = linha.querySelector('.toggle-icon');
  const aberto = icon.textContent === '➖';

  filhos.forEach(f => f.classList.toggle('hidden'));
  icon.textContent = aberto ? '➕' : '➖';
}

/* ---------- AÇÕES ---------- */
function concluir(id) {
  if (!confirm('Concluir solicitação?')) return;

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