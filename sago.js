/**************
 * sago 0.3.0 *
 * ************/

var news="<p>Au moment de l’enregistrement, un nom automatique est désormais proposé.</p>";
var el_visible="session";
var high_contrast=false;
var target;
var zoom_target;
var zoom=1;
var serie = {
    nb_v : 0,
    nb_f : 0,
    date : "",
    datemod : "",
    id : "",
    volees : new Array,
    com : new Array,
    dist : 0,
    blason : 0,
    modeX : false,
    nb_zone_spot : 10,
    tube : 0,
    tot : 0 };
var n_fl=0;
var n_volee=0;
var isave = {
  actual_name : "",
  is_save : false
};
var infoapp= {
  version : '0.3.0',
  datecode : 20160103.02,
  name : "Sago",
  mail : "tazzon@free.fr",
  dev : "AM"
};
var fl_saisie_save=[];


function init_() 
{
  document.getElementById("page_title").innerHTML = infoapp.name+" "+infoapp.version;
  //;;;console.debug(localStorage.getItem("userp"));
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
 
  //document.getElementById("ratio").value=ratio;
  //change_zoom();
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


  //console.debug("valid_session");
  if (serie.tot > 0 || n_fl > 0)  // on prévient qu'on va écraser la série précédente
   if(isave.is_save == false) 
    if (confirm("La série précédente « "+isave.actual_name+" » n'a pas été enregistrée, voulez-vous l'écraser ?") == false)
    {
      visu("tab_score");
      return;
    }
    //console.debug(isave);

    localStorage.removeItem("temp");
    isave.actual_name="sans_nom";
    isave.is_save=false;

    //console.debug(isave);
    
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
  
  // pour sauvegarder le diamètre du tube
  user_pref("save");


  volee = [];
  fl_saisie_save=[];
  tab_display=[];

  aff_fl = { v:new Array, f:new Array };
  //extr_aff_fl = { v:new Array, f:new Array };
  
  for (var v=0 ; v<nb_volee ; v++)
  {
    serie.com[v] = ""; // création du tableau commentaire sans contenu
    aff_fl.v[v] = false; // crétation des volées affichées
    fl_saisie_save[v]=[];
    tab_display[v]=[];
    //extr_aff_fl.v[v] = false; // idem extrapol
  }
  for (var f=0 ; f<nb_fl_volee ; f++)
  {
    aff_fl.f[f] = false; // création des flèches affichées
    //extr_aff_fl.f[f] = false // idem extrapol
  }
  
  
  
  //document.getElementById("extrapol_dist").value = distance;
  //document.getElementById("extrapol_blason").value = blason;
  //document.getElementById("extrapol_tube").value = diam_tube;

  n_fl = 0;
  n_volee = 0;
  serie.tot = 0;

  //console.debug(serie);

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
  tab_ana +='<p>Zone de réussite : <span id="zone_reussite_val"></span><span class="zone_reussite_legend"></span></p>';
  tab_ana +='<p>Moyenne : <span id="moy_fleche_val"></span><span class="moy_fleche_legend"></span></p>';

  //tab_ana += '<input type="checkbox" id="trace_zone_fl" onchange="draw_group()"><label for="trace_zone_fl">⊙</label>      <input type="checkbox" id="trace_disp_h" onchange="draw_group()"><label for="trace_disp_h">⇕</label>      <input type="checkbox" id="trace_disp_l" onchange="draw_group()"><label for="trace_disp_l">⇔</label>';
  document.getElementById("analyse").innerHTML = tab_ana;

  visu('saisie');
  //visu("zoom");
  zoom_move(0,0);
  document.getElementById("num_volee").innerHTML=n_volee+1;
  //draw_target();
  visu_target(1);
  //gestion_save_name();
  //console.debug("fin : valid_session");
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

  
 //console.debug(n);
  for(var i=n ; i>0 ; i--)
  {
    n_fl--;
    document.getElementById("saisie_fl"+n_fl).innerHTML="";
    document.getElementById("zoom_fl"+n_volee+"_"+n_fl).style.display="none";
    document.getElementById("target_fl"+n_volee+"_"+n_fl).style.display="none";
  }
  //adapt2viewport();

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
  //tab_tri.sort(function(a,b){return a.v()-b.v()}).reverse();
  tab_tri.sort(function(a,b){
                              if(a.X()==false && b.X()==true)
                                return -1;
                              if(a.X()==true  && b.X()==false)
                                return 1;
                              return 0;
                            });
  tab_tri.sort(function(a,b){return a.v()-b.v()}).reverse();                              
  //console.debug(tab_tri)
  // affichage de la volée triée dans la feuille de marque
  for (var i=0 ; i<nb_fl_volee ; i++)
  {
    //document.getElementById("tab_"+(n_volee)+"_"+i).innerHTML = volee[n_volee][i].v();
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
      //save_local("temp"); //sauvegarde temporaire
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
    //save_local("temp");
    save_local_temp();
    isave.is_save=false;
  }
  //document.getElementById("name_session").innerHTML = isave.actual_name+"*";
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
  // dessin de la cible
  //draw_target();
  
  color_marque(userp.color_marque);
  
};


