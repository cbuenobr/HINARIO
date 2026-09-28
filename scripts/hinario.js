
    const rootStyles = window.getComputedStyle(document.documentElement);
    const fontSizeSlider = document.getElementById("fontSizeRange");
    //const sortControl = document.getElementById("sortControl");



    //xxx TESTE RADIO BUTTONS xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    const radioSortBy = document.getElementsByName("sortBy");
    const radioSortDirection = document.getElementsByName("sortDirection");

    const btnSort = document.getElementById('btnSort');
    //btnSort.onclick = SortData;
    btnSort.addEventListener('click',(event)=>{SortData();});
    //XXXXXXX



    let table = document.getElementById("table-index");
    let rows = table.rows;

    let currentFontSize;
    let currentLineHeight;

    //EVENTOS
    //sortControl.addEventListener("change", (event)=>{SortData(event.target.value);});
    //directionControl.addEventListener("change", (event)=>{SortOrder(event.target.value);});


    
    fontSizeSlider.oninput = function()
    {
        ChangeFontSize(this.value);

        if(document.getElementById('report01') != null)
        {
            document.getElementById('report01').textContent = this.value;
        }        
    }

  
    async function carregarIndice() {

        const mensagem = document.getElementById('mensagem');

        try {
            const resposta = await fetch('../JSON/hinos.json', { cache: 'no-store' });

            //if (!resposta.ok) throw new Error('Não foi possível carregar hinos.json');
            if (!resposta.ok) throw resposta.error;

            const catalogo = await resposta.json();
            hinosCarregados = Array.isArray(catalogo) ? catalogo : (catalogo.hinos || []);
            //renderizarLista();

            mensagem.textContent = (hinosCarregados);
        } catch (erro) {
            mensagem.textContent = 'Não foi possível carregar o índice de hinos. <br>' + erro.name + "<br>" +  erro.message;
        }
    }
    
    //Tamanho fonte músicas
    function ChangeFontSize(n)
    {
        currentFontSize = n;

        
        document.documentElement.style.setProperty('--musicFontSize', (n+"rem"));

        //Fonte do índice (título) (quero que seja um pouco maior do que a dos outros)
        document.documentElement.style.setProperty('--indexFontSize', (n*1.5+"rem"));

        Print();
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

   
     function Print()
    {
        if(document.getElementById('report01') != null)
        {
            //document.getElementById('report01').textContent = " Fonte: " + currentFontSize + " rem  Espaçamento: " + currentLineHeight;


            //let count = 0;
            let text = "";

                //text += rows[i].textContent + "<br>";
                
            document.getElementById('report01').innerHTML = text;

        }
    }

    function PrintVersionAndDate()
    {
        //Imprime versão, data e hora
        const version = "1.0";

        var d = new Date();
        const time = d.getHours() + ":" + d.getMinutes();
        document.getElementById("current-date").textContent = "Versão: " + version + " - " + d.toLocaleDateString('en-GB') + " - " + time;

        alert("PrintVersionAndDate - time: " + time);
    }

    function SortByName(sortOrder)
    {
        let rowChildren1, rowChildren2;
        let songName1, songName2;
        let repeat = true;

        while (repeat)
        {
            repeat = false;

            for(let i=0;i<(rows.length - 1);i++)
            {             
                rowChildren1 = rows[i].children;
                rowChildren2 = rows[i+1].children;
                songName1 = "";
                songName2 = "";


                songName1 = rowChildren1[1].textContent;
                songName2 = rowChildren2[1].textContent;

                if(sortOrder == 1)
                {
                    if(songName1>songName2)
                    {
                        let temp = rows[i+1].innerHTML;
                        rows[i+1].innerHTML = rows[i].innerHTML;
                        rows[i].innerHTML = temp;

                        repeat = true;
                    }
                }
                else
                {
                    if(songName1<songName2)
                    {
                        let temp = rows[i+1].innerHTML;
                        rows[i+1].innerHTML = rows[i].innerHTML;
                        rows[i].innerHTML = temp;

                        repeat = true;
                    }
                }
            }
        }
    }


    function SortByNumber(sortOrder)
    {
        let rowChildren1, rowChildren2;
        let songNumber1, songNumber2;
        let repeat = true;
        
        console.log("sortOrder: " + sortOrder);

        while (repeat)
        {
            repeat = false;

            for(let i=0;i<(rows.length - 1);i++)
            {             
                rowChildren1 = rows[i].children;
                rowChildren2 = rows[i+1].children;
                songNumber1 = 0;
                songNumber2 = 0;

                songNumber1 = parseInt(rowChildren1[0].textContent);
                songNumber2 = parseInt(rowChildren2[0].textContent);

                if(sortOrder == 1)
                {
                    if(songNumber1>songNumber2)
                    {
                        let temp = rows[i+1].innerHTML;
                        rows[i+1].innerHTML = rows[i].innerHTML;
                        rows[i].innerHTML = temp;

                        repeat = true;
                    }
                }
                else
                {
                    if(songNumber1<songNumber2)
                    {
                        let temp = rows[i].innerHTML;
                        rows[i].innerHTML = rows[i+1].innerHTML;
                        rows[i+1].innerHTML = temp;

                        repeat = true;
                    }
                }
            }
        }
    }

    //Parâmetros da ordenação
    function SortData()
    {
        let sortBy = GetSortBy();
        let sortDirection = GetSortDirection();

        if(sortBy == 1)
        {
            SortByName(sortDirection);
        }
        else{
            SortByNumber(sortDirection);
        }
    }

    function InitFontSlider()
    {
        const startValue = parseFloat(rootStyles.getPropertyValue('--musicFontSize').trim());
         const indexStartValue = parseFloat(rootStyles.getPropertyValue('--indexFontSize').trim());

         //alert(indexStartValue);

        fontSizeSlider.value = startValue;  
        
        //alert(document.getElementById("indexHeader").style.fontSize);

        //const defaultHeaderSize = parseFloat(rootStyles.getPropertyValue('--indexFontSize').trim());

        //alert(defaultHeaderSize);
        //alert(document.getElementById("indexHeader").style.fontSize);

        //Título do índice
        //document.getElementById("indexHeader").style.fontSize = var(--musicFontSize);
    }

    //INICIALIZACAO
    window.addEventListener("DOMContentLoaded", function() {
        PrintVersionAndDate();
        InitFontSlider();

        carregarIndice();
    });
