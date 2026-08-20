ATUALIZAÇÃO — MAPA E CONTRASTE

Alterações:
- Google Maps incorporado na seção de localização, com marcador.
- Endereço apresentado em um cartão com ícone de localização.
- Botão "Abrir no Google Maps".
- Revisão de contraste de todos os principais textos em botões/retângulos:
  preto -> texto branco
  amarelo -> texto preto
  branco/contorno -> texto preto
  transparência escura -> texto branco
- Revisados: Home, cabeçalho, menu mobile, cards de veículos,
  página de veículo, login/admin e formulário.

INSTALAÇÃO:
1. Extraia este ZIP.
2. Copie TODO o conteúdo para a raiz de:
   C:\Users\User\Documents\LW VEÍCULOS\lw-veiculos-completo
3. Escolha "Substituir os arquivos no destino".
4. NÃO apague o .env.local.
5. Rode:
   npm.cmd install next@latest
   npm.cmd audit
   npm.cmd run dev
6. Abra http://localhost:3000 e confira.
7. Para publicar:
   git add .
   git commit -m "Adiciona Google Maps e melhora contraste"
   git push
