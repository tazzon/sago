
function init_() 
{
  //chargement de la page en 2 fois pour mise à jour du cache sans prise de tête
  if(navigator.onLine==true)
  {
    if(localStorage.getItem("reload") == null)
    {
      localStorage.setItem("reload",true);
      location.reload(true);
      return;
    }
    else
      localStorage.removeItem("reload");
  }
  //if(JSON.parse(localStorage.getItem('fullscreen')) == true)
    //toggleFullScreen();
  
  document.getElementById("page_title").innerHTML = infoapp.name+" "+infoapp.version;
  visu("session");
  //profil.write();
  if (localStorage.getItem("userp") != null)
  {  
    user_pref("restore");
    
    profil.write();
    if(userp.last_profil !== false)
    {
      //document.getElementById("select_profil").value=userp.last_profil;
      profil.load(userp.last_profil);
    }
  }
  else
    profil.write();
  
  

  visu("session"); // demande de définir les paramètres
  touch2mouse(document.getElementById("target")); // compatibilité avec le mode tactile
  document.getElementById("but_tab_score").style.display="none";
  document.getElementById("but_saisie").style.display="none";
  document.getElementById("but_analyse").style.display="none";
  
  var timer_menu=setTimeout('aff_menu()',1000);
  visu_target(0);

  // gestion des versions
  if(localStorage.getItem("infoapp") != null)
  {
    var oldinfoapp = JSON.parse(localStorage.getItem("infoapp"));
    if(infoapp.datecode > oldinfoapp.datecode) // dans le cas d'une nouvelle version
    {
      var cat_news="";
      for(var n=news.length-1;n>=0;n--)
      {
        if(news[n].datecode<=oldinfoapp.datecode) break;
        var d=(""+news[n].datecode).substr(0,8);
        var date = new Date(d.substr(0,4)+"-"+d.substr(4,2)+"-"+d.substr(6,2));
        cat_news+='<h4>'+date_format(date,"day")+'</h4>';
        cat_news+=news[n].new;
      }
      if(news.length-n > 1)
        ialert('<h3>Nouveautés</h3>'+cat_news);

      localStorage.setItem("infoapp",JSON.stringify(infoapp));
    }
  }
  else
  {
    // première utilisation
    localStorage.setItem("infoapp",JSON.stringify(infoapp));
  }

  adapt2viewport();// s'adapte à l'écran

  if (localStorage.getItem("temp") != null)
    if (confirm("Une série précédente n'a pas été sauvegardée, voulez-vous la reprendre ?") == true)
    {
      clearTimeout(timer_menu);
      load_local_data("temp"); // chargement de la série temporaire.
      ialert("Attention ! si vous ne modifiez ni n'enregistrez cette série, elle sera définitivement supprimée.");
    }
 
  calendrier();
  c.reset();
};


