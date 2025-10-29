# language: pt
@ab-testing @experiments @optimization
Funcionalidade: Sistema de A/B Testing
  Como desenvolvedor de produto
  Quero testar variações de conteúdo
  Para otimizar taxas de conversão

  Contexto:
    Dado que o sistema de A/B testing está ativo

  @experiment @hero-headline
  Cenário: Experimento de headline do Hero deve variar
    Dado que o experimento "hero_headline" está ativo
    Quando diferentes usuários acessam a página
    Então 50% devem ver "Transforme dados em decisões: Relatórios automáticos em minutos"
    E 25% devem ver "Relatórios automáticos em minutos, não dias"
    E 25% devem ver "Dashboards inteligentes que economizam 75% do seu tempo"

  @experiment @cta-color
  Cenário: Experimento de cor do CTA deve variar
    Dado que o experimento "cta_color" está ativo
    Quando usuários acessam a página
    Então aproximadamente 70% devem ver botões em azul (primary)
    E aproximadamente 30% devem ver botões em verde (accent)

  @consistency @session
  Cenário: Usuário deve ver variante consistente durante sessão
    Dado que um usuário viu uma variante específica
    Quando ele navega entre páginas ou recarrega
    Então deve continuar vendo a mesma variante
    E não deve haver mudança abrupta de experiência

  @tracking @analytics
  Cenário: Experimentos devem ser rastreados corretamente
    Dado que um usuário vê uma variante experimental
    Quando interage com elementos da página
    Então deve ser enviado evento "experiment_impression"
    E deve ser enviado evento "experiment_conversion" em CTAs
    E os eventos devem incluir ID do experimento e variante

  @debug @development
  Cenário: Ferramenta de debug deve mostrar variantes ativas
    Dado que estou em modo desenvolvimento
    Quando clico no botão "🧪 Debug"
    Então devo ver um painel com experimentos ativos
    E devo ver variantes atuais para cada experimento
    E devo ver pesos de distribuição das variantes

  @feature-flags @toggles
  Cenário: Feature flags devem controlar disponibilidade
    Quando um experimento é marcado como "active: false"
    Então todos os usuários devem ver a variante "control"
    E não deve haver distribuição de variantes experimentais

  @reset @testing
  Cenário: Função de reset deve permitir reatribuição
    Dado que estou testando variações
    Quando uso a função de reset do experimento
    Então posso ver uma nova variante na próxima carga
    E o sistema deve reavaliar a distribuição
