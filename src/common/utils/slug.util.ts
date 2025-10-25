import slugify from 'slugify';

export const generateUniqueSlug = (str: string) => {
  return slugify(str, { lower: true, strict: true }) + '-' + Date.now().toString().slice(-5);
}