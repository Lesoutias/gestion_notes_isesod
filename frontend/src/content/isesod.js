export const NAV_LINKS = [
  { to: '/', label: 'Accueil' },
  { to: '/presentation', label: 'Présentation' },
  { to: '/filieres', label: 'Filières' },
  { to: '/statut-juridique', label: 'Statut juridique' },
  { to: '/organisation', label: 'Organisation' },
]

export const LOGIN_LINKS = [
  { to: '/connexion/etudiant', label: 'Étudiant', variant: 'gold' },
  { to: '/connexion/enseignant', label: 'Enseignant', variant: 'outline' },
]

export const ADMIN_LOGIN = {
  to: '/connexion/admin',
  label: 'Administrateur',
  menuLabel: 'Administration',
}

export const INSTITUTE = {
  name: 'ISESOD',
  fullName:
    "Institut Supérieur d'Environnement Solidaire et de Développement Durable",
  motto: 'Science — Solidarité — Développement',
  address:
    'N° 003, Av. Tchela, Rue Offices II, Q. MURARA, Commune de Karisimbi, Ville de Goma',
  agrement: 'N°0441/MINESU/CAB.MIN/SMM/SG-ESU/MKK/2018',
}

export const HOME = {
  heroSubtitle:
    "Mettre à la disposition de l'économie sociale et solidaire d'Afrique des personnes capables, dotées des techniques d'administration et d'encadrement des animateurs de ladite économie.",
  highlights: [
    {
      title: 'Formation LMD',
      description: 'Licence (3 ans) et Master (2 ans) dans plusieurs filières professionnalisantes.',
    },
    {
      title: 'Économie sociale & solidaire',
      description:
        'Une vision tournée vers le développement durable et la gestion des entreprises dans un environnement protégé solidairement.',
    },
    {
      title: 'Institution agréée',
      description: `Enseignement supérieur privé autorisé — agrément ${INSTITUTE.agrement}.`,
    },
  ],
}

export const PRESENTATION = {
  identity: {
    title: 'Identité',
    denomination:
      "INSTITUT SUPERIEUR D'ENVIRONNEMENT SOLIDAIRE ET DE DEVELOPPEMENT DURABLE « ISESOD »",
  },
  address: {
    title: 'Adresse physique',
    text: INSTITUTE.address,
  },
  motto: {
    title: 'Devise',
    text: INSTITUTE.motto,
  },
  division: {
    title: 'Division / Mission',
    paragraphs: [
      "Mettre à la disposition de l'économie sociale et solidaire d'Afrique, des personnes capables et dotées des techniques d'administration et d'encadrement des animateurs de ladite économie en Afrique.",
      "La gestion de ces entreprises doit se faire dans un environnement protégé solidairement par la communauté pour un développement durable.",
    ],
  },
  studentProfiles: [
    {
      title: 'Sciences & TIC',
      items: [
        'Acquérir des connaissances solides en sciences et techniques de l\'ingéniorat',
        'Développer des compétences en technologies de l\'information et de la communication',
        'Comprendre et se construire une grande expérience professionnelle',
        "S'ouvrir au monde et à la société",
      ],
    },
    {
      title: 'Gestion de projets de développement',
      items: [
        'Former des experts en gestion des projets de développement (hommes et femmes)',
        'Élaboration des projets de développement',
        'Élaboration et suivi des projets économiques et financiers',
        'Administration des entreprises publiques et privées',
        'Vulgarisation des techniques de gestion administratives et financières',
      ],
    },
    {
      title: 'Cadres & responsables',
      items: [
        'Directeur ou responsable de service',
        'Coordinateur de réseaux au sein de coopératives, mutuelles d\'assurance et de santé',
        'Associations d\'aide à la création d\'entreprise, structures d\'insertion',
        'Associations culturelles, sociales, médico-sociales ou d\'environnement',
        'Structures-réseau de l\'Économie Sociale et Solidaire (MicroEntreprise)',
        'Services de collectivités locales',
        'Développer un projet personnel',
      ],
    },
    {
      title: 'Agents sociaux & résolution de conflits',
      items: [
        'Initier des dynamiques de maintien de la paix',
        'Proposer des outils d\'analyse de conflits',
        'Approche orientée sur les conflictualités dans le monde',
        'Coopération entre civil et militaire dans la gestion et la résolution des conflits',
        'Conceptualiser l\'approche du développement intégrant les dynamiques de conflits',
        'Participer à la transformation des conflits dans les sociétés actuelles',
      ],
    },
  ],
}

