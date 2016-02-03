
function init_() 
{
  document.getElementById("page_title").innerHTML = infoapp.name+" "+infoapp.version;
  if (localStorage.getItem("userp") != null)
    user_pref("restore");
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
      if(news != "") // si il y quelque chose à dire
        ialert('<h3>Nouveautés</h3>'+news);
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
      alert("Attention ! si vous ne modifiez ni n'enregistrez cette série, elle sera définitivement supprimée.");
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
      isNaN(parseInt(document.getElementById("diam_tube").value)) == true)
  {
    ialert('<p><span style="color:#dc322f" class="icon icon-attention"></span> Vous devez remplir tous les champs pour pouvoir commencer une session.</p>');
    return;
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
    isave.is_save=false;

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
            nb_zone_spot : 10
          };
  
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
  var marque_width=95/(nb_fl_volee+3)+"%";
  for (var c = 0 ; c<nb_volee ; c++)
  {
    tableau += '<tr><td style="width:5%">'+(c+1)+'&nbsp;</td>';
    for (var l = 0 ; l<nb_fl_volee ; l++)
    {
      tableau += '<td class="cellule" style="width:'+marque_width+'" id="tab_'+c+'_'+l+'"></td>';
    }
    tableau += '<td class="cellule" style="width:'+marque_width+'" id="result_'+c+'"></td><td class="no_com" style="width:'+marque_width+'" id="com_'+c+'" onclick="commentaire('+c+')"></td>';
  }
  tableau += '<tr>';
  for (var l = 0 ; l<nb_fl_volee+1 ; l++)
  {
    tableau += '<td></td>';
  }
  tableau +='<td class="cellule" id="result_total"></td></table>';
  
  document.getElementById("tableau").innerHTML = tableau;
  
  // création de la marque par volée
  tableau = '<div>Volée nº<span id="num_volee"></span></div>';
  tableau += "<table><tr>";
  for (var i=0;i<nb_fl_volee;i++)
  {
    tableau += '<td id="saisie_fl'+i+'" style="width:'+(100/nb_fl_volee)+'%" class="cellule"></td>';
  }
  tableau += "</tr></table>";
  tableau += '<div class="center_button"><button onclick="prev_arrow(\'all\')"><span class="icon icon-reply-all"></span></button><button onclick="prev_arrow()"><span class="icon icon-reply"></span></button><button onclick="commentaire(n_volee)"><span class="icon icon-comment"></span></button><button onclick="volee_suivante()"><span class="icon icon-ok"></span></button></div>';
  tableau += '<div class="center_button"><button onclick="visu(\'tab_score\');visu_target(0)"><span class="icon icon-table"></span></button><button onclick="visu(\'chrono\');visu_target(0)"><span class="icon icon-clock"></span></button></div>';
  
  
  document.getElementById("saisie").innerHTML = tableau;
  document.getElementById("but_saisie").style.display = "initial";
  document.getElementById("but_tab_score").style.display = "initial";
  document.getElementById("but_analyse").style.display = "initial";



  var tab_ana = '<table class="marque">';
  /*var tab_ana = '<table class="marque"><tr><td></td>';
  for(var c=0;c<nb_volee;c++)
  {
    tab_ana += '<td class="no_com" id="comi'+c+'" onclick="commentaire('+c+',true)"></td>';
  }*/
  tab_ana += '</tr><tr><td class="cellule"><div class="cellule_but" id="aff_volee_all" onclick="this.className=aff_volee_all(this.className)">Volées</div></td>';
  for(var v=0;v<nb_volee;v++)
  {
    tab_ana += '<td class="cellule"><div class="cellule_but" id="v'+v+'" onclick="aff_volee_num('+v+')">'+(v+1)+'</div></td>';
  }
  tab_ana += '</tr><tr><td class="cellule"><div class="cellule_but" id="aff_fl_all" onclick="this.className=aff_fl_all(this.className)">Flèches</div></td>';
  for(var f=0;f<nb_fl_volee;f++)
  {
    tab_ana += '<td class="cellule"><div class="cellule_but" id="f'+f+'" onclick="aff_fl_num('+f+')">'+(f+1)+'</div></td>';
  }
  tab_ana += '</tr></table>';
  tab_ana +='<p class="legend">Zone de réussite : <span id="zone_reussite_val"></span><div class="zone_reussite_legend"></div></p>';
  tab_ana +='<p class="legend">Moyenne : <span id="moy_fleche_val"></span><div class="moy_fleche_legend"></div></p>';

  document.getElementById("analyse").innerHTML = tab_ana;

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
    document.getElementById("saisie_fl"+n_fl).innerHTML="";
    document.getElementById("zoom_fl"+n_volee+"_"+n_fl).style.display="none";
    document.getElementById("target_fl"+n_volee+"_"+n_fl).style.display="none";
  }
};

