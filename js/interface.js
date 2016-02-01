
function save_local_temp()
{
  save_local("temp");
  aff_etiq('<span class="icon icon-floppy"></span> Sauvegarde temporaire',2000);
};

function aff_etiq(txt,t)
{
  document.getElementById("info_save_temp").innerHTML = txt; 
  document.getElementById("info_save_temp").className = "show";
  setTimeout('document.getElementById("info_save_temp").className = "mask"',t);
};

function load_local_data(name)
{
  // création d'un nouvelle série temporaire
  var serieTemp = JSON.parse(localStorage.getItem(name));
  // et d'un nouveau tableau de volées temporaire
  var voleeTemp = serieTemp.volees;
  
  // création d'une nouvelle session avec les paramètres
  document.getElementById("nb_volee").value = serieTemp.nb_v;
  document.getElementById("nb_fl_volee").value = serieTemp.nb_f;
  document.getElementById("distance").value = serieTemp.dist;
  document.getElementById("diam_blason").value = serieTemp.blason;
  document.getElementById("diam_tube").value = serieTemp.tube;
  if(serieTemp.modeX == true)
    document.getElementById("mode_x").checked = "checked";
  if(serieTemp.nb_zone_spot != 10)
  {
    document.getElementById("nzspot"+serieTemp.nb_zone_spot).checked=true;
    document.getElementById("mode_spot").checked = true;
  }
  valid_session();

  document.getElementById("num_volee").innerHTML = serieTemp.volees.length+1;

  if(serieTemp.volees.length == nb_volee)
  {
    //console.debug("La série est complète");
    document.getElementById("saisie").innerHTML = "";
    document.getElementById("gotosaisie").style.display = "none";
    visu("tab_score");
    visu_target(0);
    document.getElementById("but_saisie").style.display = "none";
  }
  serie = serieTemp;

  n_volee = serie.volees.length;
  n_fl = 0;
  volee = new Array;

  // il faut recréer les volées au complet pour avoir accès aux méthodes
  for ( var v=0 ; v<serie.volees.length ; v++)
  {
    flTemp = new Array;
    for (var f=0 ; f<nb_fl_volee ; f++)
       flTemp[f] = new arrow(voleeTemp[v][f].x,voleeTemp[v][f].y,voleeTemp[v][f].t,voleeTemp[v][f].b,voleeTemp[v][f].d,voleeTemp[v][f].n); 
       
    volee[v] = flTemp;
    volee[v].tot =  function() // méthode pour calculer le total de la volée
                          { 
                            var tot=0;
                            for (var i=0 ; i<this.length ; i++)
                              tot+=this[i].v();
                            return tot;
                          };
  }
  serie.volees = volee;
  for (var v=0 ; v<serie.volees.length ; v++)
  {
    var tab_tri=serie.volees[v].slice();
    tab_tri.sort(function(a,b){
                                if(a.X()==false && b.X()==true)
                                  return -1;
                                if(a.X()==true  && b.X()==false)
                                  return 1;
                                return 0;
                              });
    tab_tri.sort(function(a,b){return a.v()-b.v()}).reverse();

    for (var f=0 ; f<serie.volees[v].length ; f++)
    {
      document.getElementById("tab_"+v+"_"+f).innerHTML = tab_tri[f].v();
      if(tab_tri[f].X() == true)
        document.getElementById("tab_"+v+"_"+f).innerHTML += "+";
    }
    document.getElementById("result_"+v).innerHTML = volee[v].tot();
  }
  document.getElementById("result_total").innerHTML = serie.tot;
  
  
  commentaire();
  color_marque(userp.color_marque);

  if(name != "temp")
  {
    isave.actual_key=name;
    isave.actual_name=serieTemp.id;
    isave.is_save=true;
    gestion_save_name();
  }
};

function save_local(name_auto)
{
  if(typeof(name_auto) == "undefined") // demande pour le nom de série
  {
    if(isave.actual_name != "sans_nom")
      var save_as = confirm("Voulez-vous remplacer la série nommée « "+isave.actual_name+" » ?");
    else
      var save_as = false;
      
    if(save_as == false)
      var name = prompt("Nom de la série",date_format(new Date(),"dayhour")); // demande du nom de la série avec proposition d'un nom avec une date
    else
      var name = isave.actual_name;

    if (name == null) // si on annule la deuxième question
      return;  // on arrête tout
    
    if(name != isave.actual_name) // si le nom demandé est différent
      isave.actual_key=date_format(new Date(),"dayhour"); // il faut changer la clé pour pas écraser l'ancienne sauvegarde

    isave.actual_name = name;
    isave.is_save = true;
  }
  else
  {
    var name=name_auto;
    if(isave.actual_name == "")
      isave.actual_name="sans_nom";
  }

  serie.id = isave.actual_name;
  serie.datemod=new Date().getTime(); // date au format timestamp unix de la dernière modification
  serie.volees = volee;

  // suppression de la sauvegarde temporaire et sauvegarde de la série sous le nom donné (si c'est une temporaire on la recrée')
  if(localStorage.getItem("temp") != null)
    localStorage.removeItem("temp");

  if(name_auto=="temp")
    localStorage.setItem("temp",JSON.stringify(serie));
  else if(isave.actual_key != "")
    localStorage.setItem(isave.actual_key,JSON.stringify(serie));
  else
    localStorage.setItem(date_format(new Date(),"dayhour"),JSON.stringify(serie));

  gestion_save_name();
};