function valid_session()
{
  //test des champs de la session
  if( isNaN(parseInt(document.getElementById("nb_volee").value)) == true ||
      isNaN(parseInt(document.getElementById("nb_fl_volee").value)) == true ||
      isNaN(parseInt(document.getElementById("distance").value)) == true ||
      isNaN(parseInt(document.getElementById("diam_blason").value)) == true ||
      isNaN(parseInt(document.getElementById("diam_tube").value)) == true )    
  {
    ialert('<p><span style="color:#dc322f" class="icon icon-attention"></span> Vous devez remplir tous les champs pour pouvoir commencer une session.</p>');
    return;
  }
  if(document.getElementById("enable_objectif").checked ==true)
  {
    if(parseInt(document.getElementById("objectif").value) > (10*parseInt(document.getElementById("nb_volee").value)*parseInt(document.getElementById("nb_fl_volee").value)))
    {
      ialert('<p><span style="color:#dc322f" class="icon icon-attention"></span>Votre objectif de points est supérieur au score maximum possible de '+(10*parseInt(document.getElementById("nb_volee").value)*parseInt(document.getElementById("nb_fl_volee").value))+'.</p>');
      return;
    }
    if(isNaN(parseInt(document.getElementById("objectif").value)) == true)
    {
      ialert('<p><span style="color:#dc322f" class="icon icon-attention"></span>Si vous avez une objectif de points, vous devez le renseigner correctement.</p>');          
      return;
    }
  }

  if (serie.tot > 0 || n_fl > 0)  // on prévient qu'on va écraser la série précédente
   if(isave.is_save == false) 
    if (confirm("La série précédente « "+isave.actual_name+" » n'a pas été enregistrée, voulez-vous l'écraser ?") == false)
    {
      visu("tab_score");
      return;
    }

  localStorage.removeItem("temp");
  isave.actual_name="sans_nom";
  isave.is_save=true;
  isave.actual_key=""; 
  profil.savelast();

  // remise à l'état initial de la série
  serie = { date : "",
            datemod : "",
            id : "",
            nb_v : 0,
            nb_f : 0,
            volees : new Array,
            com : new Array,
            dist : 0,
            blason : 0,
            tube : 0,
            tot : 0,
            modeX : false,
            nb_zone_spot : 10,
            objectif : false
          };
  
  if(document.getElementById("enable_objectif").checked ==true)
    serie.objectif=parseInt(document.getElementById("objectif").value);

  nb_volee = parseInt(document.getElementById("nb_volee").value);
  nb_fl_volee = parseInt(document.getElementById("nb_fl_volee").value);
  distance = parseInt(document.getElementById("distance").value);
  blason = parseInt(document.getElementById("diam_blason").value);
  diam_tube = parseInt(document.getElementById("diam_tube").value);
  
  var nb_zone_spot;
  if(document.getElementById("mode_spot").checked == false)
    nb_zone_spot = 10;
  else
  {
    if(document.getElementById("nzspot5").checked == true)
      nb_zone_spot = 5;
    if(document.getElementById("nzspot6").checked == true)
      nb_zone_spot = 6;
  }
  // adaptation du nombre de zone si c'est supérieur à ce qui est déjà défini
  if(nb_zone>nb_zone_spot)
    nb_zone=nb_zone_spot;
  if(userp.nb_zone>nb_zone_spot)
    userp.nb_zone=nb_zone_spot;

  // complétion de la série avec les valeurs de base
  serie.dist = distance;
  serie.blason = blason;
  serie.modeX = document.getElementById("mode_x").checked;
  serie.nb_zone_spot = nb_zone_spot;
  serie.tube = diam_tube;
  serie.com = new Array;
  serie.nb_v = nb_volee;
  serie.nb_f = nb_fl_volee;
  serie.date = new Date().getTime(); // date de création

  // création de la cible svg avec les paramètres de la série
  create_zoom_target();
  create_target();
  target_view(userp.nb_zone);
  aff_mire(userp.mire);
  
  // pour sauvegarder le diamètre du tube
  user_pref("save");


  volee = [];
  fl_saisie_save=[];
  tab_display=[];

  aff_fl = { v:new Array, f:new Array };
  
  for (var v=0 ; v<nb_volee ; v++)
  {
    serie.com[v] = ""; // création du tableau commentaire sans contenu
    aff_fl.v[v] = false; // crétation des volées affichées
    fl_saisie_save[v]=[];
    tab_display[v]=[];
  }
  for (var f=0 ; f<nb_fl_volee ; f++)
  {
    aff_fl.f[f] = false; // création des flèches affichées
  }

  n_fl = 0;
  n_volee = 0;
  serie.tot = 0;

  // création des tableau de feuille de marque et d'extrapolation
  var tableau = "";
  tableau += '<div id="name_session"></div>';
  tableau +='<button id="gotosaisie" onclick="visu(\'saisie\');visu_target(1)"><span class="icon icon-bullseye"></span></button>';
  tableau += '<button onclick="save_local()"><span class="icon icon-floppy"></span></button>';
  tableau += '<table class="marque">';
  var marque_width=95/(nb_fl_volee+4)+"%";
  for (var c = 0 ; c<nb_volee ; c++)
  {
    tableau += '<tr><td style="width:5%">'+(c+1)+'&nbsp;</td>';
    for (var l = 0 ; l<nb_fl_volee ; l++)
    {
      tableau += '<td class="cellule" style="width:'+marque_width+'" id="tab_'+c+'_'+l+'"></td>';
    }
    tableau += '<td class="cellule" style="width:'+marque_width+'" id="result_'+c+'"></td>';
    if(c!=0)
      tableau += '<td class="cellule" style="width:'+marque_width+'" id="cumul_'+c+'"></td>';
    else
      tableau += '<td class="cellule_masq" style="width:'+marque_width+'" id="cumul_'+c+'"></td>';
    tableau += '<td class="no_com" style="width:'+marque_width+'" id="com_'+c+'" onclick="commentaire('+c+')"></td>';
  }
  //tableau += '<tr>';
  /*for (var l = 0 ; l<nb_fl_volee+2 ; l++)
  {
    tableau += '<td></td>';
  }
  tableau +='<td class="cellule" id="result_total"></td></table>';*/
  tableau += '</table>';
  //tableau += '<p>Blason : '+serie.blason+'cm<br>Distance : '+serie.dist+'m</p>';

  document.getElementById("tableau").innerHTML = tableau;
  
  gestion_save_name(); // on met le nom de la session en haut du tableau
  
  // création de la marque par volée
  tableau = '<div>Volée nº<span id="num_volee"></span><span id="aff_num_fleche"> ; flèche nº<span id="num_fleche"></span></span></div>';
  tableau += "<table><tr>";
  for (var i=0;i<nb_fl_volee;i++)
  {
    tableau += '<td id="saisie_fl'+i+'" style="width:'+(100/nb_fl_volee)+'%" class="cellule"></td>';
  }
  tableau += "</tr></table>";
  //tableau += '<div class="center_button"><button onclick="prev_arrow(\'all\')"><span class="icon icon-reply-all"></span></button><button onclick="prev_arrow()"><span class="icon icon-reply"></span></button><button onclick="commentaire(n_volee)"><span class="icon icon-comment"></span></button><button onclick="volee_suivante()"><span class="icon icon-ok"></span></button></div>';
  //tableau += '<div class="center_button"><button onclick="visu(\'tab_score\');visu_target(0)"><span class="icon icon-table"></span></button><button onclick="visu(\'chrono\');visu_target(0)"><span class="icon icon-clock"></span></button></div>';
  tableau += '<div class="center_button">'
          //+  '<button onclick="visu(\'tab_score\');visu_target(0)"><span class="icon icon-table"></span></button>'
          //+  '<button onclick="visu(\'chrono\');visu_target(0)"><span class="icon icon-clock"></span></button>'
          //+  '<button onclick="prev_arrow(\'all\')"><span class="icon icon-reply-all"></span></button>'
          //+  '<button onclick="commentaire(n_volee)"><span class="icon icon-comment"></span></button>'
          +  '<button onclick="select_arrow(\'prev\')"><span class="icon icon-reply"></span></button>'
          +  '<button onclick="select_arrow()"><span class="icon icon-forward"></span></button>'
          +  '<button onclick="volee_suivante()"><span class="icon icon-ok"></span></button>'
          +  '</div>';
  tableau += '<div class="center_button">'
          +  '<button onclick="visu(\'tab_score\');visu_target(0)"><span class="icon icon-table"></span></button>'
          +  '<button onclick="commentaire(n_volee)"><span class="icon icon-comment"></span></button>'
          +  '<button onclick="visu(\'chrono\');visu_target(0)"><span class="icon icon-clock"></span></button>'
          //+  '<button onclick="prev_arrow(\'all\')"><span class="icon icon-reply-all"></span></button>'
          //+  '<button onclick="select_arrow(\'prev\')"><span class="icon icon-reply"></span></button>'
          //+  '<button onclick="select_arrow()"><span class="icon icon-forward"></span></button>'
          //+  '<button onclick="volee_suivante()"><span class="icon icon-ok"></span></button>'
          +  '</div>';
  
  document.getElementById("saisie").innerHTML = tableau;
  document.getElementById("but_saisie").style.display = "initial";
  document.getElementById("chrono_to_saisie").style.display = "block";
  document.getElementById("but_tab_score").style.display = "initial";
  //document.getElementById("but_analyse").style.display = "initial";
  tab_ana_maj();



  var tab_ana = '<table class="marque">';
  /*var tab_ana = '<table class="marque"><tr><td></td>';
  for(var c=0;c<nb_volee;c++)
  {
    tab_ana += '<td class="no_com" id="comi'+c+'" onclick="commentaire('+c+',true)"></td>';
  }*/
  tab_ana += '</tr><tr><td class="cellule"><div class="cellule_but" id="aff_volee_all" onclick="aff_volee_all()">Volées</div></td>';
  for(var v=0;v<nb_volee;v++)
  {
    tab_ana += '<td class="cellule" style="display:none" id="ana_tab_v'+v+'"><div class="cellule_but" id="v'+v+'" onclick="aff_volee_num('+v+')">'+(v+1)+'</div></td>';
  }
  tab_ana += '</tr><tr><td class="cellule"><div class="cellule_but" id="aff_fl_all" onclick="aff_fl_all()">Flèches</div></td>';
  for(var f=0;f<nb_fl_volee;f++)
  {
    tab_ana += '<td class="cellule" style="display:none" id="ana_tab_f'+f+'"><div class="cellule_but" id="f'+f+'" onclick="aff_fl_num('+f+')">'+(f+1)+'</div></td>';
  }
  
  /*tab_ana +='<tr>'
          + '<td style="height:inherit" colspan="'+(nb_volee>nb_fl_volee?nb_volee:nb_fl_volee)+'">'
          +   '<p class="legend">Zone de réussite : <span id="zone_reussite_val"></span><div class="zone_reussite_legend"></div></p>'
          +   '<p class="legend">Moyenne : <span id="moy_fleche_val"></span><div class="moy_fleche_legend"></div></p>'
          + '</td>'
          + '<td id="options_analyse">'
          +   '<div class="cellule_but"><span class="icon icon-cog-alt"></span></div>'
          + '</td>'
          + '</tr>';*/
  

  tab_ana += '</tr></table>';
  
  tab_ana+='<p class="legend">Zone de réussite : <span id="zone_reussite_val"></span><div class="zone_reussite_legend"></div></p>'
          +'<p class="legend">Moyenne : <span id="moy_fleche_val"></span><div class="moy_fleche_legend"></div></p>';
          
  tab_ana+='<p><input type="checkbox" id="ign0" onclick="ignore0=this.checked;auto_trace()"><label for="ign0">Ignorer = 0</label><br>';
  tab_ana+='<input type="checkbox" id="ignInfR" onclick="ignoreInfReussite=this.checked;auto_trace()"/><label for="ignInfR">Ignorer < zone réussite</label>';
  tab_ana+='<br><div id="nb_fl_ignore"></div></p>';
  document.getElementById("analyse").innerHTML = tab_ana;
  
  document.getElementById("ign0").checked=ignore0;
  document.getElementById("ignInfR").checked=ignoreInfReussite;
  
  select_arrow("init");
  fl=[];
  sn=[];
  visu('saisie');
  zoom_move(0,0);
  document.getElementById("num_volee").innerHTML=n_volee+1;
  visu_target(1);
};

