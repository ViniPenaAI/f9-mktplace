# Guia de Upload do Projeto para o GitHub

este guia fornece trêss soluções para fazer upload dos arquivos restantes do projeto F9 Mktplace para o GitHub.

## Opção 1: Usar GitHub Desktop (Recomendado - Más Fácil)

### Passo 1: Instalar GitHub Desktop
1. Acesse https://desktop.github.com
2. Baixe e instale o GitHub Desktop
3. Faça login com sua conta GitHub

### Passo 2: Clonar o Repositório
1. Abra o GitHub Desktop
2. Clique em "File" → "Clone Repository"
3. Selecione `ViniPenaAI/f9-mktplace`
4. Escolha a pasta para clonar (ex: `C:\Users\Vinicius Pena\Desktop\f9-mktplace-git`)
5. Clique em "Clone"

### Passo 3: Substituir Arquivos
1. Abra o Explorador de Arquivos
2. Navegue para `C:\Users\Vinicius Pena\Documents\F9 mktplace`
3. Selecione TODOS os arquivos/pastas EXCETO:
   - `node_modules/` (não copie)
   - `.env.local` (não copie)
4. Copie (Ctrl+C)
5. Navegue para a pasta clonada do GitHub Desktop
6. Cole (Ctrl+V) - sobrescreva os arquivos existentes

### Passo 4: Fazer Commit e Push
1. Volte para GitHub Desktop
2. Verá os arquivos em "Changes"
3. Em "Summary" escreva: `Add project files - main upload`
4. Clique em "Commit to main"
5. Clique em "Push origin"
6. Pronto! Os arquivos estão no GitHub

---

## Opção 2: Usar Interface Web do GitHub (Más Manual)

### Passo 1: Acessar a Página de Upload
1. Acesse https://github.com/ViniPenaAI/f9-mktplace
2. Clique em "Add file" → "Upload files"

### Passo 2: Fazer Upload em Lotes
1. Abra o Explorador de Arquivos na pasta `C:\Users\Vinicius Pena\Documents\F9 mktplace`
2. Crie subpastas/grupos de arquivos para upload
3. Selecione grupos de arquivos (ex: pasta `src/`)
4. Arraste e solte na área de upload do GitHub
5. Repita para cada pasta do projeto
6. Faça commit após cada grupo

**Nota**: Este método é mais lento, mas funciona se o desktop/explorer não funcionar bem.

---

## Opção 3: Instalar Git e Usar Linha de Comando

### Passo 1: Instalar Git
1. Acesse https://git-scm.com/download/win
2. Baixe o instalador para Windows
3. Execute e siga as instruções padrão

### Passo 2: Configurar Git
```bash
git config --global user.name "ViniPenaAI"
git config --global user.email "seu-email@example.com"
```

### Passo 3: Clonar e Fazer Upload
```bash
cd Desktop
git clone https://github.com/ViniPenaAI/f9-mktplace.git
cd f9-mktplace

# Copie os arquivos do projeto (exceto node_modules e .env.local)

git add .
git commit -m "Add project files - main upload"
git push origin main
```

---

## ⚠️ Importante: Checklist Antes de Fazer Upload

- [ ] Não estou copiando a pasta `node_modules/`
- [ ] Não estou copiando o arquivo `.env.local`
- [ ] Copiei TODOS os outros arquivos e pastas
- [ ] Versei o `.gitignore` (ele impedirá commits de node_modules)
- [ ] O arquivo `.env.example` está lá como template
- [ ] O `README.md` tem instruções de setup

---

## Próximos Passos Após Upload

1. **Criar Conta na Vercel** (gratuita):
   - Acesse https://vercel.com
   - Faça login com sua conta GitHub
   - Clique em "New Project"
   - Selecione este repositório
   - Configure as variáveis de ambiente
   - Clique em "Deploy"

2. **Configurar Dominio da Hostinger**:
   - No painel da Hostinger
   - Vá para "Gerenciar Dominio"
   - Encontre "Configurar Nameservers" ou "DNS"
   - Adicione os nameservers fornecidos pela Vercel
   - Aguarde propagação (pode levar 24-48h)

---

## Dica de Ouro 🌟

A **Opção 1 (GitHub Desktop)** é a mais fácil e recomendada para usuários que não estão familiarizados com Git na linha de comando.

Se tiver dúvidas sobre qualquer passo, consulte a documentação oficial do GitHub ou GitHub Desktop.
