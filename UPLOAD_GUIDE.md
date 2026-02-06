# Guia de Upload - Opção Recomendada (Interface Web GitHub)

**MELHOR OPÇÃO PARA VOCÊ: Interface Web** (Sem instalar nada, direto no navegador!)

Com pouco espaço no PC, a solução perfeita é fazer upload direto pela interface web do GitHub. Não precisa instalar nada, é só usar o navegador que já tem!

---

## Guia Rápido - Upload via Interface Web

### Passo 1: Preparar a Pasta do Projeto

1. Abra o Explorador de Arquivos
2. Navegue para: `C:\Users\Vinicius Pena\Documents\F9 mktplace`
3. **IMPORTANTE**: Verifique que NÃO HÁ:
   - ❌ Pasta `node_modules/` será ignorada (já está no .gitignore)
   - ❌ Arquivo `.env.local` não copiar (já está no .gitignore)
   - ✅ Copie TUDO O MAIS (src/, public/, app/, package.json, etc.)

### Passo 2: Acessar a Página de Upload

1. No navegador, vá para: https://github.com/ViniPenaAI/f9-mktplace
2. Clique no botão verde **"Code"** (canto superior direito)
3. Procure por "uploading an existing file" (ou "Add file" → "Upload files")
4. Ou vá direto para: https://github.com/ViniPenaAI/f9-mktplace/upload

### Passo 3: Fazer Upload em Lotes (Recomendado)

**Porque em lotes?** Para evitar timeout e garantir que tudo suba corretamente.

#### Lote 1: Raiz do Projeto (5-10 minutos)
1. Na página de upload, clique em "Choose your files"
2. Ou arraste e solte os arquivos da raiz:
   - `package.json`
   - `package-lock.json`
   - `next.config.js`
   - `tsconfig.json`
   - Outros arquivos de configuração
3. Escreva em "Commit message": `Add root configuration files`
4. Clique em "Commit changes"

#### Lote 2: Pasta `src/` (10-15 minutos)
1. Volte para a página de upload
2. Clique em "Add file" → "Upload files"
3. Selecione TODOS os arquivos da pasta `C:\Users\Vinicius Pena\Documents\F9 mktplace\src`
4. Arraste e solte (o GitHub criará a estrutura de pastas automaticamente)
5. Escreva em "Commit message": `Add src folder with application code`
6. Clique em "Commit changes"

#### Lote 3: Pasta `public/` ou `app/` (10-15 minutos)
1. Repita o mesmo processo para cada pasta grande
2. Commit message: `Add public folder with static files` (ou `app` conforme aplicável)

#### Lote 4: Outras Pastas (se existirem)
1. `supabase/` → `Add Supabase configurations`
2. `components/` → `Add React components`
3. Qualquer outra pasta do projeto

### Passo 4: Verificar Upload

1. Volte para: https://github.com/ViniPenaAI/f9-mktplace
2. Clique na aba **"Code"**
3. Verifique se todas as pastas e arquivos aparecem
4. Confirme que `node_modules` e `.env.local` NÃO aparecem (correto!)

---

## ⚠️ Checklist Final

Antes de considerar completo:

- [ ] Pasta `src/` ou `app/` está no repositório
- [ ] Arquivo `package.json` está no repositório
- [ ] `node_modules` NÃO está no repositório (esperado)
- [ ] `.env.local` NÃO está no repositório (esperado)
- [ ] `.gitignore` está presente (está lá)
- [ ] `README.md` está presente (está lá)
- [ ] `.env.example` está presente (está lá)

---

## 🚀 Depois do Upload: Próximos Passos

### 1. Criar Conta na Vercel (GRATUITA)
```
1. Acesse: https://vercel.com
2. Clique em "Sign Up"
3. Clique em "Continue with GitHub"
4. Autorize o acesso
```

### 2. Conectar Repositório e Fazer Deploy
```
1. Na Vercel, clique em "Add New" → "Project"
2. Procure por "f9-mktplace" ou clique em "Import"
3. Configure se necessário (padrão está OK)
4. Clique em "Deploy"
5. Aguarde (normalmente 3-5 minutos)
6. Pronto! Seu site está online em um URL da Vercel
```

### 3. Apontar Seu Domínio da Hostinger para Vercel
```
1. No painel da Hostinger:
   - Vá para "Meus Serviços"
   - Clique em seu domínio
   - Vá para "DNS / Nameservers"
   - Anote os nameservers da Vercel (aparecem na configuração do projeto)

2. Adicione os nameservers da Vercel no Hostinger

3. Aguarde propagação (pode levar 24-48h, mas geralmente é instantâneo)
```

---

## 🌟 Dica Importante

Se durante o upload der erro de "timeout" ou "falha":
- Tente fazer upload de pastas menores
- Se a pasta tiver muitos arquivos, divida em mais lotes
- Refresque a página e tente novamente

A vantagem da interface web é que cada commit é independente, então se um falhar, tente de novo sem perder o progresso!

---

## 💡 Alternativa: Se Preferir Linha de Comando (Más rápido)

Se tiver Git instalado:
```bash
cd C:\Users\Vinicius Pena\Documents\F9 mktplace
git init
git add .
git commit -m "Add F9 Mktplace project files"
git branch -M main
git remote add origin https://github.com/ViniPenaAI/f9-mktplace.git
git push -u origin main
```

Mas a interface web não requer instalação, então vamos com ela! 🈟