function prev_arrow(n)
{
  if(n == null)
    n=1;
  if(n == "all")
  {
    if (confirm("Êtes-vous sûr de vouloir annuler la saisie de cette volée ?") == false)
      return;
    fl=[]; // sup du tableau de flèches
    n=n_fl;
  }
  if((n_fl-n) < 0)
    return;

  
  for(var i=n ; i>0 ; i--)
  {
    n_fl--;
    select_arrow("prev");
    document.getElementById("saisie_fl"+n_fl).innerHTML="";
    document.getElementById("zoom_fl"+n_volee+"_"+n_fl).style.display="none";
    document.getElementById("target_fl"+n_volee+"_"+n_fl).style.display="none";
  }
};

function select_arrow(action)
{
  // effacement de tout
  for(var f=0;f<serie.nb_f;f++)
    document.getElementById("saisie_fl"+f).className="cellule";

  if(action == "init")
    num_fl=0;
  else if(action == "prev")
  {
    num_fl--; // on revient à la flèche précédente
    if(num_fl < 0) num_fl=0;
    /*if(num_fl<n_fl)*/n_fl--;
    if(n_fl<0) n_fl=0;
    if(fl[n_fl] && fl[n_fl].n == num_fl)
    {
      fl.splice(n_fl,1); // on supprime l'enregistrement si il existe
      //console.debug("sup fl n°"+n_fl);
    }
    n_fl=fl.length;

    document.getElementById("target_fl"+n_volee+"_"+num_fl).style.display='none';
    document.getElementById("zoom_fl"+n_volee+"_"+num_fl).style.display='none';
    document.getElementById("saisie_fl"+num_fl).innerHTML="";
  }
  else
    if(num_fl<serie.nb_f) num_fl++;
  
  if(num_fl < serie.nb_f)
  {
    document.getElementById("saisie_fl"+num_fl).className+=" cel_on";
    document.getElementById("num_fleche").innerHTML=num_fl+1;
    document.getElementById("aff_num_fleche").style.display="initial";
  }
  else
    document.getElementById("aff_num_fleche").style.display="none";

  /*console.debug("n_fl:"+n_fl+" num_fl:"+num_fl);
  var nf=[];
  for(var f=0;f<fl.length;f++)
  {
    nf[f]=fl[f].n;
  }
  console.debug(nf);*/
};

// passe à la volée suivante (ou recommence la volée en cours)
function volee_suivante(a)
{
  if(num_fl < nb_fl_volee && a!="noConfirm") //si la volée n'est pas complète
   if(confirm("Vous n'avez pas noté toutes les flèches, voulez-vous tout de même valider ?") == false)
     return;

     
  var tot = 0;
  for ( var i=0 ; i<fl.length ; i++) // total de la volée
    tot += fl[i].v();
  serie.tot += tot; // et qu'on ajoute au total de la série
  
  var diff_obj="";
  var diff_tot="";
  if(serie.objectif !== false)
  {
    var classobj="equ small";
    if(serie.objectif/serie.nb_v < tot) classobj="sup small";
    if(serie.objectif/serie.nb_v > tot) classobj="inf small";
    diff_obj='<span class="'+classobj+'">'+Math.round(10*(tot-serie.objectif/serie.nb_v))/10+'</span>';
    var classtotobj="equ small";
    if(serie.objectif*(n_volee+1)/serie.nb_v < serie.tot) classtotobj="sup small";
    if(serie.objectif*(n_volee+1)/serie.nb_v > serie.tot) classtotobj="inf small";
    diff_tot='<span class="'+classtotobj+'">'+Math.round(10*(serie.tot-serie.objectif*(n_volee+1)/serie.nb_v))/10+'</span>';
  }
  document.getElementById("result_"+n_volee).innerHTML += tot+diff_obj; //qu'on affiche
  document.getElementById("cumul_"+n_volee).innerHTML=serie.tot+diff_tot; // la case de cumul

  volee[n_volee] = fl; // on cré la nouvelle volée 
  volee[n_volee].tot =  function() // on ajoute la fonction qui fait le total
                        { 
                          var tot=0;
                          for (var i=0 ; i<this.length ; i++)
                            tot+=this[i].v();
                          return tot;
                        };
  // création du tableau sn pour l'analyse qui comble les trous des flèches manquantes
  sn[n_volee]=[];
  for(var f=0;f<serie.nb_f;f++)
    sn[n_volee][f]=false;
  for(var f=0;f<fl.length;f++)
    sn[n_volee][fl[f].n]=fl[f];
  
  if(a != "noConfirm")
  {
    gestion_save();
    gestion_save_name();
  }

  tab_ana_maj();
  tri();

  // effacement des scores dans le tableau de la saisie et masquage des flèches
  for (var i=0;i<nb_fl_volee;i++)
  {
    if(document.getElementById("saisie_fl"+i))
      document.getElementById('saisie_fl'+i).innerHTML="";
    document.getElementById("zoom_fl"+n_volee+"_"+i).style.display="none";
    document.getElementById("target_fl"+n_volee+"_"+i).style.display="none";
  }


  n_volee++;
  n_fl=0;
  select_arrow("init");
  fl=[];

  // affichage du numéro de la volée
  if (n_volee == nb_volee)
  {
    document.getElementById("saisie").innerHTML="";
    document.getElementById("but_saisie").style.display="none";
    document.getElementById("chrono_to_saisie").style.display="none";
    document.getElementById("gotosaisie").style.display = "none";
    visu("tab_score");
    visu_target(0);
  }
  else
  {
    var text_objectif="";
    if(serie.objectif != false)
      text_objectif='<span class="obj_saisie">Objectif '+diff_tot.replace('small','normal')+'<span>';
    document.getElementById("num_volee").innerHTML=(n_volee+1)+text_objectif;
  }
 
};