function gestion_save_name()
{
  document.getElementById("name_session").innerHTML=isave.actual_name;
  if(isave.is_save == false)
    document.getElementById("name_session").innerHTML+="*";
};

function isASession(k)
{
  var t=new Array("userp","user","infoapp","temp","sync");
  if(t.indexOf(localStorage.key(k)) != -1)
    return false;
  else
    return true;
};

/*function save_network(act)
{
  if(act=="upload")
  {
    console.debug('save:'+act);
    
    if(localStorage.getItem("sync") == null)
    {
      sync();
      return;
    }

    var nb_session = 0;
    for(var i=0;i<localStorage.length;i++)
      if(isASession(i) == true)
        nb_session++;

    for(var i=0;i<localStorage.length;i++)
    {
      if(isASession(i) == true)
      {
        //request()


      }
    }
  }
  if(act=="download")
  {
    console.debug('save:'+act);
  }
};*/

function user_pref(a)
{
  if(a == "save")
  {
    userp.diam_tube = diam_tube;
    userp.hc = high_contrast;
    userp.ratio = ratio;
    userp.nb_zone = nb_zone;
    userp.auto_save=document.getElementById("save_auto").checked;
    userp.chrtemps=c.temps;
    userp.chrpretemps=c.pretemps;
    userp.chrmitemps=c.mitemps;
    userp.color_marque=document.getElementById("color_marque").checked;
    userp.mire=document.getElementById("aff_mire").checked;
    localStorage.setItem('userp',JSON.stringify(userp));
  }
  if(a == "restore")
  {
    userp = JSON.parse(localStorage.getItem('userp'));
    document.getElementById("change_style").checked = userp.hc;
    document.getElementById("diam_tube").value = userp.diam_tube;
    high_contrast = userp.hc;
    ratio = userp.ratio;
    nb_zone = userp.nb_zone;
    c.temps=userp.chrtemps;
    c.pretemps=userp.chrpretemps;
    c.mitemps=userp.chrmitemps;
    document.getElementById("save_auto").checked = userp.auto_save;
    document.getElementById("color_marque").checked = userp.color_marque;
    document.getElementById("aff_mire").checked = userp.mire;
    target_view(userp.nb_zone);
    color_marque(userp.color_marque);
    aff_mire(userp.mire);
    change_style();
    c.reset();
  }
};



function visu(el)
{
  document.getElementById(el_visible).style.display = "none";
  visu_analyse_el(el);

  el_visible = el;
  document.getElementById(el).style.display = "block";
};

function visu_analyse_el(toEl)
{
  if(document.getElementById("main_target")==null || (el_visible=="zoom" && toEl=="saisie") || (el_visible=="saisie" && toEl=="zoom"))
  {
    return;
  }
  if(toEl=="analyse")
  {
    document.getElementById("zone_fleche").style.display="block";
    document.getElementById("zone_reussite").style.display="block";
    document.getElementById("moy_fleche").style.display="block";

    for(var v=0;v<serie.nb_v;v++) // sauvegarde des flèches se trouvant sur la saisie et restauration de celles d'analyse
    {
      fl_saisie_save[v]=[];
      for(var f=0;f<serie.nb_f;f++)
      {
        if(document.getElementById("target_fl"+v+"_"+f).style.display=="block")
          fl_saisie_save[v][f]=true;
        else
          fl_saisie_save[v][f]=false;
        document.getElementById("target_fl"+v+"_"+f).style.display="none";

        if(tab_display[v][f] == true)
          document.getElementById("target_fl"+v+"_"+f).style.display="block";
        else
          document.getElementById("target_fl"+v+"_"+f).style.display="none";
      }
    }
    draw_disp();
    zone_reussite();
    moyenne_f();
  }
  else
  {
    document.getElementById("zone_fleche").style.display="none";
    document.getElementById("zone_reussite").style.display="none";
    document.getElementById("dispersion").style.display="none";
    document.getElementById("moy_fleche").style.display="none";

    if(fl_saisie_save.length<1) return;
    for(var v=0;v<serie.nb_v;v++) //restauration des flèches de la saisie
    {
      for(var f=0;f<serie.nb_f;f++)
      {
        document.getElementById("target_fl"+v+"_"+f).style.display="none";       
        if(fl_saisie_save[v][f] == true)
          document.getElementById("target_fl"+v+"_"+f).style.display="block";
      }
    }

  }
};

