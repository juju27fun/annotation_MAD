# Livraison et collecte

Cette archive est préparée pour un **dépôt GitHub privé** avec accès nominatif à
Lubin Gauthier et Sebastian Sierra Alarcon. Elle ne publie rien automatiquement,
n’invite personne et n’envoie aucun message.

Dépôt de destination : `git@github.com:juju27fun/annotation_MAD.git`.
Vérifier qu’il est privé avant le premier envoi. Y pousser la branche `main`,
puis ajouter les
comptes GitHub des relecteurs comme collaborateurs. Les noms des destinataires
ne sont pas des identifiants GitHub ; ne pas deviner leurs comptes. Préférer l’accès
minimal permettant de cloner ou télécharger le dépôt, selon le type de compte GitHub.
Ne pas activer GitHub Pages pour contourner la confidentialité du dépôt.

La version de livraison est `review-v1.2.0`. Après l’import, poser un tag Git portant
ce nom sur le commit exact livré. L’export indique `release_id`, l’empreinte du contenu
livré, l’empreinte du protocole et celle du contrat. Le tag devra correspondre à cette
livraison ; le SHA du commit Git ne peut pas être inclus dans son propre contenu.
`RELEASE.json` décrit précisément les entrées qui déterminent cette empreinte.

L'outil démarre directement, sans nom à choisir. Le coordinateur associe chaque JSON à son expéditeur. L'essai synthétique reste disponible. Recueillir
les problèmes d’interface avant qu’ils poursuivent la revue réelle. Si une correction
change le sens des annotations, les consignes, les traitements ou les valeurs par
défaut, créer une nouvelle version et décider explicitement des traces à refaire.
Ne pas changer les fichiers d’une version pendant qu’elle est annotée.

## Portée scientifique

Cette livraison contient uniquement le lot historique d’audit. Le nouveau jeu de
réglage n’est pas inclus : il nécessitera une livraison séparée et un protocole fixé
avant son utilisation. Aucun détecteur, réglage ou calcul de performance n’est lancé
par ce projet. Le protocole local fixe la collecte ; il ne remplace pas criteria.json
du projet papier pour les règles d’analyse, d’appariement ou de réglage.

Les relecteurs annotent séparément tous les passages, même s’ils connaissent déjà
ces données. Leur expérience passée est consignée dans REVIEWERS.json. L’aveugle
porte sur l’absence de propositions et d’annotations dans l’outil ; il ne signifie
pas qu’ils n’ont jamais vu les signaux. Le dépôt ne contient ni la référence de
l’auteur, ni ses notes de confiance, ni les correspondances privées.

## Recevoir les résultats

Faire transmettre un JSON final par relecteur directement au coordinateur, jamais
par le dépôt partagé. Vérifier le fichier avec `scripts/validate_review_export.py`,
archiver ses octets originaux et son SHA-256 hors de ce dépôt. Conserver séparément
les deux références et la référence initiale. Mesurer l’accord avant toute discussion
des divergences ; aucune fusion ou adjudication automatique n’est prévue.

Ne pas importer les réponses d'un relecteur dans la copie d'un autre. Un export
complet est un instantané avec reçu ; la copie locale reste éditable. Une correction
nécessite un nouvel export à archiver en conservant le précédent. Les horodatages
indiquent des sauvegardes, pas une durée effective de travail.

La précédente archive v1.0.0 est conservée séparément. Cette version ne lit ni ne
supprime son stockage. Les signaux et catégories sont inchangés, mais la présentation
et les sessions diffèrent : ne pas mélanger les versions silencieusement.

## Vérifications effectuées

Les tests automatisés contrôlent les données et les contrats de sauvegarde, les
identités, les exports et le verrouillage. Ils utilisent des annotations fictives
en mémoire. Ils ne constituent pas une mesure d’accord ni un test de rendu navigateur.
L’auteur a approuvé l’UI/UX de cette interface. Chaque relecteur peut vérifier
l’ouverture et les gestes sur l’essai synthétique avant de commencer.
Aucun résultat réel n’est présent dans les fixtures.

Le parcours a été testé dans le script généré avec un DOM simulé : fin puis début
sur le signal brut, validation de cet événement sans navigation, second événement,
puis validation de la trace et sauvegarde des deux intervalles. Le test après
clonage vérifie également l’export JSON et la reprise de session ; il distingue
explicitement ces contrôles du rendu dans un vrai navigateur.
