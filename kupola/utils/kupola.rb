module Kupola
  def self.button(label, variant = 'brand', size = 'md')
    "<button class=\"ds-btn ds-btn--#{variant} ds-btn--#{size}\">#{label}</button>"
  end

  def self.input(label, name, placeholder, validate = '')
    validate_attr = validate.empty? ? '' : " data-validate=\"#{validate}\""
    <<~HTML
      <div class="ds-form-item">
        <label class="ds-form-item__label">#{label}</label>
        <input type="text" class="ds-input" name="#{name}" placeholder="#{placeholder}"#{validate_attr}>
      </div>
    HTML
  end

  def self.card(title, body, footer = '')
    footer_html = footer.empty? ? '' : "<div class=\"ds-card__footer\">#{footer}</div>"
    <<~HTML
      <div class="ds-card">
        <div class="ds-card__header">
          <h3 class="ds-card__title">#{title}</h3>
        </div>
        <div class="ds-card__body">#{body}</div>
        #{footer_html}
      </div>
    HTML
  end

  def self.stat_card(title, value, trend = '', trend_type = 'up')
    trend_class = trend_type == 'down' ? 'ds-stat-card__trend--down' : 'ds-stat-card__trend--up'
    trend_html = trend.empty? ? '' : "<span class=\"ds-stat-card__trend #{trend_class}\">#{trend}</span>"
    <<~HTML
      <div class="ds-stat-card">
        <div class="ds-stat-card__title">#{title}</div>
        <div class="ds-stat-card__value">#{value}</div>
        #{trend_html}
      </div>
    HTML
  end

  def self.badge(text, variant = 'default')
    "<span class=\"ds-badge ds-badge--#{variant}\">#{text}</span>"
  end

  def self.avatar(initials, size = 'md', variant = 'default')
    "<div class=\"ds-avatar ds-avatar--#{size} ds-avatar--#{variant}\">#{initials}</div>"
  end

  def self.theme_script(theme = 'dark', brand = 'zengqing')
    <<~HTML
      <script>
        if (typeof setTheme === 'function') setTheme('#{theme}');
        if (typeof setBrand === 'function') setBrand('#{brand}');
      </script>
    HTML
  end

  def self.data_bind(key, bind_type)
    "data-bind=\"#{key}:#{bind_type}\""
  end

  def self.data_component(name)
    "data-component=\"#{name}\""
  end

  def self.data_validate(rules)
    "data-validate=\"#{rules}\""
  end
end