export const FILIERES = {
  licence: {
    title: 'Licence (3 ans — système LMD)',
    items: [
      { name: 'Réseau Informatique et Télécommunication', sigle: 'RIT' },
      { name: 'Logistique et Transport', sigle: 'LT' },
      { name: 'Gestion des Projets de Développement', sigle: 'GPD' },
      { name: 'Gestion des Microentreprises', sigle: 'GME' },
      { name: 'Communication et Résolution de Conflits', sigle: 'CRC' },
      { name: "Gestion de l'environnement", sigle: 'GE' },
    ],
  },
  master: {
    title: 'Master (2 ans — système LMD)',
    items: [
      { name: 'Réseaux Informatique', sigle: 'RI' },
      { name: 'Télécommunication', sigle: 'TEL' },
      { name: 'Génie Logiciel', sigle: 'GL' },
      { name: 'Gestion des Projets de Développement', sigle: 'GPD' },
      { name: 'Étude du Genre', sigle: 'EG' },
      { name: 'Communication et Résolution des Conflits', sigle: 'CRC' },
      { name: 'Gestion des Microentreprises', sigle: 'GME' },
    ],
  },
}

export const STATUT_JURIDIQUE = {
  title: 'Statut juridique actuel',
  description:
    "L'ISESOD est une institution d'enseignement supérieur privé autorisée de fonctionner par l'agrément définitif suivant :",
  agrement: INSTITUTE.agrement,
  promoteurs: [
    {
      name: 'Professeur Dr Eurasme KAKULE MILANDO',
      role: 'Directeur Général et Chargé des affaires académiques',
    },
    {
      name: 'Monsieur Athanase KAHANYA KIMUHA TASI',
      role: 'Président du Conseil d\'Administration et chargé des relations publiques',
    },
  ],
}

export const ORGANISATION_HUB = [
  {
    slug: 'college-fondateurs',
    title: 'Collège des membres fondateurs',
    summary: 'Organe suprême académique et administratif de l\'institut.',
    path: '/organisation/college-fondateurs',
  },
  {
    slug: 'conseil-institut',
    title: "Conseil de l'institut",
    summary: 'Questions d\'enseignement, recherche et propositions académiques.',
    path: '/organisation/conseil-institut',
  },
  {
    slug: 'comite-gestion',
    title: 'Comité de gestion',
    summary: 'Suivi des décisions, budget et gestion quotidienne.',
    path: '/organisation/comite-gestion',
  },
  {
    slug: 'direction',
    title: 'Direction & administration',
    summary: 'Directeur Général, Secrétaires généraux et Administrateur du budget.',
    path: '/organisation/direction',
  },
  {
    slug: 'comite-scientifique',
    title: 'Comité scientifique',
    summary: 'Conception des programmes, admission et délibérations.',
    path: '/organisation/comite-scientifique',
  },
  {
    slug: 'conseil-section',
    title: 'Conseil de section',
    summary: 'Unité d\'enseignement, recherche et production autonome.',
    path: '/organisation/conseil-section',
  },
]