function aff_menu()
{
  if(document.getElementById('menu').style.left == '0%')
  {
    document.getElementById('menu').style.left='-100%';
    setTimeout('document.getElementById("menu").style.display="none"',500);
  }
  else 
  {
    document.getElementById('menu').style.display="block";
    
    if(el_visible == "options") // sauvegarde des préférence quand on quitte la page des options
      user_pref("save");

    setTimeout('document.getElementById("menu").style.left="0%"',100);
  }
};
function visu_target(aff)
{
  if (aff == 1)
  {
    document.getElementById("target").style.display="block";
    target_view(nb_zone);
  }
  else
    document.getElementById("target").style.display="none";
};


function change_style()
{
  high_contrast=document.getElementById("change_style").checked;
  if(high_contrast == false)
  {
    document.getElementById("style_name").href = "css/low_contrast.css";
    voile = "rgba(20,20,20,0.6)";
  }
  else
  {
    document.getElementById("style_name").href = "css/high_contrast.css";
    voile = "rgba(235,235,235,0.6)";
  }
};

function commentaire(n,consult)
{
  if (n != null)
  {
    var tmp_com=serie.com[n];
    if(consult == null)
    {
      if (confirm("Commentaire "+(n+1)+" : "+serie.com[n]+"\nVoulez vous le modifier ?") == true)
      {
        serie.com[n] = prompt("Modifiez le commentaire",serie.com[n]);
        if(tmp_com != serie.com[n])
        {
          if(document.getElementById("save_auto").checked == true)
          {
            if(isave.actual_name == "sans_nom" || isave.actual_name == "")
            {
              isave.is_save = false;
              save_local_temp();
            }
            else
            {
              isave.is_save = true;
              save_local(isave.actual_name);
            }
          }
          else
            isave.is_save = false;
            
          gestion_save_name();
        }
      }
    }
    else
      alert('Commentaire '+(n+1)+' : '+serie.com[n]);
  }
  // indication si il y a un commentaire sur la volée
  for (var v=0 ; v<nb_volee ; v++)
  {
    if(serie.com[v] != "")
    {
      document.getElementById("com_"+v).className = "com_ok";
    }
    else
    {
      document.getElementById("com_"+v).className = "no_com";    
    }
  }

};

function adapt2viewport()
{
  var el_target = document.getElementById("target");
  var el_zoom = document.getElementById("zoom");
  
  var W = window.innerWidth;
  var H = window.innerHeight;
  // adaptation de la taille du texte
  document.getElementsByTagName("body")[0].style.height = H-1+"px";
  document.getElementById("local").style.height = H-1+"px";
  
  if (W > H) // orientation horizontale
  {
    el_target.width = H;
    el_target.height = H;
    el_target.style.width = H+"px";
    el_target.style.height = H+"px";
    el_target.style.left = W-H+"px";
    el_target.style.top = "0px";
    targetW = H;
    targetH = H;
    targetX = W-H;
    targetY = 0;

    var marge=Math.round(H*0.03);
    el_zoom.width = W-H-marge;
    el_zoom.height = H;
    el_zoom.style.width = W-H-marge+"px";
    el_zoom.style.height = H+"px";
    el_zoom.style.left = "0px";
    el_zoom.style.top = "0px";
    zoomX=0;
    zoomY=0;
    zoomH=H;
    zoomW=W-H-marge;

    document.getElementsByTagName("body")[0].style.fontSize = Math.round(H/(1.7*ratio))+"%";
    document.getElementsByTagName("body")[0].style.width="100%";
    document.getElementById("saisie").style.width=(W-H-marge)+"px";
    document.getElementById("analyse").style.width=(W-H-marge)+"px";
  }
  else // orientation verticale
  {
    el_target.width = W;
    el_target.height = W;
    el_target.style.width = W+"px";
    el_target.style.height = W+"px";
    el_target.style.left = "0px";
    el_target.style.top = H-W+"px";
    targetW = W;
    targetH = W;
    targetX = 0;
    targetY = H-W;

    var marge=Math.round(W*0.03);
    el_zoom.width = W;
    el_zoom.height = H-W-marge;
    el_zoom.style.width = W+"px";
    el_zoom.style.height = H-W-marge+"px";
    el_zoom.style.paddingLeft = "0";
    el_zoom.style.paddingTop = "0";
    zoomX=0;
    zoomY=0;
    zoomH=H-W-marge;
    zoomW=W;

    document.getElementsByTagName("body")[0].style.fontSize = Math.round(H/(2*ratio))+"%";
    document.getElementsByTagName("body")[0].style.width="100%";
    document.getElementById("saisie").style.width="100%";
    document.getElementById("analyse").style.width="100%";

  }

  if(document.getElementById("center_zoom_target"))
  {
    //recentrage du point_arrow
    document.getElementById("point_arrow").setAttribute("cx",zoomW/2);
    document.getElementById("point_arrow").setAttribute("cy",zoomH/2);
    document.getElementById("mirev").setAttribute("x1",zoomW/2);
    document.getElementById("mirev").setAttribute("x2",zoomW/2);
    document.getElementById("mireh").setAttribute("y1",zoomH/2);
    document.getElementById("mireh").setAttribute("y2",zoomH/2);
    //recentrage du zoom_target
    document.getElementById("center_zoom_target").setAttribute("transform","matrix(1,0,0,1,"+(zoomW/2)+","+(zoomH/2)+")");
    target_view(nb_zone);
  }
  if(document.getElementById("main_target"))
  {
    document.getElementById("main_target").setAttribute("width",targetW);
    document.getElementById("main_target").setAttribute("height",targetH);
    var scale=(10/nb_zone)/1000*targetW;
    document.getElementById("center_target").setAttribute("transform","matrix("+scale+",0,0,"+scale+","+targetW/2+","+targetH/2+")");
  }
};
function local_visu(el)
{
   var bouton = 'icon icon-plus-squared-alt';
   if (document.getElementById(el).style.display == "block")
   {
     document.getElementById(el).style.display = "none";
     bouton = 'icon icon-minus-squared-alt';
   }
   else
     document.getElementById(el).style.display = "block";
     
   return bouton;
};
function ialert(content)
{
  document.getElementById("info_in").innerHTML = content;
  aff_info()
};
function aff_info()
{
  if(document.getElementById("info").style.left == '0%')
  {
    document.getElementById("info").style.left = '-100%';
    setTimeout('document.getElementById("info").style.display="none"',200);
  }
  else
  {
    document.getElementById("info").style.display="block";
    setTimeout('document.getElementById("info").style.left = "0%"',100);
  } 
};

