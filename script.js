const URL_API = 'https://script.google.com/macros/s/AKfycbycJKciXRHOzWzkmXEj71A8pf5U-qGU-RiEKf2JiJTzAt8161G8eRVukHTeItT6bOFr/exec';

document.addEventListener('DOMContentLoaded', () => {
  carregarSolicitacoes();
});

function carregarSolicitacoes() {
  fetch(`${URL_API}?aba=DB_SOLICITACOES`)
    .then(res => res.json())
    .then(dados => renderizarTabela(dados))
    .catch(err => {
      console.error(err);
      document.getElementById('corpoTabela').innerHTML = `
        <tr>
          <td colspan="9" class="p-4 text-center text-red-500">
            Erro ao carregar dados
          </td>
        </tr>
      `;
    });
}

function renderizarTabela(dados) {
  const corpo = document.getElementById('corpoTabela');
  corpo.innerHTML = '';

  if (!dados || dados.length === 0) {
    corpo.innerHTML = `
      <tr>
        <td colspan="9" class="p-4 text-center text-gray-400">
          Nenhuma solicitação ativa
        </td>
      </tr>
    `;
    return;
  }

  const colunas = [
    'IDENTIFICADOR',
    'Data da Solicitação',
    'Data Limite',
    'Centro de Custo',
    'Item',
    'Observacao',
    'Quantidade',
    'Solicitante',
    'STATUS'
  ];

  dados.forEach(linha => {
    corpo.innerHTML += `
      <tr class="border-t hover:bg-slate-50">
        ${colunas.map(col => {
          if (col === 'STATUS') {
            return `<td class="p-3">${farolStatus(linha[col])}</td>`;
          }
          return `<td class="p-3">${linha[col] ?? ''}</td>`;
        }).join('')}
      </tr>
    `;
  });
}

function farolStatus(status) {
  if (status === 'Concluído') {
    return `<span class="px-2 py-1 text-xs rounded bg-green-100 text-green-700">🟢 Concluído</span>`;
  }
  if (status === 'Em andamento') {
    return `<span class="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700">🟡 Em andamento</span>`;
  }
  return `<span class="px-2 py-1 text-xs rounded bg-red-100 text-red-700">🔴 Pendente</span>`;
}