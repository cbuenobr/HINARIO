  
    const catalogPath = "./json/hinos_teste.json";
    //const catalogPath = "./json/hinos.json";

    const authorField = document.getElementById("autor");
    const copyrightField = document.getElementById("copyright");
    const lyricsField = document.getElementById("letra");
    const messageField = document.getElementById("formMsg");
    const numberField = document.getElementById('numero');
    const titleField = document.getElementById('titulo');    
    const tableIndex = document.getElementById("edit-table");    

    let hinoCarregado;
    let hinosCarregados;
    let isNewSong = false;
    let numberChanged = false;
    let titleChanged = false;
    let previousNumber = 0;
    let previousTitle = '';
    let sortBy = 1;
    let sortDirection = 1;

 //FUNÇÕES ---------------------------------------------------
    async function Catalogo_Carrega() {

        try {
			console.log("CarregarDados");

            if (window.location.protocol === 'file:') {
                throw new Error('Este aplicativo deve ser aberto por um servidor local. Execute "python -m http.server" e abra http://localhost:8000');
            }            

            const resposta = await fetch(catalogPath, { cache: 'no-store' });

            //== PROVOCA ERRO ====================
            //throw new Error('Não foi possível carregar hinos.json (erro ' + resposta.status + ')');
            //========================================

            if (!resposta.ok) throw new Error('Não foi possível carregar hinos.json (erro ' + resposta.status + ')');

            const catalogo = await resposta.json();

            //Se o json for um array usa "catalogo". Se houver um membro que não é array, procura "catalogo.hinos". Se este não existir devolve []
            hinosCarregados = Array.isArray(catalogo) ? catalogo : (catalogo.hinos || []);

            console.log('Hinos carregados: ' + hinosCarregados.length);

            if(hinosCarregados.length>0)
            {
                Indice_Popula();

                //Exibe ou oculta botões
                ToggleButtonVisiblity();
            }
            else{
                throw new Error('O arquivo do índice está vazio.');
            }

        } catch (erro) {
            messageField.textContent = erro.message;
        }
    }

    function entrar()
    {
        console.log( "entrar no admin");

        Catalogo_Carrega();

        document.getElementById('loginArea').classList.add('hidden');
        document.getElementById('adminArea').classList.remove('hidden');
    }

    //Verifica se o valor é um inteiro > 0
    function isInt(value) 
    {
        const num = Number(value);

        if(Number.isInteger(num) && num >0)
        {
            return num;
        }
        else
        {
            return false;
        }
    }

    //Verifica se é música nova ou edição
    function CheckIsNewSong()
    {
        numberChanged = false;
        titleChanged = false;

        if(numberField.value != hinoCarregado.numero)
        {
            numberChanged = true;
            //console.log("numero diferente");
        }

        if(titleField.value.trim().toUpperCase() != hinoCarregado.titulo.toUpperCase())
        {
            titleChanged = true;
        }

        //Se o número e o título mudaram, é uma nova música e receberá um novo ID
        isNewSong = (numberChanged && titleChanged);
    }


    //PARA TESTAR DELAY DE FETCH
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }


    //Verifica se há duplicatas (não incluí o copyright, porque pode não existir ou ser o mesmo)
    function DuplicateCheck(field)
    {
        let duplicate = undefined;
        let total = 0;

        switch(field)
        {
            case numberField:

                //Contabiliza duplicatas
                for(let i=0;i<hinosCarregados.length;i++)   
                {
                    if(hinosCarregados[i].numero == field.value)
                    {
                        total++;

                        if(total>=1)
                        {
                            //Identifica a duplicata
                            let duplicate = hinosCarregados.find(h => String(h.numero) === field.value);
                            
                            if(duplicate != undefined)
                            {
                                messageField.textContent = "Já existe um hino com este número: " + duplicate.numero + " - " + duplicate.titulo;
                            }
                            else
                            {
                                messageField.textContent = "Já existe um hino com este número;";
                            }

                            //Interrompe a iteração
                            return false;        
                        }
                    }            
                }

            return true;

            case titleField:
                for(let i=0;i<hinosCarregados.length;i++)   
                {
                    if(hinosCarregados[i].titulo.toUpperCase() == field.value.toUpperCase())
                    {
                        total++;

                        if(total>=1)
                        {
                            //Identifica a duplicata
                            duplicate = hinosCarregados.find(h => String(h.titulo).toUpperCase() === field.value.toUpperCase());

                            if(duplicate != undefined)
                            {
                                messageField.textContent = "Já existe um hino com este título: " + duplicate.numero + " - " + duplicate.titulo;
                            }
                            else
                            {
                                messageField.textContent = "Já existe um hino com este título.";
                            }

                            //Interrompe a iteração
                            return false;
                        }
                    }            
                }

            return true;
        }
    }
    
    
    function Edicao_Cancelar()
    {
       console.log(document.getElementById("listArea").classList.remove('hidden'));
       console.log(document.getElementById("formArea").classList.add('hidden'));
    }

    function Edicao_Sair()
    {
        window.location = "index.html";
    }


    function EditForm_Show()
    {

        console.log(document.getElementById("listArea").classList.add('hidden'));
        console.log(document.getElementById("formArea").classList.remove('hidden'));
    }

    //Valida campos (não incluí autor e copyright porque podem não existir)
    function Field_Validate(field)
    {
        switch(field)
        {
            case numberField:

                //Verifica se é inteiro. Se for decimal converte para inteiro.
                let newValue = isInt(field.value);
                
                if(newValue == false)
                {
                    messageField.textContent = "O número desse hino é inválido. Digite um número inteiro maior ou igual a 1.";

                    return false;
                }


            return true;

            case titleField:
                if(field.value == false)
                {
                    messageField.textContent = "Digite o título do hino.";

                    return false;
                }

            return true;


            case lyricsField:
                if(field.value == false)
                {
                    messageField.textContent = "Digite a letra do hino.";

                    return false;
                }

            return true;
        }
    }

    function Form_Clear()
    {
        authorField.value ='';
        copyrightField.value='';
        lyricsField.value = '';
        numberField.value = '';
        titleField.value = '';
    }


    //Cria linha do Índice
    function Indice_CriaLinha(id, titulo, numero)
    {
        //Cria linha
        const tr = document.createElement('tr');

        //Cria célula
        const td1 = document.createElement('td');
        td1.classList.add('td-number');
        const td1txt = document.createTextNode(numero);

        td1.appendChild(td1txt);
        tr.appendChild(td1);

        //Cria célula
        const td2 = document.createElement('td');

        const link1 = document.createElement('a');
        link1.setAttribute('href','javascript:Song_GetData(' + id + ');');

        const linktxt= document.createTextNode(titulo);
        link1.appendChild(linktxt);

        td2.appendChild(link1);
        tr.appendChild(td2);

        tableIndex.appendChild(tr);
    }

    //Monta ou remonta o índice
    function Indice_Popula()
    {   
        //Esvazia o índice
        tableIndex.textContent = '';

        //Ordena os dados conforme tipo e direção de ordenação
        SortData(sortBy, sortDirection);

        //Popula o índice, linha por linha
        for(let i=0;i<hinosCarregados.length;i++)
        {
            Indice_CriaLinha(hinosCarregados[i].id, hinosCarregados[i].titulo, hinosCarregados[i].numero);      
        }

        console.log('Índice montado com sucesso!');
    }

    //== DADOS ARMAZENADOS NO NAVEGADOR (Web Storage) ==========================================================
    function Parameters_Sort_Load()
    {
        if(typeof(Storage) == "undefined") {
            console.error("Não é possível carregar parâmetros de ordenação. O navegador não suporta Web Storage.");
            
            return;       
        }
        
        //Obtém o tipo de ordenação, se não existir, mantém o padrão (1)
        let result = localStorage.getItem("sortBy");

        if(result != null)
        {
            sortBy = parseInt(result);
        }

        //Obtém a direção da ordenação, se não existir, mantém o padrão (1)
        result = localStorage.getItem("sortDirection");

        if(result != null)
        {
            sortDirection = parseInt(result);
        }
    }
    
    function Song_GetData(selectedId)
    {
        hinoCarregado = hinosCarregados.find(h => String(h.id) === String(selectedId));

        if(hinoCarregado != null)
        {
            EditForm_Show();

            //Popula campos
            numberField.value = hinoCarregado.numero;
            titleField.value = hinoCarregado.titulo;

            //Busca a letra do hino no arquivo especificado em hino.arquivo
            //O NOME DE ARQUIVO TEM QUE SER IDÊNTIICO AO DO DISCO (CAIXA ALTA/BAIXA)

            //Testa delay
            //delay(3000).then(() => {console.log("xxxxxxx This runs after 2 seconds"); Song_GetLyrics(hinoCarregado.arquivo);});
            
            
            Song_GetLyrics(hinoCarregado.arquivo);

            if(hinoCarregado.autor != undefined)
            {                    
                authorField.value = hinoCarregado.autor;
            }

            if(hinoCarregado.copyright != undefined)
            {                    
                copyrightField.value = hinoCarregado.copyright;
            }
        }
        else{
            console.error('Hino não encontrado: ' + Id1);
            messageField.textContent = 'Hino não encontrado: ' + Id1;
        }
    }


    function Song_New()
    {
        //Limpa campoa de possível edição anterior
        Form_Clear();

        EditForm_Show();
    }

    async function Song_GetLyrics(arquivoHino)
    {
        try
        {
            if (window.location.protocol === 'file:') {
                throw new Error('Este aplicativo deve ser aberto por um servidor local. Execute "python -m http.server" e abra http://localhost:8000');
            }

            const resposta = await fetch(arquivoHino, { cache: 'no-store' });

            if (!resposta.ok) throw new Error('Não foi possível carregar o arquivo do hino (erro ' + resposta.status + ')');

            lyricsField.value =  await resposta.text();
        
        } catch (erro) {
            console.error('Não foi possível carregar a letra deste hino. ' +  erro.message);
            lyricsField.value =  'Não foi possível carregar a letra deste hino.';
            messageField.textContent = erro.message;
        }
    }


    //GRAVA HINO
