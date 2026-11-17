import { Router } from 'express';
import { HttpError } from '../middleware/errorHandler.js';
import { getCategory, listCategories } from '../services/listings/listingService.js';
import { slugParamSchema } from '../validation/items.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ categories: listCategories() });
});

router.get('/:slug', (req, res) => {
  const { slug } = slugParamSchema.parse(req.params);
  const category = getCategory(slug);
  if (!category) throw new HttpError(404, 'Category not found');
  res.json({ category });
});

export default router;