var zoom_actif=false;
var fl=[];
function coord(event) 
{
  if(zoom_actif == false)
    return;
  //console.debug("zone_size="+zone_size);
  //var startTime=new Date().getTime();
  //var elapsedTime=0;

  if( window.event)
    event = window.event;
  
  var x = event.clientX-targetX-targetW/2;
  var y = event.clientY-targetY-targetH/2;
  fl[n_fl].x = x/zone_size;
  fl[n_fl].y = y/zone_size;

  //console.debug(fl[n_fl].v());
  
  //var stroke=new Array("green","#dddddd","#dddddd","#222222","#222222","#009fe0","#009fe0","#e21019","#e21019","#feed01","#feed01");
  
  document.getElementById("valf").innerHTML=fl[n_fl].v();
  //document.getElementById("point_arrow").style.fill=stroke[fl[n_fl].v()];
  if(fl[n_fl].X()==true)
    document.getElementById("valf").innerHTML+="+";
  
  
  if(fl[n_fl].v() < (11-nb_zone) && adaptNbZonePlus == false)
  {  
    //console.debug("hors zone");
    adaptNbZonePlus=true;
    if(nb_zone<10)
    {
      for(var i=1;i<6;i++)
        setTimeout('target_view('+(nb_zone+(i/5))+')',i*100);
      setTimeout('/*target_view("+");*/adaptNbZonePlus=false',500);
    }
      //setTimeout('change_nb_zone("+",true);adapt2viewport();adaptNbZonePlus=false',500);
    else
      adaptNbZonePlus=false;

  }
  if(fl[n_fl].v() >= 11-nb_zone)
    adaptNbZonePlus == false;
  
  
  //if(fl[n_fl].v() > (10-nb_zone_save) && adaptNbZoneMinus == false)
  if(fl[n_fl].v() > 8 && adaptNbZoneMinus == false)
  {
    //console.debug('Dans la zone');
    adaptNbZoneMinus=true;
    if(nb_zone > userp.nb_zone)
    {
      for(var i=1;i<6;i++)
        setTimeout('target_view('+(nb_zone-(i/5))+')',i*100);
      setTimeout('/*target_view("-");*/adaptNbZoneMinus=false',500);
    }
      //setTimeout('change_nb_zone("-",true);adapt2viewport();adaptNbZoneMinus=false',500);
    else
      adaptNbZoneMinus=false;
  }

  zoom_move(x,y);
  //elapsedTime = new Date().getTime() - startTime;
  //document.getElementById("button_menu").innerHTML = elapsedTime;
}

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
    var interval=25; // interval entre chaque mouvement
    var mvtsparzone=5; // nombre de mouvements par zone à reprendre
    for(var i=1;i<(nb_zone-userp.nb_zone)*mvtsparzone+1;i++)
      setTimeout('target_view('+(nb_zone-i/mvtsparzone)+')',i*interval);
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
  if(serie.nb_zone_spot>=7)  // 4, 3, 2, 1
    zoom_target+='<circle cx="0" cy="0" r="499" fill="white" stroke="black"  stroke-width="2"/><circle cx="0" cy="0" r="450" fill="white" stroke="black"  stroke-width="1"/><circle cx="0" cy="0" r="399" fill="black" stroke="black"  stroke-width="2"/><circle cx="0" cy="0" r="350" fill="black" stroke="white"  stroke-width="1"/>';
  if(serie.nb_zone_spot>=6)  // 5
    zoom_target+='<circle cx="0" cy="0" r="301" fill="#009fe0" stroke="black"  stroke-width="2"/>';
  if(serie.nb_zone_spot>=5) // 6
    zoom_target+='<circle cx="0" cy="0" r="250" fill="#009fe0" stroke="black"  stroke-width="1"/>';

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
  
  // la flèche en cours
  zoom_target+='<circle cx="'+zoomW/2+'" cy="'+zoomH/2+'" r="'+arrowR+'" id="point_arrow" class="point_arrow" />';
  zoom_target+='</g>';
  
  // la valeur de la flèche en cours
  //zoom_target+='<text x="0.2em" y="1em" id="valf"></text>';
    
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
             //if(this.ModeX == true)
             //  return false;
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
  //console.debug(x+";"+y);
};
function zoom_scale(z)
{
   z=z*zoomW/1000;
   //console.debug(z);
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

var nb_zone;
var zone_size;
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
  if(zone>serie.nb_zone_spot) // au plus les zones pour le spot
    zone=serie.nb_zone_spot;
  if(zone<2) // toujours au moins 9 et 10
    zone=2;
  
  //coloration des cases de selection dans les options
  //masquage de toutes les zones inutiles et affichage neutre des autres
  
  //console.debug('--------');
  for(var z=1;z<10;z++)
  {
    //console.debug(z+" <= "+serie.nb_zone_spot)
    if(z > 10-serie.nb_zone_spot)
      document.getElementById("tv"+z).className="tv_unset";
    else
      document.getElementById("tv"+z).className="tv_inactif";
  }
  //coloration des zone actives (nb_zone)
  var tab_color=new Array("tv_white","tv_white","tv_black","tv_black","tv_blue","tv_blue","tv_red","tv_red","tv_yellow");
  for(var i=9;i>(10-zone);i--)
  {
    //console.debug("i="+i+" ; "+(11-nb_zone)+" ; "+tab_color[i-1]);
    document.getElementById("tv"+i).className=tab_color[i-1];
  }


  //affichage des zones  
  nb_zone=zone;
  zone_size=targetH/(2*nb_zone);
  
  zoom_scale(10.5-nb_zone/2-(nb_zone-1)*0.28);
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

function save_local_temp()
{
  save_local("temp");
  //document.getElementById("info_save_temp").className = "show";
  //setTimeout('document.getElementById("info_save_temp").className = "mask"',2000);
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
  /*console.debug("load_local_data");
  console.debug(isave);
  console.debug(name);*/

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

  /*console.debug(serieTemp);
  console.debug(serie);
  console.debug(isave);*/

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
      //console.debug(v+";"+f+";"+volee[v][f].v());
      //document.getElementById("tab_"+v+"_"+f).innerHTML = volee[v][f].v();
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
    isave.actual_name=name;
    isave.is_save=true;
    gestion_save_name();
  }
  /*console.debug(isave);
  console.debug("fin : load_local_data");*/
};

