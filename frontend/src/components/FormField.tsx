import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

type SharedProps = { label: string; name: string; error?: string; children?: ReactNode };
type InputProps = SharedProps & InputHTMLAttributes<HTMLInputElement> & { as?: 'input' };
type SelectProps = SharedProps & SelectHTMLAttributes<HTMLSelectElement> & { as: 'select' };
type TextareaProps = SharedProps & TextareaHTMLAttributes<HTMLTextAreaElement> & { as: 'textarea' };
type FormFieldProps = InputProps | SelectProps | TextareaProps;

export default function FormField(props: FormFieldProps) {
  const { label, name, error } = props;
  let control: ReactNode;
  if (props.as === 'select') {
    const { as: _as, label: _label, error: _error, children: options, ...controlProps } = props;
    control = <select id={name} aria-invalid={Boolean(error)} {...controlProps}>{options}</select>;
  } else if (props.as === 'textarea') {
    const { as: _as, label: _label, error: _error, children: content, ...controlProps } = props;
    control = <textarea id={name} aria-invalid={Boolean(error)} {...controlProps}>{content}</textarea>;
  } else {
    const { as: _as, label: _label, error: _error, children: _children, ...controlProps } = props;
    control = <input id={name} aria-invalid={Boolean(error)} {...controlProps} />;
  }
  return <div className="field"><label htmlFor={name}>{label}</label>{control}{error && <small className="field-error">{error}</small>}</div>;
}