export const ORGANISATION_PAGES = {
  'college-fondateurs': {
    title: 'Collège des membres fondateurs',
    subtitle: 'Organe suprême de l\'ISESOD sur le plan académique et administratif.',
    sections: [
      {
        title: 'Attributions principales',
        bullets: [
          'Définir la politique générale et les objectifs conformément aux directives des membres fondateurs',
          'Approuver les programmes des cours et la création des centres de formation',
          'Fixer le barème salarial et la bourse d\'études pour les étudiants',
          'Approuver le budget et contrôler la gestion financière',
          'Désigner une commission ou un expert-comptable pour vérifier les comptes',
          'Informer régulièrement les donateurs sur la gestion des fonds',
          'Autoriser les acquisitions et aliénations',
          'Approuver l\'amendement des statuts et règlement général',
          'Nommer le personnel académique, scientifique, administratif et technique',
        ],
      },
      {
        title: 'Composition',
        bullets: [
          'Les membres fondateurs (voix délibérative)',
          'Des organismes affiliés',
          'Le Directeur Général',
          'Le Secrétaire Général Académique',
          'Le Secrétaire Général Administratif',
          'L\'Administrateur du Budget',
          'Un représentant du corps académique dont un assistant',
          'Les chefs de section',
          'Les directeurs des centres de formation et d\'accompagnement',
        ],
      },
      {
        title: 'Fonctionnement',
        paragraphs: [
          'Le collège est présidé par un Président, assisté d\'un premier et d\'un deuxième vice-président. Le Secrétaire Général Administratif est rapporteur d\'office.',
          'Les réunions ordinaires se tiennent une fois l\'an au siège. Les réunions extraordinaires peuvent être convoquées à la demande d\'un tiers des membres.',
          'Le collège ne peut statuer que si la majorité de ses membres est présente. Les décisions sont prises à la majorité simple ; en cas de parité, la voix du président prépondère.',
          'Mandat de 5 ans renouvelable. Les fonctions sont bénévoles ; l\'ISESOD assure les frais de déplacement des membres domiciliés hors du siège.',
        ],
      },
    ],
  },
  'conseil-institut': {
    title: "Conseil de l'institut",
    subtitle: 'Organe consultatif et propositif pour l\'enseignement et la recherche.',
    sections: [
      {
        title: 'Composition',
        bullets: [
          'Le Président du collège de membres fondateurs',
          'Le Directeur Général',
          'Le Secrétaire Général Académique',
          'Le Secrétaire Général Administratif',
          'L\'Administrateur du budget',
          'Le chef de section',
          'Une ou deux personnes représentant des organismes partenaires',
        ],
      },
      {
        title: 'Attributions',
        bullets: [
          'Traiter les questions intéressant l\'enseignement et la recherche scientifique',
          'Faire au collège des propositions utiles au développement académique',
          'Entériner les décisions du comité scientifique et du comité de gestion',
          'Proposer au collège la nomination du DG, SGA, SGAdmin et administrateur du budget',
          'Proposer la nomination et révocation du personnel académique et administratif de commandement',
          'Nommer et révoquer le personnel administratif et technique de collaboration',
          'Donner son avis sur la prévision budgétaire',
          'Élaborer l\'ordre du jour soumis au collège des membres fondateurs',
        ],
      },
      {
        title: 'Fonctionnement',
        paragraphs: [
          'Le conseil se réunit une fois par semestre. Les réunions extraordinaires sont convoquées par le président ou le DG sur demande de la majorité des membres.',
        ],
      },
    ],
  },
  'comite-gestion': {
    title: 'Comité de gestion',
    subtitle: 'Suivi opérationnel des décisions et gestion courante.',
    sections: [
      {
        title: 'Composition',
        bullets: [
          'Le Directeur Général (président)',
          'Le Secrétaire Général Académique',
          'Le Secrétaire Général Administratif',
          'L\'Administrateur du budget',
        ],
      },
      {
        title: 'Attributions',
        bullets: [
          'Recevoir les rapports mensuels et trimestriels de l\'ISESOD',
          'Nommer le personnel administratif et technique d\'exécution, octroyer promotions et licenciements',
          'Proposer au conseil de l\'institut la nomination et révocation du personnel de collaboration',
          'Élaborer les prévisions budgétaires soumises au collège pour approbation',
          'Exercer le droit de propriétaire et de locateur relatif aux immeubles de l\'institut',
          'Décider de l\'exécution des travaux d\'entretien dans la limite des crédits',
          'Conclure les contrats de location nécessaires au fonctionnement',
          'Prendre les mesures d\'urgence relevant du conseil de l\'institut',
        ],
      },
      {
        title: 'Fonctionnement',
        paragraphs: ['Le comité se réunit une fois par semaine sous la présidence du Directeur Général.'],
      },
    ],
  },
  direction: {
    title: 'Direction & administration',
    subtitle: 'Les principaux responsables exécutifs de l\'institut.',
    sections: [
      {
        title: 'Directeur Général',
        paragraphs: [
          'Nommé ou déchu par le collège des membres fondateurs sur proposition du conseil de l\'institut. Mandat de 5 ans renouvelable une fois. En cas d\'absence, remplacé par le Secrétaire Général Académique.',
        ],
        bullets: [
          'Assurer la direction et coordination journalières académiques et administratives',
          'Représenter l\'ISESOD dans les actes civils et judiciaires',
          'Présenter le rapport annuel des activités au collège des membres fondateurs',
          'Contresigner les diplômes académiques et décerner les diplômes scientifiques',
          'Ouvrir et clôture les sessions de cours et d\'examens en accord avec le comité scientifique',
        ],
      },
      {
        title: 'Secrétaire Général Académique',
        paragraphs: [
          'Assiste le Directeur Général. Membre du collège des membres fondateurs et secrétaire-rapporteur du comité scientifique. Mandat de 4 ans renouvelable une fois.',
        ],
        bullets: [
          'Rédiger et distribuer le rapport du comité scientifique, tenir les archives académiques',
          'Élaborer les horaires des cours',
          'Apprécier les corps académiques et scientifiques',
          'S\'occuper des questions relatives aux étudiants, examens et encadrement scientifique',
        ],
      },
      {
        title: 'Secrétaire Général Administratif',
        paragraphs: [
          'Assiste le Directeur Général dans les fonctions administratives. Rapporteur du collège des membres fondateurs. Mandat de 4 ans renouvelable une fois.',
        ],
        bullets: [
          'Rédiger et distribuer les rapports du comité de gestion et du conseil de l\'institut',
          'Garder les archives et le sceau de l\'institution',
          'Responsable du personnel et du patrimoine',
          'Appréciation annuelle du personnel et inventaire des biens meubles et immeubles',
        ],
      },
      {
        title: 'Administrateur du budget',
        paragraphs: [
          'De concert avec le Directeur Général, s\'occupe de la recherche de fonds et de la gestion financière. Mandat de 4 ans renouvelable une fois.',
        ],
        bullets: [
          'Rendre compte au collège des membres fondateurs',
          'Présenter semestriellement le rapport financier au conseil de l\'institut',
          'Préparer les propositions de budget et établir le bilan annuel',
          'Veiller à la bonne tenue des documents comptables',
          'Suivre l\'affectation et l\'utilisation des budgets par département',
          'Signer conjointement les documents comptables avec le Directeur Général',
        ],
      },
    ],
  },
  'comite-scientifique': {
    title: 'Comité scientifique',
    subtitle: 'Organe de conception pédagogique et de recherche.',
    sections: [
      {
        title: 'Composition & présidence',
        paragraphs: [
          'Composé des membres du corps enseignant à temps plein et à mi-temps. Le Secrétaire Général Académique en est le rapporteur. Présidé par le Directeur Général ou, en cas d\'empêchement, par le SGA.',
        ],
      },
      {
        title: 'Attributions',
        bullets: [
          'Donner son avis sur l\'admission de nouveaux étudiants',
          'Concevoir et réviser les programmes d\'enseignement et de recherche',
          'Proposer l\'ordre du jour au conseil de l\'institut',
          'Veiller à l\'application des programmes',
          'Planifier la formation du personnel académique et des étudiants',
          'Assurer l\'encadrement du personnel scientifique et des étudiants',
          'Examiner les candidatures aux postes académiques',
          'Discuter les propositions de sujets de thèses',
          'Délibérer sur les examens',
        ],
      },
      {
        title: 'Fonctionnement',
        paragraphs: [
          'Se réunit une fois par trimestre. En cas d\'urgence, le directeur convoque une séance extraordinaire.',
        ],
      },
    ],
  },
  'conseil-section': {
    title: 'Conseil de section',
    subtitle: 'Unité d\'enseignement, de recherche et de production autonome.',
    sections: [
      {
        title: 'Composition',
        bullets: [
          'Le chef de section',
          'Les professeurs',
          'Deux représentants du personnel scientifique',
          'Deux représentants des étudiants',
          'Professeurs à temps partiel, invités et suppléants (voix consultative)',
        ],
      },
      {
        title: 'Attributions',
        bullets: [
          'Délibérer sur toute question intéressant le département et les étudiants',
          'Veiller au bon fonctionnement de l\'enseignement et de la recherche',
          'Donner son avis sur les activités extérieures du personnel académique',
          'Proposer horaires, calendrier des examens et constitution des jurys',
          'Proposer le nombre d\'heures par cours et les options à créer',
          'Élaborer le projet de programme d\'enseignement et de recherche',
          'Établir les prévisions budgétaires de la section',
        ],
      },
      {
        title: 'Bureau de section',
        bullets: [
          'Le chef de section — mandat de 3 ans renouvelable une fois',
          'Le secrétaire académique de la section, chargé de la recherche',
          'Le secrétaire administratif de la section',
          'Les chefs des options',
        ],
      },
      {
        title: 'Fonctionnement',
        paragraphs: [
          'Le conseil de section se réunit une fois par mois ou lorsque l\'intérêt de la section l\'exige. Le chef de section exécute les décisions, élabore l\'ordre du jour et prend les mesures d\'urgence en informant le conseil.',
        ],
      },
    ],
  },
}
