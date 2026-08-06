export type CSSProperties = Record<string, string | number>;
export type CSSRules = Record<string, CSSProperties | Record<string, CSSProperties | Record<string, string | number>>>;

/**
 * Converts a structured TypeScript object of CSS rules into a CSS string.
 * Supports camelCase property names, pseudo-classes, @keyframes, and @media queries.
 */
export function css(rules: CSSRules): string {
  let cssString = "";
  for (const [selector, properties] of Object.entries(rules)) {
    if (selector.startsWith("@media")) {
      cssString += `${selector} {\n`;
      for (const [subSelector, subProps] of Object.entries(properties as Record<string, CSSProperties>)) {
        cssString += `  ${subSelector} {\n`;
        for (const [prop, value] of Object.entries(subProps as CSSProperties)) {
          const kebabProp = prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
          cssString += `    ${kebabProp}: ${value};\n`;
        }
        cssString += `  }\n`;
      }
      cssString += `}\n`;
    } else if (selector.startsWith("@keyframes")) {
      cssString += `${selector} {\n`;
      for (const [step, stepProps] of Object.entries(properties as Record<string, CSSProperties>)) {
        cssString += `  ${step} {\n`;
        for (const [prop, value] of Object.entries(stepProps as CSSProperties)) {
          const kebabProp = prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
          cssString += `    ${kebabProp}: ${value};\n`;
        }
        cssString += `  }\n`;
      }
      cssString += `}\n`;
    } else {
      cssString += `${selector} {\n`;
      for (const [prop, value] of Object.entries(properties as CSSProperties)) {
        const kebabProp = prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
        cssString += `  ${kebabProp}: ${value};\n`;
      }
      cssString += `}\n`;
    }
  }
  return cssString;
}