function help()
{
  ialert("<h3>AIDE</h3>"+eval("help_"+el_visible));
};

function about()
{
  ialert('<h3>À propos</h3>'
        +'<div class="about"><p>'+infoapp.name+' <span style="color:#dc322f;font-size:1.5em" class="icon icon-sago"></span><br>'
        +'Version '+infoapp.version+' '+infoapp.datecode+'<br>'
        +'Contact : '+infoapp.mail+'</p>'
        +'<hr>'
        +'<p>Information sur l’appareil<br/>'
        +navigator.userAgent+'<br>'
        +'Résolution : '+window.innerWidth+'×'+window.innerHeight+'</p>'
        +'<hr>'
        +'<p>'+infoapp.name+' est une application qui fonctionne dans un navigateur et est destiné à la saisie de séries d’entrainement sur cible anglaise.</p><p>Si votre navigateur gère le cache des pages web, '+infoapp.name+' restera disponible même si vous n’avez pas de connexion internet. Les enregistrements que vous pourrez faire sont stockées dans votre cache de navigateur. Si vous le supprimez, les sauvegardes seront supprimées.</p>'
        +'<p>'+infoapp.dev+'</p></div>'
        );
};

/***** sauvegarde de fichiers *****/

//http://jsfiddle.net/koldev/cw7w5/
var saveData = (function () {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    return function (data, fileName) {
        var json = JSON.stringify(data),
            blob = new Blob([json], {type: "octet/stream"}),
            url = (window.URL || window.webkitURL).createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        a.click();
        (window.URL || window.webkitURL).revokeObjectURL(url);
    };
}());
function save_as_file()
{
  var filename="sago_"+date_format(new Date,"dayhour")+'.json';

  var save_file=[];
  for(var i=0;i<localStorage.length;i++)
  {
    if(isASession(i) == true)
    {
      save_file[i]= {
                    data:JSON.parse(localStorage.getItem(localStorage.key(i))),
                    key:localStorage.key(i)
                    };
    }
  }
  saveData(save_file,filename);
};

/***** lecture de fichier *****/

function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object

    // files is a FileList of File objects. List some properties.
    var output = [];
    for (var i = 0, f; f = files[i]; i++) {
      output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
                  f.size, ' bytes, last modified: ',
                  f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
                  '</li>');
    }
    document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
  };


