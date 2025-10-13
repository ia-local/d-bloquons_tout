// docs/src/js/mapConfig.js

// On exporte directement la configuration pour qu'elle soit importable partout.
export const categories = [
  {
    "name": "Manifestations",
    "icon": "manifestation-icon.png",
    "dataKeys": [
      "manifestation_points_10_septembre",
      "manifestation_points_18_septembre",
      "marche_climat",
      "manifestation_points_2_octobre",
      "manifestation_points_15_octobre",
      "manifestation_points_18_octobre",
      "telecoms"
    ],
    "id": "cat_524e9a0c6a",
    "subcategories": [
      {
        "name": "Bloquons Tout 10 Sept.",
        "icon": "manif_10sep_icon.png",
        "typeFilter": [
          "Rassemblement",
          "Manifestation"
        ],
        "dataKeys": [
          "manifestation_points_10_septembre"
        ],
        "id": "sub_e420121a97"
      },
      {
        "name": "Grèves Général du 18 Sept.",
        "icon": "manif_18sep_icon.png",
        "typeFilter": [
          "Rassemblement",
          "Manifestation"
        ],
        "dataKeys": [
          "manifestation_points_18_septembre"
        ],
        "id": "sub_75791a811d"
      },
      {
        "name": "Rassemblement du 2 Oct.",
        "icon": "manif_02oct_icon.png",
        "typeFilter": [
          "Rassemblement",
          "Manifestation"
        ],
        "dataKeys": [
          "manifestation_points_2_octobre"
        ],
        "id": "sub_c7e8a3a303"
      },
      {
        "name": "Manifestation du 15 Oct.",
        "icon": "manifestive.png",
        "typeFilter": [
          "Rassemblement",
          "Manifestation"
        ],
        "dataKeys": [
          "manifestation_points_15_octobre"
        ],
        "id": "sub_103b415a77"
      },
      {
        "name": "Revendicative du 18 Oct.",
        "icon": "manifestive.png",
        "typeFilter": [
          "Rassemblement",
          "Manifestation"
        ],
        "dataKeys": [
          "manifestation_points_18_octobre"
        ],
        "id": "sub_d5f14c2b97"
      },
      {
        "name": "Marche pour le climat",
        "icon": "climat-icon.png",
        "typeFilter": [
          "Manifestation",
          "Marche pour le climat",
          ""
        ],
        "dataKeys": [
          "marche_climat",
          "manifestation_points_2_octobre"
        ],
        "id": "sub_01ac83173d"
      },
      {
        "name": "Opérations Spéciales",
        "icon": "op.png",
        "typeFilter": [
          "Opération",
          "Action symbolique",
          "Opération 'Cana'"
        ],
        "id": "sub_0569731671"
      },
      {
        "name": "Piquet de grève",
        "icon": "op.png",
        "typeFilter": [
          "Piquet de grève"
        ],
        "id": "sub_d5d214e6b5"
      },
      {
        "name": "Pancarte / Affichage",
        "icon": "pancarte.png",
        "typeFilter": [
          "Pancarte"
        ],
        "id": "sub_ff7f369f9f"
      }
    ]
  },
  {
    "name": "Actions strategique",
    "icon": "roundabout-icon.png",
    "dataKeys": [
      "strategic_locations",
      "roundabout_points",
      "porte_points",
      "actions"
    ],
    "id": "cat_6938b812f2",
    "subcategories": [
      {
        "name": "Ronds-points",
        "icon": "roundabout-icon.png",
        "typeFilter": [
          "Rond-point",
          "Rond-point de Blocage"
        ],
        "dataKeys": [
          "roundabout_points",
          "strategic_locations"
        ],
        "id": "sub_1955365535"
      },
      {
        "name": "Portes & Gares",
        "icon": "porte-icon.png",
        "typeFilter": [
          "Porte",
          "Gare",
          "Porte de Paris"
        ],
        "dataKeys": [
          "porte_points",
          "strategic_locations"
        ],
        "id": "sub_a5bb042c16"
      },
      {
        "name": "Hôpitaux & Universités",
        "icon": "hospital.png",
        "typeFilter": [
          "Hôpital",
          "Université",
          "Établissement scolaire"
        ],
        "dataKeys": [
          "strategic_locations"
        ],
        "id": "sub_2b9e6a00a0"
      },
      {
        "name": "Blocage Tactique",
        "icon": "blocage-icon.png",
        "typeFilter": [
          "Blocage"
        ],
        "dataKeys": [
          "actions"
        ],
        "id": "sub_2d011c7625"
      },
      {
        "name": "Actions Économiques",
        "icon": "blocage-economie-icon.png",
        "typeFilter": [
          "Économie"
        ],
        "dataKeys": [
          "actions"
        ],
        "id": "sub_103c8098c4"
      },
      {
        "name": "Actions Écologiques",
        "icon": "blocage-ecologie-icon.png",
        "typeFilter": [
          "Écologie"
        ],
        "dataKeys": [
          "actions"
        ],
        "id": "sub_6163310065"
      },
      {
        "name": "Actions Symboliques",
        "icon": "blocage-Symbole-icon.png",
        "typeFilter": [
          "Symbole"
        ],
        "dataKeys": [
          "actions"
        ],
        "id": "sub_3482d3c907"
      },
      {
        "name": "Actions Pédagogiques",
        "icon": "blocage-Pédagogie-icon.png",
        "typeFilter": [
          "Pédagogie"
        ],
        "dataKeys": [
          "actions"
        ],
        "id": "sub_f3c7346765"
      },
      {
        "name": "Actions Numerique",
        "icon": "blocage-Numerique-icon.png",
        "typeFilter": [
          "Numerique"
        ],
        "dataKeys": [
          "actions"
        ],
        "id": "sub_a52eb23395"
      },
      {
        "name": "Actions Artistique",
        "icon": "blocage-Artistique-icon.png",
        "typeFilter": [
          "Artistique"
        ],
        "dataKeys": [
          "actions"
        ],
        "id": "sub_f1f8b46e30"
      },
      {
        "name": "Actions de Perturbation",
        "icon": "blocage-Perturbation-icon.png",
        "typeFilter": [
          "Perturbation"
        ],
        "dataKeys": [
          "actions"
        ],
        "id": "sub_b715206f47"
      },
      {
        "name": "Actions Satiriques",
        "icon": "satire-icon.png",
        "typeFilter": [
          "Satire"
        ],
        "dataKeys": [
          "actions"
        ],
        "id": "sub_c5807914f6"
      },
      {
        "name": "Autres Actions",
        "icon": "blocage-Autres-icon.png",
        "typeFilter": [
          "Autres"
        ],
        "dataKeys": [
          "actions"
        ],
        "id": "sub_263443e981"
      }
    ]
  },
  {
    "name": "Lieux Administratifs",
    "icon": "mairie-icon.png",
    "dataKeys": [
      "mairies",
      "prefectures",
      "elysee",
      "taxes"
    ],
    "id": "cat_801c82f259",
    "subcategories": [
      {
        "name": "Mairies",
        "icon": "mairie-icon.png",
        "typeFilter": [
          "Mairie"
        ],
        "id": "sub_f8d87501a3"
      },
      {
        "name": "Préfectures",
        "icon": "pref.png",
        "typeFilter": [
          "Préfecture"
        ],
        "id": "sub_a0048d3e23"
      },
      {
        "name": "Élysée",
        "icon": "elyseeBoutique.png",
        "typeFilter": [
          "elysee"
        ],
        "id": "sub_40a4552b1b"
      },
      {
        "name": "Ministères",
        "icon": "ministere.png",
        "typeFilter": [
          "Ministère"
        ],
        "id": "sub_1c34a8c98e"
      },
      {
        "name": "Centres des Impôts",
        "icon": "taxes-icon.png",
        "typeFilter": [
          "Centre des finances publiques",
          ""
        ],
        "id": "sub_4e3396860a"
      }
    ]
  },
  {
    "name": "Secteurs d'application",
    "icon": "secteur-icon.png",
    "dataKeys": [
      "boycotts",
      "telecoms"
    ],
    "id": "cat_a8c7b6d5e4",
    "subcategories": [
      {
        "name": "Agriculture",
        "icon": "fnsea.png",
        "typeFilter": [
          "Agriculture",
          "BIO",
          "FNSEA"
        ],
        "id": "sub_180b6a7a0f"
      },
      {
        "name": "Éducation",
        "icon": "McDonalds.png",
        "typeFilter": [
          "Éducation",
          "Université",
          "Lycée",
          "Établissement scolaire",
          "SUD éducation"
        ],
        "id": "sub_a231f8216c"
      },
      {
        "name": "Santé",
        "icon": "hospital.png",
        "typeFilter": [
          "Santé",
          "Hôpital"
        ],
        "id": "sub_f42e43e7e2"
      },
      {
        "name": "Finance",
        "icon": "CreditCooperatif.png",
        "typeFilter": [
          "Finance",
          "Banque",
          "Holding Financière"
        ],
        "id": "sub_5d862f6859"
      },
      {
        "name": "Industrie",
        "icon": "industrie-icon.png",
        "typeFilter": [
          "Industrie",
          "Énergie/Stations-service"
        ],
        "id": "sub_77d13b3504"
      },
      {
        "name": "Commerce",
        "icon": "store.png",
        "typeFilter": [
          "Commerce",
          "Distribution",
          "Restauration",
          "Restauration Rapide",
          "Habillement",
          "E-commerce",
          "Streaming"
        ],
        "id": "sub_bd425f385c"
      },
      {
        "name": "Transport",
        "icon": "transport-icon.png",
        "typeFilter": [
          "Transport",
          "RATP",
          "SNCF",
          "Porte de Paris"
        ],
        "id": "sub_65d0752530"
      },
      {
        "name": "Télécoms/Réseaux",
        "icon": "telecom.png",
        "typeFilter": [
          "Opérateur 5G"
        ],
        "id": "sub_d758a08a26"
      }
    ]
  },
  {
    "name": "Boycotts",
    "icon": "boycott-icon.png",
    "dataKeys": [
      "boycotts"
    ],
    "id": "cat_309b55d7f6",
    "subcategories": [
      {
        "name": "Distribution",
        "icon": "store.png",
        "typeFilter": [
          "Distribution",
          "movie",
          "Habillement",
          "E-commerce",
          "Streaming"
        ],
        "id": "sub_1c378b871c"
      },
      {
        "name": "Banques",
        "icon": "CreditCooperatif.png",
        "typeFilter": [
          "Banque",
          "Holding Financière"
        ],
        "id": "sub_57604d538f"
      },
      {
        "name": "Restauration",
        "icon": "McDonalds.png",
        "typeFilter": [
          "Restauration",
          "Restauration Rapide"
        ],
        "id": "sub_f32152817d"
      },
      {
        "name": "Commerce (Divers)",
        "icon": "Carrefour.png",
        "typeFilter": [
          "commerce",
          "Énergie/Stations-service"
        ],
        "id": "sub_0185960d70"
      },
      {
        "name": "Industrie",
        "icon": "industrie-icon.png",
        "typeFilter": [
          "Industrie"
        ],
        "id": "sub_f2f8b5398a"
      }
    ]
  },
  {
    "name": "Surveillance & Réseaux",
    "icon": "camera-icon.png",
    "dataKeys": [
      "cameras_points",
      "telecoms"
    ],
    "id": "cat_f529f7f98e",
    "subcategories": [
      {
        "name": "Caméras Fixes",
        "icon": "fixed-camera.png",
        "typeFilter": [
          "fixed",
          "Caméra Fixe"
        ],
        "id": "sub_e4d9c7c251"
      },
      {
        "name": "Caméras Dôme",
        "icon": "dome-camera.png",
        "typeFilter": [
          "dome",
          "Caméra Dôme"
        ],
        "id": "sub_d4f5b2b2a1"
      },
      {
        "name": "Caméras Panoramiques",
        "icon": "panoramic-camera.png",
        "typeFilter": [
          "panning",
          "Caméra Panoramique"
        ],
        "id": "sub_b7d0b3c299"
      },
      {
        "name": "Agents de Sécurité",
        "icon": "guard-icon.png",
        "typeFilter": [
          "guard",
          "Agent de Sécurité"
        ],
        "id": "sub_c6d7e0f209"
      },
      {
        "name": "Opérateurs 5G / Antennes",
        "icon": "telecom.png",
        "typeFilter": [
          "Opérateur 5G",
          "Antenne Télécom"
        ],
        "id": "sub_a9b1c7d287"
      }
    ]
  },
  {
    "name": "Organisations & Syndicats",
    "icon": "syndicats.png",
    "dataKeys": [
      "syndicats",
      "cnccfp_partis",
      "organisation"
    ],
    "id": "cat_f0d5e8c1b2",
    "subcategories": [
      {
        "name": "Organisations Locales",
        "icon": "syndicats.png",
        "dataKeys": [
          "organisation"
        ],
        "typeFilter": [
          "Organisation locale",
          "Intersyndical",
          ""
        ],
        "id": "sub_4b5c7d1e8a"
      },
      {
        "name": "Sièges Syndicaux",
        "icon": "syndicats.png",
        "dataKeys": [
          "syndicats"
        ],
        "typeFilter": [
          "Siège Syndical",
          ""
        ],
        "id": "sub_f3c8d7e4b2"
      },
      {
        "name": "Partis Politiques",
        "icon": "parti-icon.png",
        "dataKeys": [
          "cnccfp_partis"
        ],
        "typeFilter": [
          "Parti Politique"
        ],
        "id": "sub_1a2b3c8d7e"
      }
    ]
  },
  {
    "name": "Réseaux sociaux",
    "icon": "reseau.png",
    "dataKeys": [
      "reseau"
    ],
    "id": "cat_c3d4e5f6a7",
    "subcategories": [
      {
        "name": "Telegram",
        "icon": "telegram.png",
        "typeFilter": [
          "Telegram"
        ],
        "id": "sub_a1b2c3d4e5"
      },
      {
        "name": "Youtube",
        "icon": "youtube.png",
        "typeFilter": [
          "Youtube"
        ],
        "id": "sub_f6g7h8i9j0"
      },
      {
        "name": "Instagram",
        "icon": "instagram.png",
        "typeFilter": [
          "Instagram"
        ],
        "id": "sub_k1l2m3n4o5"
      },
      {
        "name": "Facebook",
        "icon": "facebook.png",
        "typeFilter": [
          "Facebook"
        ],
        "id": "sub_p6q7r8s9t0"
      },
      {
        "name": "Whatsapp",
        "icon": "whatapp.png",
        "typeFilter": [
          "Whatsapp"
        ],
        "id": "sub_u1v2w3x4y5"
      },
      {
        "name": "Signal",
        "icon": "signal.png",
        "typeFilter": [
          "Signal"
        ],
        "id": "sub_z6a7b8c9d0"
      },
      {
        "name": "Site Web",
        "icon": "site.png",
        "typeFilter": [
          "Site"
        ],
        "id": "sub_e1f2g3h4i5"
      }
    ]
  },
  {
    "name": "RIC",
    "icon": "folder-icon.png",
    "dataKeys": [
      "rics"
    ],
    "id": "cat_j6k7l8m9n0",
    "subcategories": [
      {
        "name": "RIC Législatif",
        "icon": "ric-legislatif.png",
        "typeFilter": [
          "Législatif"
        ],
        "id": "sub_o1p2q3r4s5"
      },
      {
        "name": "RIC Abrogatoire",
        "icon": "ric-abrogatoire.png",
        "typeFilter": [
          "Abrogatoire"
        ],
        "id": "sub_t6u7v8w9x0"
      },
      {
        "name": "RIC Constituant",
        "icon": "ric-constituant.png",
        "typeFilter": [
          "Constituant"
        ],
        "id": "sub_y1z2a3b4c5"
      },
      {
        "name": "RIC Révocatoire",
        "icon": "ric-revocatoire.png",
        "typeFilter": [
          "Révocatoire"
        ],
        "id": "sub_d6e7f8g9h0"
      }
    ]
  }
];