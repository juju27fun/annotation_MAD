# Annotation indépendante — deux clics par événement

Mini-projet local pour Lubin Gauthier et Sebastian Sierra Alarcon. Chacun annote
indépendamment les mêmes traces, sans propositions ni annotations d'un autre relecteur.
Les effectifs sont consignés dans paper/claims.toml et MANIFEST.json.

## Commencer

Clone le dépôt privé, puis ouvre **Revue.html** dans un navigateur récent :

```sh
git clone git@github.com:juju27fun/annotation_MAD.git
cd annotation_MAD
```

Double-clique sur **Revue.html** dans le dossier cloné. Sur macOS, la commande
`open Revue.html` fait la même chose. Sous Windows ou Linux, ouvre ce fichier
dans ton navigateur. Le téléchargement GitHub « Code → Download ZIP », suivi
d’une décompression, fonctionne également.

Les traces et tous les composants sont inclus : aucune installation de Python,
Node, serveur ou dépendance n’est nécessaire pour annoter. Après récupération
du dossier, l’outil fonctionne hors ligne. **index.html** est une copie identique ;
garde ensuite le même fichier d’entrée pour retrouver ta sauvegarde locale.
La première trace est immédiatement annotable : aucun nom à choisir ou à saisir.
Les liens **Essai synthétique** et **Consignes** restent disponibles en haut.

Clique sur les deux bornes du passage, **fin puis début ou début puis fin**, sur le
petit signal du haut ou le grand signal filtré. Un glisser fonctionne aussi. À droite, les grands boutons **Présence certaine**
et **Bornes nettes** sont déjà sélectionnés. Modifie uniquement les exceptions ; les
choix incertains apparaissent en orange. Les champs de censure, difficulté, commentaire
et les bornes numériques se trouvent dans **Autres détails et bornes précises**.
**Valider cet événement** enregistre le passage et reste sur la même trace.
**Ajouter un événement** prépare le suivant ; deux nouveaux clics suffisent aussi.
**Terminer la trace et continuer** (Entrée) valide tous les passages et avance. **0** confirme une trace sans passage ; **I**
signale une trace incertaine. **A** ajuste les intervalles ; **D** dessine ; **Z** zoome.

## Sauvegarder et envoyer

La sauvegarde dans le navigateur est automatique. Garde le même fichier, le même
emplacement et le même navigateur pour reprendre. **Reprendre** importe une sauvegarde
JSON compatible dans une session vide ; aucune réponse différente n'est écrasée.

**Exporter le JSON** produit une sauvegarde partielle ou, si toutes les traces sont
validées, un export complet avec reçu. Envoie ce fichier directement au coordinateur,
qui l'associera à ton nom. Aucun nom n'est demandé dans l'outil. La copie locale reste
modifiable ; après une correction, exporte un nouveau fichier et conserve le précédent.

Ne commite pas les réponses et ne les joins pas à une issue ou une pull request du
dépôt partagé. Aucune donnée n'est transmise automatiquement à GitHub.

## Fichiers et vérifications

index.html et Revue.html sont la même application autonome. Essai.html contient les
exercices synthétiques. docs/CONSIGNES.html contient le guide illustré. Les fichiers
MANIFEST.json, CONTRACT.json, COLLECTION_PROTOCOL.json et RELEASE.json identifient
les données, les règles de collecte et la version. Les sources sont dans app/ et data/.

Les commandes suivantes sont destinées au développement, pas aux relecteurs :

```sh
uv sync --locked
pnpm install --frozen-lockfile --offline
uv run --locked python scripts/build.py
uv run --locked pnpm test
uv run --locked python scripts/check_package.py
uv run --locked python scripts/validate_review_export.py /chemin/export.json --bundle . --complete
```

Les versions de runtime sont dans mise.toml ; aucune bibliothèque applicative tierce
n'est requise. Consulter MAINTAINER.md pour la livraison privée. La version livrée conserve les données et l’interface approuvées. Les sauvegardes
navigateur existantes ne sont jamais effacées.

Pour reproduire le contrôle depuis un nouveau clone (développement uniquement) :

```sh
uv run --locked python scripts/test_clone.py
```

Ce test clone le commit courant dans un dossier temporaire, vérifie les données,
exécute les parcours d’annotation et d’export avec un DOM simulé, contrôle une
reconstruction identique, puis supprime son clone temporaire. Il ne remplace pas
l’essai visuel dans le navigateur. Pour contrôler la version envoyée sur GitHub :

```sh
uv run --locked python scripts/test_clone.py --remote git@github.com:juju27fun/annotation_MAD.git
```
