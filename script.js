        const API_URL = "https://script.google.com/macros/s/AKfycbykKNpAdWAL3WqwbqYDidqvQP3TS_PW1eJOhrausPI5yvcAVJYnzRt0KSd2wb33shKu/exec";
        let abaAtiva = 'banco';
        let dadosLocais = [];

        window.onload = () => carregarDados();

        function mudarAba(aba) {
            abaAtiva = aba;
            document.getElementById('btn-banco').classList.toggle('bg-white/10', aba === 'banco');
            document.getElementById('btn-licitacao').classList.toggle('bg-white/10', aba === 'licitacao');
            document.getElementById('tituloPagina').innerText = aba === 'banco' ? 'BANCO DE PREÇOS' : 'LICITAÇÕES';
            carregarDados();
        }

        async function carregarDados() {
            const corpo = document.getElementById('corpoTabela');
            corpo.innerHTML = '<tr><td colspan="12" class="p-10 text-center"><span class="loader"></span> Sincronizando...</td></tr>';
            try {
                const res = await fetch(`${API_URL}?aba=${abaAtiva === 'banco' ? 'DB_ITENS' : 'DB_LICITACOES'}`);
                dadosLocais = await res.json();
                renderizar(dadosLocais);
            } catch (e) { corpo.innerHTML = '<tr><td colspan="12" class="p-10 text-center text-red-500">Erro de conexão.</td></tr>'; }
        }

        function renderizar(dados) {
            const corpo = document.getElementById('corpoTabela');
            document.getElementById('contadorRegistros').innerText = dados.length;
            // Proteção contra Out of Memory: Renderiza apenas os últimos 300
            const exibicao = dados.slice(-300).reverse();
            corpo.innerHTML = exibicao.map(item => `
                <tr class="border-b hover:bg-slate-50 transition">
                    <td class="px-4 py-3">${item.DATA_CRIACAO || ''}</td>
                    <td class="px-4 py-3">${item.ID_ORIGEM || ''}</td>
                    <td class="px-4 py-3">${item.COD_REDUZIDO_CCUSTO || ''}</td>
                    <td class="px-4 py-3 uppercase text-[10px]">${item.CENTRO_DE_CUSTO || ''}</td>
                    <td class="px-4 py-3 font-mono">${item.CODIGOPRD || ''}</td>
                    <td class="px-4 py-3 font-semibold">${item.PRODUTO || ''}</td>
                    <td class="px-4 py-3 text-center">${item.QUANTIDADEORC || 0}</td>
                    <td class= "px-4 py-3 text-center">${item.UNIDADE ||0}</td>
                    <td class="px-4 py-3">R$ ${Number(item.PRECO_UNITARIO || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                    <td class="px-4 py-3 font-bold text-effico-green">R$ ${Number(item.VALOR_TOTAL || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                    <td class="px-4 py-3 uppercase text-[10px]">${item.FORNECEDOR || ''}</td>
                    <td class="px-4 py-3">${item.COMPRADOR || ''}</td>
                </tr>
            `).join('');
        }

        function importarDados(input) {
            const file = input.files[0];
            const reader = new FileReader();
            reader.onload = async (e) => {
                // REMOVE CARACTERES DE CONTROLE (O "LIXO" DO COPIAR/COLAR)
                let limpo = e.target.result.replace(/[\x00-\x1F\x7F-\x9F]/g, " ");
                const linhas = limpo.split('\n');
                const status = document.getElementById('statusConexao');

                for (let i = 0; i < linhas.length; i++) {
                    const textoLinha = linhas[i].trim();
                    if (!textoLinha) continue;

                    // Regex para separar por 2 ou mais espaços, tabulação ou ponto-e-vírgula
                    const col = textoLinha.split(/\t|;| {2,}/);
                    if (col.length < 2) continue;

                    status.innerHTML = `<span class="loader"></span> Lendo linha ${i}...`;

                    const pld = {
                        TABELA_DESTINO: abaAtiva === 'banco' ? 'DB_ITENS' : 'DB_LICITACOES',
                        PRODUTO: col[0] ? col[0].trim() : "N/A",
                        CODIGOPRD: col[1] ? col[1].trim() : "-",
                        // Adicione o mapeamento conforme a ordem do seu arquivo TXT/CSV
                        FORNECEDOR: col[12] || "-",
                        VALOR_TOTAL: 0
                    };

                    await fetch(API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(pld) });
                }
                alert("Importação Concluída com Limpeza!");
                carregarDados();
            };
            reader.readAsText(file);
        }

        document.getElementById('inputBusca').addEventListener('input', (e) => {
            const t = e.target.value.toLowerCase();
            const f = dadosLocais.filter(i => Object.values(i).some(v => String(v).toLowerCase().includes(t)));
            renderizar(f);
        });