function save_local(name_auto)
{
  //console.debug(typeof(name_auto));
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

    isave.actual_name = name;
    isave.is_save = true;


    if (name == null)
    {
      //console.debug("null ; name="+name);
      return;
    }
  }
  else
  {
    var name=name_auto;
    if(isave.actual_name == "")
      isave.actual_name="sans_nom";
    
  }

  //console.debug("name="+name);
  //var now = new Date();
  serie.id = name;
  //console.debug(serie.id);  
  //serie.date = now.getDate()+"/"+now.getMonth()+"/"+now.getFullYear()+" "+now.getHours()+":"+now.getMinutes();
  serie.datemod=new Date().getTime(); // date au format timestamp unix de la dernière modification
  //console.debug(serie.date);
  serie.volees = volee;
  //console.debug(serie.volees);

  // suppression de la sauvegarde temporaire et sauvegarde de la série sous le nom donné (si c'est une temporaire on la recrée')
  //console.debug("suppression sauvegarde temporaire");
  localStorage.removeItem("temp");
  //console.debug("création d'une sauvegarde : "+name)
  localStorage.setItem(name,JSON.stringify(serie));
  //document.getElementById("name_session").innerHTML = isave.actual_name;
  gestion_save_name();
};
function gestion_save_name()
{
  document.getElementById("name_session").innerHTML=isave.actual_name;
  if(isave.is_save == false)
    document.getElementById("name_session").innerHTML+="*";
};

