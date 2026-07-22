export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Record<string, any> = {},
  children: Array<string | HTMLElement | null | undefined> = []
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === 'style' && typeof value === 'object' && value !== null) {
      Object.assign(element.style, value);
    } else if (key === 'dataset' && typeof value === 'object' && value !== null) {
      for (const [dataKey, dataValue] of Object.entries(value)) {
        element.dataset[dataKey] = String(dataValue);
      }
    } else if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.slice(2).toLowerCase();
      element.addEventListener(eventName, value);
    } else {
      (element as any)[key] = value;
    }
  }
  children.forEach((child) => {
    if (!child) return;
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else {
      element.appendChild(child);
    }
  });
  return element;
}

export function getOrCreateContainer(id: string, tag: keyof HTMLElementTagNameMap = 'div'): HTMLElement {
  let container = document.getElementById(id);
  if (!container) {
    container = document.createElement(tag);
    container.id = id;
    document.body.appendChild(container);
  }
  return container;
}