function tri()
{
  for(var v=0;v<serie.volees.length;v++)
  {
    for(var f=0;f<serie.nb_f;f++)
    {
      document.getElementById("tab_"+v+"_"+f).innerHTML="";
    }
    for(var f=0;f<serie.volees[v].length;f++)
    {
      if(userp.tab_tri==true)
      {
        serie.volees[v].sort( function(a,b){return(Math.sqrt(a.x*a.x+a.y*a.y)-Math.sqrt(b.x*b.x+b.y*b.y));});
        document.getElementById("tab_"+v+"_"+f).innerHTML=serie.volees[v][f].v();
        if(serie.volees[v][f].X() == true)
          document.getElementById("tab_"+v+"_"+f).innerHTML += "+";
      }
      else
      {
        serie.volees[v].sort(function(a,b){return a.n-b.n;});
        document.getElementById("tab_"+v+"_"+serie.volees[v][f].n).innerHTML=serie.volees[v][f].v();
        if(serie.volees[v][f].X() == true)
          document.getElementById("tab_"+v+"_"+serie.volees[v][f].n).innerHTML += "+";
      }

    }
  }
  color_marque(userp.color_marque);
};

function coord(event) 
{
  if(zoom_actif == false)
    return;

  if( window.event)
    event = window.event;
  
  var x = event.clientX-targetX-targetW/2;
  var y = event.clientY-targetY-targetH/2;
  fl[n_fl].x = Math.round(1000*x/zone_size)/1000;
  fl[n_fl].y = Math.round(1000*y/zone_size)/1000;

  document.getElementById("valf").innerHTML=fl[n_fl].v();
  if(fl[n_fl].X()==true)
    document.getElementById("valf").innerHTML+="+";
  
  /*var cordon=Math.abs(fl[n_fl].r()-Math.round(fl[n_fl].r()))-(fl[n_fl].t/fl[n_fl].b);
  console.debug(cordon);
  if(cordon < 0)
  {
    //console.debug("Sur le cordon - "+cordon);
    document.getElementById("valf").innerHTML+=" ·";
  }
  else if(cordon < 0.1)
  {
    //console.debug("Près du cordon - "+cordon);
    document.getElementById("valf").innerHTML+=" ··";
  }*/

  if((fl[n_fl].v() < (11-nb_zone) || fl[n_fl].v()==0) && adaptNbZonePlus == false)
  {  
    adaptNbZonePlus=true;
    if(nb_zone<(serie.nb_zone_spot+5))
      setTimeout('adaptNbZonePlus=false',transition_target_view(10-nb_zone));
    else
      adaptNbZonePlus=false;

  }
  if(fl[n_fl].v() > 8 && adaptNbZoneMinus == false)
  {
    adaptNbZoneMinus=true;
    if(nb_zone > userp.nb_zone)
      setTimeout('adaptNbZoneMinus=false',transition_target_view(12-nb_zone));
    else
      adaptNbZoneMinus=false;
  }

  zoom_move(x,y);
};

function start_coord(event)
{
  if (num_fl >= serie.nb_f || n_volee >= serie.nb_v || el_visible =="analyse") // si on est à la fin de la volée ou qu'il n'y a plus de volée à faire
    return;                                       // on ne fait rien

  if( window.event)
    event = window.event;
  
  var x = event.clientX-targetX-targetW/2;
  var y = event.clientY-targetY-targetH/2;
  
  fl[n_fl] = new arrow(x/zone_size,y/zone_size,diam_tube,blason,distance,num_fl);
  zoom_actif=true;
  visu("zoom");
  coord(event);
};

var adaptNbZoneMinus=false;
var adaptNbZonePlus=false;
function stop_coord(event)
{
  if (num_fl >= nb_fl_volee || n_volee >= nb_volee || el_visible =="analyse") // si on est à la fin de la volée ou qu'il n'y a plus de volée à faire
    return;
  
  adaptNbZonePlus=false;
  adaptNbZoneMinus=false;

  /*var cordon=Math.abs(fl[n_fl].r()-Math.round(fl[n_fl].r()))-(fl[n_fl].t/fl[n_fl].b);
  if(cordon < 0)
    console.debug("Sur le cordon - "+cordon);
  else if(cordon < 0.1)
    console.debug("Près du cordon - "+cordon);*/
    
  if(nb_zone != userp.nb_zone)
    transition_target_view(11-userp.nb_zone);

  // on place et on montre la flèche dans le zoom  
  document.getElementById("zoom_fl"+n_volee+"_"+num_fl).setAttribute("cx",50*fl[n_fl].x);
  document.getElementById("zoom_fl"+n_volee+"_"+num_fl).setAttribute("cy",50*fl[n_fl].y);
  document.getElementById("zoom_fl"+n_volee+"_"+num_fl).style.display="block";

  // on place et on motre la flèche dans la cible
  //document.getElementById("target_fl"+n_volee+"_"+num_fl).setAttribute("cx",50*fl[n_fl].x);
  //document.getElementById("target_fl"+n_volee+"_"+num_fl).setAttribute("cy",50*fl[n_fl].y);
  document.getElementById("target_fl"+n_volee+"_"+num_fl).setAttribute('transform','translate('+(50*fl[n_fl].x)+','+(50*fl[n_fl].y)+')');
  document.getElementById("target_fl"+n_volee+"_"+num_fl).style.display="block";
  
  zoom_actif=false;
  visu("saisie");
  document.getElementById('saisie_fl'+num_fl).innerHTML=fl[n_fl].v();
  if(fl[n_fl].X() == true)
    document.getElementById('saisie_fl'+num_fl).innerHTML+="+";
    
  n_fl++;
  select_arrow();
  
};


