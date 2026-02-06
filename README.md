# F9 Mktplace

Webapp Next.js para marketplace da F9 Comunicação Visual.

## Tecnologias

- **Framework**: Next.js
- **Runtime**: Node.js
- **Linguagem**: TypeScript/JavaScript
- **Banco de Dados**: Supabase
- **Deployment**: Vercel
- **Styling**: CSS/Tailwind CSS

## Instalação

### Pré-requisitos
- Node.js 18+ instalado
- npm ou yarn

### Setup Local

1. Clone o repositório:
```bash
git clone https://github.com/ViniPenaAI/f9-mktplace.git
cd f9-mktplace
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
# Edite .env.local com seus valores
```

4. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

Acesse http://localhost:3000

## Build para Produção

```bash
npm run build
npm start
```

## Deployment no Vercel

1. Faça login em vercel.com
2. Clique em "New Project"
3. Selecione este repositório GitHub
4. Configure as variáveis de ambiente no Vercel
5. Faça o deploy

## Estrutura do Projeto

```
f9-mktplace/
├── app/              # Arquivos da aplicação Next.js
├── public/           # Arquivos estáticos
├── src/              # Código fonte
├── .env.example      # Template de variáveis de ambiente
├── .gitignore        # Arquivos ignorados no git
├── package.json      # Dependências do projeto
└── README.md         # Este arquivo
```

## Variáveis de Ambiente

Ver `.env.example` para a lista de variáveis necessárias.

## Notas Importantes

- Nunca commitar `.env.local` no repositório (ele está no .gitignore)
- Nunca commitar a pasta `node_modules` (será instalada automaticamente)
- Manter a pasta `.next/` no .gitignore para evitar conflitos

## Suporte

Para dúvidas ou problemas, abra uma issue no repositório.

---

Desenvolvido com ❤️ por ViniPenaAI
