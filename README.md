# hosbank

Application bancaire pédagogique en architecture **N-tiers**, livrée avec Docker.

## Stack

| Couche | Choix |
| --- | --- |
| Backend | Node.js + Express.js |
| Frontend | EJS, HTML, CSS, JavaScript, Bootstrap 5 |
| Base | MySQL 8 (requêtes SQL paramétrées, sans ORM) |
| Auth | Sessions MySQL + vérification e-mail (MailHog en local) |
| Autorisation | Rôles `client` / `manager` / `admin` et permissions en base |

## Démarrage

```bash
cp .env.example .env
docker compose up --build
```

- Application : http://localhost:3000
- MailHog : http://localhost:8025
- MySQL : `localhost:3306`

Comptes de démonstration (e-mail déjà vérifié) :

| Rôle | E-mail | Mot de passe |
| --- | --- | --- |
| Admin | `admin@hosbank.local` | `Admin123!` |
| Conseiller | `manager@hosbank.local` | `Manager123!` |
| Client | `client@hosbank.local` | `Client123!` |
| Client 2 | `client2@hosbank.local` | `Client123!` |

Un nouveau client doit valider le lien reçu dans MailHog avant de se connecter.

## Architecture

```
src/config          environnement, MySQL, sessions
src/routes          HTTP
src/controllers     orchestration des vues
src/services        règles métier
src/repositories    SQL
src/middlewares     auth, rôles, validation, erreurs
views/              EJS (auth, client, manager, admin)
database/           schéma, migrations, seeds
```

Les routes n’accèdent pas à SQL : elles passent par les contrôleurs et les services.
