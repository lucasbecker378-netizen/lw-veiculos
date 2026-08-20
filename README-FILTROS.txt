LW VEÍCULOS — FILTROS DO ESTOQUE

Filtros implementados:
- Valor máximo
- Marca (preenchida automaticamente com as marcas cadastradas)
- Câmbio
- Comodidades

Comodidades disponíveis:
- Ar-condicionado
- Direção hidráulica
- Direção elétrica
- Vidros elétricos
- Travas elétricas
- Central multimídia
- Câmera de ré
- Sensor de estacionamento
- Bancos em couro
- Piloto automático
- Chave presencial
- Teto solar

O painel /admin também foi atualizado: no cadastro/edição do veículo,
as comodidades agora são marcadas por botões, e são salvas no campo
optional_items já existente no Supabase. Não precisa alterar o banco.

COMO APLICAR:
1. Extraia este ZIP.
2. Copie todo o conteúdo para:
   C:\Users\User\Documents\LW VEÍCULOS\lw-veiculos-completo
3. Substitua os arquivos no destino.
4. NÃO apague .env.local.
5. Rode:
   npm.cmd install next@latest
   npm.cmd audit
   npm.cmd run dev
6. Teste:
   http://localhost:3000/estoque
   http://localhost:3000/admin
7. Para publicar:
   git add .
   git commit -m "Adiciona filtros de estoque e comodidades"
   git push