// préférence utilisateur par défaut
var userp = {
  diam_tube:6,
  hc:false,
  ratio:2.5,
  nb_zone:10,
  auto_save:true,
  chrtemps:120,
  chrpretemps:10,
  chrmitemps:30,
  color_marque:false,
};
function user_pref(a)
{
  if(a == "save")
  {
    //console.debug("save");
    userp.diam_tube = diam_tube;
    userp.hc = high_contrast;
    userp.ratio = ratio;
    userp.nb_zone = nb_zone;
    userp.auto_save=document.getElementById("save_auto").checked;
    userp.chrtemps=c.temps;
    userp.chrpretemps=c.pretemps;
    userp.chrmitemps=c.mitemps;
    userp.color_marque=document.getElementById("color_marque").checked;
    localStorage.setItem('userp',JSON.stringify(userp));
  }
  if(a == "restore")
  {
    //console.debug("restore");
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
    target_view(userp.nb_zone);
    color_marque(userp.color_marque);
    change_style();
    c.reset();
  }
};

// affiche l'onglet demandé par le menu 
var el_visible;
function visu(el)
{
  //console.debug("visu:"+el);
  document.getElementById(el_visible).style.display = "none";
  visu_analyse_el(el);

  el_visible = el;
  document.getElementById(el).style.display = "block";
  //adapt2viewport();
};