function create_zoom_target()
{
  var zoomW=document.getElementById("zoom").width;
  var zoomH=document.getElementById("zoom").height;
  var arrowR=50*diam_tube/serie.blason;
  
  zoom_target="";
  
  zoom_target+='<svg width="100%" height="100%"><g id="zoom_scale"><g id="center_zoom_target">';
  
  // équivalent des zones hors du blason pour estimer les flèches manquées
  if(serie.nb_zone_spot>=10)
    zoom_target+='<g class="out_target"><circle cx="0" cy="0" r="550"/><circle cx="0" cy="0" r="600"/><circle cx="0" cy="0" r="650"/><circle cx="0" cy="0" r="700"/><circle cx="0" cy="0" r="750"/></g>';
  
  if(serie.nb_zone_spot>=7)  // 4, 3, 2, 1
    zoom_target+='<circle cx="0" cy="0" r="499" fill="white" stroke="black"  stroke-width="2"/><circle cx="0" cy="0" r="450" fill="white" stroke="black"  stroke-width="1"/><circle cx="0" cy="0" r="399" fill="black" stroke="black"  stroke-width="2"/><circle cx="0" cy="0" r="350" fill="black" stroke="white"  stroke-width="1"/>';
  else
    zoom_target+='<g class="out_target"><circle cx="0" cy="0" r="500"/><circle cx="0" cy="0" r="450"/><circle cx="0" cy="0" r="400"/><circle cx="0" cy="0" r="350"/></g>';
  if(serie.nb_zone_spot>=6)  // 5
    zoom_target+='<circle cx="0" cy="0" r="301" fill="#009fe0" stroke="black"  stroke-width="2"/>';
  else
    zoom_target+='<g class="out_target"><circle cx="0" cy="0" r="300"/></g>';
  if(serie.nb_zone_spot>=5) // 6
    zoom_target+='<circle cx="0" cy="0" r="250" fill="#009fe0" stroke="black"  stroke-width="1"/>';
  else
    zoom_target+='<g class="out_target"><circle cx="0" cy="0" r="250"/></g>';

  // 7, 8, 9
  zoom_target+='<circle cx="0" cy="0" r="199" fill="#e21019" stroke="black" stroke-width="2"/><circle cx="0" cy="0" r="150" fill="#e21019" stroke="black" stroke-width="1"/><circle cx="0" cy="0" r="99" fill="#feed01" stroke="black" stroke-width="2"/>';
  
  if(serie.modeX == false) // grand 10 + petit 10 gris
    zoom_target+='<circle cx="0" cy="0" r="50" fill="#feed01" stroke="black" stroke-width="1"/><circle cx="0" cy="0" r="25" fill="#feed01" stroke="grey" stroke-width="1"/>';
  else // petit 10 noir
    zoom_target+='<circle cx="0" cy="0" r="24" fill="#feed01" stroke="black" stroke-width="2"/>';
 
  // mouche
  zoom_target+='<line x1="0" y1="-5" x2="0" y2="5" stroke="black" stroke-width="1"/><line x1="-5" y1="0" x2="5" y2="0" stroke="black" stroke-width="1"/>';

  // les flèches qui seront tirées
  for(var v=0;v<serie.nb_v;v++)
    for(var f=0;f<serie.nb_f;f++)
      zoom_target+='<circle cx="0" cy="0" r="'+arrowR+'" style="display:none" class="arrowz" id="zoom_fl'+v+'_'+f+'"/>';
  
  zoom_target+='</g>';

  // la mire  
  zoom_target+='<g id="mire">';
  zoom_target+='<circle id="mirec" cx="'+zoomW/2+'" cy="'+zoomH/2+'" r="'+(arrowR*2)+'"/>';
  zoom_target+='<line id="mirev1" x1="'+zoomW/2+'" y1="-1000" x2="'+zoomW/2+'" y2="'+(zoomH/2-arrowR*1.5)+'"/>';
  zoom_target+='<line id="mireh1" y1="'+zoomH/2+'" x1="-1000" y2="'+zoomH/2+'" x2="'+(zoomW/2-arrowR*1.5)+'"/>';
  zoom_target+='<line id="mirev2" x1="'+zoomW/2+'" y1="1000" x2="'+zoomW/2+'" y2="'+(zoomH/2+arrowR*1.5)+'"/>';
  zoom_target+='<line id="mireh2" y1="'+zoomH/2+'" x1="1000" y2="'+zoomH/2+'" x2="'+(zoomW/2+arrowR*1.5)+'"/>';

  zoom_target+='</g>';

  // la flèche en cours
  zoom_target+='<circle cx="'+zoomW/2+'" cy="'+zoomH/2+'" r="'+arrowR+'" id="point_arrow" class="point_arrow" />';
  zoom_target+='</g>';
  
  // fin de l'image
  zoom_target+='</svg>';
  
  // texte des points
  zoom_target+='<div id="valf"></div>';
  zoom_target+='<div id="valz"></div>';

  //dessin de la cible zoom
  document.getElementById("zoom").innerHTML=zoom_target;
};

// crée un nouvel objet contenant les caractéristiques de la flèche
// x,y => coordonnée de la flèche en unitaire (unité = une largeur de zone)
// t   => diamètre de la flèche en mm
// b   => diamètre du blason pour les coordonnée x,y
// d   => distance de tir
// v   => la valeur de flèche est calculé
// r   => rayon unitaire est calculé
// n   => numéro de la flèche
// X   => true si la flèche vaut le petit 10 sinon false
// modeX => true si on utilise le petit 10
// minv => la valeur mini du blason
function arrow(x,y,t,b,d,n)
{
  this.x = x;
  this.y = y;
  this.t = t;
  this.b = b;
  this.d = d;
  this.n = n;
  this.r = function()
           {
             return Math.sqrt(Math.pow(this.x,2)+Math.pow(this.y,2));
           };
  this.v = function(ndec) // nbdec = nombre de décimales
           {
             var v = 11-this.r()+(this.t/this.b);
             if(this.modeX == true && v<10.5 && v>=9)
               v=9;                 
             if(typeof(ndec) == "number")
               v=Math.round(Math.pow(10,ndec)*v)/Math.pow(10,ndec);
             else
               v=Math.floor(v);
             if (v >10)
              v=10;
             if (v < this.minv)
              v=0;
             return v;
           };
  this.X = function()
           {
             var v = 11-this.r()+(this.t/this.b);
             if(v >= 10.5 && this.modeX == false)
               return true;
             else
               return false;
           };
  this.modeX = serie.modeX;
  if(document.getElementById("mode_spot").checked == true)
    this.minv = 11-serie.nb_zone_spot;
  else
    this.minv = 1;
};


function zoom_move(x,y)
{
  //if(isNaN(x) || isNaN(y)) return;
  document.getElementById("center_zoom_target").setAttribute("transform","matrix(1,0,0,1,"+((-1000/targetW*x)/zoom+zoomW/2)+","+((-1000/targetH*y)/zoom+zoomH/2)+")");
};
function zoom_scale(z)
{
   //if(isNaN(z)) return;
   if(!document.getElementById("zoom_scale")) return;

   document.getElementById("valz").innerHTML='×'+Math.round(z*10)/10;
   if(zoomW>zoomH)
     z=z*zoomW/1000;
   else
     z=z*zoomH/1000;
   document.getElementById("zoom_scale").setAttribute("transform","matrix("+z+",0,0,"+z+","+((zoomW/2)*(1-z))+","+((zoomH/2)*(1-z))+")");
};

