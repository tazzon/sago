
var infoapp= {
  version : '0.4.0',
  datecode : 20170305.02,
  name : "Sago",
  mail : "tazzon@free.fr",
  git : 'https://github.com/tazzon/sago',
  dev : "AM"
};

var news=[];
news[0]={
  new:"<p>Ajout de la possibilité de saisir les flèches hors du blason jusqu’à l'équivalent de 5 zones à l’extérieur du blason.</p>",
  datecode:20160218.01
};
news[1]={
  new:"<p>Il est désormais possible d’exporter vos séries au format csv pour les charger dans un tableur.</p><p>Rendez-vous dans le calendrier des sauvegardes et cliquez sur le bouton <span class=\"icon icon-doc\"></span> pour télécharger une série.</p>",
  datecode:20160416.01
};
news[2]={
  new:"<p>La page d’analyse dispose désormais que quelques fonctions supplémentaires.</p>",
  datecode:20160425.02
};
news[3]={
  new:"<p>Il est désormais possible de saisir un objectif de points pour une série.</p><p>Quelques améliorations ont été apportées à la page d’analyse.</p>",
  datecode:20160528.01
};
news[4]={
  new:"<p>L’application passe en version 0.4.0.</p><p>L’agencement de la page de saisie a été retouché. Vous pouvez ignorer la saisie de certaines flèches en avançant dans le tableau avec le bouton <span class=\"icon icon-forward\"></span>. Ceci permet de maintenir l’ordre des flèches lors de la saisie pour une meilleure restitution lors de l’analyse.</p>",
  datecode:20160608.01
};
news[5]={
  new:'<p>La feuille de marque évolue. Elle bénéficie maintenant du cumul volées après volées.</p>',
  datecode:20160614.01
};
news[6]={
  new:'<p>Une nouvelle option permet d’avoir ou non le tri des flèches dans la feuille de marque.</p>',
  datecode:20160618.01
};
news[7]={
  new:'<p>Il est maintenent possible de créer des profils pour sauvegarder les paramètres d’une série et les rappeler rapidement.</p>',
  datecode:20160625.01
};
news[8]={
  new:'<p>Les préférences utilisateur peuvent être sauvegardées et restaurées. Rendez-vous dans le menu « options ».</p>',
  datecode:20160630.01
};
news[9]={
  new:'<p>Le cercle de repérage des flèches en cible a subit quelques modifications pour améliorer le repérage.</p>',
  datecode:20170419.01
};

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
    tot : 0,
    objectif : false };
var n_fl=0;
var num_fl=0;
var n_volee=0;
var isave = {
  actual_key : "",
  actual_name : "",
  is_save : false
};

