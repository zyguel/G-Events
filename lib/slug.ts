export const buildEventSlug = (name: string, id: string | number) => {
    const base = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    return `${base}-${id}`;
};