var readFile="";
function readBlob(opt_startByte, opt_stopByte) {

    var files = document.getElementById('files').files;
    if (!files.length) {
      ialert('Vous devez selectionner un fichier !');
      return;
    }

    var file = files[0];
    var start = parseInt(opt_startByte) || 0;
    var stop = parseInt(opt_stopByte) || file.size - 1;

    var reader = new FileReader();

    // If we use onloadend, we need to check the readyState.
    reader.onloadend = function(evt) {
      if (evt.target.readyState == FileReader.DONE) { // DONE == 2
        var readJson=evt.target.result;
        if (/^[\],:{}\s]*$/.test(readJson.replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, '')))
        {
          //the json is ok
          readJson=JSON.parse(readJson);
          readFile=readJson;
          if(typeof(readJson[0].data) == "undefined" || typeof(readJson[0].key) == "undefined" || typeof(readJson) != "object" )
            ialert("Le fichier selectionné ne correspond pas à un fichier de sauvegarde.");
          else
          {
            var n=0;
            for(var i=0;i<localStorage.length;i++)
            {
              if(isASession(i))
                n++;
            }
            var info="<p>Votre fichier contient "+readJson.length+" sauvegarde(s).</p>";
            info +="<p>sauvegarde(s) locale(s) : "+n+"</p>";

            var plus_recent=[];
            var r=0;
            for(var i=0; i<readJson.length;i++)
            {
              if(localStorage.getItem(readJson[i].key) != null)
              {
                if(JSON.parse(localStorage.getItem(readJson[i].key)).datemod > readJson[i].data.datemod)
                  plus_recent[r++]=i;

                console.debug(JSON.parse(localStorage.getItem(readJson[i].key)).datemod+'---'+readJson[i].data.datemod);
              }
            }
            info+="<p>"+plus_recent.length+" sauvegarde(s) locale(s) sont plus récentes que celles du fichier.</p>";
            document.getElementById("info_file").innerHTML=info;
            console.debug(plus_recent);
            
            if(plus_recent.length>1)
            {
              if(confirm(plus_recent.length+' sauvegardes sont plus récentes localement que celles sauvegardées.\nVoulez-vous tout de même les importer ?') == true)
                plus_recent=[];
            }
            else
            {
            if(plus_recent.length>0)
              if(confirm(plus_recent.length+' sauvegarde est plus récente localement que celles sauvegardées.\nVoulez-vous tout de même l’ importer ?') == true)
                plus_recent=[];
            }

            for(var i=0;i<readJson.length;i++)
            {
              if(plus_recent.indexOf(i) == -1) // on exécute que si c'est une sauvegarde qui n'existe pas ou qui est plus récentes
              {
                localStorage.setItem(readJson[i].key,JSON.stringify(readJson[i].data))
              }
            }

          }
        }
        else
        {
          //the json is not ok
          ialert("Le type de fichier selectionné n’est pas bon !");
        }
      }
    };

    var blob = file.slice(start, stop + 1);
    reader.readAsBinaryString(blob);
};    

function date_format(date,a)
{
  if(typeof(date) == "indefined")
    return "(non défini)";
    
  date=new Date(date);
  var day = ( "0" + date.getDate()).slice(-2);
  var month = ("0"+ (1+date.getMonth())).slice(-2);
  var year = date.getFullYear();
  var hours = ( "0" + date.getHours()).slice(-2);
  var minutes = ( "0" + date.getMinutes()).slice(-2);
  var secondes = ( "0" + date.getSeconds()).slice(-2);
  if(a=="hour")
    return(hours+":"+minutes);
  if(a=="day")
    return(day+"/"+month+"/"+year);
  if(a=="dayhour")
    return(year+month+day+hours+minutes+secondes);

  return(day+"/"+month+"/"+year+" "+hours+":"+minutes);
};

function calendrier(a,m)
{
  var now = new Date();
  nowId = now.getFullYear()+"_"+now.getMonth()+"_"+now.getDate();
  var ladate=new Date();
  if(a!=null || m!=null)
    ladate.setFullYear(a,m);
  else
  {
    var a=ladate.getFullYear();
    var m=ladate.getMonth();
  }
  
  first_day=new Date(a,m,1).getDay();
  var dayCount=2-first_day;
  if(first_day == 0)
    dayCount-=7;
  
  var MaxCount=(new Date(a, m+1, 0)).getDate()+1;

  var month=new Array("Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre");
  var titre=month[m]+" "+a;
  
  var prev_m = m-1;
  var prev_a = a;
  if(prev_m<0)
  {
    prev_a = a-1;
    prev_m = 11;
  }
  var next_m = m+1;
  var next_a = a;
  if(next_m > 11)
  {
    next_a = a+1;
    next_m = 0;
  }

  var calendar='<table class="calendar">';
  calendar+='<tr><td onclick="calendrier('+prev_a+','+prev_m+')"><span class="icon icon-angle-double-left"></span></td><td colspan="5">'+titre+'</td><td onclick="calendrier('+next_a+','+next_m+')"><span class="icon icon-angle-double-right"></span></td></tr>';
  calendar+='<tr><td>Lu</td><td>Ma</td><td>Me</td><td>Je</td><td>Ve</td><td>Sa</td><td>Di</td></tr>';
  for(var l=1;l<7;l++)
  {
    calendar+="<tr>";
    for(var c=1;c<8;c++)
    {
      var id=a+'_'+m+'_'+dayCount;
      calendar+='<td';
      if(dayCount > 0 && dayCount<MaxCount)
        calendar+=' id="'+id+'" class="cellule">'+dayCount;
      else
        calendar += '>';
      dayCount++;
      calendar+='</td>';
    }
    calendar+="</tr>";
  }
  calendar+="</table>";

  calendar += '<p><button class="right" onclick="visu(\'save_restore_file\')"><span class="icon icon-download"> Sauvegarde</span></button><button class="right" onclick="calendrier()"><span class="icon icon-calendar"></span> Aujourd’hui</button></p>';

  document.getElementById("local").innerHTML=calendar;
  //marquage du jour courant si il existe dans le calendrier affiché
  if(document.getElementById(nowId))
    document.getElementById(nowId).className+=" today";
  list_local();
  upcal.func="calendrier("+a+","+m+")";
};



