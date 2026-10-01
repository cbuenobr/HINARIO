
    const rootStyles = window.getComputedStyle(document.documentElement);
    const fontSizeSlider = document.getElementById("fontSizeRange");
    //const sortControl = document.getElementById("sortControl");



    //xxx TESTE RADIO BUTTONS xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    const radioSortBy = document.getElementsByName("sortBy");
    const radioSortDirection = document.getElementsByName("sortDirection");

    const btnSort = document.getElementById('btnSort');

    //xxxxxxxxxxxxxxxxxxxxxxxxxx
    const el = document.querySelector('#btnSort');
    if (el) {
        btnSort.addEventListener('click',MontaIndice);
        }
        else{
            console.log('btnSortnão encontrado!');
            alert('btnSort não encontrado!');
        }
    //xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx    
    
    const tableIndex = document.getElementById("table-index");    

    //xxxxxxxxxxxxxxxxxxxxxxxxxx
    const el2 = document.querySelector('#table-index');
    if (el2) {
        console.log('table-index encontrado!');
        }
        else{console.log('table-index não encontrado!');}
    //xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx 

    let currentFontSize;
    let currentLineHeight;
    let hinosCarregados;   
    let sortBy = 1;
    let sortDirection = 1;

    //EVENTOS
    const el3 = document.querySelector('#fontSlider');
    if(el3) {
        fontSizeSlider.oninput = function()
        {
            ChangeFontSize(this.value);

            if(document.getElementById('report01') != null)
            {
                document.getElementById('report01').textContent = this.value;
            }        
        }
    }
    else{console.log('fontSlider não encontrado!');}

  
    async function CarregaDados() {

        const mensagem = document.getElementById('mensagem');

        try {
			console.log("CarregarDados");

            const resposta = await fetch('./json/hinos.json', { cache: 'no-store' });

            if (!resposta.ok) throw new Error('Não foi possível carregar hinos.json (erro ' + resposta.status + ')');

            const catalogo = await resposta.json();

            //Se o json for um array usa "catalogo". Se houver um membro que não é array, procura "catalogo.hinos". Se este não existir devolve []
            hinosCarregados = Array.isArray(catalogo) ? catalogo : (catalogo.hinos || []);

            console.log('Hinos carregados: ' + hinosCarregados.length);

            if(hinosCarregados.length>0)
            {
                MontaIndice();
            }
            else{
                throw new Error('O arquivo do índice está vazio.');
            }

        } catch (erro) {
            mensagem.textContent = 'Não foi possível carregar o índice de hinos.' +  erro.message;
        }
    }

    
    //Tamanho fonte músicas
    function ChangeFontSize(n)
    {
        currentFontSize = n;

        
        document.documentElement.style.setProperty('--musicFontSize', (n+"rem"));

        //Fonte do índice (título) (quero que seja um pouco maior do que a dos outros)
        document.documentElement.style.setProperty('--indexFontSize', (n*1.5+"rem"));
    }


    function GetSortBy()
    {
        for(let i=0; i<radioSortBy.length;i++)
        {
            if(radioSortBy[i].checked)
            {
                return radioSortBy[i].value;
            }
        }      
    }

    function GetSortDirection()
    {
        for(let i=0; i<radioSortDirection.length;i++)
        {
            if(radioSortDirection[i].checked)
            {
                return radioSortDirection[i].value;
            }
        }      
    }


    //Cria linha do Índice
    function CreateIndexLine(nome, numero)
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
        td2.style ="font-size:var(--musicFontSize)";

        const link1 = document.createElement('a');
        //link1.setAttribute('href',('hino.html?Id=' + numero + '&sortBy=' + sortBy + '&sortDirection=' + sortDirection));
        link1.setAttribute('href',('hino.html?Id=' + numero));
        const linktxt= document.createTextNode(nome);
        link1.appendChild(linktxt);
        td2.appendChild(link1);
        tr.appendChild(td2);

        tableIndex.appendChild(tr);
    }

    //Monta ou remonta o Índice
    function MontaIndice()
    {
       console.log('Montando índice...');

        //Esvazia o índice
        tableIndex.textContent = '';

        //Ordena os dados conforme tipo e direção de ordenação
        sortBy = GetSortBy();
        sortDirection = GetSortDirection();
        SortData(sortBy, sortDirection);

        //Cria ou atualiza o localStorage com os parâmetros de ordenação
        SortParameters_Save();

        console.log('Ordenando por: ' + sortBy + ' - Direção: ' + sortDirection);

        //Popula o índice, linha por linha
        for(let i=0;i<hinosCarregados.length;i++)
        {
            CreateIndexLine(hinosCarregados[i].nome, hinosCarregados[i].numero);
        }

        console.log('Índice montado com sucesso!');
    }
   

    function PrintVersionAndDate()
    {
        //Imprime versão, data e hora
        const version = "1.0";

        var d = new Date();
        const time = d.getHours() + ":" + d.getMinutes();
        document.getElementById("current-date").textContent = "Versão: " + version + " - " + d.toLocaleDateString('en-GB') + " - " + time;
    }

    function RelatorioIndice()
    {
        const mensagem = document.getElementById('mensagem');
        let txt = '';
        for(let i=0;i<hinosCarregados.length;i++)
        {
            txt += "==========\n";
            txt += hinosCarregados[i].nome + '\n' + hinosCarregados[i].numero + '\n' + hinosCarregados[i].arquivo;

        }

        mensagem.textContent = txt;
    }

    //== DADOS ARMAZENADOS NO NAVEGADOR (Web Storage) ==========================================================

    function SortParameters_Load()
    {
        if(typeof(Storage) == "undefined") {
            console.log("Não é possível carregar parâmetros de ordenação. O navegador não suporta Web Storage.");
            
            return;       
        }
        
        //Obtém o tipo de ordenação, se não existir, mantém o padrão (1)
        let result = localStorage.getItem("sortBy");

        if(result != null)
        {
            sortBy = parseInt(result);

            //Atualiza interface
            radioSortBy[sortBy-1].checked = true;
        }

        //Obtém a direção da ordenação, se não existir, mantém o padrão (1)
        result = localStorage.getItem("sortDirection");

        if(result != null)
        {
            sortDirection = parseInt(result);

            //Atualiza interface
            radioSortDirection[sortDirection-1].checked = true;
        }
    }

    function SortParameters_Save()
    {
        if (typeof(Storage) !== "undefined") {
        localStorage.setItem("sortBy", sortBy);
        localStorage.setItem("sortDirection", sortDirection);
        } else {
            console.log("Não é possível salvar parâmetros de ordenação. O navegador não suporta Web Storage.");
        }
    }

    //====================================================================================================


    //Ordena array pelo nome do hino obedecendo a ordem passada (Caixa alta tem precedência sobre caixa baixa, por isso devemos igualá-las)
    function SortByName(sortOrder)
    {
        if(sortOrder == 1)
        {
            hinosCarregados = hinosCarregados.sort(function(a,b){
            let x = a.nome.toLowerCase();
            let y = b.nome.toLowerCase();
            if(x<y){return -1}
            if(x>y){return 1}
            
            return 0});
        }
        else{
            hinosCarregados = hinosCarregados.sort(function(a,b){
            let x = a.nome.toLowerCase();
            let y = b.nome.toLowerCase();
            if(x<y){return 1}
            if(x>y){return -1}
            
            return 0});
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
            SortByName(sortDirection);
        }
        else{
            SortByNumber(sortDirection);
        }

        //PRINT
        RelatorioIndice();
    }

    function InitFontSlider()
    {
        const startValue = parseFloat(rootStyles.getPropertyValue('--musicFontSize').trim());
        const indexStartValue = parseFloat(rootStyles.getPropertyValue('--indexFontSize').trim());

         //alert(indexStartValue);

        fontSizeSlider.value = startValue;  
    }


    //Obtém os parâmetros de ordenação salvos no navegador e atualiza a interface
    function LoadSortParameters()
    {
        if(typeof(Storage) == "undefined") {
            console.log("Não é possível carregar parâmetros de ordenação. O navegador não suporta Web Storage.");
            
            return;       
        }

        //Obtém o tipo de ordenação.Se não existir, mantém o padrão (1)
        let result = localStorage.getItem("sortBy");

        if(result != null)
        {
            sortBy = parseInt(result);

            //Atualiza interface
            radioSortBy[sortBy-1].checked = true;
        }

        //Obtém a direção da ordenação. Se não existir, mantém o padrão (1)
        result = localStorage.getItem("sortDirection");

        if(result != null)
        {
            sortDirection = parseInt(result);

            //Atualiza interface
            radioSortDirection[sortDirection-1].checked = true;
        }
    }

    //INICIALIZACAO
    window.onload = function() {

        //Carrega parâmetros de ordenação, caso já tenham sido salvos no navegador
        SortParameters_Load();

        PrintVersionAndDate();

        InitFontSlider();

        CarregaDados();
    };