var fl_saisie_save=[];
var sn=[]; // la tableau de flèche utilisé pour la page d'analyse
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
  tab_tri:true,
  profils:[],
  last_profil:false,
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
var help_session='<p>Choisissez les paramètres de votre session (nombre de volées, flèches par volée, distance, diamètre du blason).</p><p>Le diamètre du tube est respecté à l’affichage lors de la saisie des flèches, soyez le plus près possible de la réalité.</p><p>Si vous avez un objectif, vous pouvez cocher la case « Objectif de points » et indiquer la valeur en face.</p><p>Si vous cochez la case « Spot », votre blason complet sera limité au 6 ou au 5 suivant votre choix.</p><p>Vous pouvez enfin choisir d’utiliser un petit 10 en cochant la case « Petit 10 ».</p><p>Une fois votre session définie, vous pouvez la sauvegarder dans un profil avec le bouton <span class="icon icon-floppy"></span>. Vous pouvez supprimer un profil avec le bouton <span class="icon icon-trash"></span>.</p>';
var help_tab_score='<p>La feuille de marque permet de voir les volées qui ont été faite et validées dans l’onglet de saisie.</p><p>Vous pouvez ajouter un commentaire (icône <span class="icon icon-comment"></span>) par volée (changement de réglage, sensation, etc).</p><p>Vous pouvez sauvegarder à tout moment la volée en cours grâce au bouton <span class="icon icon-floppy"></span>.Le nom d’une série non enregistrée est suivie d’un astérisque (*).</p><p>Le bouton <span class="icon icon-bullseye"></span> permet un accès direct à la saisie de la volée en cours.</p>';
var help_saisie='<p>Les flèches peuvent être saisies dans n’importe quel ordre (numéro de flèche par exemple), elles seront triées automatiquement dans la feuille de marque lors de la validation de la volée par le bouton <span class="icon icon-ok"></span>.</p><p>Lors de la saisie d’une flèche, si celle-ci se trouve hors de la cible visible, déplacez votre doigt hors de la cible pour ajouter des zones. Un passage rapide dans le jaune supprimera une à une les zones ajoutées. À la fin de chaque flèche, le blason reprendra l’aspect choisi dans les options.</p><p>Vous pouvez recommencer la dernière flèche en appuyant sur le bouton <span class="icon icon-reply"></span> ou passer une flèche (hors cible) grâce au bouton <span class="icon icon-forward"></span>.</p><p>Vous pouvez ajouter un commentaire à la volée en cours (avant de la valider) avec le bouton <span class="icon icon-comment"></span>, il sera consultable ou modifiable ultérieurement dans la feuille de marque.</p><p>Le bouton <span class="icon icon-table"></span> permet un accès direct à la feuille de marque de la série en cours.</p><p>Le bouton <span class="icon icon-clock"></span> permet un accès rapide au chronomètre.</p>';
var help_options='<p>Augmenter au diminuez la taille globale de l’affichage pour l’ensemble de l’application avec les boutons <span class="icon icon-zoom-out"></span> ou <span class="icon icon-zoom-in"></span>.</p><p>Si vous maintenez cochée la case « sauvegarde automatique », à chaque validation d’une volée, la série sera sauvegardée.<p><p>Dans le cas d’une utilisation en extérieur (ou suivant vos goûts), il peut être utile de passer l’interface en contraste élevé.</p><p>Vous pouvez choisir le nombres de zones visible du blason lors de la saisie des flèches.</p>';
var help_local='<p>Ici se trouvent les séries que vous avez enregistrées. Vous pouvez les revoir ou les reprendre si elles n’étaient pas terminées.</p><p>Choisissez la série, appuyez sur le bouton <span class="icon icon-folder-open"></span> et chargez la. Si vous souhaitez la supprimer, appuyer sur le bouton <span class="icon icon-trash"></span>.</p><p>Si vous souhaitez avoir plus d’informations sur cette série, cliquez sur le bouton <span class="icon icon-info"></span>.';
var help_analyse="<p>Vous pouvez analyser votre série en choisissant d’afficher les volées ou les flèches.</p><p>Vous pouvez afficher ou masquer les différentes volées. Des lignes violettes matérialisent la dispersion horizontale et verticale de l’ensemble des volées affichées. Le bouton « Volées » affiche ou masque l’ensemble des volées.</p><p>Si vous ne selectionnez qu’une flèche, vous avez une représentation de son groupement en violet. Si vous appuyez sur le bouton « flèches », vous avez l’ensemble des flèches qui s’affiche ou se masque.</p><p>La zone de réussite est dessinée en vert pointillé, la moyenne de toutes les flèches est dessinée en rose. Ces informations sont également données sous le tableau.</p>";
var help_viseur='<p>Indiquez pour deux distances les réglages du viseur, indiquez la distance (X) pour laquelle vous souhaitez trouver la valeur de réglage et appuyez sur calculer.</p>';
var help_chrono='<p>Paramétrez le chronomètre en appuyant sur le bouton <span class="icon icon-sliders"></span>.</p><p>Lancer le chronomètre à l’aide du bouton <span class="icon icon-play"></span>, le décompte commence. À la fin de celui-ci, le temps commence à être décompté. Faites <span class="icon icon-pause"></span> pour stopper le chronomètre.</p><p>Le bouton <span class="icon icon-history"></span> réinitialise le chronomètre.</p><p>Le bouton <span class="icon icon-bell-alt"></span> permet de d’activer ou non le son du chronomètre.</p>';


var aff_fl;
var tab_display=[];

var ignore0=false;
var ignoreInfReussite=false;