function list_local()
{
  var select_local = "";
  var date;
  for(var i=0, len=localStorage.length; i<len; i++)
  {
    var key = localStorage.key(i);
    // ne liste que les série qui ne sont pas temporaire
    if(isASession(i) == true)
    {
      var data = JSON.parse(localStorage[key]);
      date=new Date();
      date.setTime(data.date);
      var date_id=date.getFullYear()+"_"+date.getMonth()+"_"+date.getDate();
      if(document.getElementById(date_id))
      {
        document.getElementById(date_id).className+=" save_exist";
        document.getElementById(date_id).addEventListener("click",function(){list_from_date(this.id)});
      }
    }
  }
};

function list_from_date(d)
{
  var date;
  var list_sessions=[];
  var n=0;
  for(var i=0, len=localStorage.length; i<len; i++)
  {
    var key = localStorage.key(i);
    // ne liste que les série qui ne sont pas temporaire
    if(isASession(i) == true)
    {
      var data = JSON.parse(localStorage[key]);
      date=new Date();
      date.setTime(data.date);
      var date_id=date.getFullYear()+"_"+date.getMonth()+"_"+date.getDate();
      if(d == date_id)
      {
        list_sessions[n]=key;
        n++;
      }
    }
  }
  var select_local="";
  for(var i=0 ; i<list_sessions.length ; i++)
  {
    var data = JSON.parse(localStorage.getItem(list_sessions[i]));
    // premier élément pour récupérer la date
    if(i==0)
    {
      var month=new Array("Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre");
      var date=new Date();
      date.setTime(data.date);
      select_local += '<table class="calendar"><tr>';
      select_local += '<td onclick="calendrier('+date.getFullYear()+','+date.getMonth()+')"><span class="icon icon-angle-double-up"></span><span class="icon icon-calendar"></span></td>';
      select_local += '<td>'+date.getDate()+" "+month[date.getMonth()]+" "+date.getFullYear()+'</td>';
      select_local += '</tr></table>';
      select_local += "<div class=ovf>";

    }
    // création des éléments sauvegardés
    select_local +='<div class="local_storage">'
                   + '<div>'
                   + '<b> '+data.id+'</b><span class="right">'+date_format(data.date,'hour')+'</span>'
                   + '<br><div class="deroule">'
                   + '<button onclick="load_local_data(\''+list_sessions[i]+'\')"><span class="icon icon-folder-open"></span></button>'
                   + '<button onclick="if(confirm(\'Supprimer ?\') != false) {localStorage.removeItem(\''+list_sessions[i]+'\');list_from_date(\''+d+'\');}"><span class="icon icon-trash"></span></button>'    
                   + '<button class="right" onclick="local_visu(\''+list_sessions[i]+'_visu\')"><span class="icon icon-info"></span></button>'
                   + '</div></div>'
                   + '<div id="'+list_sessions[i]+'_visu" style="display:none">'
                   + "Tir à "+ data.dist +" m sur blason de " + data.blason + " cm.<br>" 
                   + data.nb_v+" Volées de "+data.nb_f+" flèches (Ø "+data.tube+"mm).<br>"
                   + "Total : " + data.tot + " points.<br>"
                   + "Dernière modification le "+date_format(data.datemod)
                   + "</div></div>";

  }
  select_local += '</div>';
  if(list_sessions.length==0) //remonte au calendrier si il n'y a plus d'éléments
    calendrier(parseInt(d.substr(0,4)),parseInt(d.substr(5,2)))
  else //sinon actualise la liste
    document.getElementById("local").innerHTML = select_local;
  upcal.func="list_from_date('"+d+"')";
};

var upcal = {
  update : function() { eval(this.func); },
  func : "calendrier()"
};

function aff_mire(c)
{
  if(document.getElementById("mire"))
  {
    if(c==true)
      document.getElementById("mire").style.display="block";
    else
      document.getElementById("mire").style.display="none";
  }
};

function color_marque(c)
{
    for(var v=0;v<n_volee;v++)
    {
      for(var f=0;f<nb_fl_volee;f++)
      {
        document.getElementById("tab_"+v+"_"+f).className="cellule";
        if(c==true)
        {
          document.getElementById("tab_"+v+"_"+f).className+=" col"+parseInt(document.getElementById("tab_"+v+"_"+f).innerHTML);
        }

      }
    }
};

