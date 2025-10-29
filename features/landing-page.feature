# language: pt
@landing-page @smoke @critical
Funcionalidade: Landing Page Principal
  Como um visitante do site
  Quero acessar a landing page da DataFlow
  Para conhecer os serviços e converter em lead

  Contexto:
    Dado que estou na página inicial da DataFlow

  @hero @visual
  Cenário: Hero section deve estar visível e funcional
    Quando eu acessar a landing page
    Então devo ver o título principal contendo "relatórios automáticos"
    E devo ver dois botões de CTA visíveis
    E devo ver uma imagem de dashboard mockup
    E os botões devem ter texto "Comece seu teste grátis" e "Ver demonstração"

  @hero @cta @conversion
  Cenário: Botões CTA devem ser clicáveis
    Dado que estou na seção hero
    Quando eu clicar no botão "Comece seu teste grátis"
    Então deve ser disparado um evento de analytics "cta_click"
    E o evento deve conter o parâmetro "cta_text" como "Comece seu teste grátis"

  @social-proof @credibility
  Cenário: Seção de prova social deve mostrar credibilidade
    Quando eu visualizar a seção de prova social
    Então devo ver pelo menos 6 logos de empresas parceiras
    E devo ver métricas de "2.500+ empresas confiam na gente"
    E devo ver "99.9% disponibilidade garantida"
    E devo ver "75% menos tempo em relatórios"

  @benefits @value-prop
  Cenário: Seção de benefícios deve comunicar valor
    Quando eu visualizar a seção de benefícios
    Então devo ver o título "Resultados que você pode medir"
    E devo ver 6 cards de benefícios
    E o primeiro benefício deve mencionar "75% menos tempo"
    E deve haver métricas específicas em cada benefício

  @features @functionality
  Cenário: Seção de funcionalidades deve explicar recursos
    Quando eu visualizar a seção de features
    Então devo ver o título contendo "Funcionalidades que resolvem problemas reais"
    E devo ver 6 funcionalidades listadas
    E cada funcionalidade deve ter ícone, título e descrição
    E pelo menos uma deve mencionar "alertas inteligentes"

  @pricing @conversion
  Cenário: Seção de preços deve apresentar opções claras
    Quando eu visualizar a seção de preços
    Então devo ver 3 planos de preços
    E o plano do meio deve estar marcado como "Mais Popular"
    E devo ver toggle entre "Anual" e "Mensal"
    E os preços devem estar em reais (R$)

  @faq @support
  Cenário: FAQ deve responder dúvidas comuns
    Quando eu visualizar a seção de FAQ
    Então devo ver pelo menos 7 perguntas frequentes
    E ao clicar em uma pergunta deve expandir a resposta
    E deve haver pergunta sobre "tempo de implementação"
    E deve haver pergunta sobre "LGPD"

  @consent @lgpd @privacy
  Cenário: Banner de consentimento deve respeitar LGPD
    Dado que é minha primeira visita ao site
    Quando a página carregar
    Então devo ver um banner de cookies após 2 segundos
    E o banner deve ter opções para aceitar todos ou apenas essenciais
    E deve haver link para configurações detalhadas

  @ab-testing @experiment
  Cenário: Sistema de A/B testing deve variar conteúdo
    Quando eu acessar a página múltiplas vezes
    Então posso ver diferentes variações do headline principal
    E posso ver diferentes cores nos botões CTA
    E o sistema deve manter consistência durante a sessão

  @responsive @mobile
  Cenário: Página deve ser responsiva em mobile
    Quando eu acessar em um dispositivo mobile (largura 375px)
    Então todos os elementos devem estar visíveis
    E o layout deve se adaptar corretamente
    E os botões devem ter tamanho adequado para toque

  @hydration @critical @ssr
  Cenário: Página deve hidratar corretamente sem erros
    Quando eu acessar a landing page
    Então não deve haver erros de hidratação no console
    E o tema deve ser aplicado consistentemente
    E todas as seções devem renderizar corretamente
    E não deve haver elementos HTML inválidos

  @seo @performance
  Cenário: Página deve ter SEO otimizado
    Quando eu inspecionar o código fonte
    Então devo ver meta tags title e description
    E devo ver Open Graph tags para Facebook
    E devo ver Twitter Card tags
    E devo ver schemas JSON-LD estruturados
