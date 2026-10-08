// AUTO-GENERATED.
let intended: string | null = null;
export const deepLinkGate = {
  stashIntended(href: string) { intended = href; },
  consumeIntended(): string | null { const v = intended; intended = null; return v; },
};