var convertTouchEvent = function (ev) {
    var touch, ev_type, mouse_ev;
    touch = ev.targetTouches[0];
    ev.preventDefault();
    switch (ev.type) {
    case 'touchstart':
        // Make sure only one finger is on the target
        if (ev.targetTouches.length != 1) {
            return;
        }
        touch = ev.targetTouches[0];
        ev_type = 'mousedown';
        break;
    case 'touchmove':
        // Make sure only one finger is on the target
        if (ev.targetTouches.length != 1) {
            return;
        }
        touch = ev.targetTouches[0];
        ev_type = 'mousemove';
        break;
    case 'touchend':
        // Make sure only one finger is lifted from the target
        // TODO AND CHECK: check that targetTouches is empty?
        if (ev.changedTouches.length != 1) {
            return;
        }
        touch = ev.changedTouches[0];
        //ev_type = 'mouseup';
        ev_type = 'mouseup';
        break;
    default:
        return;
    }
    /* console.debug("fake " + ev_type); */
    mouse_ev = document.createEvent("MouseEvents");
    mouse_ev.initMouseEvent(
        ev_type, /* type of event */
        true, /* can bubble? */
        true, /* cancelable? */
        window, /* event view */
        0, /* mouse click count */
        touch.screenX, /* event's screen x-coordinate */
        touch.screenY, /* event's screen y-coordinate */
        touch.clientX, /* event's client x-coordinate */
        touch.clientY, /* event's client y-coordinate */
        ev.ctrlKey, /* control key was pressed? */
        ev.altKey, /* alt key was pressed? */
        ev.shiftKey, /* shift key was pressed? */
        ev.metaKey, /* meta key was pressed? */
        0, /* mouse button */
        null /* related target */
    );
    this.dispatchEvent(mouse_ev);
};

// déclaration des événements tactils utilisables
var touch2mouse = function (el) {
    el.addEventListener("touchstart", convertTouchEvent); // début d'un touché
    el.addEventListener("touchmove", convertTouchEvent);  // déplacement d'un contact
    el.addEventListener("touchend", convertTouchEvent);   // fin d'un touché
};

var c={
  temps:120,
  pretemps:10,
  preact:true,
  act:false,
  output_t:"chr_temps",
  output_pt:"chr_pretemps",
  outcolor:"chrono",
  colormod:2,
  classcolor:new Array('chr_vert','chr_orange','chr_rouge'),
  mitemps:30,
  encours_t:0,
  encours_pt:0,
  klax:new Audio('sound/klax.mp3'),
  bip:new Audio('sound/bip.mp3'),
  bellact:true,
  bellon:0,
  bipon:0,
  reset:function(){
    document.getElementById("chr_mode").className="mode_pretemps";
    this.preact=true;
    this.encours_t=this.temps;
    this.encours_pt=this.pretemps;
    this.act=false;
    this.colormod=2;
    this.bellon=0;
    document.getElementById("chr_span_play-pause").className="icon icon-play";
    document.getElementById("chr_param").innerHTML='<span class="icon icon-sliders"></span> '+c.pretemps+" - "+c.temps+" - "+c.mitemps;
    this.aff();
  },
  start:function(auto){
   
     
   if(auto != true)
   {
     this.act=!this.act;
     if(this.encours_t>0) this.bellon=1;
     if(this.act==true)
     {
       document.getElementById("chr_span_play-pause").className="icon icon-pause";
       this.bellon=1;
     }
     else
     {
       document.getElementById("chr_span_play-pause").className="icon icon-play";
       this.pause();
       this.colormod=2;
     }
   }
   
   if(this.act==true && this.preact==true)
   {

     if(this.encours_pt < 1)
       document.getElementById("chr_mode").className="mode_temps";
     else
       document.getElementById("chr_mode").className="mode_pretemps";

     if(this.encours_pt==0)
     {
       this.preact=false;
       this.act=true;
       this.bellon=1;
     }
     else
     {
       this.encours_pt=Math.round(this.encours_pt*10-1)/10;
     }
   }   

   if(this.act==true && this.preact==false)
   {
     document.getElementById("chr_mode").className="mode_temps";
     if(this.encours_t==0)
     {
       this.pause();
       this.bellon=2;
       this.colormod=2;
     }
     else
     {
       this.encours_t=Math.round(this.encours_t*10-1)/10;
       if(this.encours_t == this.mitemps)
         this.bipon=1;

       if(this.encours_t < this.mitemps)
       {
         this.colormod=1;
         if(this.encours_t%10==0 && this.encours_t>0)
           this.bipon=1;
         if(this.encours_t%1==0 && this.encours_t>0 && this.encours_t<10 && this.bipon==0)
           this.bipon=1;
       }
       else
         this.colormod=0;
     }
   }
   if(this.act==true)
     setTimeout("c.start(true)",100);
    this.aff();
  },
  pause:function(){
    this.act=false;
    if(this.encours_t==0)
      return;
    this.preact=true;
    this.encours_pt=this.pretemps;
    document.getElementById("chr_mode").className="mode_pretemps";
  },
  aff:function(){
    if(document.getElementById(this.output_t))
      document.getElementById(this.output_t).innerHTML=this.encours_t.toFixed(1)+'”';
    if(document.getElementById(this.output_pt))
      document.getElementById(this.output_pt).innerHTML=this.encours_pt.toFixed(1)+'”';
    if(document.getElementById(this.outcolor))
      document.getElementById(this.outcolor).className=this.classcolor[this.colormod];

    if(this.bellon > 0 && this.bellact==true)
      for(var i=0;i<this.bellon;i++)
        setTimeout('c.klax.play()',i*800);
    this.bellon=0;

    if(this.bipon > 0 && this.bellact==true)
      for(var i=0;i<this.bipon;i++)
        setTimeout('c.bip.play()',i*300);
    this.bipon=0;
  },
  param:function(){
    var val;
    val=parseInt(prompt("Décompte avant le début du temps ?",this.pretemps));
    if(!isNaN(val))
      this.pretemps=val;
    
    val=parseInt(prompt("Temps de tir ?",this.temps));
    if(!isNaN(val))
      this.temps=val;
    
    val=parseInt(prompt("Valeur du passage au orange ?",this.mitemps));
    if(!isNaN(val))
      this.mitemps=val;
    user_pref("save");
    this.reset();
    
  },
  bell:function(){
    this.bellact=!this.bellact;
    if(this.bellact == true)
      document.getElementById("chr_bell").className="icon icon-bell-alt";
    else
      document.getElementById("chr_bell").className="icon icon-bell-off";
  },


};



