function create_target()
{
  var targetW=document.getElementById("target").width;
  var targetH=document.getElementById("target").height;
  var arrowR=50*diam_tube/serie.blason;
  
  target='<svg id="main_target" width="'+targetW+'" height="'+targetH+'"><g id="center_target">';
  if(serie.nb_zone_spot>=7)  // 4, 3, 2, 1
  {
    target+='<circle id="t1" cx="0" cy="0" r="499" fill="white" stroke="black"  stroke-width="2"/>';
    target+='<circle id="t2" cx="0" cy="0" r="450" fill="white" stroke="black"  stroke-width="1"/>';
    target+='<circle id="t3" cx="0" cy="0" r="399" fill="black" stroke="black"  stroke-width="2"/>';
    target+='<circle id="t4" cx="0" cy="0" r="350" fill="black" stroke="white"  stroke-width="1"/>';
  }
  if(serie.nb_zone_spot>=6)  // 5
    target+='<circle id="t5" cx="0" cy="0" r="301" fill="#009fe0" stroke="black"  stroke-width="2"/>';
  if(serie.nb_zone_spot>=5) // 6
    target+='<circle id="t6" cx="0" cy="0" r="250" fill="#009fe0" stroke="black"  stroke-width="1"/>';

  // 7, 8, 9
  target+='<circle id="t7" cx="0" cy="0" r="199" fill="#e21019" stroke="black" stroke-width="2"/>';
  target+='<circle id="t8" cx="0" cy="0" r="150" fill="#e21019" stroke="black" stroke-width="1"/>';
  target+='<circle id="t9" cx="0" cy="0" r="99" fill="#feed01" stroke="black" stroke-width="2"/>';
  
  if(serie.modeX == false) // grand 10 + petit 10 gris
    target+='<circle id="t10" cx="0" cy="0" r="50" fill="#feed01" stroke="black" stroke-width="1"/><circle cx="0" cy="0" r="25" fill="#feed01" stroke="grey" stroke-width="1"/>';
  else // petit 10 noir
    target+='<circle id="t10" cx="0" cy="0" r="24" fill="#feed01" stroke="black" stroke-width="2"/>';
 
  // mouche
  target+='<line x1="0" y1="-5" x2="0" y2="5" stroke="black" stroke-width="1"/><line x1="-5" y1="0" x2="5" y2="0" stroke="black" stroke-width="1"/>';
  // fin de l'image
  
  //moyenne des flèches
  target+='<circle id="moy_fleche" cx="0" cy="0" r="0" />';
  //la zone de réussite
  
  target+='<circle id="zone_reussite" cx="0" cy="0" r="0" />';

  //moyenne d'une flèches
  target+='<circle id="zone_fleche" cx="0" cy="0" r="0" />';
  
  //dispersion h
  target+='<g id="dispersion">';
  target+='<line x1="-10000" y1="0" x2="10000" y2="0" id="disph1"/><line x1="-10000" y1="0" x2="10000" y2="0" id="disph2"/>';
  //dispersion l
  target+='<line x1="0" y1="-10000" x2="0" y2="10000" id="displ1"/><line x1="0" y1="-10000" x2="0" y2="10000" id="displ2"/>';
  target+='</g>';
  // les flèches qui seront tirées
  for(var v=0;v<serie.nb_v;v++)
    for(var f=0;f<serie.nb_f;f++)
      target+='<g id="target_fl'+v+'_'+f+'" style="display:none">'
            + '<circle cx="0" cy="0" r="20" class="arrowtcirc"/>' // cercle de marquage de la taille d'une zone
            + '<circle cx="0" cy="0" r="'+arrowR+'" class="arrowt"/>' // tube
            + '</g>';
    
  target+='</g></svg>';
  
  //dessin de la cible zoom
  document.getElementById("target").innerHTML=target;
};
function target_view(zone)
{
  if(isNaN(zone))
    zone=userp.nb_zone;
  if(zone=="+")
  {
    nb_zone++;
    zone=nb_zone;
  }
  if(zone=="-")
  {
    nb_zone--;
    zone=nb_zone;
  }
  if(zone>serie.nb_zone_spot+5) // au plus les zones pour le spot
    zone=serie.nb_zone_spot+5;
  if(zone<2) // toujours au moins 9 et 10
    zone=2;
  
  //coloration des cases de selection dans les options
  //masquage de toutes les zones inutiles et affichage neutre des autres
  for(var z=1;z<10;z++)
  {
    if(z > 10-serie.nb_zone_spot)
      document.getElementById("tv"+z).className="tv_unset";
    else
      document.getElementById("tv"+z).className="tv_inactif";
  }
  //coloration des zone actives (nb_zone)
  var tab_color=new Array("tv_white","tv_white","tv_black","tv_black","tv_blue","tv_blue","tv_red","tv_red","tv_yellow");
  for(var i=9;i>(10-zone);i--)
  {
    if(document.getElementById("tv"+i))
      document.getElementById("tv"+i).className=tab_color[i-1];
  }


  //affichage des zones  
  nb_zone=zone;
  zone_size=targetH/(2*nb_zone);
  
  //zoom_scale(10.5-nb_zone/2-(nb_zone-1)*0.28);
  var max_zoom=5.5;
  var min_zoom=1.5;
  var max_zone=serie.nb_zone_spot+5;
  var div_zoom=(max_zone-min_zoom)/(max_zoom-min_zoom);
  zoom_scale(min_zoom+(max_zone-zone)/div_zoom);// le zoom mini vaut 2 pour 15 zones visibles et le zoom maxi vaut environ 6 pour pour 2 zones visibles
  zoom=10/zone;  
  
  var scale=zoom/1000*targetW;

  for(var t=11-serie.nb_zone_spot;t<11;t++) // masquage des zones qui ne sont pas complètes
  {
    if(document.getElementById("t"+t))
    {
      if(t<=10-zone)
        document.getElementById("t"+t).style.display="none";
      else
        document.getElementById("t"+t).style.display="block";
    }
  }
  /*for(var f=0;f<fl.length;f++) // masquage des flèches qui ne sont pas dans les zones visibles ou qui sont en cours de saisie
  {
    if(fl[f].v()<11-zone || f==n_fl)
      document.getElementById("target_fl"+n_volee+"_"+f).style.display="none";
    else
      document.getElementById("target_fl"+n_volee+"_"+f).style.display="block";
  }*/
  if(document.getElementById("center_target"))
    document.getElementById("center_target").setAttribute("transform","matrix("+scale+",0,0,"+scale+","+targetW/2+","+targetH/2+")");
};


