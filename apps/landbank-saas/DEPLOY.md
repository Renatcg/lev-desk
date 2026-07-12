# LEV Landbank SaaS

Este app Laravel/Filament fica no mesmo repositório do Lev Desk, mas precisa rodar em um host PHP próprio. O Vercel continua sendo a URL pública principal e encaminha `/landbank` para esse host.

## URL pública

- Lev Desk: domínio atual do Vercel.
- Landbank SaaS: `https://SEU-DOMINIO-VERCEL/landbank`.

## Deploy do Laravel no Railway

O Railway detecta Laravel automaticamente quando o serviço aponta para a pasta do app.

### 1. Criar o projeto

1. Acesse https://railway.com.
2. Clique em **New Project**.
3. Escolha **Deploy from GitHub repo**.
4. Selecione o repositório `Renatcg/lev-desk`.
5. No serviço criado, vá em **Settings** e configure **Root Directory** como:

```text
apps/landbank-saas
```

### 2. Criar banco

No mesmo projeto Railway, adicione um serviço **Postgres**.

### 3. Variáveis do Laravel

No host Laravel, configure:

- `APP_URL=https://SEU-DOMINIO-VERCEL/landbank`
- `ASSET_URL=https://SEU-DOMINIO-VERCEL/landbank`
- `SESSION_PATH=/landbank`
- `APP_ENV=production`
- `APP_DEBUG=false`
- `LOG_CHANNEL=stderr`
- `NIXPACKS_PHP_VERSION=8.4`
- `NIXPACKS_NODE_VERSION=22`
- `DB_CONNECTION=pgsql`
- `DB_URL=${{Postgres.DATABASE_URL}}`
- `QUEUE_CONNECTION=database`
- `OPENAI_API_KEY=sua-chave-da-openai`
- `OPENAI_MODEL=gpt-5.5`

Se estiver acessando diretamente pelo domínio do Railway, use a URL do Railway em `APP_URL` e `ASSET_URL`. O upload de documentos usa URLs assinadas do Livewire e falha quando essas variáveis apontam para um domínio diferente do que está aberto no navegador.

Crie também `APP_KEY`. Localmente, dentro de `apps/landbank-saas`, gere uma chave com:

```bash
php artisan key:generate --show
```

Copie o valor para a variável `APP_KEY` no Railway.

### 4. Pre-deploy

No serviço Laravel do Railway, configure **Pre-deploy Command**:

```bash
chmod +x ./railway/init-app.sh && sh ./railway/init-app.sh
```

O Railway/Railpack cuida do build e do start do Laravel via PHP-FPM/Caddy.

### 5. Gerar domínio Railway

Depois do deploy, vá em **Settings > Networking** e clique em **Generate Domain**.

Guarde essa URL. Ela será a origem real do Laravel.

## Configuração no Vercel

Crie a variável de ambiente:

```text
LANDBANK_APP_ORIGIN=https://ORIGEM-REAL-DO-LARAVEL
```

Exemplo:

```text
LANDBANK_APP_ORIGIN=https://lev-landbank-saas-production.up.railway.app
```

O usuário final acessa pelo Vercel em `/landbank`; a origem real do Laravel não precisa aparecer para ele.

## Primeiro usuário

No host Laravel:

```bash
php artisan app:create-lev-user
```

O comando solicita e-mail, nome, senha, empresa e perfil.

No Railway, você pode rodar isso abrindo um shell no serviço ou usando a CLI vinculada ao serviço.

## Worker e cron

Na primeira fase, o serviço web basta. Quando entrarmos em IA documental, WhatsApp e lembretes, crie serviços separados no Railway usando o mesmo repo e root directory:

- Worker start command: `chmod +x ./railway/run-worker.sh && sh ./railway/run-worker.sh`
- Cron start command: `chmod +x ./railway/run-cron.sh && sh ./railway/run-cron.sh`
