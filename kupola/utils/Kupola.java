package com.kupola;

public class Kupola {

    public static String button(String label, String variant, String size) {
        if (variant == null || variant.isEmpty()) variant = "brand";
        if (size == null || size.isEmpty()) size = "md";
        return String.format(
            "<button class=\"ds-btn ds-btn--%s ds-btn--%s\">%s</button>",
            variant, size, label
        );
    }

    public static String input(String label, String name, String placeholder, String validate) {
        String validateAttr = "";
        if (validate != null && !validate.isEmpty()) {
            validateAttr = String.format(" data-validate=\"%s\"", validate);
        }
        return String.format(
            "<div class=\"ds-form-item\">\n" +
            "    <label class=\"ds-form-item__label\">%s</label>\n" +
            "    <input type=\"text\" class=\"ds-input\" name=\"%s\" placeholder=\"%s\"%s>\n" +
            "</div>",
            label, name, placeholder, validateAttr
        );
    }

    public static String card(String title, String body, String footer) {
        String footerHtml = "";
        if (footer != null && !footer.isEmpty()) {
            footerHtml = String.format("<div class=\"ds-card__footer\">%s</div>", footer);
        }
        return String.format(
            "<div class=\"ds-card\">\n" +
            "    <div class=\"ds-card__header\">\n" +
            "        <h3 class=\"ds-card__title\">%s</h3>\n" +
            "    </div>\n" +
            "    <div class=\"ds-card__body\">%s</div>\n" +
            "    %s\n" +
            "</div>",
            title, body, footerHtml
        );
    }

    public static String statCard(String title, String value, String trend, String trendType) {
        String trendHtml = "";
        if (trend != null && !trend.isEmpty()) {
            String trendClass = "ds-stat-card__trend--up";
            if ("down".equals(trendType)) {
                trendClass = "ds-stat-card__trend--down";
            }
            trendHtml = String.format("<span class=\"ds-stat-card__trend %s\">%s</span>", trendClass, trend);
        }
        return String.format(
            "<div class=\"ds-stat-card\">\n" +
            "    <div class=\"ds-stat-card__title\">%s</div>\n" +
            "    <div class=\"ds-stat-card__value\">%s</div>\n" +
            "    %s\n" +
            "</div>",
            title, value, trendHtml
        );
    }

    public static String badge(String text, String variant) {
        if (variant == null || variant.isEmpty()) variant = "default";
        return String.format(
            "<span class=\"ds-badge ds-badge--%s\">%s</span>",
            variant, text
        );
    }

    public static String avatar(String initials, String size, String variant) {
        if (size == null || size.isEmpty()) size = "md";
        if (variant == null || variant.isEmpty()) variant = "default";
        return String.format(
            "<div class=\"ds-avatar ds-avatar--%s ds-avatar--%s\">%s</div>",
            size, variant, initials
        );
    }

    public static String themeScript(String theme, String brand) {
        if (theme == null || theme.isEmpty()) theme = "dark";
        if (brand == null || brand.isEmpty()) brand = "zengqing";
        return String.format(
            "<script>\n" +
            "    if (typeof setTheme === 'function') setTheme('%s');\n" +
            "    if (typeof setBrand === 'function') setBrand('%s');\n" +
            "</script>",
            theme, brand
        );
    }

    public static String dataBind(String key, String bindType) {
        return String.format("data-bind=\"%s:%s\"", key, bindType);
    }

    public static String dataComponent(String name) {
        return String.format("data-component=\"%s\"", name);
    }

    public static String dataValidate(String rules) {
        return String.format("data-validate=\"%s\"", rules);
    }
}