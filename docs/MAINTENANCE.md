# Maintenance du dépôt d’annotation

Ce dépôt d’annotation est destiné à Lubin Gauthier et Sebastian Sierra Alarcon.
Le [README](../README.md) décrit leur parcours d’annotation ; cette page regroupe
les informations de développement et de collecte.

## Organisation

- `Revue.html` : application autonome à ouvrir pour annoter.
- `index.html` : copie identique, conservée pour les liens et usages existants.
- `Essai.html` : exercices synthétiques.
- `docs/CONSIGNES.md` et `docs/CONSIGNES.html` : guide illustré.
- `app/` et `data/` : sources de l’interface et données embarquées.
- `MANIFEST.json`, `CONTRACT.json`, `COLLECTION_PROTOCOL.json`, `REVIEWERS.json`
  et `RELEASE.json` : population, contrat, protocole, contexte des relecteurs et version.
- `paper/claims.toml` : effectifs vérifiés à partir du manifeste.
- `SHA256SUMS` : empreintes des fichiers distribués.
- `scripts/` et `tests/` : reconstruction, validation et tests.

## Développer et vérifier

Python utilise uv ; JavaScript utilise pnpm. Les versions sont fixées dans
`mise.toml` et les fichiers de verrouillage sont versionnés.

Depuis la racine du dépôt :

```sh
uv sync --locked
pnpm install --frozen-lockfile
uv run --locked python scripts/build.py
uv run --locked pnpm test
uv run --locked python scripts/check_package.py
```

Pour vérifier un commit depuis un clone temporaire propre :

```sh
uv run --locked python scripts/test_clone.py
```

Pour vérifier la version sur GitHub :

```sh
uv run --locked python scripts/test_clone.py --remote https://github.com/juju27fun/annotation_MAD.git
```

Les tests couvrent les données, les sauvegardes, l’export, la reprise et la
reconstruction à l’identique. Les parcours utilisent un DOM simulé et des annotations
fictives ; ils ne remplacent pas une vérification visuelle dans le navigateur.

## Préserver la collecte

La version distribuée est `review-v1.2.0`. Son empreinte est définie par
`RELEASE.json` et incluse dans les exports. Une modification des données, des
consignes, des traitements ou des valeurs par défaut exige une nouvelle version
et une décision sur les annotations à refaire. Ne pas modifier ces éléments
pendant une collecte en cours.

Les relecteurs annotent séparément toute la population. Le dépôt ne contient
ni propositions de détecteur, ni référence de l’auteur, ni notes de confiance
privées, ni correspondances avec les identifiants historiques. Leur familiarité
avec les données est consignée dans `REVIEWERS.json`.

Cette livraison couvre le lot historique d’audit. Le jeu de réglage et les calculs
de performance restent hors de ce dépôt. Le protocole de collecte ne remplace
pas les règles d’analyse du projet scientifique.

## Recevoir les résultats

Chaque relecteur transmet son JSON directement à Julien. Ne pas collecter les
réponses dans le dépôt, une issue ou une pull request partagée.

Vérifier un export complet depuis la racine :

```sh
uv run --locked python scripts/validate_review_export.py /chemin/export.json --bundle . --complete
```

Conserver hors du dépôt les octets originaux et le SHA-256 de chaque export.
Associer chaque JSON à son expéditeur, garder les deux références séparées et
mesurer l’accord avant de discuter les divergences. Aucune fusion ou adjudication
automatique n’est prévue.

Un export est un instantané ; la session locale reste modifiable. Après une
correction, conserver l’ancien export et archiver le nouveau. Ne pas importer
les réponses d’un relecteur dans la copie de l’autre et ne pas effacer le stockage
navigateur. Les horodatages ne mesurent pas le temps de travail effectif.
Les exports de l’ancienne version v1.0.0 restent séparés.

## Diffusion

Le partage prévu avec les relecteurs est privé. Vérifier la visibilité du dépôt
avant une nouvelle diffusion et ne pas activer GitHub Pages. Les accès des
relecteurs se gèrent à partir de leurs comptes GitHub confirmés.
Les fichiers de configuration des assistants restent locaux et sont ignorés par Git.
