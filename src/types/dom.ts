export interface DomSnapshot {
  headings: { level: number; text: string }[];
  buttons: { text: string; selector: string; disabled: boolean }[];
  links: { text: string; href: string; selector: string }[];
  forms: FormSnapshot[];
  tables: { selector: string; headers: string[]; rowCount: number }[];
  dialogs: { open: boolean; title?: string; selector: string }[];
  alerts: { text: string; type?: string; selector: string }[];
}

export interface FormSnapshot {
  selector: string;
  action?: string;
  method?: string;
  inputs: {
    name: string;
    type: string;
    label?: string;
    required: boolean;
    value?: string;
  }[];
}
