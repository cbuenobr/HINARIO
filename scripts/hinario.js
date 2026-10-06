
    const rootStyles = window.getComputedStyle(document.documentElement);

    //Slider de tamanho de fonte
    const fontSizeSlider = document.getElementById("fontSizeRange");
    fontSizeSlider.oninput = function()
    {
        ChangeFontSize(this.value);  
    }

    //Controles de ordenação ----------------------------------------------
    const radioSortBy = document.getElementsByName("sortBy");

    const radioSortByName = document.getElementById("sortByName");
    const radioSortByNumber = document.getElementById("sortByNumber");
    radioSortByName.addEventListener('change', () => GetSortBy(1));
    radioSortByNumber.addEventListener('change', () => GetSortBy(2));

    const arrowDown = document.getElementById("arrowDown");
    const arrowUp = document.getElementById("arrowUp");
    arrowDown.addEventListener('click', () => GetSortDirection(1));
    arrowUp.addEventListener('click', function() {GetSortDirection(2)});
    //-----------------------------------------------------------

    const themeModeRadios = document.getElementsByName("theme");
    
    const tableIndex = document.getElementById("table-index");    


    let currentFontSize;
    let hinosCarregados;
    let sortBy = 1;
    let sortDirection = 1;


   //FUNÇÕES ---------------------------------------------------
  
    async function Catalogo_Carrega() {

        const mensagem = document.getElementById('mensagem');

        try {
			console.log("CarregarDados");

            if (window.location.protocol === 'file:') {
                throw new Error('Este aplicativo deve ser aberto por um servidor local. Execute "python -m http.server" e abra http://localhost:8000');
            }

            const resposta = await fetch('./json/hinos.json', { cache: 'no-store' });

            if (!resposta.ok) throw new Error('Não foi possível carregar hinos.json (erro ' + resposta.status + ')');

            const catalogo = await resposta.json();

            //Se o json for um array usa "catalogo". Se houver um membro que não é array, procura "catalogo.hinos". Se este não existir devolve []
            hinosCarregados = Array.isArray(catalogo) ? catalogo : (catalogo.hinos || []);

            console.log('Hinos carregados: ' + hinosCarregados.length);

            if(hinosCarregados.length>0)
            {
                Indice_Popula();
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

        console.log("ChangeFontSize() recebeu: " + n);
        
        document.documentElement.style.setProperty('--musicFontSize', (n+"rem"));

        //Fonte do índice (título) (quero que seja um pouco maior do que a dos outros)
        document.documentElement.style.setProperty('--indexFontSize', (n*1.5+"rem"));

        //Salva o tamanho da fonte no localStorage
        Parameters_FontSize_Save();
    }


    function GetSortBy(n)
    {
        if(sortBy != n)
        {
            sortBy = n;
            Indice_Popula();
        }
    }

    function GetSortDirection(n)
    {
        if(sortDirection != n)
        {
            sortDirection = n;

            Indice_Popula();
        }
    }



    //Cria linha do Índice
    function Indice_CriaLinha(id, nome, numero)
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
        link1.setAttribute('href',('hino.html?Id=' + id));
        const linktxt= document.createTextNode(nome);

        link1.appendChild(linktxt);
        td2.appendChild(link1);
        tr.appendChild(td2);

        tableIndex.appendChild(tr);
    }

    //Monta ou remonta o índice
    function Indice_Popula()
    {
       //console.log('Montando índice...');
       //console.log('Recebi: ' + sortBy + ' - Direção: ' + sortDirection);
       
        //Esvazia o índice
        tableIndex.textContent = '';

        //Ordena os dados conforme tipo e direção de ordenação
        SortData(sortBy, sortDirection);

        //Cria ou atualiza o localStorage com os parâmetros de ordenação
        Parameters_Sort_Save();

        //console.log('Ordenando por: ' + sortBy + ' - Direção: ' + sortDirection);

        //Popula o índice, linha por linha
        for(let i=0;i<hinosCarregados.length;i++)
        {
            Indice_CriaLinha(hinosCarregados[i].id, hinosCarregados[i].nome, hinosCarregados[i].numero);
        }

        console.log('Índice montado com sucesso!');
    }
       
    function InitFontSlider()
    {
        const startValue = parseFloat(rootStyles.getPropertyValue('--musicFontSize').trim());
        const indexStartValue = parseFloat(rootStyles.getPropertyValue('--indexFontSize').trim());

        fontSizeSlider.value = startValue;  
    }

    function PrintVersionAndDate()
    {
        //Imprime versão, data e hora
        const version = "1.0";

        var d = new Date();
        document.getElementById("current-date").textContent = "Versão: " + version + " - " + d.toLocaleDateString('en-GB');
        /*      
        const time = d.getHours() + ":" + d.getMinutes();
        document.getElementById("current-date").textContent = "Versão: " + version + " - " + d.toLocaleDateString('en-GB') + " - " + time; */
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

            //Atualiza interface
            radioSortBy[sortBy-1].checked = true;
        }

        //Obtém a direção da ordenação, se não existir, mantém o padrão (1)
        result = localStorage.getItem("sortDirection");

        if(result != null)
        {
            sortDirection = parseInt(result);
        }
    }

    function Parameters_Sort_Save()
    {
        if (typeof(Storage) !== "undefined") {
        localStorage.setItem("sortBy", sortBy);
        localStorage.setItem("sortDirection", sortDirection);
        } else {
            console.error("Não é possível salvar parâmetros de ordenação. O navegador não suporta Web Storage.");
        }
    }

    function Parameters_FontSize_Load()
    {
        if(typeof(Storage) != "undefined") 
        {
            let storedFontSize = localStorage.getItem("musicFontSize");

            if(storedFontSize != null) {
                ChangeFontSize(parseFloat(storedFontSize));

                console.log("Tamanho da fonte carregado: " + storedFontSize);
            }
        }
    }

    function Parameters_FontSize_Save()
    {
        if (typeof(Storage) !== "undefined") {
            localStorage.setItem("musicFontSize", currentFontSize);}
    }


    function Parameters_Theme_Load()
    {
        if(typeof(Storage) != "undefined") 
        {
            let storedThemeMode = localStorage.getItem("themeMode");

            if(storedThemeMode != null) {

                let themeRadio = document.querySelector(`input[name="theme"][value="${storedThemeMode}"]`);
                if (themeRadio) {
                    themeRadio.checked = true;
                    ThemeMode_Toggle({ target: themeRadio });
                }
            }
        }
    }

    function Parameters_Theme_Save(themeMode)
    {
        if (typeof(Storage) !== "undefined") {  

            localStorage.setItem("themeMode", themeMode);

            console.log("Modo de tema salvo: " + themeMode);
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
        //RelatorioIndice();
    }

    function ThemeMode_Toggle(e) {
        let element = document.body;

        if(e.target.value == "1")
        {   
            element.classList.remove("dark-mode");         
            element.classList.toggle("light-mode");
        }
        else if(e.target.value == "2")
        {
            //document.body.classList.remove("dark-mode");
            //Parameters_Theme_Save("light");
            element.classList.remove("light-mode");
            element.classList.toggle("dark-mode");
        }

        //Atualiza o localStorage com o modo de tema selecionado
        Parameters_Theme_Save(e.target.value);
    }

    //SIDE MENU --------------------------------------------------
    function openNav() {
    //document.getElementById("mySidenav").style.width = "250px";
    document.getElementById("mySidenav").style = "transform: translateX(0)"; 
    }

    function closeNav() {
    //document.getElementById("mySidenav").style.width = "0";
    document.getElementById("mySidenav").style = ""; 
    }

    function OpenSortMenu()
    {
        //document.getElementById("sortMenu").style.width = "250px";
        document.getElementById("sortMenu").style = "transform: translateX(0)"; 
        closeNav();
    }

    function CloseSortMenu()
    {
        //document.getElementById("sortMenu").style.width = "0";
        document.getElementById("sortMenu").style = "";
    }

    function OpenFontSizeMenu()
    {
        //document.getElementById("fontSizeMenu").style.width = "250px";
        document.getElementById("fontSizeMenu").style = "transform: translateX(0)"; 
        closeNav();
    }

    function CloseFontSizeMenu()
    {
        //document.getElementById("fontSizeMenu").style.width = "0";
        document.getElementById("fontSizeMenu").style = "";
    }
    //---------------------------------------------------------------

    //INICIALIZACAO
    window.onload = function() {

        //Carrega parâmetros, caso já tenham sido salvos no navegador
        Parameters_FontSize_Load();

        Parameters_Sort_Load();

        Parameters_Theme_Load();

        PrintVersionAndDate();

        InitFontSlider();

        Catalogo_Carrega();
    };
