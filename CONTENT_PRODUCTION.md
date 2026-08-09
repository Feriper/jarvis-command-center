# Modo de produção e revisão de conteúdo do Jarvis

Este modo prepara um pacote revisável para YouTube ou TikTok sem publicar automaticamente. O Jarvis salva roteiro, fontes, descrição, tags, legendas SRT, prompt de thumbnail e checklist de direitos no rascunho.

## Fluxo seguro

1. Crie um rascunho em `content.createDraft` com plataforma, título, roteiro, descrição opcional e fontes.
2. Execute `content.preparePackage` para gerar tags, descrição final, legendas, prompt de thumbnail e notas de produção.
3. Produza ou selecione somente imagens, áudio e músicas próprias ou licenciadas.
4. Revise o roteiro, as fontes, a licença de cada mídia e as afirmações factuais.
5. Execute `content.reviewRights` com as quatro confirmações verdadeiras.
6. Execute `content.approveDraft` somente depois da revisão humana.
7. Faça o upload manual pelo YouTube Studio. Para o primeiro teste, use visibilidade privada ou não listada.

A aprovação do rascunho não publica o conteúdo. O projeto não contém endpoint de publicação automática nesta etapa.

## Renderização local com FFmpeg

O script `scripts/render-content-package.sh` aceita um diretório com imagens PNG/JPG, um arquivo de áudio, um arquivo SRT e um caminho de saída:

```bash
scripts/render-content-package.sh ./imagens ./narracao.wav ./legendas.srt ./video.mp4
```

O resultado é um MP4 vertical 1080x1920, com H.264, áudio AAC e legendas embutidas. O vídeo deve ser revisado visualmente e auditado quanto a direitos antes do upload.

## Limites conhecidos

A geração automática de narração, imagens ou vídeo por serviços externos não é ativada neste fluxo. O pipeline apenas prepara os metadados e monta arquivos locais a partir dos materiais fornecidos. Também não há garantia de alcance, monetização ou aprovação de conteúdo pelas plataformas.