/*function get_user_infos()
{
  if(localStorage.getItem("user") != null)
  {
    user=JSON.parse(localStorage.getItem("user"));
    document.getElementById("user").value=user.id;
    document.getElementById("password").value=user.pwd;
    return true;
    
  }
  else
    return false;
  
};*/
/*function addUser(callback,response)
{
  var newuser=document.getElementById("newuser").value;
  var newmail=document.getElementById("newmail").value;
  var newpwd1=document.getElementById("newpwd1").value;
  var newpwd2=document.getElementById("newpwd2").value;
  

  if(callback == "callback")
  {
    var r=JSON.parse(response);
    if(r[0] == true)
    {
      document.getElementById("info_newuser").innerHTML='Votre compte vient d’être créé !</p><p>Bienvenue '+newuser+'</p>';
      visu("network");
      document.getElementById("newpwd1").value="";
      document.getElementById("newpwd2").value="";
      user.id=newuser;
      user.pwd=newpwd1;
      user.isId=true;
      localStorage.setItem("user",JSON.stringify(user));
      get_user_infos();
      return;
    }
    else
    {
      ialert('<p>Une erreur s’est produite lors de la création du compte.</p>');
      return;
    }
  }

  if(newuser != "" && newmail != "" && newpwd1 != "" && newpwd2 != "")
  {
    // test de l'email
    var testmail = new RegExp('^[0-9a-z._-]+@{1}[0-9a-z.-]{2,}[.]{1}[a-z]{2,5}$','i');
    if(testmail.test(newmail) == false)
    {
      ialert('<p>Votre E-mail n’est pas valide.</p>');
      return;
    }
    if(newpwd1 != newpwd2)
    {
      ialert('<p>Les deux mots de passe que vous avez saisis ne sont pas identiques.</p>');
      return;
    }
    ialert('<p id="info_newuser">Votre compte est en cours de création…</p>');
    request('data.php?action=newuser&user='+newuser+'&pwd='+newpwd1,'addUser("callback",xhttp.responseText)');
  }
  else
    ialert('<p>Vous devez renseigner tous les champs.</p>');
};

function change_progress(progress)
{
  //var actual=0;
  //if(document.getElementById("progress").style.width != '')
  //  actual = parseInt(document.getElementById("progress").style.width);
  //
  //var progress=actual+add+'%';

  
  document.getElementById("progress").innerHTML=progress+'%';
  document.getElementById("progress").style.width=progress+'%';

};
//*******************
//* fonctions liées au serveur
//*********************
function request(req,func)
{
  console.debug('-->request('+req+','+func+')');

  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (xhttp.readyState == 4 && xhttp.status == 200) {
      //console.debug(xhttp.responseText);
      //func(xhttp.responseText);
      console.debug(xhttp.responseText);
      eval(func);
    }
  };
  xhttp.open("GET", req, true);
  xhttp.send();
};

function new_user()
{
  
};

function sync(act,response)
{
  if(get_user_infos() == false)
  {
    ialert("<p>Vous devez vous identifier pour synchroniser vos sauvegardes.</p>");
    visu("log");     
    return;
  }

  if(navigator.onLine == false)
  {
    ialert("<p>Il semblerait que votre équipement ne dispose pas d’accès internet. Connectez vous pour pouvoir synchroniser vos sauvegardes sur votre compte.</p>");
    return;
  }
  

  if(act == "callback")
  {
    // sauvegarde des fichiers présent sur le serveur dans le localStorage
    
    localStorage.setItem("sync",xhttp.responseText);
    document.getElementById("nb_net_saves").innerHTML=JSON.parse(localStorage.getItem("sync")).length;
  }
  else
  {
    var req='"data.php?user="+user.id+"&pwd="+user.pwd+"&action=list"';
    request(req,'sync("callback",xhttp.responseText)');
  }

  

};*/
/******************************/
