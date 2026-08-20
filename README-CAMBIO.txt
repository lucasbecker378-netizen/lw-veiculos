LW VEÍCULOS — CÂMBIO

Alterado:
- O filtro de câmbio agora possui somente:
  • Manual
  • Automático
- A opção CVT foi removida também do cadastro/edição no painel administrativo,
  para manter o site e os dados cadastrados consistentes.

APLICAR:
1. Extraia o ZIP.
2. Copie todo o conteúdo para:
   C:\Users\User\Documents\LW VEÍCULOS\lw-veiculos-completo
3. Substitua os arquivos.
4. Mantenha o .env.local.
5. Rode:
   npm.cmd run dev
6. Teste:
   http://localhost:3000/estoque
   http://localhost:3000/admin
7. Para publicar:
   git add .
   git commit -m "Limita cambio a manual e automatico"
   git push