/*****************************
* les fonctions pour l'analyse
******************************/
function zone_reussite(act)
{
  if(serie.volees.length==0) return;
  
  var moy=0;
  var tab_tri=[];
  var i=0;
  for(var v=0;v<sn.length;v++)
  {
    for(var f=0;f<sn[v].length;f++)
    {
      if(sn[v][f])
      {
        tab_tri[i]=sn[v][f].v();
        i++;
      }
    }
  }
  var borneh=Math.round(i*0.8);
  var borneb=Math.round(i*0.6);

  tab_tri.sort(function(a,b){return a-b}).reverse();

  if(i == 0)
    return;
  
  var zr;  
  if(i < 2)
    zr=tab_tri[0];
  else if(borneh==borneb)
   zr=tab_tri[borneh] 
  else
  {
    for(var f=borneb;f<borneh;f++)
      moy+=tab_tri[f];
    zr=moy/(borneh-borneb);
  }

  if(act=="value")
    return zr;
  else
  {
    document.getElementById("zone_reussite").setAttribute("r",50*(11-zr));
    document.getElementById("zone_reussite_val").innerHTML=Math.round(10*zr)/10;
  }
};

function moyenne_f(act)
{
  if(serie.volees.length==0) return;

  var moy=0;
  var i=0;
  for(var v=0;v<serie.volees.length;v++)
  {
    for(var f=0;f<serie.volees[v].length;f++)
    {
      //moy+=serie.volees[v][f].v();
      if(sn[v][f])
      {
        moy+=sn[v][f].v();
        i++;
      }
    }
  }
  if(i==0)
    return;

  if(act == "value")
    return moy/i;
  else
  {
    document.getElementById("moy_fleche").setAttribute("cx",0);
    document.getElementById("moy_fleche").setAttribute("cy",0);
    document.getElementById("moy_fleche").setAttribute("r",50*(11-moy/i));
    document.getElementById("moy_fleche_val").innerHTML=Math.round(100*moy/i)/100;
  }
};

function ecart_fl(reset)
{
  var moyx=0;
  var moyy=0;
  var i=1;
  if(reset!=true)
  {
    i=0;
    for(var v=0;v<serie.volees.length;v++)
    {
      for(var f=0;f<serie.nb_f;f++)
      {
        moyx+=serie.volees[v][f].x;
        moyy+=serie.volees[v][f].y;
        i++;
      }
    }
  }

  return new Array(moyx/i,moyy/i);
};

function group_volee(v)
{
  var cx=0;
  var cy=0;
  var r=0;
  var f=0;
  //calcul de la position moyenne
  for(f=0;f<serie.volees[v].length;f++)
  {
    cx+=serie.volees[v][f].x;
    cy+=serie.volees[v][f].y;
  }
  cx=cx/f;
  cy=cy/f;

  //calcul du rayon par rapport à la position moyenne
  var f_larg=0;
  var tab=serie.volees[v].slice();
  for(f=0;f<serie.volees[v].length;f++)
  {
    tab[f].x-=cx;
    tab[f].y-=cy;
    if(tab[f].r() > r)
      r=tab[f].r();
  }
  document.getElementById("moy_fleche").setAttribute("cx",50*cx);
  document.getElementById("moy_fleche").setAttribute("cy",50*cy);
  document.getElementById("moy_fleche").setAttribute("r",50*r);

};
function group_fleche(f)
{
  var cx=0;
  var cy=0;
  var r=0;
  var count=0;
  if(f != "reset")
  {
    var v=0;
    var tab=[];
    //calcul de la position moyenne
    for(v=0;v<serie.volees.length;v++)
    {
      //if(typeof(serie.volees[v][f]) != "undefined" && serie.volees[v][f].v(2)>(ignoreInfReussite?zone_reussite("value"):ignore0?0:-1))
      //console.debug("v:"+v+" f:"+f);
      if((typeof(sn[v][f]) != "undefined" && sn[v][f] != false) && sn[v][f].v(2)>(ignoreInfReussite?zone_reussite("value"):ignore0?0:-1))
      {
        cx+=sn[v][f].x;
        cy+=sn[v][f].y;

        tab[v]={x:sn[v][f].x,
                y:sn[v][f].y,
                r:sn[v][f].r,
               };
        count++;
      }
    }
    cx=cx/count;
    cy=cy/count;

      if(count == 0)
      {
        document.getElementById("zone_fleche").style.display="none";
        return;
      }
      // si une seule flèche on calcule le rayon en fonction du diamètre du tube
      else if(count < 2)
      {
        r=4*serie.tube/serie.blason;
      }
      else
      {
        //calcul du rayon par rapport à la position moyenne
        for(v=0;v<serie.volees.length;v++)
        {
          if(tab[v])
          {
            tab[v].x-=cx;
            tab[v].y-=cy;
            if(tab[v].r() > r)
              r=tab[v].r();
          }
        }
      }
  }
  
  document.getElementById("zone_fleche").style.display="block";
  document.getElementById("zone_fleche").setAttribute("cx",50*cx);
  document.getElementById("zone_fleche").setAttribute("cy",50*cy);
  document.getElementById("zone_fleche").setAttribute("r",50*r);
};

function draw_disp(a)
{
  if(a==false)
  {
    document.getElementById("dispersion").style.display="none";
    return;
  }
  else
    document.getElementById("dispersion").style.display="block";

  var dh1=false;
  var dh2=false;
  var dl1=false;
  var dl2=false;
  var f=0;
  for(var v=0;v<serie.volees.length;v++)
  {
    if(aff_fl.v[v] == true)
    {
      for(f=0;f<sn[v].length;f++)
      {
        if(sn[v][f] && sn[v][f].v(2)>(ignoreInfReussite?zone_reussite("value"):ignore0?0:-1))
        {
          if(sn[v][f].y>dh1 || dh1 == false)
            dh1=sn[v][f].y;
          if(sn[v][f].y<dh2 || dh2 == false)
            dh2=sn[v][f].y;
          if(sn[v][f].x>dl1 || dl1 == false)
            dl1=sn[v][f].x;
          if(sn[v][f].x<dl2 || dl2 == false)
            dl2=sn[v][f].x;
        }
      }
    }
  }
  if(f==0)
    draw_disp(false);
  
  document.getElementById("disph1").setAttribute("y1",50*dh1);
  document.getElementById("disph1").setAttribute("y2",50*dh1);
  document.getElementById("disph2").setAttribute("y1",50*dh2);
  document.getElementById("disph2").setAttribute("y2",50*dh2);

  document.getElementById("displ1").setAttribute("x1",50*dl1);
  document.getElementById("displ1").setAttribute("x2",50*dl1);
  document.getElementById("displ2").setAttribute("x1",50*dl2);
  document.getElementById("displ2").setAttribute("x2",50*dl2);

};