// passe à la volée suivante (ou recommence la volée en cours)
function volee_suivante(a)
{
  if(n_fl < nb_fl_volee) //si la volée n'est pas complète
   if(confirm("Compléter les flèches manquées par des 0 ?") == true)
     for(n_fl=n_fl;n_fl<nb_fl_volee;n_fl++) // on complète les flèches qui manquent
       fl[n_fl] = new arrow(9,-9,diam_tube,blason,distance,n_fl); // en les mettant en haut à droite de blason (je sai pas trop comment gérer ce genre de flèche)
   else
     return;
     
  var tot = 0;
  for ( var i=0 ; i<fl.length ; i++) // total de la volée
    tot += fl[i].v();
  document.getElementById("result_"+n_volee).innerHTML += tot; //qu'on affiche
  serie.tot += tot; // et qu'on ajoute au total de la série
  document.getElementById("result_total").innerHTML = serie.tot; // on modifie le total dans le tableau
  
  volee[n_volee] = fl; // on cré la nouvelle volée 
  volee[n_volee].tot =  function() // on ajoute la fonction qui fait le total
                        { 
                          var tot=0;
                          for (var i=0 ; i<this.length ; i++)
                            tot+=this[i].v();
                          return tot;
                        };

  // tri de la volée
  var tab_tri = new Array;
  tab_tri=volee[n_volee].slice();// copie du tableau avant le tri des flèches
  tab_tri.sort(function(a,b){
                              if(a.X()==false && b.X()==true)
                                return -1;
                              if(a.X()==true  && b.X()==false)
                                return 1;
                              return 0;
                            });
  tab_tri.sort(function(a,b){return a.v()-b.v()}).reverse();                              
  // affichage de la volée triée dans la feuille de marque
  for (var i=0 ; i<nb_fl_volee ; i++)
  {
    document.getElementById("tab_"+n_volee+"_"+i).innerHTML = tab_tri[i].v();
    if(tab_tri[i].X() == true)
      document.getElementById("tab_"+n_volee+"_"+i).innerHTML += "+";
  }                     
  
 
  // sauvegarde temporaire de la série
  // toute volée validée est sauvegardée pour pouvoir reprendre la série en cours
  if(document.getElementById("save_auto").checked == true)
  {
    if(isave.actual_name == "sans_nom" || isave.actual_name == "")
    {
      save_local_temp();
      isave.is_save=false; // n'est pas sauvegardé sous un nom défini par l'utilsateur
    }
    else
    {
      save_local(isave.actual_name); // si un non est défini on sauvegarde
      isave.is_save=true;             // et on ne met pas la marque
    }
  }
  else
  {
    // on ne gère que la sauvegarde temporaire
    save_local_temp();
    isave.is_save=false;
  }
  gestion_save_name();


  // effacement des scores dans le tableau de la saisie et masquage des flèches
  for (var i=0;i<nb_fl_volee;i++)
  {
    document.getElementById('saisie_fl'+i).innerHTML="";
    document.getElementById("zoom_fl"+n_volee+"_"+i).style.display="none";
    document.getElementById("target_fl"+n_volee+"_"+i).style.display="none";
  }


  n_volee++;
  n_fl=0;
  fl=[];

  // affichage du numéro de la volée
  if (n_volee == nb_volee)
  {
    document.getElementById("saisie").innerHTML="";
    document.getElementById("but_saisie").style.display="none";
    document.getElementById("gotosaisie").style.display = "none";
    visu("tab_score");
    visu_target(0);
  }
  else
    document.getElementById("num_volee").innerHTML=n_volee+1;
  
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
  fl[n_fl].x = x/zone_size;
  fl[n_fl].y = y/zone_size;

  document.getElementById("valf").innerHTML=fl[n_fl].v();
  if(fl[n_fl].X()==true)
    document.getElementById("valf").innerHTML+="+";
  
  var nbv=6 // nombre de mouvents intermédiaires
  var delai=50 // délai par mouvements
  if((fl[n_fl].v() < (11-nb_zone) || fl[n_fl].v()==0) && adaptNbZonePlus == false)
  {  
    adaptNbZonePlus=true;
    if(nb_zone<(serie.nb_zone_spot+5))
    {
      for(var i=1;i<nbv+1;i++)
        setTimeout('target_view('+(nb_zone+(i/nbv))+')',i*delai);
      setTimeout('adaptNbZonePlus=false',(i-1)*delai);
    }
    else
      adaptNbZonePlus=false;

  }
  if(fl[n_fl].v() >= 11-nb_zone)
    adaptNbZonePlus == false;
  
  
  if(fl[n_fl].v() > 8 && adaptNbZoneMinus == false)
  {
    adaptNbZoneMinus=true;
    if(nb_zone > userp.nb_zone)
    {
      for(var i=1;i<nbv+1;i++)
        setTimeout('target_view('+(nb_zone-(i/nbv))+')',i*delai);
      setTimeout('adaptNbZoneMinus=false',(i-1)*delai);
    }
    else
      adaptNbZoneMinus=false;
  }

  zoom_move(x,y);
};

