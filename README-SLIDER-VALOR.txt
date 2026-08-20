LW VEÍCULOS — FILTRO DE VALOR COM SLIDER

Alteração:
- O menu suspenso de valor máximo foi removido.
- Agora o cliente arrasta uma barra para definir o valor máximo desejado.
- O valor selecionado aparece em reais acima da barra.
- Passos de R$ 5.000.
- O limite máximo se adapta automaticamente ao veículo mais caro cadastrado.
- Enquanto não houver veículos, o limite padrão é R$ 200.000.
- O botão "Limpar filtros" volta a barra para o limite máximo.

COMO APLICAR:
1. Extraia este ZIP.
2. Copie todo o conteúdo para a raiz de:
   C:\Users\User\Documents\LW VEÍCULOS\lw-veiculos-completo
3. Escolha "Substituir os arquivos no destino".
4. NÃO apague seu .env.local.
5. Rode:
   npm.cmd install next@latest
   npm.cmd audit
   npm.cmd run dev
6. Teste em:
   http://localhost:3000/estoque
7. Para publicar:
   git add .
   git commit -m "Troca filtro de valor por slider"
   git push