/*     function Song_Save()
    {
        //Limpa mensagem de erro
        messageField.textContent ='';

        //Valida entradas de número, título e letra
        if(Field_Validate(numberField))
        {
            if(Field_Validate(titleField))
            {
                if(Field_Validate(lyricsField) == false)
                {
                    return;
                }
            }
            else{return;}
        }
        else{return;} 

        //Verifica se é música nova ou atualização
        CheckIsNewSong();

        //Se for nova: verifica se existe outra com o mesmo número e o mesmo título
        //Se for atualização:
        //Só o número mudou: verifica duplicata do número
        //Só o título mudou: verifica duplicata do título
        //Ambos mudaram: verifica duplicata de ambos 

        if(isNewSong)
        {
            DuplicateCheck(numberField);
            DuplicateCheck(titleField);
        }
        else
        {
            if(numberChanged)
            {
                DuplicateCheck(numberField);
            }

            if(titleChanged)
            {
                DuplicateCheck(titleField);
            }
        }

        //Checagem positiva
        //Atualiza objeto        
        hinoCarregado.autor = authorField.value.trim();
        hinoCarregado.copyright = copyrightField.value.trim();
        hinoCarregado.letra = lyricsField.value.trim();
        hinoCarregado.numero = numberField.value
        hinoCarregado.titulo = titleField.value.trim();

        console.log(hinoCarregado.numero + ", " + hinoCarregado.titulo);
        console.log(hinoCarregado.letra);
        console.log(hinoCarregado.autor);
        console.log(hinoCarregado.copyright);

        return;         
    } */

    async function salvar() {
    const numero = Number(numberField.value);
    const titulo = titleField.value.trim();
    const letra = lyricsField.value.trim();
    const autor = authorField.value.trim();
    const copyright = copyrightField.value.trim();


    if (!Number.isInteger(numero) || numero <= 0) {
        setMsg('formMsg', 'Informe um número de hino válido.', 'error');
        return;
    }
    if (!titulo) {
        setMsg('formMsg', 'Informe o título.', 'error');
        return;
    }
    if (!letra) {
        setMsg('formMsg', 'Informe a letra.', 'error');
        return;
    }

    const btn = document.getElementById('salvarBtn');
    btn.disabled = true;
    setMsg('formMsg', 'Salvando no GitHub...');

    try {
        const action = editandoId === null ? 'create' : 'update';
        const payload = { action, numero, titulo, letra, autor, copyright };
        if (editandoId !== null) payload.id = editandoId;

        const data = await api('POST', payload);
        setMsg('formMsg', data.message || 'Salvo.', 'success');

        await carregarLista(true);
        setTimeout(() => {
        cancelarEdicao();
        setMsg('listaMsg', 'Alteração salva no GitHub. Ela ainda não foi publicada no site.', 'success');
        }, 500);
    } catch (e) {
        setMsg('formMsg', e.message, 'error');
    } finally {
        btn.disabled = false;
    }
    }

    //Ordena array pelo titulo do hino obedecendo a ordem passada (Caixa alta tem precedência sobre caixa baixa, por isso devemos igualá-las)
    //Usei localecompare para obedecer a acentuaçao
    function SortByTitle(sortOrder)
    {
        if(sortOrder == 1)
        {       
            hinosCarregados.sort(function(a, b) {
                return a.titulo.toLowerCase().localeCompare(b.titulo.toLowerCase());
            });

        }
        else{
            hinosCarregados.sort(function(a, b) {
                return b.titulo.toLowerCase().localeCompare(a.titulo.toLowerCase());
            });
        }
    }

    //Ordena array pelo número do hino obedecendo a ordem passada
    function SortByNumber(sortOrder)
    {
        if(sortOrder == 1)
        {
            hinosCarregados = hinosCarregados.sort(function(a,b){return a.numero - b.numero});
        }
        else
        {
            hinosCarregados = hinosCarregados.sort(function(a,b){return b.numero - a.numero});
        }
        
    }

    //Parâmetros da ordenação
    function SortData(sortBy, sortDirection)
    {
        if(sortBy == 1)
        {
            SortByTitle(sortDirection);
        }
        else{
            SortByNumber(sortDirection);
        }

        //PRINT
        //RelatorioIndice();
    }

    //Exibe ou esconde os botões superiores se o documento sangrar
    function ToggleButtonVisiblity()
    {
        const footer = document.getElementById('button_row_bottom');

        finalHeight = tableIndex.offsetHeight;

        if(finalHeight > screen.height)
        {
            footer.classList.remove('hidden');
        }
        else
        {
            footer.classList.add('hidden');
        }
    }



    //INICIALIZACAO
    window.onload = function() {

        //Obtém variáveis globais
        Parameters_Sort_Load();

        Catalogo_Carrega();

    }