function start_coord(event)
{
  if (n_fl >= serie.nb_f || n_volee >= serie.nb_v || el_visible =="analyse") // si on est à la fin de la volée ou qu'il n'y a plus de volée à faire
    return;                                       // on ne fait rien

  if( window.event)
    event = window.event;
  
  var x = event.clientX-targetX-targetW/2;
  var y = event.clientY-targetY-targetH/2;
  
  fl[n_fl] = new arrow(x/zone_size,y/zone_size,diam_tube,blason,distance,n_fl);
  zoom_actif=true;
  visu("zoom");
  coord(event);
};

var adaptNbZoneMinus=false;
var adaptNbZonePlus=false;
function stop_coord(event)
{
  if (n_fl >= nb_fl_volee || n_volee >= nb_volee || el_visible =="analyse") // si on est à la fin de la volée ou qu'il n'y a plus de volée à faire
    return;
  
  adaptNbZonePlus=false;
  adaptNbZoneMinus=false;
    
  if(nb_zone != userp.nb_zone)
  {
    var interval=15; // interval entre chaque mouvement
    var mvtsparzone=8; // nombre de mouvements par zone à reprendre
    for(var i=1;i<(nb_zone-userp.nb_zone)*mvtsparzone+1;i++)
      setTimeout('target_view('+(nb_zone-i/mvtsparzone)+')',i*interval);
    setTimeout('target_view('+userp.nb_zone+')',(i+5)*interval); // pour éviter des zones incomplètes ne cas de manipulation rapide et s'assurer de retrouver le bon nombre de zones
  }

  // on place et on montre la flèche dans le zoom  
  document.getElementById("zoom_fl"+n_volee+"_"+n_fl).setAttribute("cx",50*fl[n_fl].x);
  document.getElementById("zoom_fl"+n_volee+"_"+n_fl).setAttribute("cy",50*fl[n_fl].y);
  document.getElementById("zoom_fl"+n_volee+"_"+n_fl).style.display="block";

  // on place et on motre la flèche dans la cible
  document.getElementById("target_fl"+n_volee+"_"+n_fl).setAttribute("cx",50*fl[n_fl].x);
  document.getElementById("target_fl"+n_volee+"_"+n_fl).setAttribute("cy",50*fl[n_fl].y);
  document.getElementById("target_fl"+n_volee+"_"+n_fl).style.display="block";
  
  zoom_actif=false;
  visu("saisie");
  document.getElementById('saisie_fl'+n_fl).innerHTML=fl[n_fl].v();
  if(fl[n_fl].X() == true)
    document.getElementById('saisie_fl'+n_fl).innerHTML+="+";
    
  n_fl++;
  
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
  zoom_target+='<line id="mirev" x1="'+zoomW/2+'" y1="-1000" x2="'+zoomW/2+'" y2="1000"/>';
  zoom_target+='<line id="mireh" y1="'+zoomH/2+'" x1="-1000" y2="'+zoomH/2+'" x2="1000"/>';
  zoom_target+='</g>';

  // la flèche en cours
  zoom_target+='<circle cx="'+zoomW/2+'" cy="'+zoomH/2+'" r="'+arrowR+'" id="point_arrow" class="point_arrow" />';
  zoom_target+='</g>';
  
  // fin de l'image
  zoom_target+='</svg>';
  
  // texte des points
  zoom_target+='<div id="valf"></div>';

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
  this.v = function()
           {
             var v = 11-this.r()+(this.t/this.b);
             if(this.modeX == true && v<10.5 && v>=9)
               v=9;                 
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
    this.minv = 0;
};


function zoom_move(x,y)
{
  document.getElementById("center_zoom_target").setAttribute("transform","matrix(1,0,0,1,"+((-1000/targetW*x)/zoom+zoomW/2)+","+((-1000/targetH*y)/zoom+zoomH/2)+")");
};
function zoom_scale(z)
{
   z=z*zoomW/1000;
   if(document.getElementById("zoom_scale"))
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
  
  //la zone de réussite
  target+='<circle id="zone_reussite" cx="0" cy="0" r="0" />';

  //moyenne des flèches
  target+='<circle id="moy_fleche" cx="0" cy="0" r="0" />';

  //moyenne d'une flèches
  target+='<circle id="zone_fleche" cx="0" cy="0" r="0" />';
  
  //dispersion h
  target+='<g id="dispersion">';
  target+='<line x1="-500" y1="0" x2="500" y2="0" id="disph1"/><line x1="-500" y1="0" x2="500" y2="0" id="disph2"/>';
  //dispersion l
  target+='<line x1="0" y1="-500" x2="0" y2="500" id="displ1"/><line x1="0" y1="-500" x2="0" y2="500" id="displ2"/>';
  target+='</g>';
  // les flèches qui seront tirées
  for(var v=0;v<serie.nb_v;v++)
    for(var f=0;f<serie.nb_f;f++)
      target+='<circle cx="1000" cy="1000" r="'+arrowR+'" style="display:none" class="arrowt" id="target_fl'+v+'_'+f+'"/>';
    
  target+='</g></svg>';
  
  //dessin de la cible zoom
  document.getElementById("target").innerHTML=target;
};
function target_view(zone)
{
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
  
  //console.debug('--------');
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
  zoom_scale(10.5-nb_zone/2-(nb_zone-1)*0.1);
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
  for(var f=0;f<fl.length;f++) // masquage des flèches qui ne sont pas dans les zones visibles ou qui sont en cours de saisie
  {
    if(fl[f].v()<11-zone || f==n_fl)
      document.getElementById("target_fl"+n_volee+"_"+f).style.display="none";
    else
      document.getElementById("target_fl"+n_volee+"_"+f).style.display="block";
  }
  if(document.getElementById("center_target"))
    document.getElementById("center_target").setAttribute("transform","matrix("+scale+",0,0,"+scale+","+targetW/2+","+targetH/2+")");
};

function zone_reussite()
{
  if(serie.volees.length==0) return;
  
  var moy=0;
  var tab_tri=[];
  var i=0;
  for(var v=0;v<serie.volees.length;v++)
  {
    for(var f=0;f<serie.nb_f;f++)
    {
      tab_tri[i]=serie.volees[v][f].v();
      i++;
    }
  }
  var borneh=Math.round(i*0.8);
  var borneb=Math.round(i*0.6);

  tab_tri.sort(function(a,b){return a-b}).reverse();
  for(var f=borneb;f<borneh;f++)
    moy+=tab_tri[f];

  document.getElementById("zone_reussite").setAttribute("r",50*(11-moy/(borneh-borneb)));
  document.getElementById("zone_reussite_val").innerHTML=Math.round(10*moy/(borneh-borneb))/10;
};

function moyenne_f()
{
  if(serie.volees.length==0) return;

  var moy=0;
  var i=0;
  for(var v=0;v<serie.volees.length;v++)
  {
    for(var f=0;f<serie.nb_f;f++)
    {
      moy+=serie.volees[v][f].v();
      i++;
    }
  }
  
  document.getElementById("moy_fleche").setAttribute("cx",0);
  document.getElementById("moy_fleche").setAttribute("cy",0);
  document.getElementById("moy_fleche").setAttribute("r",50*(11-moy/i));
  document.getElementById("moy_fleche_val").innerHTML=Math.round(100*moy/i)/100;
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
  if(f!="reset")
  {
    var v=0;
    var tab=[];
    //calcul de la position moyenne
    for(v=0;v<serie.volees.length;v++)
    {
      if(serie.volees[v][f].v()>0 || ignore0!=true)
      {
        cx+=serie.volees[v][f].x;
        cy+=serie.volees[v][f].y;
        tab[v]={x:serie.volees[v][f].x,
                y:serie.volees[v][f].y,
                r:serie.volees[v][f].r,
               };
      }
    }
    cx=cx/v;
    cy=cy/v;
    console.debug(tab);
    //calcul du rayon par rapport à la position moyenne
    for(v=0;v<serie.volees.length;v++)
    {
      if(tab[v] || ignore0!=true)
      {
        tab[v].x-=cx;
        tab[v].y-=cy;
        if(tab[v].r() > r)
          r=tab[v].r();
      }
    }
  }
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

  var dh1=0;
  var dh2=0;
  var dl1=0;
  var dl2=0;
  var f=0;
  for(var v=0;v<serie.volees.length;v++)
  {
    if(aff_fl.v[v] == true)
    {
      for(f=0;f<serie.volees[v].length;f++)
      {
        if(serie.volees[v][f].v()>0 || ignore0!=false)
        {
          if(serie.volees[v][f].y>dh1)
            dh1=serie.volees[v][f].y;
          if(serie.volees[v][f].y<dh2)
            dh2=serie.volees[v][f].y;
          if(serie.volees[v][f].x>dl1)
            dl1=serie.volees[v][f].x;
          if(serie.volees[v][f].x<dl2)
            dl2=serie.volees[v][f].x;
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
function aff_volee_num(v)
{
  aff_fl.v[v] = !aff_fl.v[v];
  display_fl();
};
function aff_fl_num(f)
{
  if(aff_fl.f[f] == true && document.getElementById("aff_fl_all").className=="cellule_but")
  {
    aff_fl_all("reset");
    return;
  }
  document.getElementById("aff_fl_all").className=aff_fl_all("cellule_but_on");
  
  aff_fl.f[f] = !aff_fl.f[f];
  display_fl();
  group_fleche(f);

};
function aff_volee_all(cl)
{
  var af=false;
  if(cl=="cellule_but")
    af=true;

  for(var v=0;v<serie.nb_v;v++)
    aff_fl.v[v] = af;
  
  display_fl();
  
  if(cl=="cellule_but")  
    return "cellule_but_on";
  else
    return "cellule_but";
};
function aff_fl_all(cl)
{
  if(cl=="reset")
  {
    for(var f=0;f<aff_fl.length;f++)
      aff_fl[f].f=false;
    document.getElementById("aff_fl_all").className="cellule_but";
    display_fl();
  }
  document.getElementById("aff_volee_all").className=aff_volee_all("cellule_but_on");
  var af=false;
  if(cl=="cellule_but")
    af=true;

  for(var f=0;f<serie.nb_f;f++)
    aff_fl.f[f] = af;
  
  display_fl();
    group_fleche("reset");

  
  if(cl=="cellule_but")  
    return "cellule_but_on";
  else
    return "cellule_but";
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
      if(aff_fl.v[v]==true) tab_display[v][f]=aff_fl.v[v];
  for(var f=0;f<serie.nb_f;f++)
    for(var v=0;v<serie.nb_v;v++)
      if(aff_fl.f[f]==true) tab_display[v][f]=aff_fl.f[f];
   
  for(var v=0;v<serie.volees.length;v++)
  {
    for(var f=0;f<serie.nb_f;f++)
    {
      if(serie.volees[v][f])
      {
        var fd=document.getElementById("target_fl"+v+"_"+f);
        if(tab_display[v][f] == true)
        {
          fd.setAttribute("cx",50*serie.volees[v][f].x);
          fd.setAttribute("cy",50*serie.volees[v][f].y);          
          fd.style.display="block";
        }
        else
        {
          fd.style.display="none";
        }
      }
    }
  } 
  draw_disp();   
  
  
  for (var v=0;v<nb_volee;v++)
  {
    if(aff_fl.v[v] == true)
        document.getElementById("v"+v).className = "cellule_but_on";
    else
        document.getElementById("v"+v).className = "cellule_but";
  }
  for (var f=0;f<nb_fl_volee;f++)
  {
    if(aff_fl.f[f] == true)
      document.getElementById("f"+f).className ="cellule_but_on";
    else
      document.getElementById("f"+f).className = "cellule_but";
  }
};