function visu_analyse_el(toEl)
{
  //console.debug(el_visible+" --> "+toEl);
  if(document.getElementById("main_target")==null || (el_visible=="zoom" && toEl=="saisie") || (el_visible=="saisie" && toEl=="zoom"))
  {
    //console.debug(el_visible+" "+toEl+" , return");
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
        //else
          //document.getElementById("target_fl"+v+"_"+f).style.display=="none";
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
    document.getElementById("target").style.display="block";
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
  //user_pref("save");
};

function commentaire(n,consult)
{
  //console.debug(n+";"+consult)
  if (n != null)
  {
    var tmp_com=serie.com[n];
    if(consult == null)
    {
      if (confirm("Commentaire "+(n+1)+" : "+serie.com[n]+"\nVoulez vous le modifier ?") == true)
      {
        serie.com[n] = prompt("Modifiez le commentaire",serie.com[n]);
        //console.debug(tmp_com+";"+serie.com[n]);
        if(tmp_com != serie.com[n])
        {
          if(document.getElementById("save_auto").checked == true)
          {
            if(isave.actual_name == "sans_nom" || isave.actual_name == "")
            {
              isave.is_save = false;
              //save_local("temp");
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
      //document.getElementById("comi"+v).className = "com_ok";
    }
    else
    {
      document.getElementById("com_"+v).className = "no_com";    
      //document.getElementById("comi"+v).className = "no_com";
    }
  }

};


var ratio=2.9;
var targetX;
var targetY;
var targetW;
var targetH;
var zoomX;
var zoomY;
var zoomH;
var zoomW;
function adapt2viewport()
{
  //;;;console.debug("ratio:"+ratio);

  var el_target = document.getElementById("target");
  var el_zoom = document.getElementById("zoom");
  
  var W = window.innerWidth;
  var H = window.innerHeight;
  // adaptation de la taille du texte
  //document.getElementsByTagName("body")[0].style.fontSize = Math.round(H/ratio)+"%";
  //console.debug( "fontSize=" +Math.round(H/ratio)+"%");
  document.getElementsByTagName("body")[0].style.height = H-1+"px";
  document.getElementById("local").style.height = H-1+"px";
  
  if (W > H) // orientation horizontale
  {
    //console.debug("horizontale");
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
    //if(el_visible == "saisie" || el_visible=="analyse")
    // document.getElementsByTagName("body")[0].style.width=(W-H-marge)+"px";
    //else
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
    //recentrage du zoom_target
    document.getElementById("center_zoom_target").setAttribute("transform","matrix(1,0,0,1,"+(zoomW/2)+","+(zoomH/2)+")");
    target_view(nb_zone);
  }
  if(document.getElementById("main_target"))
  {
    document.getElementById("main_target").setAttribute("width",targetW);
    document.getElementById("main_target").setAttribute("height",targetH);
    //target_view(nb_zone);
    var scale=(10/nb_zone)/1000*targetW;
    document.getElementById("center_target").setAttribute("transform","matrix("+scale+",0,0,"+scale+","+targetW/2+","+targetH/2+")");
    //aff_etiq(W+"×"+H,4000);
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

/*************************************************/
// les textes d'aide en fonction de l'onglet ou l'on se trouve
var help_session='<p>Choisissez les paramètres de votre session (nombre de volées, flèches par volée, distance, diamètre du blason).</p><p>Le diamètre du tube est respecté à l’affichage lors de la saisie des flèches, soyez le plus près possible de la réalité.</p><p>Si vous cochez la case « Spot », votre blason complet sera limité au 6 ou au 5 suivant votre choix.</p><p>Vous pouvez enfin choisir d’utiliser un petit 10 en cochant la case « Petit 10 ».</p>';
var help_tab_score='<p>La feuille de marque permet de voir les volées qui ont été faite et validées dans l’onglet de saisie.</p><p>Vous pouvez ajouter un commentaire (icône <span class="icon icon-comment"></span>) par volée (changement de réglage, sensation, etc).</p><p>Vous pouvez sauvegarder à tout moment la volée en cours grâce au bouton <span class="icon icon-floppy"></span>.Le nom d’une série non enregistrée est suivie d’un astérisque (*).</p><p>Le bouton <span class="icon icon-bullseye"></span> permet un accès direct à la saisie de la volée en cours.</p>';
var help_saisie='<p>Les flèches peuvent être saisies dans n’importe quel ordre (numéro de flèche par exemple), elles seront triées automatiquement dans la feuille de marque lors de la validation de la volée par le bouton <span class="icon icon-ok"></span>.</p><p>Lors de la saisie d’une flèche, si celle-ci se trouve hors de la cible visible, déplacez votre doigt hors de la cible pour ajouter des zones. Un passage rapide dans le jaune supprimera une à une les zones ajoutées. À la fin de chaque flèche, le blason reprendra l’aspect choisi dans les options.</p><p>Vous pouvez recommencer la dernière flèche en appuyant sur le bouton <span class="icon icon-reply"></span> ou toute la volée grace au bouton<span class="icon icon-reply-all"></span>.</p><p>Vous pouvez ajouter un commentaire à la volée en cours (avant de la valider) avec le bouton <span class="icon icon-comment"></span>, il sera consultable ou modifiable ultérieurement dans la feuille de marque.</p><p>Le bouton <span class="icon icon-table"></span> permet un accès direct à la feuille de marque de la volée en cours.</p>';
var help_options='<p>Augmenter au diminuez la taille globale de l’affichage pour l’ensemble de l’application avec les boutons <span class="icon icon-zoom-out"></span> ou <span class="icon icon-zoom-in"></span>.</p><p>Si vous maintenez cochée la case « sauvegarde automatique », à chaque validation d’une volée, la série sera sauvegardée.<p><p>Dans le cas d’une utilisation en extérieur (ou suivant vos goûts), il peut être utile de passer l’interface en contraste élevé.</p><p>Vous pouvez choisir le nombres de zones visible du blason lors de la saisie des flèches.</p>';
var help_local='<p>Ici se trouvent les séries que vous avez enregistrées. Vous pouvez les revoir ou les reprendre si elles n’étaient pas terminées.</p><p>Choisissez la série, appuyez sur le bouton <span class="icon icon-folder-open"></span> et chargez la. Si vous souhaitez la supprimer, appuyer sur le bouton <span class="icon icon-trash"></span>.</p><p>Si vous souhaitez avoir plus d’informations sur cette série, cliquez sur le bouton <span class="icon icon-info"></span>.';
var help_analyse="<p>Vous pouvez analyser votre série en choisissant d’afficher les volées ou les flèches.</p><p>Vous pouvez afficher ou masquer les différentes volées. Des lignes blanches matérialisent la dispersion horizontale et verticale de l’ensemble des volées affichées. Le bouton « Volées » affiche ou masque l’ensemble des volées.</p><p>Si vous ne selectionnez qu’une flèche, vous avez une représentation de son groupement en violet. Si vous appuyez sur le bouton flèches, vous avez l’ensemble des flèches qui s’affiche ou se masque.</p><p>La zone de réussite est dessinée en vert pointillé, la moyenne de toutes les flèches est dessinée en rose. Ces informations sont également données sous le tableau.</p>";
var help_viseur='<p>Indiquez pour deux distances les réglages du viseur, indiquez la distance (X) pour laquelle vous souhaitez trouvez la valeur de réglage et appuyez sur calculer.</p>';
var help_chrono='<p>Paramétrez le chronomètre en appuyant sur le bouton <span class="icon icon-sliders"></span>.</p><p>Lancer le chronomètre à l’aide du bouton <span class="icon icon-play"></span>, le décompte commence. À la fin de celui-ci, le temps commence à être décompté. Faites <span class="icon icon-pause"></span> pour stopper le chronomètre.</p><p>Le bouton <span class="icon icon-history"></span> réinitialise le chronomètre.</p><p>Le bouton <span class="icon icon-bell-alt"></span> permet de d’activer ou non le son du chronomètre.</p>';
function help()
{
  ialert("<h3>AIDE</h3>"+eval("help_"+el_visible));
}

function about()
{
  ialert('<h3>À propos</h3>'
        +'<div class="about"><p>'+infoapp.name+' <span style="color:#dc322f" class="icon icon-sago-(copie-1)"></span><br>'
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
  //console.debug(tab_tri);
  for(var f=borneb;f<borneh;f++)
    moy+=tab_tri[f];

  document.getElementById("zone_reussite").setAttribute("r",50*(11-moy/(borneh-borneb)));
  document.getElementById("zone_reussite_val").innerHTML=Math.round(10*moy/(borneh-borneb))/10;
  //document.getElementById("zone_reussite").setAttribute("r",50*(11-tab_tri[borneh]));
  //document.getElementById("zone_reussite_val").innerHTML=tab_tri[borneh];
  
  //return Math.round(10*moy/(borneh-borneb))/10;
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

  //document.getElementById("moy_fleche").setAttribute("cx",50*moyx/i);
  //document.getElementById("moy_fleche").setAttribute("cy",50*moyy/i);
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
  //console.debug(cx+" "+cy);

  //calcul du rayon par rapport à la position moyenne
  var f_larg=0;
  var tab=serie.volees[v].slice();
  //console.debug(tab);
  for(f=0;f<serie.volees[v].length;f++)
  {
    tab[f].x-=cx;
    tab[f].y-=cy;
    if(tab[f].r() > r)
      r=tab[f].r();
  }
  //console.debug(cx+" "+cy+" "+r);
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
      cx+=serie.volees[v][f].x;
      cy+=serie.volees[v][f].y;
      tab[v]={x:serie.volees[v][f].x,
              y:serie.volees[v][f].y,
              r:serie.volees[v][f].r,
             };
    }
    cx=cx/v;
    cy=cy/v;
    //console.debug(cx+" "+cy);

    //calcul du rayon par rapport à la position moyenne
    //var f_larg=0;
    //var tab=serie.volees[v].slice();
    //console.debug(tab);
    for(v=0;v<serie.volees.length;v++)
    {
      tab[v].x-=cx;
      tab[v].y-=cy;
      if(tab[v].r() > r)
        r=tab[v].r();
    }
  }
  //console.debug(cx+" "+cy+" "+r);
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

var aff_fl;
function aff_volee_num(v)
{
  //document.getElementById("aff_fl_all").className=aff_fl_all("cellule_but_on");
  //aff_fl_all("reset");
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
  /*for (var v=0 ; v<serie.volees.length ; v++)
    aff_volee_num(v);*/
  


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
  /*for(var f=0 ; f<serie.nb_f ; f++)
    aff_fl_num(f);*/
  if(cl=="reset")
  {
    for(var f=0;f<aff_fl.length;f++)
      aff_fl[f].f=false;
    document.getElementById("aff_fl_all").className="cellule_but";
    display_fl();
    //document.getElementById("aff_fl_all").className=aff_fl_all("cellule_but_on");
    //return;
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


var tab_display=[];
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
      /*console.debug("v:"+v+" ; f:"+f);
      console.debug(serie.volees[v][f]);*/
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
  var first_day=new Date(new Date(ladate.getFullYear(),ladate.getMonth(),1)).getDay();
  var dayCount=2-first_day;
  if(first_day == 0)
    dayCount-=7;
  var MaxCount=28;
  while(ladate.getMonth() == new Date(new Date(ladate.getFullYear(),ladate.getMonth(),++MaxCount)).getMonth());

  var month=new Array("Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre");
  var titre=month[ladate.getMonth()]+" "+ladate.getFullYear();
  
  var calendar='<table class="calendar">';

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


  calendar+='<tr><td onclick="calendrier('+prev_a+','+prev_m+')"><span class="icon icon-angle-double-left"></span></td><td colspan="5">'+titre+'</td><td onclick="calendrier('+next_a+','+next_m+')"><span class="icon icon-angle-double-right"></span></td></tr>';
  calendar+='<tr><td>Lu</td><td>Ma</td><td>Me</td><td>Je</td><td>Ve</td><td>Sa</td><td>Di</td></tr>';
  for(var l=1;l<7;l++)
  {
    calendar+="<tr>";
    for(var c=1;c<8;c++)
    {
      var id=a+'_'+m+'_'+dayCount;
      calendar+='<td ';
      if(dayCount > 0 && dayCount<MaxCount)
        calendar+='id="'+id+'" class="cellule">'+dayCount;
      dayCount++;
      calendar+='</td>';
    }
    calendar+="</tr>";
  }
  calendar+="</table>";

  calendar += '<p><button class="right" onclick="calendrier()"><span class="icon icon-calendar"></span> Aujourd’hui</button></p>';

  document.getElementById("local").innerHTML=calendar;
  //marquage du jour courant si il existe dans le calendrier affiché
  if(document.getElementById(nowId))
    document.getElementById(nowId).className+=" today";
  list_local();
};


function list_local()
{
  var select_local = "";
  var date;
  for(var i=0, len=localStorage.length; i<len; i++)
  {
    var key = localStorage.key(i);
    // ne liste que les série qui ne sont pas temporaire
    if (key != "temp" && key != "userp" && key != "infoapp")
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
    if (key != "temp" && key != "userp" && key != "infoapp")
    {
      var data = JSON.parse(localStorage[key]);
      date=new Date();
      date.setTime(data.date);
      var date_id=date.getFullYear()+"_"+date.getMonth()+"_"+date.getDate();
      if(d == date_id)
      {
        list_sessions[n]=data.id;
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
                   + '<button onclick="load_local_data(\''+data.id+'\')"><span class="icon icon-folder-open"></span></button>'
                   //+ '<button onclick="if(confirm(\'Supprimer ?\') != false) {localStorage.removeItem(\''+data.id+'\');list_local();}"><span class="icon icon-trash"></span></button>'    
                   + '<button onclick="if(confirm(\'Supprimer ?\') != false) {localStorage.removeItem(\''+data.id+'\');list_from_date(\''+d+'\');}"><span class="icon icon-trash"></span></button>'    
                   + '<button class="right" onclick="local_visu(\''+data.id+'_visu\')"><span class="icon icon-info"></span></button>'
                   + '</div></div>'
                   + '<div id="'+data.id+'_visu" style="display:none">'
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
    /* console.debug("got " + ev.type +
        " tt" + ev.targetTouches.length +
        " ct" + ev.changedTouches.length
    ); */
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
  klax:new Audio('klax.mp3'),
  bip:new Audio('bip.mp3'),
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
       //this.preact=true;
       //this.encours_pt=this.pretemps;
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
       //this.act=false;
       this.pause();
       //this.preact=true;
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
    //this.encours=this.pretemps;
    //this.preact=true;
    //document.getElementById("chr_play-pause").onclick="c.start()";
    //document.getElementById("chr_span_play-pause").className="icon icon-play";
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
      //this.bip.play();
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


/****************************************************/
/* générateur de son*/

function mksound()
{
  var data = []; // just an array
  var s=0;
  for (var i=0; i<2500; i++)
  {
    //data[i] = Math.round(255 * ); // fill data with random samples
    s=128+Math.round(1000*Math.sin(i/2)); // en son un peu saturé
    if(s>255) s=255;
    if(s<0) s=0;
    data[i]=s;
  }
  var wave = new RIFFWAVE(data); // create the wave file
  var audio = new Audio(wave.dataURI); // create the HTML5 audio element
  audio.play(); // some noise
}

/* 
 * RIFFWAVE.js v0.03 - Audio encoder for HTML5 <audio> elements.
 * Copyleft 2011 by Pedro Ladaria <pedro.ladaria at Gmail dot com>
 *
 * Public Domain
 *
 * Changelog:
 *
 * 0.01 - First release
 * 0.02 - New faster base64 encoding
 * 0.03 - Support for 16bit samples
 *
 * Notes:
 *
 * 8 bit data is unsigned: 0..255
 * 16 bit data is signed: âˆ’32,768..32,767
 *
 */

var FastBase64 = {

    chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    encLookup: [],

    Init: function() {
        for (var i=0; i<4096; i++) {
            this.encLookup[i] = this.chars[i >> 6] + this.chars[i & 0x3F];
        }
    },

    Encode: function(src) {
        var len = src.length;
        var dst = '';
        var i = 0;
        while (len > 2) {
            n = (src[i] << 16) | (src[i+1]<<8) | src[i+2];
            dst+= this.encLookup[n >> 12] + this.encLookup[n & 0xFFF];
            len-= 3;
            i+= 3;
        }
        if (len > 0) {
            var n1= (src[i] & 0xFC) >> 2;
            var n2= (src[i] & 0x03) << 4;
            if (len > 1) n2 |= (src[++i] & 0xF0) >> 4;
            dst+= this.chars[n1];
            dst+= this.chars[n2];
            if (len == 2) {
                var n3= (src[i++] & 0x0F) << 2;
                n3 |= (src[i] & 0xC0) >> 6;
                dst+= this.chars[n3];
            }
            if (len == 1) dst+= '=';
            dst+= '=';
        }
        return dst;
    } // end Encode

}

FastBase64.Init();

var RIFFWAVE = function(data) {

    this.data = [];        // Array containing audio samples
    this.wav = [];         // Array containing the generated wave file
    this.dataURI = '';     // http://en.wikipedia.org/wiki/Data_URI_scheme

    this.header = {                         // OFFS SIZE NOTES
        chunkId      : [0x52,0x49,0x46,0x46], // 0    4    "RIFF" = 0x52494646
        chunkSize    : 0,                     // 4    4    36+SubChunk2Size = 4+(8+SubChunk1Size)+(8+SubChunk2Size)
        format       : [0x57,0x41,0x56,0x45], // 8    4    "WAVE" = 0x57415645
        subChunk1Id  : [0x66,0x6d,0x74,0x20], // 12   4    "fmt " = 0x666d7420
        subChunk1Size: 16,                    // 16   4    16 for PCM
        audioFormat  : 1,                     // 20   2    PCM = 1
        numChannels  : 1,                     // 22   2    Mono = 1, Stereo = 2...
        sampleRate   : 8000,                  // 24   4    8000, 44100...
        byteRate     : 0,                     // 28   4    SampleRate*NumChannels*BitsPerSample/8
        blockAlign   : 0,                     // 32   2    NumChannels*BitsPerSample/8
        bitsPerSample: 8,                     // 34   2    8 bits = 8, 16 bits = 16
        subChunk2Id  : [0x64,0x61,0x74,0x61], // 36   4    "data" = 0x64617461
        subChunk2Size: 0                      // 40   4    data size = NumSamples*NumChannels*BitsPerSample/8
    };

    function u32ToArray(i) {
        return [i&0xFF, (i>>8)&0xFF, (i>>16)&0xFF, (i>>24)&0xFF];
    }

    function u16ToArray(i) {
        return [i&0xFF, (i>>8)&0xFF];
    }

    function split16bitArray(data) {
        var r = [];
        var j = 0;
        var len = data.length;
        for (var i=0; i<len; i++) {
            r[j++] = data[i] & 0xFF;
            r[j++] = (data[i]>>8) & 0xFF;
        }
        return r;
    }

    this.Make = function(data) {
        if (data instanceof Array) this.data = data;
        this.header.blockAlign = (this.header.numChannels * this.header.bitsPerSample) >> 3;
        this.header.byteRate = this.header.blockAlign * this.sampleRate;
        this.header.subChunk2Size = this.data.length * (this.header.bitsPerSample >> 3);
        this.header.chunkSize = 36 + this.header.subChunk2Size;

        this.wav = this.header.chunkId.concat(
            u32ToArray(this.header.chunkSize),
            this.header.format,
            this.header.subChunk1Id,
            u32ToArray(this.header.subChunk1Size),
            u16ToArray(this.header.audioFormat),
            u16ToArray(this.header.numChannels),
            u32ToArray(this.header.sampleRate),
            u32ToArray(this.header.byteRate),
            u16ToArray(this.header.blockAlign),
            u16ToArray(this.header.bitsPerSample),    
            this.header.subChunk2Id,
            u32ToArray(this.header.subChunk2Size),
            (this.header.bitsPerSample == 16) ? split16bitArray(this.data) : this.data
        );
        this.dataURI = 'data:audio/wav;base64,'+FastBase64.Encode(this.wav);
    };

    if (data instanceof Array) this.Make(data);

}; // end RIFFWAVE

