import { Plus, Trash2 } from 'lucide-react';
import AiChip from '../../components/ai/AiChip';
import Button from '../../components/common/Button';
import { Input, Select, TextArea } from '../../components/common/Input';
import { categoryNav } from '../../components/layout/categories';
import { useApi } from '../../hooks/useApi';
import type { CategoryDetail } from '../../types';
import TagInput from './TagInput';
import { CONDITIONS, type AiField, type Condition, type FieldErrors, type FormState } from './wizardModel';
import styles from './Wizard.module.css';

interface Props {
  form: FormState;
  errors: FieldErrors;
  aiFields: Set<AiField>;
  set: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}

const SPEC_HINTS = ['Brand', 'Model', 'Included', 'Colour'];

export default function DetailsStep({ form, errors, aiFields, set }: Props) {
  const { data: catRes } = useApi<{ category: CategoryDetail }>(form.categorySlug ? `/categories/${form.categorySlug}` : null);
  const category = catRes?.category;
  const chip = (field: AiField) => (aiFields.has(field) ? <AiChip /> : undefined);
  const listId = 'subcategory-options';

  const updateSpec = (i: number, key: 'label' | 'value', value: string) =>
    set('specs', form.specs.map((s, idx) => (idx === i ? { ...s, [key]: value } : s)));

  return (
    <div className={styles.fields}>
      <Input
        label="Title"
        value={form.title}
        onChange={(e) => set('title', e.target.value)}
        error={errors.title}
        hint="Say what it is, for example “Sony A7 III mirrorless camera”."
        maxLength={80}
        labelAddon={chip('title')}
        autoComplete="off"
      />

      <div className={styles.two}>
        <Select
          label="Category"
          value={form.categorySlug}
          onChange={(e) => set('categorySlug', e.target.value as FormState['categorySlug'])}
          error={errors.categorySlug}
          labelAddon={chip('categorySlug')}
        >
          <option value="">Choose a category…</option>
          {categoryNav.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </Select>
        <div>
          <Input
            label="Subcategory (optional)"
            value={form.subcategory}
            onChange={(e) => set('subcategory', e.target.value)}
            error={errors.subcategory}
            list={listId}
            placeholder={category?.subcategories[0]?.name ?? 'for example Mirrorless Cameras'}
            labelAddon={chip('subcategory')}
            autoComplete="off"
            maxLength={40}
          />
          <datalist id={listId}>{category?.subcategories.map((s) => <option key={s.name} value={s.name} />)}</datalist>
        </div>
      </div>

      <TextArea
        label="Description"
        rows={6}
        value={form.description}
        onChange={(e) => set('description', e.target.value)}
        error={errors.description}
        hint={`${form.description.trim().length}/1,500 · What it is, what’s included, and anything renters should know.`}
        maxLength={1500}
        labelAddon={chip('description')}
      />

      <fieldset className={styles.conditions} aria-describedby={errors.condition ? 'condition-error' : undefined}>
        <legend>Condition <span>Be honest. Renters see this.</span></legend>
        <div className={styles.segments} role="radiogroup" aria-label="Item condition">
          {CONDITIONS.map((c) => (
            <label key={c} className={`${styles.segment} ${form.condition === c ? styles.picked : ''}`}>
              <input type="radio" name="condition" value={c} checked={form.condition === c} onChange={() => set('condition', c as Condition)} />
              {c}
            </label>
          ))}
        </div>
        {errors.condition && <p id="condition-error" className={styles.fieldError} role="alert">{errors.condition}</p>}
      </fieldset>

      <fieldset className={styles.specs}>
        <legend>Key details <span>optional · brand, model, what’s included{aiFields.has('specs') && <> <AiChip /></>}</span></legend>
        {form.specs.map((s, i) => (
          <div key={i} className={styles.specRow}>
            <Input label={`Detail ${i + 1} name`} value={s.label} onChange={(e) => updateSpec(i, 'label', e.target.value)} error={errors[`specs.${i}.label`]} placeholder={SPEC_HINTS[i % SPEC_HINTS.length]} maxLength={30} autoComplete="off" />
            <Input label={`Detail ${i + 1} value`} value={s.value} onChange={(e) => updateSpec(i, 'value', e.target.value)} error={errors[`specs.${i}.value`]} maxLength={80} autoComplete="off" />
            <button type="button" className={styles.iconButton} onClick={() => set('specs', form.specs.filter((_, idx) => idx !== i))} aria-label={`Remove detail ${i + 1}`}>
              <Trash2 size={18} aria-hidden />
            </button>
          </div>
        ))}
        {form.specs.length < 8 && (
          <Button variant="outline" size="sm" onClick={() => set('specs', [...form.specs, { label: '', value: '' }])} iconLeft={<Plus size={16} aria-hidden />}>Add a detail</Button>
        )}
      </fieldset>

      <div>
        <TagInput tags={form.tags} onChange={(t) => set('tags', t)} />
        {aiFields.has('tags') && <p className={styles.tagAi}><AiChip /></p>}
      </div>
    </div>
  );
}
