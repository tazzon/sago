/**************
 * sago 0.3.0 *
 * ************/

var news="<p>Ajout de la possibilité de saisir les flèches hors du blason jusqu’à l'équivalent de 5 zones à l’extérieur du blason.</p>";
//var news="";
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
  actual_key : "",
  actual_name : "",
  is_save : false
};
var infoapp= {
  version : '0.3.0',
  datecode : 20160205.01,
  name : "Sago",
  mail : "tazzon@free.fr",
  git : 'https://github.com/tazzon/sago',
  dev : "AM"
};
var fl_saisie_save=[];

var zoom_actif=false;
var fl=[];

var nb_zone;
var zone_size;
var user={
  id:"",
  pwd:"",
  isId:false
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
  mire:false,
};

var el_visible;


var ratio=2.9;
var targetX;
var targetY;
var targetW;
var targetH;
var zoomX;
var zoomY;
var zoomH;
var zoomW;

// les textes d'aide en fonction de l'onglet ou l'on se trouve
var help_session='<p>Choisissez les paramètres de votre session (nombre de volées, flèches par volée, distance, diamètre du blason).</p><p>Le diamètre du tube est respecté à l’affichage lors de la saisie des flèches, soyez le plus près possible de la réalité.</p><p>Si vous cochez la case « Spot », votre blason complet sera limité au 6 ou au 5 suivant votre choix.</p><p>Vous pouvez enfin choisir d’utiliser un petit 10 en cochant la case « Petit 10 ».</p>';
var help_tab_score='<p>La feuille de marque permet de voir les volées qui ont été faite et validées dans l’onglet de saisie.</p><p>Vous pouvez ajouter un commentaire (icône <span class="icon icon-comment"></span>) par volée (changement de réglage, sensation, etc).</p><p>Vous pouvez sauvegarder à tout moment la volée en cours grâce au bouton <span class="icon icon-floppy"></span>.Le nom d’une série non enregistrée est suivie d’un astérisque (*).</p><p>Le bouton <span class="icon icon-bullseye"></span> permet un accès direct à la saisie de la volée en cours.</p>';
var help_saisie='<p>Les flèches peuvent être saisies dans n’importe quel ordre (numéro de flèche par exemple), elles seront triées automatiquement dans la feuille de marque lors de la validation de la volée par le bouton <span class="icon icon-ok"></span>.</p><p>Lors de la saisie d’une flèche, si celle-ci se trouve hors de la cible visible, déplacez votre doigt hors de la cible pour ajouter des zones. Un passage rapide dans le jaune supprimera une à une les zones ajoutées. À la fin de chaque flèche, le blason reprendra l’aspect choisi dans les options.</p><p>Vous pouvez recommencer la dernière flèche en appuyant sur le bouton <span class="icon icon-reply"></span> ou toute la volée grace au bouton<span class="icon icon-reply-all"></span>.</p><p>Vous pouvez ajouter un commentaire à la volée en cours (avant de la valider) avec le bouton <span class="icon icon-comment"></span>, il sera consultable ou modifiable ultérieurement dans la feuille de marque.</p><p>Le bouton <span class="icon icon-table"></span> permet un accès direct à la feuille de marque de la volée en cours.</p>';
var help_options='<p>Augmenter au diminuez la taille globale de l’affichage pour l’ensemble de l’application avec les boutons <span class="icon icon-zoom-out"></span> ou <span class="icon icon-zoom-in"></span>.</p><p>Si vous maintenez cochée la case « sauvegarde automatique », à chaque validation d’une volée, la série sera sauvegardée.<p><p>Dans le cas d’une utilisation en extérieur (ou suivant vos goûts), il peut être utile de passer l’interface en contraste élevé.</p><p>Vous pouvez choisir le nombres de zones visible du blason lors de la saisie des flèches.</p>';
var help_local='<p>Ici se trouvent les séries que vous avez enregistrées. Vous pouvez les revoir ou les reprendre si elles n’étaient pas terminées.</p><p>Choisissez la série, appuyez sur le bouton <span class="icon icon-folder-open"></span> et chargez la. Si vous souhaitez la supprimer, appuyer sur le bouton <span class="icon icon-trash"></span>.</p><p>Si vous souhaitez avoir plus d’informations sur cette série, cliquez sur le bouton <span class="icon icon-info"></span>.';
var help_analyse="<p>Vous pouvez analyser votre série en choisissant d’afficher les volées ou les flèches.</p><p>Vous pouvez afficher ou masquer les différentes volées. Des lignes blanches matérialisent la dispersion horizontale et verticale de l’ensemble des volées affichées. Le bouton « Volées » affiche ou masque l’ensemble des volées.</p><p>Si vous ne selectionnez qu’une flèche, vous avez une représentation de son groupement en violet. Si vous appuyez sur le bouton flèches, vous avez l’ensemble des flèches qui s’affiche ou se masque.</p><p>La zone de réussite est dessinée en vert pointillé, la moyenne de toutes les flèches est dessinée en rose. Ces informations sont également données sous le tableau.</p>";
var help_viseur='<p>Indiquez pour deux distances les réglages du viseur, indiquez la distance (X) pour laquelle vous souhaitez trouvez la valeur de réglage et appuyez sur calculer.</p>';
var help_chrono='<p>Paramétrez le chronomètre en appuyant sur le bouton <span class="icon icon-sliders"></span>.</p><p>Lancer le chronomètre à l’aide du bouton <span class="icon icon-play"></span>, le décompte commence. À la fin de celui-ci, le temps commence à être décompté. Faites <span class="icon icon-pause"></span> pour stopper le chronomètre.</p><p>Le bouton <span class="icon icon-history"></span> réinitialise le chronomètre.</p><p>Le bouton <span class="icon icon-bell-alt"></span> permet de d’activer ou non le son du chronomètre.</p>';


var aff_fl;
var tab_display=[];

var ignore0=false;
