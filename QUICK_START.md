# 🚀 Quick Start - 5 Passos para Colocar seu Projeto no GitHub

## ⏱️ Tempo total: ~20-30 minutos (sem instalar nada!)

---

## PASSO 1️⃣: Preparar Arquivos (2 min)

✅ Abra a pasta do seu projeto:
```
C:\Users\Vinicius Pena\Documents\F9 mktplace
```

**Checklist:**
- ✓ Tem `package.json`?
- ✓ Tem pasta `src/` ou `app/`?
- ✓ NÃO tem `node_modules/` (está ok ignorar)
- ✓ NÃO vai copiar `.env.local` (está ok ignorar)

---

## PASSO 2️⃣: Abrir Upload do GitHub (1 min)

🌐 No navegador, vá para:
```
https://github.com/ViniPenaAI/f9-mktplace/upload
```

Ou:
1. Acesse https://github.com/ViniPenaAI/f9-mktplace
2. Clique em "Add file" → "Upload files"

---

## PASSO 3️⃣: Upload dos Arquivos (10-15 min)

### Lote 1: Arquivos da Raiz
1. Selecione na pasta do projeto:
   - `package.json`
   - `package-lock.json`
   - `next.config.js` (se tiver)
   - `tsconfig.json` (se tiver)
   - Outros arquivos `.config.*`

2. Arraste para a área do GitHub ou clique "Choose files"

3. Em "Commit message" escreva:
   ```
   Add root configuration files
   ```

4. Clique "Commit changes"

### Lote 2: Pasta Principal (src/ ou app/)
1. Volte para: https://github.com/ViniPenaAI/f9-mktplace/upload

2. Selecione TODO o conteúdo da pasta `src/` (ou `app/` se tiver)
   - O GitHub criará a estrutura automaticamente

3. Commit message:
   ```
   Add application source code
   ```

4. Clique "Commit changes"

### Lote 3: Outras Pastas (se tiver)
1. `public/` → `Add public static files`
2. `components/` → `Add React components`
3. `supabase/` → `Add Supabase configs`
4. Qualquer outra pasta importante

---

## PASSO 4️⃣: Validar Upload (2 min)

✅ Verifique tudo está lá:

1. Vá para: https://github.com/ViniPenaAI/f9-mktplace

2. Você deve ver:
   - ✓ Pasta `src/` ou `app/`
   - ✓ Arquivo `package.json`
   - ✓ Arquivo `README.md`
   - ✓ Arquivo `.gitignore`
   - ✓ NÃO deve ver `node_modules` (correto!)
   - ✓ NÃO deve ver `.env.local` (correto!)

---

## PASSO 5️⃣: Deploy na Vercel (5 min)

### Criar Conta Vercel
1. Vá para: https://vercel.com
2. Clique "Sign Up"
3. "Continue with GitHub"
4. Autorize o acesso

### Deploy do Projeto
1. Clique "Add New" → "Project"
2. Selecione `ViniPenaAI/f9-mktplace`
3. Deixe as configurações padrão (OK)
4. Clique "Deploy"
5. Aguarde 3-5 minutos
6. ✅ Pronto! Seu site está online!

---

## 🎯 Depois: Apontar Domínio Hostinger (Opcional)

Para usar seu domínio da Hostinger:

1. Na Vercel, vá para "Settings" → "Domains"
2. Adicione seu domínio
3. Copie os nameservers que aparecerem
4. Na Hostinger, vá para DNS/Nameservers
5. Substitua pelos nameservers da Vercel
6. Aguarde 24-48h (ou minutos se sorte!)

---

## ❓ Dúvidas ou Erros?

Leia o `UPLOAD_GUIDE.md` para detalhes mais completos:
https://github.com/ViniPenaAI/f9-mktplace/blob/main/UPLOAD_GUIDE.md

---

## 💡 Dica de Ouro

Se der erro durante upload:
- Tente fazer upload de pastas menores
- Refresque a página e tente novamente
- Cada commit é independente, então não perde o progresso!

**Está pronto? Boa sorte! 🚀**
