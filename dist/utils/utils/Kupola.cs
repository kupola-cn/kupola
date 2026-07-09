using System;

namespace Kupola
{
    public static class Components
    {
        public static string Button(string label, string variant = "brand", string size = "md")
        {
            return $"<button class=\"ds-btn ds-btn--{variant} ds-btn--{size}\">{label}</button>";
        }

        public static string Input(string label, string name, string placeholder, string validate = "")
        {
            string validateAttr = string.IsNullOrEmpty(validate) ? "" : $" data-validate=\"{validate}\"";
            return $@"<div class=""ds-form-item"">
    <label class=""ds-form-item__label"">{label}</label>
    <input type=""text"" class=""ds-input"" name=""{name}"" placeholder=""{placeholder}""{validateAttr}>
</div>";
        }

        public static string Card(string title, string body, string footer = "")
        {
            string footerHtml = string.IsNullOrEmpty(footer) ? "" : $"<div class=\"ds-card__footer\">{footer}</div>";
            return $@"<div class=""ds-card"">
    <div class=""ds-card__header"">
        <h3 class=""ds-card__title"">{title}</h3>
    </div>
    <div class=""ds-card__body"">{body}</div>
    {footerHtml}
</div>";
        }

        public static string StatCard(string title, string value, string trend = "", string trendType = "up")
        {
            string trendHtml = string.IsNullOrEmpty(trend) ? "" : 
                $"<span class=\"ds-stat-card__trend {(trendType == "down" ? "ds-stat-card__trend--down" : "ds-stat-card__trend--up")}\">{trend}</span>";
            return $@"<div class=""ds-stat-card"">
    <div class=""ds-stat-card__title"">{title}</div>
    <div class=""ds-stat-card__value"">{value}</div>
    {trendHtml}
</div>";
        }

        public static string Badge(string text, string variant = "default")
        {
            return $"<span class=\"ds-badge ds-badge--{variant}\">{text}</span>";
        }

        public static string Avatar(string initials, string size = "md", string variant = "default")
        {
            return $"<div class=\"ds-avatar ds-avatar--{size} ds-avatar--{variant}\">{initials}</div>";
        }

        public static string ThemeScript(string theme = "dark", string brand = "zengqing")
        {
            return $@"<script>
    if (typeof setTheme === 'function') setTheme('{theme}');
    if (typeof setBrand === 'function') setBrand('{brand}');
</script>";
        }

        public static string DataBind(string key, string bindType)
        {
            return $"data-bind=\"{key}:{bindType}\"";
        }

        public static string DataComponent(string name)
        {
            return $"data-component=\"{name}\"";
        }

        public static string DataValidate(string rules)
        {
            return $"data-validate=\"{rules}\"";
        }
    }
}