function transition_target_view(v)
{
    max=200; // casse la boucle si il y a un problème. Les mouvement se font par 0.1 zones et maximum 15 zone peuvent être saisies donc 150 d'ou un peu plus
    mvt=11-Math.floor(v)-nb_zone;
    var it=Math.floor(450/Math.abs(mvt));
    var sign=1;
    if(mvt!=0)
      sign=mvt/Math.abs(mvt);
    else
      it=50; // dans le cas ou mvt=0 évite it=infinty
    for(i=0;i<Math.abs(mvt);i=i+0.1)
    {
      setTimeout('target_view('+(nb_zone+i*sign)+')',i*it);
      if(max--<0)
      {
        console.debug("break");
        break;
      }
    }
    setTimeout('target_view('+Math.round(nb_zone+i*sign)+')',i*it);
    return i*it;
};

function aff_volee_num(v)
{
  if(v>=serie.volees.length)
    return;
    
  aff_fl.v[v] = !aff_fl.v[v];
  for(f=0;f<serie.nb_f;f++)
    aff_fl.f[f]=false;

  auto_trace();
};
function aff_fl_num(f)
{
  for(var i=0;i<serie.nb_v;i++) // désactive l'affichage par volées
    aff_fl.v[i]=false;

  var count=0;                  // init de comptage
  for(var i=0;i<serie.nb_f;i++) // boucle le nombre de flèches max par volée
  {
    if(aff_fl.f[i] == true)     // si la flèche est déjà affichée
      count++;                  // on incrémente
    if(f!=i) aff_fl.f[i]=false; // si le num de flèche demandé est différent la flèche traité on désactive son affichage
  }
  if(count!=serie.nb_f)         // si on a pas le max de flèches
    aff_fl.f[f] = !aff_fl.f[f]; // on inverse l'activation

  auto_trace();                 // on affiche
};
function aff_volee_all()
{
  var af=true;
  var count=0;
  for(var v=0;v<serie.volees.length;v++)
    if(aff_fl.v[v]==true)
      count++;
  if(count==serie.volees.length)
    af=false;

  for(f=0;f<serie.nb_f;f++)
    aff_fl.f[f]=false;

  for(var v=0;v<serie.volees.length;v++)
    aff_fl.v[v] = af;
  
  auto_trace();
};

function aff_fl_all()
{
  var af=true;
  var count=0;
  for(var f=0;f<serie.nb_f;f++)
    if(aff_fl.f[f]==true)
      count++;
  if(count==serie.nb_f)
    af=false;
  
  for(var f=0;f<serie.nb_f;f++)
    aff_fl.f[f] = af;

  for(var v=0;v<serie.nb_v;v++)
    aff_fl.v[v] = false;

  auto_trace();
};

function display_fl()
{

  tab_display=[];
  for(var v=0;v<serie.nb_v;v++)
  {
    tab_display[v]=[];
    for(var f=0;f<serie.nb_f;f++)
      tab_display[v][f]=false;
  }
  for(var v=0;v<serie.nb_v;v++)
    for(var f=0;f<serie.nb_f;f++)
      if(aff_fl.v[v]==true)
        tab_display[v][f]=aff_fl.v[v];
  for(var f=0;f<serie.nb_f;f++)
    for(var v=0;v<serie.nb_v;v++)
      if(aff_fl.f[f]==true)
        tab_display[v][f]=aff_fl.f[f];
  
  var min=false;
  var nb_fl_ignore=0;
  for(var v=0;v<serie.volees.length;v++)
  {
    for(var f=0;f<serie.nb_f;f++)
    {
      if(sn[v][f])
      {
        var fd=document.getElementById("target_fl"+v+"_"+f);
        if(tab_display[v][f] == true)
        {
          //fd.setAttribute("cx",50*sn[v][f].x);
          //fd.setAttribute("cy",50*sn[v][f].y);
          fd.setAttribute('transform','translate('+(50*sn[v][f].x)+','+(50*sn[v][f].y)+')');          
          fd.style.display="block";

          if(min === false || min < sn[v][f].r())
            if(sn[v][f].v(2)>(ignoreInfReussite?zone_reussite("value"):ignore0?0:-1))
              min=sn[v][f].r();
            else
              nb_fl_ignore++;
        }
        else
        {
          fd.style.display="none";
        }
      }
    }
  }
  //console.debug('nb_fl_ignore:'+nb_fl_ignore);
  if(nb_fl_ignore==1)
    document.getElementById("nb_fl_ignore").innerHTML='<span class="icon icon-info-circled"></span> '+nb_fl_ignore+" flèche ignorée";
  else if(nb_fl_ignore > 1)
    document.getElementById("nb_fl_ignore").innerHTML='<span class="icon icon-info-circled"></span> '+nb_fl_ignore+" flèches ignorées";
  else
    document.getElementById("nb_fl_ignore").innerHTML="";

  if(min !== false)
    transition_target_view(10.5-min); // une zone de plus que la valeur mini
  else
    transition_target_view(Math.floor(moyenne_f("value")>zone_reussite("value")?moyenne_f("value"):zone_reussite("value"))-1);
    //transition_target_view(11-userp.nb_zone);
  var count=0;
  for (var v=0;v<serie.nb_v;v++)
  {
    if(aff_fl.v[v] == true)
    {
      document.getElementById("v"+v).className = "cellule_but_on";
      count++;
    }
    else
      document.getElementById("v"+v).className = "cellule_but";
  }

  if(count == serie.volees.length)
    document.getElementById("aff_volee_all").className = "cellule_but_on";
  else
    document.getElementById("aff_volee_all").className = "cellule_but";

  count=0;
  for (var f=0;f<serie.nb_f;f++)
  {
    if(aff_fl.f[f] == true)
    {
      document.getElementById("f"+f).className ="cellule_but_on";
      count++;
    }
    else
      document.getElementById("f"+f).className = "cellule_but";
  }

  if(count == serie.nb_f)
    document.getElementById("aff_fl_all").className = "cellule_but_on";
  else
    document.getElementById("aff_fl_all").className = "cellule_but";
};

function tab_ana_maj()
{
  var f=false;
  for(var v=0;v<serie.volees.length;v++)
  {
    document.getElementById("ana_tab_v"+v).style.display="";
    f=true;
  }
  if(f==true)
  {
    document.getElementById("but_analyse").style.display="initial";
    for(var f=0;f<serie.nb_f;f++)
      document.getElementById("ana_tab_f"+f).style.display="";
  }
  else
    document.getElementById("but_analyse").style.display="none";
};

function auto_trace()
{
  var dd=false; //draw_disp
  var dg=0; //draw group_fleche
  var ndg=false;//nombre de numéro flèches à afficher

  for(var v=0;v<serie.nb_v;v++)
    if(aff_fl.v[v]==true)
      dd=true;
  
  for(var f=0;f<serie.nb_f;f++)
    if(aff_fl.f[f]==true)
    {
      dg++;
      ndg=f;
    }
  
  group_fleche("reset");

  display_fl();
  if(dd=true)
    draw_disp();

  if(ndg!==false && dg==1)
    group_fleche(ndg);

};