import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

type RelatedKey = 'leadId' | 'contactId' | 'companyId' | 'dealId';
type Entity = 'LEAD' | 'CONTACT' | 'COMPANY' | 'DEAL';

interface CustomFieldDef {
  id: string;
  label: string;
  fieldKey: string;
  type: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT';
  options: string[] | null;
  isRequired: boolean;
}

interface CustomFieldValue {
  id: string;
  customFieldId: string;
  value: string | null;
}

const RELATED_TO_ENTITY: Record<RelatedKey, Entity> = {
  leadId: 'LEAD',
  contactId: 'CONTACT',
  companyId: 'COMPANY',
  dealId: 'DEAL',
};

export function CustomFieldsSection({ relatedKey, relatedId }: { relatedKey: RelatedKey; relatedId: string }) {
  const queryClient = useQueryClient();
  const entity = RELATED_TO_ENTITY[relatedKey];

  const { data: fields } = useQuery({
    queryKey: ['custom-fields', entity],
    queryFn: async () => (await api.get('/custom-fields', { params: { entity } })).data as CustomFieldDef[],
  });

  const { data: values } = useQuery({
    queryKey: ['custom-field-values', relatedKey, relatedId],
    queryFn: async () => (await api.get('/custom-fields/values', { params: { [relatedKey]: relatedId } })).data as CustomFieldValue[],
  });

  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!values) return;
    const map: Record<string, string> = {};
    values.forEach((v) => { if (v.value != null) map[v.customFieldId] = v.value; });
    setDraft(map);
  }, [values]);

  const save = useMutation({
    mutationFn: async ({ customFieldId, value }: { customFieldId: string; value: string }) =>
      (await api.put('/custom-fields/values', { customFieldId, [relatedKey]: relatedId, value: value || null })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['custom-field-values', relatedKey, relatedId] }),
  });

  if (!fields || fields.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="mb-3 text-xs font-semibold uppercase text-slate-500">Custom Fields</p>
      <div className="space-y-2.5">
        {fields.map((field) => (
          <div key={field.id}>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              {field.label}{field.isRequired && <span className="text-red-500"> *</span>}
            </label>
            {field.type === 'BOOLEAN' ? (
              <select
                value={draft[field.id] ?? ''}
                onChange={(e) => {
                  setDraft({ ...draft, [field.id]: e.target.value });
                  save.mutate({ customFieldId: field.id, value: e.target.value });
                }}
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
              >
                <option value="">—</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            ) : field.type === 'SELECT' ? (
              <select
                value={draft[field.id] ?? ''}
                onChange={(e) => {
                  setDraft({ ...draft, [field.id]: e.target.value });
                  save.mutate({ customFieldId: field.id, value: e.target.value });
                }}
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
              >
                <option value="">—</option>
                {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                type={field.type === 'NUMBER' ? 'number' : field.type === 'DATE' ? 'date' : 'text'}
                value={draft[field.id] ?? ''}
                onChange={(e) => setDraft({ ...draft, [field.id]: e.target.value })}
                onBlur={(e) => save.mutate({ customFieldId: field.id, value: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
