const URL_API = 'https://script.google.com/macros/s/AKfycbzmLvDrB8jTm-6pzBVBVNdAtwclN6ybaaUkwiai_HsrwgVkuaTy4l5KWKYY32CoK0kJ/exec';

function carregarDados() {
    const corpo = document.getElementById('corpoTabela');

    corpo.innerHTML = `
        <tr>
            <td colspan="8" class="p-4 text-center text-gray-400">
                Carregando...
            </td>
        </tr>
    `;

    fetch(URL_API)
        .then(res => res.json())
        .then(dados => {
            corpo.innerHTML = '';

            dados.forEach(l => {
                corpo.innerHTML += `
                    <tr class="border-t">
                        <td class="p-3">${l.IDENTIFICADOR}</td>
                        <td class="p-3">${l['Data da Solicitação']}</td>
                        <td class="p-3">${l['Data Limite']}</td>
                        <td class="p-3">${l['Centro de Custo']}</td>
                        <td class="p-3">${l.Item}</td>
                        <td class="p-3">${l.Observacao}</td>
                        <td class="p-3">${l.Quantidade}</td>
                        <td class="p-3">${l.Solicitante}</td>
                    </tr>
                `;
            });
        })
        .catch(() => {
            corpo.innerHTML = `
                <tr>
                    <td colspan="8" class="p-4 text-center text-red-500">
                        Erro ao carregar dados
                    </td>
                </tr>
            `;
        });
}

carregarDados();