package kupola

import (
	"fmt"
	"html/template"
)

func Button(label string, variant string, size string) template.HTML {
	if variant == "" {
		variant = "brand"
	}
	if size == "" {
		size = "md"
	}
	return template.HTML(fmt.Sprintf(
		`<button class="ds-btn ds-btn--%s ds-btn--%s">%s</button>`,
		variant, size, label,
	))
}

func Input(label string, name string, placeholder string, validate string) template.HTML {
	validateAttr := ""
	if validate != "" {
		validateAttr = fmt.Sprintf(` data-validate="%s"`, validate)
	}
	return template.HTML(fmt.Sprintf(
		`<div class="ds-form-item">
			<label class="ds-form-item__label">%s</label>
			<input type="text" class="ds-input" name="%s" placeholder="%s"%s>
		</div>`,
		label, name, placeholder, validateAttr,
	))
}

func Card(title string, body string, footer string) template.HTML {
	footerHTML := ""
	if footer != "" {
		footerHTML = fmt.Sprintf(`<div class="ds-card__footer">%s</div>`, footer)
	}
	return template.HTML(fmt.Sprintf(
		`<div class="ds-card">
			<div class="ds-card__header">
				<h3 class="ds-card__title">%s</h3>
			</div>
			<div class="ds-card__body">%s</div>
			%s
		</div>`,
		title, body, footerHTML,
	))
}

func StatCard(title string, value string, trend string, trendType string) template.HTML {
	trendHTML := ""
	if trend != "" {
		trendClass := "ds-stat-card__trend--up"
		if trendType == "down" {
			trendClass = "ds-stat-card__trend--down"
		}
		trendHTML = fmt.Sprintf(`<span class="ds-stat-card__trend %s">%s</span>`, trendClass, trend)
	}
	return template.HTML(fmt.Sprintf(
		`<div class="ds-stat-card">
			<div class="ds-stat-card__title">%s</div>
			<div class="ds-stat-card__value">%s</div>
			%s
		</div>`,
		title, value, trendHTML,
	))
}

func Badge(text string, variant string) template.HTML {
	if variant == "" {
		variant = "default"
	}
	return template.HTML(fmt.Sprintf(
		`<span class="ds-badge ds-badge--%s">%s</span>`,
		variant, text,
	))
}

func Avatar(initials string, size string, variant string) template.HTML {
	if size == "" {
		size = "md"
	}
	if variant == "" {
		variant = "default"
	}
	return template.HTML(fmt.Sprintf(
		`<div class="ds-avatar ds-avatar--%s ds-avatar--%s">%s</div>`,
		size, variant, initials,
	))
}

func ThemeScript(theme string, brand string) template.HTML {
	if theme == "" {
		theme = "dark"
	}
	if brand == "" {
		brand = "zengqing"
	}
	return template.HTML(fmt.Sprintf(
		`<script>
			if (typeof setTheme === 'function') setTheme('%s');
			if (typeof setBrand === 'function') setBrand('%s');
		</script>`,
		theme, brand,
	))
}

func DataBind(key string, bindType string) template.HTML {
	return template.HTML(fmt.Sprintf(`data-bind="%s:%s"`, key, bindType))
}

func DataComponent(name string) template.HTML {
	return template.HTML(fmt.Sprintf(`data-component="%s"`, name))
}

func DataValidate(rules string) template.HTML {
	return template.HTML(fmt.Sprintf(`data-validate="%s"`, rules))
}